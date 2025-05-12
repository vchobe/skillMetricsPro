// Simple script to add a project skill directly to the database
import pg from 'pg';
const { Pool } = pg;

// Connect to PostgreSQL
const pool = new Pool({
  host: '34.30.6.95',
  port: 5432,
  user: 'app_user',
  password: process.env.PGPASSWORD,
  database: 'neondb',
});

async function addProjectSkill() {
  console.log("Starting direct DB insertion...");
  
  // Get a client from the pool
  const client = await pool.connect();
  
  try {
    // 1. Check if our skill template exists
    const checkTemplate = await client.query(
      'SELECT * FROM skill_templates WHERE id = $1',
      [98]
    );
    
    if (checkTemplate.rows.length === 0) {
      console.log("Skill template ID 98 does not exist. Creating a new template...");
      
      // Create a new template if needed
      const newTemplate = await client.query(
        `INSERT INTO skill_templates 
         (name, category, description, is_recommended, target_level, category_id, subcategory_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        ['Redis', 'Database', 'Experience with Redis in-memory database', true, 'intermediate', 2, 76]
      );
      
      console.log("Created skill template:", newTemplate.rows[0]);
      var templateId = newTemplate.rows[0].id;
    } else {
      console.log("Found existing skill template:", checkTemplate.rows[0]);
      var templateId = 98;
    }
    
    // 2. Add a project skill
    console.log(`Adding project skill with template ID ${templateId}...`);
    
    // First check if it already exists
    const checkSkill = await client.query(
      'SELECT * FROM project_skills WHERE project_id = $1 AND skill_template_id = $2',
      [2, templateId]
    );
    
    if (checkSkill.rows.length > 0) {
      console.log("Project skill already exists:", checkSkill.rows[0]);
    } else {
      try {
        // Insert with explicit column names
        const result = await client.query(
          `INSERT INTO project_skills 
           (project_id, skill_template_id, required_level, importance) 
           VALUES ($1, $2, $3, $4) 
           RETURNING *`,
          [2, templateId, 'intermediate', 'high']
        );
        
        console.log("Successfully created project skill:", result.rows[0]);
      } catch (error) {
        console.error("Error inserting project skill:", error);
        
        // Show table schema for debugging
        console.log("\nChecking project_skills table schema:");
        const schema = await client.query(
          "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_skills'"
        );
        console.log("Table schema:", schema.rows);
      }
    }
    
  } catch (error) {
    console.error("Database operation error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

addProjectSkill().catch(err => {
  console.error("Script error:", err);
});