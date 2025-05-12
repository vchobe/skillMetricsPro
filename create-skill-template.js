/**
 * Create a skill template directly through the database
 * This script bypasses the API authentication process
 */
import pkg from 'pg';
const { Pool } = pkg;

// Get database connection config from environment variables
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
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true',
  };
}

// Create the database pool
const pool = new Pool(getDatabaseConfig());

// Function to create skill template
async function createSkillTemplate(templateData) {
  const { 
    name,
    categoryId,
    subcategoryId,
    description,
    isRecommended,
    targetLevel
  } = templateData;
  
  try {
    // First, get the category name from its ID
    const categoryResult = await pool.query(
      'SELECT name FROM skill_categories WHERE id = $1',
      [categoryId]
    );
    
    if (categoryResult.rows.length === 0) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }
    
    const categoryName = categoryResult.rows[0].name;
    console.log(`Found category name "${categoryName}" for categoryId ${categoryId}`);
    
    // Verify subcategory if provided
    if (subcategoryId) {
      const subcategoryResult = await pool.query(
        'SELECT name FROM skill_subcategories WHERE id = $1 AND category_id = $2',
        [subcategoryId, categoryId]
      );
      
      if (subcategoryResult.rows.length === 0) {
        throw new Error(`Subcategory with ID ${subcategoryId} not found or not associated with category ${categoryId}`);
      }
      
      console.log(`Verified subcategory ${subcategoryResult.rows[0].name} for category ${categoryName}`);
    }
    
    // Insert the skill template
    const result = await pool.query(
      `INSERT INTO skill_templates (
        name, 
        category, 
        category_id, 
        subcategory_id, 
        description, 
        is_recommended, 
        target_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        name,
        categoryName,
        categoryId,
        subcategoryId || null,
        description || '',
        isRecommended || false,
        targetLevel || null
      ]
    );
    
    console.log('Successfully created skill template:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating skill template:', error);
    throw error;
  } finally {
    // Don't close the pool here since we might want to create multiple templates
  }
}

// Main function
async function main() {
  try {
    // Create Oracle Database skill template
    await createSkillTemplate({
      name: 'Oracle Database',
      categoryId: 2, // Database category
      subcategoryId: 77, // Relational Databases subcategory
      description: 'Experience with Oracle database administration, SQL development, and performance tuning',
      isRecommended: true,
      targetLevel: 'intermediate'
    });
    
    // Create CouchDB skill template
    await createSkillTemplate({
      name: 'CouchDB',
      categoryId: 2, // Database category
      subcategoryId: 76, // NoSQL Databases subcategory
      description: 'Experience with Apache CouchDB document-oriented database',
      isRecommended: true,
      targetLevel: 'intermediate'
    });
    
    console.log('All skill templates created successfully');
  } catch (error) {
    console.error('Template creation failed:', error);
  } finally {
    // Close the pool when done with all operations
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
});