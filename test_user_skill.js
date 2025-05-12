import pg from 'pg';
const { Client } = pg;

async function testAddUserSkill() {
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
    
    // Find MongoDB skill template we just created
    const templateResult = await client.query(
      `SELECT * FROM skill_templates WHERE name = 'MongoDB'`
    );
    
    if (templateResult.rows.length === 0) {
      console.log('MongoDB template not found');
      return;
    }
    
    const template = templateResult.rows[0];
    console.log('Found MongoDB template:', template);
    
    // Add user skill (for user ID 66 which is admin@atyeti.com)
    const insertResult = await client.query(
      `INSERT INTO user_skills (
         user_id,
         skill_template_id,
         level,
         notes
       ) VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [66, template.id, 'expert', 'Created during V2 transition testing']
    );
    
    console.log('Successfully added user skill:', insertResult.rows[0]);
    
    // Verify the user's skills
    const userSkills = await client.query(
      `SELECT us.*, st.name, st.category, st.category_id, st.subcategory_id
       FROM user_skills us
       JOIN skill_templates st ON us.skill_template_id = st.id
       WHERE us.user_id = $1 AND us.skill_template_id = $2`,
      [66, template.id]
    );
    
    console.log('User skill with template information:', userSkills.rows[0]);
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await client.end();
  }
}

testAddUserSkill();