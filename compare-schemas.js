/**
 * Script to compare the database schemas between Replit DB and Google Cloud SQL
 */
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

// Get both database connection configurations
async function compareSchemas() {
  // Get Google Cloud SQL connection (current)
  const cloudSqlConfig = {
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE,
    host: process.env.CLOUD_SQL_HOST,
    port: parseInt(process.env.CLOUD_SQL_PORT || '5432', 10),
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true'
  };
  
  // Use the current DATABASE_URL for Replit, we'll need to re-apply this
  // since we commented it out in the main application
  const replitConfig = {
    connectionString: process.env.DATABASE_URL
  };
  
  console.log('Connecting to Google Cloud SQL database...');
  const cloudPool = new Pool(cloudSqlConfig);
  
  try {
    // Extract schema from Google Cloud SQL
    const cloudSchema = await extractSchema(cloudPool);
    console.log('✅ Successfully extracted Google Cloud SQL schema');
    
    // Save the cloud schema
    fs.writeFileSync('cloud-sql-schema.json', JSON.stringify(cloudSchema, null, 2));
    console.log('📄 Saved Google Cloud SQL schema to cloud-sql-schema.json');
    
    // Check if DATABASE_URL is available for Replit comparison
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL environment variable not found. Cannot compare with Replit database.');
      console.log('✨ Google Cloud SQL schema has been saved to cloud-sql-schema.json');
      return;
    }
    
    console.log('Connecting to Replit database...');
    const replitPool = new Pool(replitConfig);
    
    // Extract schema from Replit
    const replitSchema = await extractSchema(replitPool);
    console.log('✅ Successfully extracted Replit database schema');
    
    // Save the replit schema
    fs.writeFileSync('replit-schema.json', JSON.stringify(replitSchema, null, 2));
    console.log('📄 Saved Replit schema to replit-schema.json');
    
    // Compare schemas
    const differences = compareSchemaObjects(cloudSchema, replitSchema);
    
    // Save comparison results
    fs.writeFileSync('schema-comparison.json', JSON.stringify(differences, null, 2));
    console.log('📊 Schema comparison saved to schema-comparison.json');
    
    // Print a summary of the comparison
    printComparisonSummary(differences);
    
    // Clean up connections
    await cloudPool.end();
    await replitPool.end();
    
  } catch (error) {
    console.error('Error during schema comparison:', error);
    try {
      await cloudPool.end();
    } catch (e) {
      // Ignore error on cleanup
    }
  }
}

async function extractSchema(pool) {
  const schema = {};
  
  // Get list of tables
  const tablesQuery = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  
  const tablesResult = await pool.query(tablesQuery);
  const tables = tablesResult.rows.map(row => row.table_name);
  
  schema.tables = {};
  
  // For each table, get column information
  for (const table of tables) {
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await pool.query(columnsQuery, [table]);
    schema.tables[table] = columnsResult.rows;
    
    // Get primary key information
    const primaryKeyQuery = `
      SELECT 
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = $1
      ORDER BY kcu.ordinal_position;
    `;
    
    const primaryKeyResult = await pool.query(primaryKeyQuery, [table]);
    schema.tables[table].primaryKey = primaryKeyResult.rows.map(row => row.column_name);
    
    // Get foreign key information
    const foreignKeysQuery = `
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = $1;
    `;
    
    const foreignKeysResult = await pool.query(foreignKeysQuery, [table]);
    schema.tables[table].foreignKeys = foreignKeysResult.rows;
    
    // Get indexes
    const indexesQuery = `
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = $1;
    `;
    
    const indexesResult = await pool.query(indexesQuery, [table]);
    schema.tables[table].indexes = indexesResult.rows;
  }
  
  return schema;
}

