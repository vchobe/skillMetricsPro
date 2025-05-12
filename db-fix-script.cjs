/**
 * Direct Database Fix Script
 * 
 * This script connects to the database using the application's actual environment 
 * variables and makes direct SQL calls to update project skills.
 */
const { Client } = require('pg');

async function main() {
  try {
    console.log('Getting database configuration from environment...');
    
    // Get database config from environment
    const dbConfig = {
      user: process.env.CLOUD_SQL_USER,
      password: process.env.CLOUD_SQL_PASSWORD,
      database: process.env.CLOUD_SQL_DATABASE,
      host: process.env.CLOUD_SQL_HOST || 'localhost',
      port: parseInt(process.env.CLOUD_SQL_PORT || '5432', 10)
    };
    
    console.log('Connection details:');
    console.log(`- Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`- Database: ${dbConfig.database}`);
    console.log(`- User: ${dbConfig.user}`);
    
    // Initialize client with correct config
    const client = new Client(dbConfig);
    
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');
    
    // Verify skill template existence
    console.log('\nChecking skill template ID 98:');
    const templateCheck = await client.query('SELECT * FROM skill_templates WHERE id = 98');
    
    if (templateCheck.rows.length === 0) {
      console.log('Skill template ID 98 not found.');
    } else {
      console.log('Found skill template:', templateCheck.rows[0]);
    }
    
    // Check projects table
    console.log('\nVerifying projects table:');
    const projectCheck = await client.query('SELECT id, name FROM projects WHERE id = 2');
    
    if (projectCheck.rows.length === 0) {
      console.log('Project ID 2 not found.');
    } else {
      console.log('Found project:', projectCheck.rows[0]);
    }
    
    // Check project_skills table structure
    console.log('\nChecking project_skills table structure:');
    const tableCheck = await client.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'project_skills' 
       ORDER BY ordinal_position`
    );
    
    console.log('Table columns:');
    tableCheck.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check existing project skills
    console.log('\nChecking existing project skills:');
    const skillsCheck = await client.query('SELECT * FROM project_skills LIMIT 5');
    
    if (skillsCheck.rows.length === 0) {
      console.log('No project skills found.');
    } else {
      console.log(`Found ${skillsCheck.rows.length} project skills:`);
      skillsCheck.rows.forEach((row, index) => {
        console.log(`${index + 1}. Project ID: ${row.project_id}, Skill ID: ${row.skill_id}, Template ID: ${row.skill_template_id || 'NULL'}`);
      });
    }
    
    // Insert a new project skill
    console.log('\nCreating a new project skill with template ID 98...');
    
    try {
      const insertResult = await client.query(
        `INSERT INTO project_skills 
         (project_id, skill_template_id, required_level, importance) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`, 
        [2, 98, 'intermediate', 'high']
      );
      
      console.log('Success! Created project skill:', insertResult.rows[0]);
    } catch (error) {
      console.error('Failed to insert project skill:', error.message);
      
      if (error.message.includes('foreign key constraint')) {
        console.log('\nChecking foreign key constraints:');
        const constraints = await client.query(
          `SELECT conname, pg_get_constraintdef(oid) 
           FROM pg_constraint 
           WHERE conrelid = 'project_skills'::regclass`
        );
        constraints.rows.forEach(row => {
          console.log(`- ${row.conname}: ${row.pg_get_constraintdef}`);
        });
      }
    }
    
    // Close the connection
    await client.end();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

// Run the main function
main();