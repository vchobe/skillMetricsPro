import pg from 'pg';
const { Client } = pg;

async function testCreateSkillTemplate() {
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
    
    // Try creating a skill template
    const result = await client.query(
      `INSERT INTO skill_templates (name, category, category_id, subcategory_id, description, is_recommended)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      ['MongoDB', 'Database', 11, null, 'NoSQL database system', true]
    );
    
    console.log('Successfully created skill template:', result.rows[0]);
    
  } catch (error) {
    console.error('Error creating skill template:', error);
  } finally {
    await client.end();
  }
}

testCreateSkillTemplate();