function compareSchemaObjects(cloudSchema, replitSchema) {
  const differences = {
    tablesOnlyInCloud: [],
    tablesOnlyInReplit: [],
    commonTables: {},
  };
  
  // Find tables that exist only in Cloud SQL
  for (const table in cloudSchema.tables) {
    if (!replitSchema.tables[table]) {
      differences.tablesOnlyInCloud.push(table);
    }
  }
  
  // Find tables that exist only in Replit
  for (const table in replitSchema.tables) {
    if (!cloudSchema.tables[table]) {
      differences.tablesOnlyInReplit.push(table);
    }
  }
  
  // Compare common tables
  for (const table in cloudSchema.tables) {
    if (replitSchema.tables[table]) {
      const cloudColumns = cloudSchema.tables[table].filter(col => typeof col === 'object');
      const replitColumns = replitSchema.tables[table].filter(col => typeof col === 'object');
      
      const tableDiff = {
        columnsOnlyInCloud: [],
        columnsOnlyInReplit: [],
        commonColumnsWithDifferences: []
      };
      
      // Check columns only in Cloud
      for (const cloudCol of cloudColumns) {
        const replitColMatch = replitColumns.find(replitCol => 
          replitCol.column_name === cloudCol.column_name);
        
        if (!replitColMatch) {
          tableDiff.columnsOnlyInCloud.push(cloudCol.column_name);
        } else {
          // Check for differences in common columns
          const differences = [];
          
          if (cloudCol.data_type !== replitColMatch.data_type) {
            differences.push({
              property: 'data_type',
              cloud: cloudCol.data_type,
              replit: replitColMatch.data_type
            });
          }
          
          if (cloudCol.is_nullable !== replitColMatch.is_nullable) {
            differences.push({
              property: 'is_nullable',
              cloud: cloudCol.is_nullable,
              replit: replitColMatch.is_nullable
            });
          }
          
          if (cloudCol.character_maximum_length !== replitColMatch.character_maximum_length) {
            differences.push({
              property: 'character_maximum_length',
              cloud: cloudCol.character_maximum_length,
              replit: replitColMatch.character_maximum_length
            });
          }
          
          if (differences.length > 0) {
            tableDiff.commonColumnsWithDifferences.push({
              column_name: cloudCol.column_name,
              differences
            });
          }
        }
      }
      
      // Check columns only in Replit
      for (const replitCol of replitColumns) {
        const cloudColMatch = cloudColumns.find(cloudCol => 
          cloudCol.column_name === replitCol.column_name);
        
        if (!cloudColMatch) {
          tableDiff.columnsOnlyInReplit.push(replitCol.column_name);
        }
      }
      
      // Compare primary keys
      tableDiff.primaryKeyDifferences = comparePrimaryKeys(
        cloudSchema.tables[table].primaryKey || [],
        replitSchema.tables[table].primaryKey || []
      );
      
      // Compare foreign keys
      tableDiff.foreignKeyDifferences = compareForeignKeys(
        cloudSchema.tables[table].foreignKeys || [],
        replitSchema.tables[table].foreignKeys || []
      );
      
      // Compare indexes
      tableDiff.indexDifferences = compareIndexes(
        cloudSchema.tables[table].indexes || [],
        replitSchema.tables[table].indexes || []
      );
      
      // Only add tables with differences
      if (
        tableDiff.columnsOnlyInCloud.length > 0 ||
        tableDiff.columnsOnlyInReplit.length > 0 ||
        tableDiff.commonColumnsWithDifferences.length > 0 ||
        tableDiff.primaryKeyDifferences.different ||
        tableDiff.foreignKeyDifferences.missing.length > 0 ||
        tableDiff.indexDifferences.missing.length > 0
      ) {
        differences.commonTables[table] = tableDiff;
      }
    }
  }
  
  return differences;
}

function comparePrimaryKeys(cloudPKs, replitPKs) {
  if (cloudPKs.length === 0 && replitPKs.length === 0) {
    return { different: false };
  }
  
  // Sort arrays to make comparison consistent
  const sortedCloudPKs = [...cloudPKs].sort();
  const sortedReplitPKs = [...replitPKs].sort();
  
  if (sortedCloudPKs.length !== sortedReplitPKs.length) {
    return {
      different: true,
      cloud: sortedCloudPKs,
      replit: sortedReplitPKs
    };
  }
  
  for (let i = 0; i < sortedCloudPKs.length; i++) {
    if (sortedCloudPKs[i] !== sortedReplitPKs[i]) {
      return {
        different: true,
        cloud: sortedCloudPKs,
        replit: sortedReplitPKs
      };
    }
  }
  
  return { different: false };
}

function compareForeignKeys(cloudFKs, replitFKs) {
  const missing = {
    inCloud: [],
    inReplit: []
  };
  
  // Check FKs in Cloud not in Replit
  for (const cloudFK of cloudFKs) {
    const replitMatch = replitFKs.find(replitFK => 
      replitFK.column_name === cloudFK.column_name && 
      replitFK.foreign_table_name === cloudFK.foreign_table_name &&
      replitFK.foreign_column_name === cloudFK.foreign_column_name
    );
    
    if (!replitMatch) {
      missing.inReplit.push({
        column_name: cloudFK.column_name,
        references: `${cloudFK.foreign_table_name}(${cloudFK.foreign_column_name})`
      });
    }
  }
  
  // Check FKs in Replit not in Cloud
  for (const replitFK of replitFKs) {
    const cloudMatch = cloudFKs.find(cloudFK => 
      cloudFK.column_name === replitFK.column_name && 
      cloudFK.foreign_table_name === replitFK.foreign_table_name &&
      cloudFK.foreign_column_name === replitFK.foreign_column_name
    );
    
    if (!cloudMatch) {
      missing.inCloud.push({
        column_name: replitFK.column_name,
        references: `${replitFK.foreign_table_name}(${replitFK.foreign_column_name})`
      });
    }
  }
  
  return missing;
}

