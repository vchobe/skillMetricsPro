import pg from 'pg';
import fetch from 'node-fetch';
const { Client } = pg;

// Login as admin to get a session
async function loginAdmin() {
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@atyeti.com', password: 'password123' }),
      credentials: 'include'
    });
    
    // While Express sends the cookie in the response, fetch doesn't expose it directly
    // We'll use the response status to see if login was successful
    console.log('Login status:', response.status);
    
    if (response.status === 200) {
      // For our test script, we'll just create a cookie string from the session ID
      // In a real browser, the cookie would be automatically stored and sent
      const data = await response.json();
      console.log('Logged in as:', data.email);
      
      // Use bash to get the cookie from a file
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      await execPromise('curl -s -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d \'{"email":"admin@atyeti.com", "password":"password123"}\' -c cookies.txt');
      const { stdout } = await execPromise('cat cookies.txt | grep connect.sid');
      const sessionCookie = stdout.split('\t').pop().trim();
      
      return `connect.sid=${sessionCookie}`;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Add a skill to a project
async function addSkillToProject(cookie, projectId, skillTemplateId) {
  try {
    const response = await fetch(`http://localhost:5000/api/projects/${projectId}/skills`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({
        skillTemplateId: skillTemplateId,
        requiredLevel: 'intermediate'
      })
    });
    
    const data = await response.json();
    console.log('Add skill response:', response.status);
    console.log('Added skill data:', data);
    return data;
  } catch (error) {
    console.error('Error adding skill to project:', error);
  }
}

// Get project skills
async function getProjectSkills(cookie, projectId) {
  try {
    const response = await fetch(`http://localhost:5000/api/projects/${projectId}/skills`, {
      headers: { 'Cookie': cookie }
    });
    
    const data = await response.json();
    console.log('Project skills response:', response.status);
    console.log('Project skills:', data);
    return data;
  } catch (error) {
    console.error('Error getting project skills:', error);
  }
}

// Get skill templates
async function getTemplates() {
  const client = new Client({
    host: process.env.CLOUD_SQL_HOST || '34.30.6.95',
    port: process.env.CLOUD_SQL_PORT || 5432,
    database: process.env.CLOUD_SQL_DATABASE || 'neondb',
    user: process.env.CLOUD_SQL_USER || 'app_user',
    password: process.env.CLOUD_SQL_PASSWORD
  });
  
  try {
    await client.connect();
    
    // Find MongoDB skill template we just created
    const result = await client.query(
      `SELECT * FROM skill_templates WHERE name = 'MongoDB'`
    );
    
    console.log('MongoDB template:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting templates:', error);
  } finally {
    await client.end();
  }
}

async function runTest() {
  const cookie = await loginAdmin();
  
  if (!cookie) {
    console.error('Failed to login');
    return;
  }
  
  // Get template
  const template = await getTemplates();
  
  if (!template) {
    console.error('Template not found');
    return;
  }
  
  // Use project ID 1 for testing
  const projectId = 1;
  
  // Get current project skills
  await getProjectSkills(cookie, projectId);
  
  // Add MongoDB skill to project
  await addSkillToProject(cookie, projectId, template.id);
  
  // Get updated project skills
  await getProjectSkills(cookie, projectId);
}

runTest();