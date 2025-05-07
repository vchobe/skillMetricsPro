// Set type to module in package.json
// This must be a CommonJS file for compatibility
const { Pool } = require('pg');
const fs = require('fs');

// Function to extract schema information from a database
async function extractSchema(pool, dbName) {
  console.log(`Extracting schema from ${dbName} database...`);
  
  const schema = { tables: {} };
  
  try {
    // Get list of tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`Found ${tables.length} tables in ${dbName}`);
    
    // For each table, get column information
    for (const table of tables) {
      const columnsResult = await pool.query(`
        SELECT 
          column_name, 
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      
      schema.tables[table] = {
        columns: columnsResult.rows
      };
      
      // Get indexes
      const indexesResult = await pool.query(`
        SELECT
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1;
      `, [table]);
      
      schema.tables[table].indexes = indexesResult.rows;
    }
    
    return schema;
  } catch (error) {
    console.error(`Error extracting schema from ${dbName}:`, error);
    throw error;
  }
}

// Compare the schemas
function compareSchemas(cloudSchema, replitSchema) {
  const differences = {
    tablesOnlyInCloud: [],
    tablesOnlyInReplit: [],
    commonTablesWithDifferences: {}
  };
  
  // Find tables only in Cloud
  for (const table in cloudSchema.tables) {
    if (!replitSchema.tables[table]) {
      differences.tablesOnlyInCloud.push(table);
    }
  }
  
  // Find tables only in Replit
  for (const table in replitSchema.tables) {
    if (!cloudSchema.tables[table]) {
      differences.tablesOnlyInReplit.push(table);
    }
  }
  
  // Compare common tables
  for (const table in cloudSchema.tables) {
    if (replitSchema.tables[table]) {
      const tableDiffs = {
        columnsOnlyInCloud: [],
        columnsOnlyInReplit: [],
        columnTypesDifferent: []
      };
      
      const cloudColumns = cloudSchema.tables[table].columns;
      const replitColumns = replitSchema.tables[table].columns;
      
      // Find columns only in Cloud
      for (const cloudCol of cloudColumns) {
        const replitCol = replitColumns.find(col => col.column_name === cloudCol.column_name);
        if (!replitCol) {
          tableDiffs.columnsOnlyInCloud.push(cloudCol.column_name);
        } else {
          // Check for type differences
          if (cloudCol.data_type !== replitCol.data_type || 
              cloudCol.is_nullable !== replitCol.is_nullable) {
            tableDiffs.columnTypesDifferent.push({
              column: cloudCol.column_name,
              cloud: {
                type: cloudCol.data_type,
                nullable: cloudCol.is_nullable
              },
              replit: {
                type: replitCol.data_type,
                nullable: replitCol.is_nullable
              }
            });
          }
        }
      }
      
      // Find columns only in Replit
      for (const replitCol of replitColumns) {
        const cloudCol = cloudColumns.find(col => col.column_name === replitCol.column_name);
        if (!cloudCol) {
          tableDiffs.columnsOnlyInReplit.push(replitCol.column_name);
        }
      }
      
      // Only add tables with differences
      if (tableDiffs.columnsOnlyInCloud.length > 0 || 
          tableDiffs.columnsOnlyInReplit.length > 0 || 
          tableDiffs.columnTypesDifferent.length > 0) {
        differences.commonTablesWithDifferences[table] = tableDiffs;
      }
    }
  }
  
  return differences;
}

// Print the comparison in a readable format
function printComparison(differences) {
  console.log('\n===== DATABASE SCHEMA COMPARISON SUMMARY =====');
  
  console.log(`\nTables only in Google Cloud SQL (${differences.tablesOnlyInCloud.length}):`);
  if (differences.tablesOnlyInCloud.length === 0) {
    console.log('  None');
  } else {
    differences.tablesOnlyInCloud.forEach(table => console.log(`  - ${table}`));
  }
  
  console.log(`\nTables only in Replit Database (${differences.tablesOnlyInReplit.length}):`);
  if (differences.tablesOnlyInReplit.length === 0) {
    console.log('  None');
  } else {
    differences.tablesOnlyInReplit.forEach(table => console.log(`  - ${table}`));
  }
  
  const commonTables = Object.keys(differences.commonTablesWithDifferences);
  console.log(`\nCommon tables with differences (${commonTables.length}):`);
  
  if (commonTables.length === 0) {
    console.log('  None - All common tables are identical!');
  } else {
    commonTables.forEach(table => {
      const diffs = differences.commonTablesWithDifferences[table];
      console.log(`\n  Table: ${table}`);
      
      if (diffs.columnsOnlyInCloud.length > 0) {
        console.log('    Columns only in Cloud SQL:');
        diffs.columnsOnlyInCloud.forEach(col => console.log(`      - ${col}`));
      }
      
      if (diffs.columnsOnlyInReplit.length > 0) {
        console.log('    Columns only in Replit:');
        diffs.columnsOnlyInReplit.forEach(col => console.log(`      - ${col}`));
      }
      
      if (diffs.columnTypesDifferent.length > 0) {
        console.log('    Columns with different types:');
        diffs.columnTypesDifferent.forEach(diff => {
          console.log(`      - ${diff.column}:`);
          console.log(`          Cloud: type=${diff.cloud.type}, nullable=${diff.cloud.nullable}`);
          console.log(`          Replit: type=${diff.replit.type}, nullable=${diff.replit.nullable}`);
        });
      }
    });
  }
}

// Main function
async function compareDBSchemas() {
  console.log('Database Schema Comparison Tool');
  console.log('===============================');
  
  // Check environment variables
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set');
    console.error('Cannot compare with Replit database without this variable.');
    return;
  }
  
  if (!process.env.CLOUD_SQL_HOST || !process.env.CLOUD_SQL_USER || 
      !process.env.CLOUD_SQL_PASSWORD || !process.env.CLOUD_SQL_DATABASE) {
    console.error('Error: One or more Cloud SQL environment variables are not set');
    console.error('Required: CLOUD_SQL_HOST, CLOUD_SQL_USER, CLOUD_SQL_PASSWORD, CLOUD_SQL_DATABASE');
    return;
  }
  
  // Setup cloud SQL connection
  const cloudConfig = {
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT || 5432,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE,
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true'
  };
  
  // Setup Replit connection
  const replitConfig = {
    connectionString: process.env.DATABASE_URL
  };
  
  console.log(`Cloud SQL Connection: ${cloudConfig.host}:${cloudConfig.port} (${cloudConfig.database})`);
  console.log(`Replit Connection: ${replitConfig.connectionString.split('@')[1].split('/')[0]}`);
  
  const cloudPool = new Pool(cloudConfig);
  const replitPool = new Pool(replitConfig);
  
  try {
    // Extract schemas
    const cloudSchema = await extractSchema(cloudPool, 'Google Cloud SQL');
    const replitSchema = await extractSchema(replitPool, 'Replit');
    
    // Save schemas to files for future reference
    fs.writeFileSync('cloud-schema.json', JSON.stringify(cloudSchema, null, 2));
    fs.writeFileSync('replit-schema.json', JSON.stringify(replitSchema, null, 2));
    console.log('\nSaved schema files:');
    console.log('- cloud-schema.json');
    console.log('- replit-schema.json');
    
    // Compare schemas
    const differences = compareSchemas(cloudSchema, replitSchema);
    
    // Save the comparison
    fs.writeFileSync('schema-diff.json', JSON.stringify(differences, null, 2));
    console.log('- schema-diff.json');
    
    // Print readable comparison
    printComparison(differences);
    
  } catch (error) {
    console.error('Error during schema comparison:', error);
  } finally {
    // Clean up
    await cloudPool.end();
    await replitPool.end();
  }
}

// Run the comparison
compareDBSchemas().catch(console.error);