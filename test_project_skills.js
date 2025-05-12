import pg from 'pg';
const { Client } = pg;

async function testAddProjectSkill() {
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
    
    // Add the skill to project 1
    const insertResult = await client.query(
      `INSERT INTO project_skills (
         project_id,
         skill_id,
         skill_template_id,
         required_level
       ) VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [1, null, template.id, 'intermediate']
    );
    
    console.log('Successfully added project skill:', insertResult.rows[0]);
    
    // Get all project skills for project 1
    const projectSkills = await client.query(
      `SELECT ps.*, st.name as skill_name, st.category
       FROM project_skills ps
       LEFT JOIN skill_templates st ON ps.skill_template_id = st.id
       WHERE ps.project_id = $1`,
      [1]
    );
    
    console.log(`Project has ${projectSkills.rows.length} skills:`);
    console.log(projectSkills.rows);
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await client.end();
  }
}

testAddProjectSkill();