function compareIndexes(cloudIndexes, replitIndexes) {
  const missing = {
    inCloud: [],
    inReplit: []
  };
  
  // Check indexes in Cloud not in Replit
  for (const cloudIndex of cloudIndexes) {
    const replitMatch = replitIndexes.find(replitIndex => 
      replitIndex.indexname === cloudIndex.indexname
    );
    
    if (!replitMatch) {
      missing.inReplit.push({
        name: cloudIndex.indexname,
        definition: cloudIndex.indexdef
      });
    }
  }
  
  // Check indexes in Replit not in Cloud
  for (const replitIndex of replitIndexes) {
    const cloudMatch = cloudIndexes.find(cloudIndex => 
      cloudIndex.indexname === replitIndex.indexname
    );
    
    if (!cloudMatch) {
      missing.inCloud.push({
        name: replitIndex.indexname,
        definition: replitIndex.indexdef
      });
    }
  }
  
  return missing;
}

function printComparisonSummary(differences) {
  console.log('\n===== DATABASE SCHEMA COMPARISON SUMMARY =====');
  
  // Tables summary
  console.log(`\n🔍 Tables only in Google Cloud SQL (${differences.tablesOnlyInCloud.length}):`);
  if (differences.tablesOnlyInCloud.length === 0) {
    console.log('   None');
  } else {
    differences.tablesOnlyInCloud.forEach(table => console.log(`   - ${table}`));
  }
  
  console.log(`\n🔍 Tables only in Replit (${differences.tablesOnlyInReplit.length}):`);
  if (differences.tablesOnlyInReplit.length === 0) {
    console.log('   None');
  } else {
    differences.tablesOnlyInReplit.forEach(table => console.log(`   - ${table}`));
  }
  
  // Common tables with differences
  const tablesWithDiffs = Object.keys(differences.commonTables);
  console.log(`\n🔍 Common tables with schema differences (${tablesWithDiffs.length}):`);
  
  if (tablesWithDiffs.length === 0) {
    console.log('   None - All common tables have identical schemas!');
  } else {
    tablesWithDiffs.forEach(table => {
      const diff = differences.commonTables[table];
      console.log(`\n   📋 ${table}:`);
      
      if (diff.columnsOnlyInCloud.length > 0) {
        console.log(`      Columns only in Cloud SQL: ${diff.columnsOnlyInCloud.join(', ')}`);
      }
      
      if (diff.columnsOnlyInReplit.length > 0) {
        console.log(`      Columns only in Replit: ${diff.columnsOnlyInReplit.join(', ')}`);
      }
      
      if (diff.commonColumnsWithDifferences.length > 0) {
        console.log('      Different column definitions:');
        diff.commonColumnsWithDifferences.forEach(colDiff => {
          console.log(`         - ${colDiff.column_name}:`);
          colDiff.differences.forEach(propDiff => {
            console.log(`            ${propDiff.property}: Cloud=${propDiff.cloud || 'NULL'}, Replit=${propDiff.replit || 'NULL'}`);
          });
        });
      }
      
      if (diff.primaryKeyDifferences.different) {
        console.log('      Primary Key differences:');
        console.log(`         - Cloud: ${diff.primaryKeyDifferences.cloud.join(', ') || 'None'}`);
        console.log(`         - Replit: ${diff.primaryKeyDifferences.replit.join(', ') || 'None'}`);
      }
      
      if (diff.foreignKeyDifferences.inCloud.length > 0) {
        console.log('      Foreign Keys missing in Cloud SQL:');
        diff.foreignKeyDifferences.inCloud.forEach(fk => {
          console.log(`         - ${fk.column_name} -> ${fk.references}`);
        });
      }
      
      if (diff.foreignKeyDifferences.inReplit.length > 0) {
        console.log('      Foreign Keys missing in Replit:');
        diff.foreignKeyDifferences.inReplit.forEach(fk => {
          console.log(`         - ${fk.column_name} -> ${fk.references}`);
        });
      }
    });
  }
  
  console.log('\nFor complete details, check the schema-comparison.json file.');
}

// Run the comparison
compareSchemas().catch(console.error);

// Export the main function for module usage
export { compareSchemas };