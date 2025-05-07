import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure DB connection
function getDatabaseConfig() {
  const cloudSqlUser = process.env.CLOUD_SQL_USER;
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlDatabase = process.env.CLOUD_SQL_DATABASE;
  const dbHost = process.env.CLOUD_SQL_HOST || 'localhost';
  const dbPort = parseInt(process.env.CLOUD_SQL_PORT || '5432', 10);
  
  console.log(`Using direct TCP connection to: ${dbHost}:${dbPort}`);
  
  return {
    user: cloudSqlUser,
    password: cloudSqlPassword,
    database: cloudSqlDatabase,
    host: dbHost,
    port: dbPort,
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true'
  };
}

// Create a database connection pool
const pool = new Pool(getDatabaseConfig());

async function checkTableSchema(tableName) {
  try {
    console.log(`Checking schema for table: ${tableName}`);
    
    // Get column info
    const columnQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `;
    
    const columnResult = await pool.query(columnQuery, [tableName]);
    
    if (columnResult.rows.length === 0) {
      console.log(`Table ${tableName} not found or has no columns`);
      return;
    }
    
    console.log(`\nColumns in ${tableName}:`);
    console.log('------------------------------');
    columnResult.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Get foreign key info
    const fkQuery = `
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1;
    `;
    
    const fkResult = await pool.query(fkQuery, [tableName]);
    
    if (fkResult.rows.length > 0) {
      console.log('\nForeign Keys:');
      console.log('------------------------------');
      fkResult.rows.forEach(fk => {
        console.log(`${fk.column_name} REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name})`);
      });
    } else {
      console.log('\nNo foreign keys defined');
    }
    
    // Get primary key info
    const pkQuery = `
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass
      AND i.indisprimary;
    `;
    
    const pkResult = await pool.query(pkQuery, [tableName]);
    
    if (pkResult.rows.length > 0) {
      console.log('\nPrimary Key:');
      console.log('------------------------------');
      const pkColumns = pkResult.rows.map(row => row.attname).join(', ');
      console.log(pkColumns);
    } else {
      console.log('\nNo primary key defined');
    }
    
    // Get index info
    const indexQuery = `
      SELECT
        i.relname as index_name,
        a.attname as column_name
      FROM pg_class t,
           pg_class i,
           pg_index ix,
           pg_attribute a
      WHERE t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname = $1
      ORDER BY i.relname, a.attnum;
    `;
    
    const indexResult = await pool.query(indexQuery, [tableName]);
    
    if (indexResult.rows.length > 0) {
      console.log('\nIndexes:');
      console.log('------------------------------');
      
      // Group by index name
      const indexes = {};
      indexResult.rows.forEach(row => {
        if (!indexes[row.index_name]) {
          indexes[row.index_name] = [];
        }
        indexes[row.index_name].push(row.column_name);
      });
      
      // Print each index
      Object.entries(indexes).forEach(([indexName, columns]) => {
        console.log(`${indexName}: (${columns.join(', ')})`);
      });
    } else {
      console.log('\nNo indexes defined');
    }
    
  } catch (error) {
    console.error('Error checking table schema:', error);
  } finally {
    await pool.end();
  }
}

// Check the user_skills table schema
checkTableSchema('user_skills');