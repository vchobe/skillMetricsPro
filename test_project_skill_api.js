import pg from 'pg';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

const { Pool } = pg;
dotenv.config();

async function getAdminSessionId() {
  // Get admin session directly from the database by inserting into the session store
  const pool = new Pool({
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE
  });

  try {
    // Get the admin user ID first
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = 'admin@atyeti.com'"
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }
    
    const adminId = userResult.rows[0].id;
    
    // Create a session for the admin
    const sessionData = {
      passport: {
        user: adminId
      }
    };
    
    // Create a new session in the session store
    const sessionResult = await pool.query(
      "INSERT INTO session (sid, sess, expire) VALUES ($1, $2, $3) RETURNING sid",
      ['test-session-' + Date.now(), JSON.stringify(sessionData), new Date(Date.now() + 24 * 60 * 60 * 1000)]
    );
    
    return sessionResult.rows[0].sid;
  } finally {
    await pool.end();
  }
}

async function testProjectSkillAPI() {
  try {
    console.log('Testing API endpoint for adding project skills with skill templates...');
    
    // Get admin session ID
    const sessionId = await getAdminSessionId();
    console.log(`Got session ID: ${sessionId}`);
    
    // Setup cookie with the session ID
    const cookie = `connect.sid=s%3A${sessionId}`;
    
    // Get a skill template for testing
    const templateId = await getSkillTemplateId();
    console.log(`Using skill template ID: ${templateId}`);
    
    // Project ID to test with
    const projectId = 4; // Using project ID 4 for testing
    
    // Make API request to add the skill to the project
    const response = await fetch(`http://localhost:5000/api/projects/${projectId}/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({
        skillTemplateId: templateId,
        requiredLevel: 'intermediate',
        importance: 'high'
      })
    });
    
    const responseText = await response.text();
    console.log(`API Response Status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`API request failed: ${responseText}`);
      return;
    }
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.log(`Response is not valid JSON: ${responseText}`);
      return;
    }
    
    console.log('API request succeeded with response:');
    console.log(JSON.stringify(responseData, null, 2));
    
    // Clean up the created skill
    await deleteProjectSkill(responseData.id);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function getSkillTemplateId() {
  const pool = new Pool({
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE
  });
  
  try {
    const result = await pool.query('SELECT id FROM skill_templates LIMIT 1');
    return result.rows[0].id;
  } finally {
    await pool.end();
  }
}

async function deleteProjectSkill(id) {
  const pool = new Pool({
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE
  });
  
  try {
    console.log(`Cleaning up: Deleting project skill with ID ${id}`);
    await pool.query('DELETE FROM project_skills WHERE id = $1', [id]);
    console.log('Cleanup successful');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await pool.end();
  }
}

testProjectSkillAPI();