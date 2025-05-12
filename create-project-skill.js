import { pool } from './server/db.ts';

async function createProjectSkill() {
  try {
    console.log("Starting direct DB test for project skill creation...");
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Check if the template exists
      const templateCheckQuery = 'SELECT * FROM skill_templates WHERE id = $1';
      const templateResult = await client.query(templateCheckQuery, [98]);
      
      if (templateResult.rows.length === 0) {
        console.log("Skill template with ID 98 not found");
        return;
      }
      
      console.log("Found skill template:", templateResult.rows[0]);
      
      // Create project skill
      const insertQuery = `
        INSERT INTO project_skills (
          project_id, 
          skill_template_id, 
          required_level, 
          importance
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [2, 98, 'intermediate', 'high'];
      const result = await client.query(insertQuery, values);
      
      console.log("Successfully created project skill:", result.rows[0]);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error("Error during database operation:", error);
  } finally {
    // Close the database pool
    await pool.end();
  }
}

// Run the function
createProjectSkill();