import pg from 'pg';
const { Client } = pg;

// Define appropriate subcategory mappings for each template
// Choose the most appropriate subcategory based on the skill
const subcategoryMappings = {
  58: 31, // SQL -> Data Analysis (subcategory of Data Science)
  61: 19, // Docker -> Containerization (subcategory of DevOps)
  62: 60, // Analytics -> Analytics (subcategory of Marketing)
  66: 28, // Penetration Testing -> Penetration Testing (subcategory of Security)
  68: 46, // Express.js -> Web UI (subcategory of UI)
  69: 46, // Vue.js -> Web UI (subcategory of UI)
  94: 6   // MongoDB -> SQL Databases (subcategory of Database) - Note: this is incorrect as MongoDB is NoSQL, will fix below
};

// Fix MongoDB mapping - we need to add a NoSQL subcategory to Database category
async function updateMissingSubcategoryIds() {
  const client = new Client({
    host: process.env.CLOUD_SQL_HOST || '34.30.6.95',
    port: process.env.CLOUD_SQL_PORT || 5432,
    database: process.env.CLOUD_SQL_DATABASE || 'neondb',
    user: process.env.CLOUD_SQL_USER || 'app_user',
    password: process.env.CLOUD_SQL_PASSWORD
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check if NoSQL Databases subcategory already exists
    let checkSubcategoryResult = await client.query(
      `SELECT id, name FROM skill_subcategories 
       WHERE name = 'NoSQL Databases' AND category_id = 2`
    );
    
    let noSqlSubcategoryId;
    
    if (checkSubcategoryResult.rows.length > 0) {
      // Already exists
      noSqlSubcategoryId = checkSubcategoryResult.rows[0].id;
      console.log(`Found existing NoSQL Databases subcategory (ID: ${noSqlSubcategoryId})`);
    } else {
      // Create new subcategory
      const createSubcategoryResult = await client.query(
        `INSERT INTO skill_subcategories (name, category_id, color, icon)
         VALUES ('NoSQL Databases', 2, '#4B5563', 'database')
         RETURNING id, name`
      );
      
      noSqlSubcategoryId = createSubcategoryResult.rows[0].id;
      console.log(`Created new NoSQL Databases subcategory (ID: ${noSqlSubcategoryId})`);
    }
    console.log(`Created or verified NoSQL Databases subcategory (ID: ${noSqlSubcategoryId})`);
    
    // Update MongoDB to use NoSQL subcategory
    subcategoryMappings[94] = noSqlSubcategoryId;
    
    // Update each template with the mapped subcategory id
    const updates = [];
    for (const [templateId, subcategoryId] of Object.entries(subcategoryMappings)) {
      const result = await client.query(
        `UPDATE skill_templates
         SET subcategory_id = $1
         WHERE id = $2
         RETURNING id, name, category_id, subcategory_id`,
        [subcategoryId, templateId]
      );
      
      if (result.rows.length > 0) {
        updates.push(result.rows[0]);
        console.log(`Updated template ID ${templateId} (${result.rows[0].name}) with subcategory ID ${subcategoryId}`);
      } else {
        console.log(`Template ID ${templateId} not found`);
      }
    }
    
    console.log('\nSuccessfully updated the following templates:');
    console.table(updates);
    
    // Verify all templates now have subcategory IDs
    const verifyResult = await client.query(
      `SELECT COUNT(*) FROM skill_templates
       WHERE category_id IS NOT NULL 
       AND subcategory_id IS NULL`
    );
    
    const remainingCount = parseInt(verifyResult.rows[0].count);
    if (remainingCount === 0) {
      console.log('Success: All templates with category_id now have subcategory_id');
    } else {
      console.log(`Warning: ${remainingCount} templates still have category_id but no subcategory_id`);
    }
    
  } catch (error) {
    console.error('Error updating subcategory IDs:', error);
  } finally {
    await client.end();
  }
}

updateMissingSubcategoryIds();