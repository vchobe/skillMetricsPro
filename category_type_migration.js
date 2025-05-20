// Direct database migration script to add category_type column to skill_categories table
const pg = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a database connection
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  // Enable SSL if needed (usually needed for production)
  ssl: process.env.NODE_ENV === 'production' ? 
    { rejectUnauthorized: false } : 
    undefined
};

const pool = new pg.Pool(dbConfig);

async function migrateCategoryType() {
  console.log('Starting migration to add category_type column to skill_categories table...');
  
  // Get a client from the connection pool
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    try {
      // Step 1: Check if the enum type exists, create it if not
      console.log('Checking if category_type enum exists...');
      const enumCheck = await client.query(`
        SELECT typname FROM pg_type WHERE typname = 'category_type'
      `);
      
      if (enumCheck.rows.length === 0) {
        console.log('Creating category_type enum...');
        await client.query(`
          CREATE TYPE category_type AS ENUM ('technical', 'functional')
        `);
        console.log('Enum type created successfully');
      } else {
        console.log('Enum type already exists, skipping creation');
      }
      
      // Step 2: Check if the column exists, add it if not
      console.log('Checking if category_type column exists...');
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'skill_categories' AND column_name = 'category_type'
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('Adding category_type column to skill_categories table...');
        await client.query(`
          ALTER TABLE skill_categories
          ADD COLUMN category_type category_type NOT NULL DEFAULT 'technical'
        `);
        console.log('Column added successfully');
      } else {
        console.log('Column already exists, skipping creation');
      }
      
      // Step 3: Set values for existing categories
      
      // Technical categories
      console.log('Setting technical categories...');
      const techCount = await client.query(`
        UPDATE skill_categories
        SET category_type = 'technical'
        WHERE name IN (
          'Programming', 'Database', 'Cloud', 'DevOps', 'Security',
          'Data Science', 'AI', 'UI', 'Testing'
        )
        RETURNING id, name
      `);
      
      console.log(`Updated ${techCount.rowCount} technical categories`);
      
      // Functional categories
      console.log('Setting functional categories...');
      const funcCount = await client.query(`
        UPDATE skill_categories
        SET category_type = 'functional'
        WHERE name IN (
          'Design', 'Project Management', 'Leadership', 'Communication',
          'Marketing', 'Messaging & Streaming', 'Metrics and visualization',
          'Log aggregation and search', 'BigData'
        )
        RETURNING id, name
      `);
      
      console.log(`Updated ${funcCount.rowCount} functional categories`);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('Transaction committed successfully');
      
      // Verify results
      const finalCheck = await client.query(`
        SELECT id, name, category_type
        FROM skill_categories
        ORDER BY name
      `);
      
      console.log('\nCategory types after migration:');
      finalCheck.rows.forEach(cat => {
        console.log(`- ${cat.name}: ${cat.category_type}`);
      });
      
      console.log('\nMigration completed successfully!');
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Error during transaction, rolling back:', error);
      throw error;
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

// Run the migration
migrateCategoryType()
  .then(() => {
    console.log('Migration script finished execution');
  })
  .catch(err => {
    console.error('Fatal error in migration script:', err);
    process.exit(1);
  });