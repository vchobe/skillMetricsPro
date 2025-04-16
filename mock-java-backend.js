// Lightweight mock Java backend for testing frontend Java compatibility
// This provides just enough API functionality to test the skill update fix

import http from 'http';
import { URL } from 'url';

// Simple in-memory database
const db = {
  skills: [],
  pendingUpdates: [],
  users: [
    { id: 1, username: 'testuser', email: 'test@example.com', firstName: 'Test', lastName: 'User' }
  ],
  skillId: 1,
  pendingId: 1
};

// Create basic HTTP server
const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const path = requestUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`[MOCK JAVA] ${req.method} ${path}`);
  
  // Handle API endpoints
  try {
    // API info endpoint
    if (path === '/api/info') {
      return sendJson(res, 200, {
        serviceName: 'skills-management-api',
        version: '1.0.0',
        status: 'UP',
        mode: 'MOCK'
      });
    }
    
    // User login/auth status endpoint
    if (path === '/api/user') {
      return sendJson(res, 401, { message: 'Not authenticated' });
    }
    
    // Get all skills
    if (path === '/api/skills' && req.method === 'GET') {
      return sendJson(res, 200, db.skills);
    }
    
    // Create skill - supports both PUT and POST
    if (path === '/api/skills' && (req.method === 'PUT' || req.method === 'POST')) {
      return handleCreateSkill(req, res);
    }
    
    // Update skill - support both PUT and PATCH (key for compatibility)
    if (path.match(/^\/api\/skills\/\d+$/) && (req.method === 'PUT' || req.method === 'PATCH')) {
      return handleUpdateSkill(req, res, path);
    }
    
    // Get pending updates - Node.js style endpoint
    if (path === '/api/skills/pending' && req.method === 'GET') {
      return sendJson(res, 200, db.pendingUpdates);
    }
    
    // Create pending update
    if (path === '/api/skills/pending' && req.method === 'POST') {
      return handleCreatePendingUpdate(req, res);
    }
    
    // Get pending updates - Java style endpoint
    if (path === '/api/pending-updates' && req.method === 'GET') {
      return sendJson(res, 200, db.pendingUpdates);
    }
    
    // Default response for unknown endpoints
    sendJson(res, 404, { message: 'API endpoint not found', path });
    
  } catch (error) {
    console.error('Error handling request:', error);
    sendJson(res, 500, { message: 'Internal server error', error: error.message });
  }
});

// Helper function to read request body
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString();
        const data = body ? JSON.parse(body) : {};
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper function to send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Handle skill creation
async function handleCreateSkill(req, res) {
  try {
    const data = await readBody(req);
    const skill = {
      id: db.skillId++,
      userId: 1,
      name: data.name,
      category: data.category,
      level: data.level, 
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.skills.push(skill);
    console.log('[MOCK JAVA] Created skill:', skill);
    sendJson(res, 201, skill);
  } catch (err) {
    console.error('Error creating skill:', err);
    sendJson(res, 400, { message: 'Invalid skill data', error: err.message });
  }
}

// Handle skill update
async function handleUpdateSkill(req, res, path) {
  try {
    const skillId = parseInt(path.split('/').pop());
    const skillIndex = db.skills.findIndex(s => s.id === skillId);
    
    if (skillIndex === -1) {
      return sendJson(res, 404, { message: 'Skill not found', skillId });
    }
    
    const data = await readBody(req);
    const skill = db.skills[skillIndex];
    
    // Different behavior for PATCH vs PUT
    if (req.method === 'PATCH') {
      // For PATCH, update only provided fields
      Object.assign(skill, data);
    } else {
      // For PUT, replace all fields (maintaining id and userId)
      Object.assign(skill, {
        name: data.name,
        category: data.category,
        level: data.level,
        description: data.description
      });
    }
    
    // Update the timestamp
    skill.updatedAt = new Date().toISOString();
    
    console.log(`[MOCK JAVA] Updated skill using ${req.method}:`, skill);
    sendJson(res, 200, skill);
  } catch (err) {
    console.error('Error updating skill:', err);
    sendJson(res, 400, { message: 'Invalid skill data', error: err.message });
  }
}

// Handle creating pending update
async function handleCreatePendingUpdate(req, res) {
  try {
    const data = await readBody(req);
    
    // Verify the referenced skill exists
    const skillExists = db.skills.some(s => s.id === data.skillId);
    if (!skillExists) {
      return sendJson(res, 404, { message: 'Referenced skill not found', skillId: data.skillId });
    }
    
    const pendingUpdate = {
      id: db.pendingId++,
      skillId: data.skillId,
      userId: 1,
      requesterId: 1,
      currentLevel: data.currentLevel || 'Beginner',
      newLevel: data.newLevel,
      justification: data.justification,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    
    db.pendingUpdates.push(pendingUpdate);
    console.log('[MOCK JAVA] Created pending update:', pendingUpdate);
    sendJson(res, 201, pendingUpdate);
  } catch (err) {
    console.error('Error creating pending update:', err);
    sendJson(res, 400, { message: 'Invalid data', error: err.message });
  }
}

// Start server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`  Mock Java Backend running on port ${PORT}`);
  console.log(`  This simulates the Java Spring Boot API`);
  console.log(`===========================================`);
});