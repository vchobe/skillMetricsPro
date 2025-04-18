import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { pool } from "./db";
import * as schema from "@shared/schema";
import {
  insertSkillSchema,
  insertSkillHistorySchema,
  insertProfileHistorySchema,
  insertEndorsementSchema,
  insertNotificationSchema,
  insertPendingSkillUpdateSchema,
  Skill,
  insertSkillTargetSchema,
  insertSkillTemplateSchema,
  insertSkillCategorySchema,
  insertSkillApproverSchema,
  SkillCategory,
  SkillApprover
} from "@shared/schema";

// Direct database check for admin status
async function checkIsUserAdminDirectly(userId: number): Promise<boolean> {
  try {
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return false;
    
    const dbValue = result.rows[0]?.is_admin;
    // PostgreSQL returns boolean values in different formats
    return dbValue === true || dbValue === 't' || dbValue === 'true';
  } catch (error) {
    console.error("Error checking admin status directly:", error);
    return false;
  }
}

// Helper function to check if a user is an admin from the user object
function isUserAdmin(user: any): boolean {
  if (!user) return false;
  
  // Convert any user object to have consistent properties
  const userObj = user as {
    id?: number;
    is_admin?: boolean | string;
    isAdmin?: boolean | string;
  };
  
  // Check both camelCase and snake_case properties
  const adminValue = 
    userObj.isAdmin !== undefined ? userObj.isAdmin : 
    userObj.is_admin !== undefined ? userObj.is_admin : 
    false;
  
  // Handle different formats PostgreSQL might return
  if (adminValue === true) return true;
  if (typeof adminValue === 'string') {
    const lowerValue = adminValue.toLowerCase();
    return lowerValue === 't' || lowerValue === 'true';
  }
  
  return false;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Import project-related schemas for validation
  const { 
    insertClientSchema, 
    insertProjectSchema, 
    insertProjectResourceSchema,
    insertProjectSkillSchema,
    insertProjectResourceHistorySchema
  } = schema;
  // Set up authentication routes
  setupAuth(app);
  
  // Health check endpoints for testing and deployment verification
  app.get(["/health", "/status", "/api/health"], async (req, res) => {
    try {
      // Test database connection
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      // Get database connection type
      const dbUrl = process.env.DATABASE_URL || '';
      const isCloudSql = process.env.CLOUD_SQL_URL && process.env.CLOUD_SQL_URL.includes('/cloudsql/');
      const connectionType = isCloudSql ? 'cloud_sql' : 
                            dbUrl.includes('neon.tech') ? 'neon' : 
                            'standard_postgres';
      
      res.status(200).json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        database: "connected",
        connection_type: connectionType,
        environment: process.env.NODE_ENV || 'development',
        use_cloud_sql: process.env.USE_CLOUD_SQL === 'true',
        version: process.env.npm_package_version || '1.0.0',
        server_time: new Date().toISOString()
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ 
        status: "error", 
        timestamp: new Date().toISOString(),
        database: "disconnected",
        environment: process.env.NODE_ENV || 'development',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Root endpoint that will serve the frontend
  app.get("/", (req, res, next) => {
    // Let Vite handle serving the frontend
    next();
  });
  
  // Status endpoint for deployment verification (moved from root)
  app.get("/server-status", (req, res) => {
    res.send(`
      <html>
        <head>
          <title>SkillMetrics API Server Status</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
            .card { border: 1px solid #ddd; border-radius: 4px; padding: 20px; margin-bottom: 20px; }
            .success { color: green; }
            .error { color: red; }
            code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>SkillMetrics API Server Status</h1>
            <div class="card">
              <h2>Server Status</h2>
              <p class="success">✅ Server is running</p>
              <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
              <p>Server Time: ${new Date().toISOString()}</p>
            </div>
            <div class="card">
              <h2>API Status</h2>
              <p>Check health endpoints: <a href="/health">/health</a> or <a href="/status">/status</a></p>
            </div>
          </div>
        </body>
      </html>
    `);
  });

  // Middleware to ensure user is authenticated
  const ensureAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
  
  // Middleware to ensure user is admin
  const ensureAdmin = async (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      console.log("Admin check failed - user not authenticated");
      return res.status(403).json({ message: "Forbidden" });
    }
    
    // First try the user object from the session
    const sessionAdminCheck = isUserAdmin(req.user);
    
    // If that fails, do a direct database check (more reliable)
    if (!sessionAdminCheck) {
      const userId = req.user!.id;
      const directAdminCheck = await checkIsUserAdminDirectly(userId);
      
      console.log("Admin check details:");
      console.log("- User:", req.user);
      console.log("- Session check result:", sessionAdminCheck);
      console.log("- Direct DB check result:", directAdminCheck);
      console.log("- isAdmin value:", req.user?.isAdmin, "type:", typeof req.user?.isAdmin);
      console.log("- is_admin value:", req.user?.is_admin, "type:", typeof req.user?.is_admin);
      
      if (!directAdminCheck) {
        console.log("Admin check failed for user:", req.user?.email || req.user?.username);
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    
    console.log("Admin check passed for user:", req.user?.email || req.user?.username);
    next();
  };

  // User profile routes
  app.get("/api/user/profile", ensureAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      const { password, ...userWithoutPassword } = user!;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching profile", error });
    }
  });
  
  // Get a specific user's profile by ID (for viewing other users)
  app.get("/api/users/:userId", ensureAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information - only return basic profile data
      const { password, ...userBasicInfo } = user;
      res.json(userBasicInfo);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user profile", error });
    }
  });
  
  // Get a specific user's skills by userId
  app.get("/api/users/:userId/skills", ensureAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get skills for the specified user
      const skills = await storage.getUserSkills(userId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user skills", error });
    }
  });
  
  // Get a specific user's skill history by userId
  app.get("/api/users/:userId/skills/history", ensureAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get skill history for the specified user
      const skillHistory = await storage.getUserSkillHistory(userId);
      res.json(skillHistory);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user skill history", error });
    }
  });

  app.patch("/api/user/profile", ensureAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create profile history for each changed field
      const updateData: Partial<typeof user> = {};
      
      // Directly check database for current admin status
      const userCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
      // Convert PostgreSQL boolean representation to JS boolean
      const dbValue = userCheck.rows[0]?.is_admin;
      const isAdmin = dbValue === true || dbValue === 't' || dbValue === 'true';
      
      console.log("Admin status from database (raw):", dbValue);
      console.log("Admin status from database (type):", typeof dbValue);
      console.log("Admin status converted to boolean:", isAdmin);
      console.log("User object from storage:", user);
      console.log("User object is_admin property:", user.is_admin);
      
      // Track changes for history
      for (const [key, value] of Object.entries(req.body)) {
        if (key in user && key !== 'id' && key !== 'password' && key !== 'is_admin' && user[key as keyof typeof user] !== value) {
          const oldValue = user[key as keyof typeof user]?.toString() || '';
          const newValue = value?.toString() || '';
          
          // Add to update data
          if (typeof value !== 'undefined' && value !== null) {
            (updateData as any)[key] = value;
          }
          
          // Create history entry
          await storage.createProfileHistory({
            userId,
            changedField: key,
            previousValue: oldValue,
            newValue
          });
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        // Always preserve the admin flag by including it specifically as isAdmin
        // This will be properly converted to is_admin in storage.ts
        (updateData as any).isAdmin = isAdmin;
        
        console.log("Update data with preserved admin flag:", updateData);
        
        const updatedUser = await storage.updateUser(userId, updateData);
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      }
    } catch (error) {
      res.status(500).json({ message: "Error updating profile", error });
    }
  });

  app.get("/api/user/profile/history", ensureAuth, async (req, res) => {
    try {
      const history = await storage.getUserProfileHistory(req.user!.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching profile history", error });
    }
  });

  // Skills routes
  app.get("/api/skills", ensureAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const skills = await storage.getUserSkills(userId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skills", error });
    }
  });

  app.post("/api/skills", ensureAuth, async (req, res) => {
    try {
      const parsedData = insertSkillSchema.safeParse({
        ...req.body,
        userId: req.user!.id
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid skill data", 
          errors: parsedData.error.format() 
        });
      }
      
      const skill = await storage.createSkill(parsedData.data);
      
      // Create initial skill history
      await storage.createSkillHistory({
        skillId: skill.id,
        userId: req.user!.id,
        previousLevel: null, // New skill
        newLevel: skill.level,
        changeNote: "Initial skill creation"
      });
      
      res.status(201).json(skill);
    } catch (error) {
      res.status(500).json({ message: "Error creating skill", error });
    }
  });

  app.get("/api/skills/:id", ensureAuth, async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      const skill = await storage.getSkill(skillId);
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      // Ensure user owns the skill or is admin
      if (skill.userId !== req.user!.id && !isUserAdmin(req.user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(skill);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill", error });
    }
  });

  app.patch("/api/skills/:id", ensureAuth, async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      const skill = await storage.getSkill(skillId);
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      // Ensure user owns the skill or is admin
      if (skill.userId !== req.user!.id && !isUserAdmin(req.user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Create a copy of the request body without changeNote for skill update
      const { changeNote, ...skillUpdateData } = req.body;
      
      // If level is changed, record history
      if (skillUpdateData.level && skillUpdateData.level !== skill.level) {
        await storage.createSkillHistory({
          skillId,
          userId: req.user!.id,
          previousLevel: skill.level,
          newLevel: skillUpdateData.level,
          changeNote: changeNote || `Updated from ${skill.level} to ${skillUpdateData.level}`
        });
      }
      
      const updatedSkill = await storage.updateSkill(skillId, skillUpdateData);
      res.json(updatedSkill);
    } catch (error) {
      res.status(500).json({ message: "Error updating skill", error });
    }
  });

  app.delete("/api/skills/:id", ensureAuth, async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      const skill = await storage.getSkill(skillId);
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      // Ensure user owns the skill or is admin
      if (skill.userId !== req.user!.id && !isUserAdmin(req.user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteSkill(skillId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting skill", error });
    }
  });

  app.get("/api/skills/:id/history", ensureAuth, async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      const skill = await storage.getSkill(skillId);
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      // Ensure user owns the skill or is admin
      if (skill.userId !== req.user!.id && !isUserAdmin(req.user)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const history = await storage.getSkillHistory(skillId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill history", error });
    }
  });

  app.get("/api/user/skills/history", ensureAuth, async (req, res) => {
    try {
      const history = await storage.getUserSkillHistory(req.user!.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill history", error });
    }
  });
  
  // Global organization-wide skill history (for all users to view global activity)
  app.get("/api/org/skills/history", ensureAuth, async (req, res) => {
    try {
      const history = await storage.getAllSkillHistories();
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching global skill history", error });
    }
  });

  // All users directory (accessible to all authenticated users)
  app.get("/api/users", ensureAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  });
  
  // Get all skills (for organization dashboard)
  app.get("/api/all-skills", ensureAuth, async (req, res) => {
    try {
      const skills = await storage.getAllSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching all skills", error });
    }
  });
  
  // Get all skills (for activity feed)
  app.get("/api/skills/all", ensureAuth, async (req, res) => {
    try {
      const skills = await storage.getAllSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching all skills", error });
    }
  });

  // Admin routes
  app.get("/api/admin/users", ensureAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  });
  
  // Delete user by email
  app.delete("/api/admin/users/delete-by-email", ensureAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }
      
      // Find the user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: `User with email ${email} not found` });
      }
      
      // Use the dedicated storage method to delete the user and all related records
      await storage.deleteUser(user.id);
      
      res.status(200).json({ message: `User ${email} deleted successfully`, userId: user.id });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user", error });
    }
  });

  app.get("/api/admin/skills", ensureAdmin, async (req, res) => {
    try {
      const skills = await storage.getAllSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skills", error });
    }
  });
  
  // Skill template management (for admin)
  app.get("/api/admin/skill-templates", ensureAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllSkillTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill templates", error });
    }
  });
  
  // Public endpoint for skill templates - available to all authenticated users
  app.get("/api/skill-templates", ensureAuth, async (req, res) => {
    try {
      const templates = await storage.getAllSkillTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill templates", error });
    }
  });
  
  app.post("/api/admin/skill-templates", ensureAdmin, async (req, res) => {
    try {
      const newTemplate = await storage.createSkillTemplate(req.body);
      res.status(201).json(newTemplate);
    } catch (error) {
      res.status(500).json({ message: "Error creating skill template", error });
    }
  });
  
  app.patch("/api/admin/skill-templates/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const updatedTemplate = await storage.updateSkillTemplate(id, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      res.status(500).json({ message: "Error updating skill template", error });
    }
  });
  
  app.delete("/api/admin/skill-templates/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      await storage.deleteSkillTemplate(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting skill template", error });
    }
  });
  
  // Skill target management (for admin)
  app.get("/api/admin/skill-targets", ensureAdmin, async (req, res) => {
    try {
      const targets = await storage.getAllSkillTargets();
      
      // For each target, get the associated skills and users
      const targetsWithDetails = await Promise.all(
        targets.map(async (target) => {
          const skillIds = await storage.getSkillTargetSkills(target.id);
          const userIds = await storage.getSkillTargetUsers(target.id);
          
          return {
            ...target,
            skillIds,
            assignedUsers: userIds
          };
        })
      );
      
      res.json(targetsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill targets", error });
    }
  });
  
  app.post("/api/admin/skill-targets", ensureAdmin, async (req, res) => {
    try {
      const { skillIds, assignedUsers, ...targetData } = req.body;
      
      // Since name field might be missing, create a default name based on selected skills level
      // Create the target
      const target = await storage.createSkillTarget({
        name: targetData.name || `Target: ${targetData.targetLevel} level`, // Default name if not provided
        description: targetData.description,
        targetLevel: targetData.targetLevel,
        targetDate: targetData.targetDate,
        targetNumber: targetData.targetNumber
      });
      
      // Add skills to the target
      if (Array.isArray(skillIds)) {
        for (const skillId of skillIds) {
          await storage.addSkillToTarget(target.id, skillId);
        }
      }
      
      // Add users to the target
      if (Array.isArray(assignedUsers)) {
        for (const userId of assignedUsers) {
          await storage.addUserToTarget(target.id, userId);
        }
      }
      
      // Return the target with skills and users
      const skillIdsFromDb = await storage.getSkillTargetSkills(target.id);
      const userIdsFromDb = await storage.getSkillTargetUsers(target.id);
      
      res.status(201).json({
        ...target,
        skillIds: skillIdsFromDb,
        assignedUsers: userIdsFromDb
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating skill target", error });
    }
  });
  
  app.patch("/api/admin/skill-targets/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid target ID" });
      }
      
      console.log(`Updating skill target ${id} with request body:`, req.body);
      
      const { skillIds, assignedUsers, ...targetData } = req.body;
      console.log("Extracted targetData:", targetData);
      
      // Update the basic target data
      const updatedTarget = await storage.updateSkillTarget(id, targetData);
      
      // If skillIds are provided, update the target skills
      if (Array.isArray(skillIds)) {
        // Get current skill IDs
        const currentSkillIds = await storage.getSkillTargetSkills(id);
        
        // Remove skills that are no longer in the list
        for (const currentId of currentSkillIds) {
          if (!skillIds.includes(currentId)) {
            await storage.removeSkillFromTarget(id, currentId);
          }
        }
        
        // Add new skills
        for (const skillId of skillIds) {
          if (!currentSkillIds.includes(skillId)) {
            await storage.addSkillToTarget(id, skillId);
          }
        }
      }
      
      // If assignedUsers are provided, update the target users
      if (Array.isArray(assignedUsers)) {
        // Get current user IDs
        const currentUserIds = await storage.getSkillTargetUsers(id);
        
        // Remove users that are no longer in the list
        for (const currentId of currentUserIds) {
          if (!assignedUsers.includes(currentId)) {
            await storage.removeUserFromTarget(id, currentId);
          }
        }
        
        // Add new users
        for (const userId of assignedUsers) {
          if (!currentUserIds.includes(userId)) {
            await storage.addUserToTarget(id, userId);
          }
        }
      }
      
      // Return the updated target with skills and users
      const skillIdsFromDb = await storage.getSkillTargetSkills(id);
      const userIdsFromDb = await storage.getSkillTargetUsers(id);
      
      res.json({
        ...updatedTarget,
        skillIds: skillIdsFromDb,
        assignedUsers: userIdsFromDb
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating skill target", error });
    }
  });
  
  app.delete("/api/admin/skill-targets/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid target ID" });
      }
      
      await storage.deleteSkillTarget(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting skill target", error });
    }
  });
  
  // Endpoint to get skill targets for the current user
  // Get all skill targets - accessible to all users (global skill gap analysis)
  app.get("/api/skill-targets", ensureAuth, async (req, res) => {
    try {
      // Get all skill targets
      const allTargets = await storage.getAllSkillTargets();
      
      // Enhance targets with skill IDs
      const enhancedTargets = await Promise.all(
        allTargets.map(async (target) => {
          const skillIds = await storage.getSkillTargetSkills(target.id);
          return {
            ...target,
            skillIds
          };
        })
      );
      
      res.json(enhancedTargets);
    } catch (error) {
      console.error("Error fetching global skill targets:", error);
      res.status(500).json({ message: "Error fetching global skill targets", error });
    }
  });
  
  // GET global skill gap analysis - for all users (not just admins)
  app.get("/api/skill-gap-analysis", ensureAuth, async (req, res) => {
    try {
      const targets = await storage.getAllSkillTargets();
      const skills = await storage.getAllSkills();
      const users = await storage.getAllUsers();
      
      // Process targets to include skill IDs
      const processedTargets = await Promise.all(
        targets.map(async (target) => {
          const skillIds = await storage.getSkillTargetSkills(target.id);
          return { ...target, skillIds };
        })
      );
      
      // Calculate skill gap analysis similar to admin dashboard
      const gapAnalysis = await Promise.all(processedTargets.map(async (target) => {
        // Get skills that are part of this target
        const targetSkills = skills.filter(s => 
          target.skillIds.includes(s.id)
        );
        
        if (targetSkills.length === 0) return null;
        
        // Calculate current average level across all users
        const levelToValue = (level: string) => {
          switch(level) {
            case "beginner": return 33;
            case "intermediate": return 66;
            case "expert": return 100;
            default: return 0;
          }
        };
        
        const targetLevelValue = levelToValue(target.targetLevel);
        
        // Calculate current level (average of all users who have these skills)
        const levelData = targetSkills.map(skill => levelToValue(skill.level));
        const currentLevelValue = levelData.length > 0 
          ? Math.round(levelData.reduce((a, b) => a + b, 0 as number) / levelData.length) 
          : 0;
          
        // Calculate gap
        const gap = Math.max(0, targetLevelValue - currentLevelValue);
        
        // Count employees needing skill improvement
        const employeesNeedingImprovement = users.filter(user => {
          // Get the user's skills that match skills in the target's skillIds
          const userTargetSkills = skills.filter(s => 
            s.userId === user.id && 
            target.skillIds.includes(s.id)
          );
          
          // If user has no relevant skills, they need improvement
          if (userTargetSkills.length === 0) return true;
          
          // Calculate user's average level for target skills
          const userAvgLevel = userTargetSkills.reduce((sum, skill) => 
            sum + levelToValue(skill.level), 0 as number) / userTargetSkills.length;
            
          // If user's level is below target, they need improvement
          return userAvgLevel < targetLevelValue;
        }).length || 0;
        
        return {
          name: target.name || `Target ${target.id}`,
          id: target.id,
          targetSkillCount: targetSkills.length,
          currentLevel: Math.round(currentLevelValue),
          targetLevel: Math.round(targetLevelValue),
          gap: Math.round(gap),
          employeesNeedingImprovement
        };
      }));
      
      // Filter out null entries
      const filteredAnalysis = gapAnalysis.filter(Boolean);
      
      res.json(filteredAnalysis);
    } catch (error) {
      console.error("Error calculating skill gap analysis:", error);
      res.status(500).json({ message: "Error calculating skill gap analysis", error });
    }
  });

  app.get("/api/user/skill-targets", ensureAuth, async (req, res) => {
    try {
      // Get all skill targets
      const allTargets = await storage.getAllSkillTargets();
      
      // Filter targets that are assigned to the current user
      const userTargets = await Promise.all(
        allTargets.map(async (target) => {
          const userIds = await storage.getSkillTargetUsers(target.id);
          
          // If this target is assigned to the current user
          if (userIds.includes(req.user!.id)) {
            const skillIds = await storage.getSkillTargetSkills(target.id);
            
            // Get the user's current skills
            const userSkills = await storage.getUserSkills(req.user!.id);
            
            // Get the target skills
            const targetSkillsPromises = skillIds.map(skillId => storage.getSkill(skillId));
            const targetSkillsResults = await Promise.all(targetSkillsPromises);
            
            // Filter out undefined results
            const targetSkills = targetSkillsResults.filter(skill => skill !== undefined) as Skill[];
            
            // Find skills that match the target level
            const matchingSkills = userSkills.filter(userSkill => {
              // Check if the user has this skill
              const hasMatchingSkill = targetSkills.some(targetSkill => 
                targetSkill.name === userSkill.name ||
                targetSkill.id === userSkill.id
              );
              
              // For level-based targets, also check if the level matches or exceeds
              if (target.targetLevel && hasMatchingSkill) {
                const levelOrder = { beginner: 1, intermediate: 2, expert: 3 };
                const userLevel = levelOrder[userSkill.level as keyof typeof levelOrder] || 0;
                const targetLevel = levelOrder[target.targetLevel as keyof typeof levelOrder] || 0;
                
                return userLevel >= targetLevel;
              }
              
              return hasMatchingSkill;
            });
            
            // Calculate gap and progress
            const totalTargetSkills = skillIds.length;
            const acquiredSkills = matchingSkills.length;
            const progress = totalTargetSkills > 0 ? Math.round((acquiredSkills / totalTargetSkills) * 100) : 0;
            
            // Create the response object
            return {
              ...target,
              skillIds,
              targetSkills,
              progress,
              acquiredSkills,
              totalTargetSkills,
              skillGap: totalTargetSkills - acquiredSkills,
              dueDate: target.targetDate ? new Date(target.targetDate).toISOString() : null,
              isCompleted: progress === 100
            };
          }
          return null;
        })
      );
      
      // Filter out null values
      const validUserTargets = userTargets.filter(target => target !== null);
      
      res.json(validUserTargets);
    } catch (error) {
      console.error("Error fetching user skill targets:", error);
      res.status(500).json({ message: "Error fetching user skill targets", error });
    }
  });
  
  // Get all skill histories across all users for admin
  app.get("/api/admin/skill-history", ensureAdmin, async (req, res) => {
    try {
      const histories = await storage.getAllSkillHistories();
      res.json(histories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill histories", error });
    }
  });
  
  // Export all data for admins (for data analysis and reporting)
  app.get("/api/admin/export-data", ensureAdmin, async (req, res) => {
    try {
      // Get all data
      const users = await storage.getAllUsers();
      const skills = await storage.getAllSkills();
      const skillHistories = await storage.getAllSkillHistories();
      
      // Remove sensitive information from users
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      // Format data for export
      const exportData = {
        exportDate: new Date().toISOString(),
        exportedBy: {
          id: req.user!.id,
          username: req.user!.username,
          email: req.user!.email
        },
        data: {
          users: usersWithoutPasswords,
          skills,
          skillHistories
        }
      };
      
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Error exporting data", error });
    }
  });
  
  // Get certification report
  app.get("/api/admin/certification-report", ensureAdmin, async (req, res) => {
    try {
      console.log("Running certification report for user:", req.user);
      
      // Direct database query to get all certified skills with their related data
      const queryText = `
        SELECT s.*, u.email, u.username
        FROM skills s
        JOIN users u ON s.user_id = u.id
        WHERE s.certification IS NOT NULL 
          AND s.certification != 'true' 
          AND s.certification != 'false'
      `;
      console.log("Running SQL query:", queryText);
      
      const result = await pool.query(queryText);
      
      const rawSkills = result.rows;
      console.log("Certification report - Total skills in DB:", rawSkills.length);
      
      if (rawSkills.length > 0) {
        console.log("Certification report - Sample skill from DB:", JSON.stringify(rawSkills[0], null, 2));
      } else {
        console.log("No certified skills found in the database!");
      }
      
      // Group by user
      const userMap = new Map();
      
      // When using raw SQL queries, the result has snake_case field names
      // and TypeScript doesn't know the shape, so we need to use "any" type
      for (const skill of rawSkills as any[]) {
        try {
          const userId = skill.user_id;
          
          if (!userId) {
            console.log(`Skill ${skill.id} has undefined user_id:`, skill);
            continue;
          }
          
          if (!userMap.has(userId)) {
            // Create user object from the joined query data
            const userObj = {
              id: userId,
              email: skill.email,
              username: skill.username
            };
            
            userMap.set(userId, {
              user: userObj,
              certifications: []
            });
          }
          
          if (userMap.has(userId)) {
            // Parse dates from the database fields
            const certificationDate = skill.certification_date ? new Date(skill.certification_date) : null;
            const expirationDate = skill.expiration_date ? new Date(skill.expiration_date) : null;
            
            userMap.get(userId).certifications.push({
              skillId: skill.id,
              name: skill.name,
              category: skill.category,
              level: skill.level,
              certification: skill.certification,
              credlyLink: skill.credly_link,
              acquired: certificationDate,
              acquiredFormatted: certificationDate ? certificationDate.toISOString().split('T')[0] : null,
              expirationDate: expirationDate,
              expirationFormatted: expirationDate ? expirationDate.toISOString().split('T')[0] : null,
              isExpired: expirationDate ? expirationDate < new Date() : false
            });
          }
        } catch (err) {
          console.error(`Error processing skill ${skill.id} for user ${skill.user_id}:`, err);
        }
      }
      
      const report = Array.from(userMap.values());
      console.log("Certification report ready. Report length:", report.length);
      res.json(report);
    } catch (error) {
      console.error("Error generating certification report:", error);
      res.status(500).json({ message: "Error generating certification report", error });
    }
  });
  
  // Get advanced analytics data
  app.get("/api/admin/advanced-analytics", ensureAdmin, async (req, res) => {
    try {
      const skills = await storage.getAllSkills();
      const users = await storage.getAllUsers();
      const histories = await storage.getAllSkillHistories();
      
      // Monthly progress trends - group skill updates by month
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      
      // Format: YYYY-MM
      const monthlyUpdates = histories.reduce((acc, history) => {
        const date = new Date(history.createdAt);
        if (date >= sixMonthsAgo) {
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Convert to array sorted by date
      const monthlyData = Object.entries(monthlyUpdates)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      // Skill growth by level over time
      const skillsByLevel = histories.reduce((acc, history) => {
        const date = new Date(history.createdAt);
        if (date >= sixMonthsAgo) {
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!acc[month]) {
            acc[month] = { beginner: 0, intermediate: 0, expert: 0 };
          }
          
          if (history.newLevel) {
            acc[month][history.newLevel] = (acc[month][history.newLevel] || 0) + 1;
          }
        }
        return acc;
      }, {} as Record<string, Record<string, number>>);
      
      // Convert to array for chart data
      const skillLevelTrends = Object.entries(skillsByLevel).map(([month, levels]) => ({
        month,
        beginner: levels.beginner || 0,
        intermediate: levels.intermediate || 0,
        expert: levels.expert || 0
      })).sort((a, b) => a.month.localeCompare(b.month));
      
      // Top skills by category
      const skillsByCategory = skills.reduce((acc, skill) => {
        const category = skill.category || 'Other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Convert to array for charts
      const categoryData = Object.entries(skillsByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      
      // Department distribution (using categories as proxy for departments)
      const departmentData = categoryData.slice();
      
      // User growth - number of skills per user
      const userSkillsCount = skills.reduce((acc, skill) => {
        acc[skill.userId] = (acc[skill.userId] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      // Parse all valid user IDs and filter out invalid ones
      const validSkillUserEntries = Object.entries(userSkillsCount)
        .map(([userIdStr, count]) => {
          const id = parseInt(userIdStr);
          return isNaN(id) ? null : { id, count };
        })
        .filter(entry => entry !== null) as { id: number, count: number }[];
      
      // Process only valid user IDs
      const userSkillData = await Promise.all(
        validSkillUserEntries.map(async ({ id, count }) => {
          const user = await storage.getUser(id);
          // Create a display name from username or email
          let displayName = `User ${id}`;
          if (user) {
            if (user.username) {
              displayName = user.username;
            } else if (user.email) {
              displayName = user.email.split('@')[0];
            }
          }
          return {
            userId: id,
            name: displayName,
            skillCount: count
          };
        })
      );
      
      // Top certified users
      const certificationUsers = await storage.getAllUsers();
      const certSkills = await storage.getAllSkills();
      const certSkillsByUser = certSkills
        .filter(skill => 
          skill.certification &&
          skill.certification !== 'true' &&
          skill.certification !== 'false'
        )
        .reduce((acc, skill) => {
          acc[skill.userId] = (acc[skill.userId] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);
      
      // Parse all valid user IDs and filter out invalid ones
      const validUserEntries = Object.entries(certSkillsByUser)
        .map(([userIdStr, count]) => {
          const id = parseInt(userIdStr);
          return isNaN(id) ? null : { id, count };
        })
        .filter(entry => entry !== null) as { id: number, count: number }[];
      
      // Process only valid user IDs
      const certifiedUsers = await Promise.all(
        validUserEntries.map(async ({ id, count }) => {
          const user = await storage.getUser(id);
          // Create a display name from username or email
          let displayName = `User ${id}`;
          if (user) {
            if (user.username) {
              displayName = user.username;
            } else if (user.email) {
              displayName = user.email.split('@')[0];
            }
          }
          return {
            userId: id,
            name: displayName,
            certCount: count
          };
        })
      );
      
      const topCertifiedUsers = certifiedUsers
        .sort((a, b) => b.certCount - a.certCount)
        .slice(0, 10);
      
      res.json({
        monthlyData,
        skillLevelTrends,
        categoryData,
        departmentData,
        userSkillData,
        certifiedUsers: topCertifiedUsers
      });
    } catch (error) {
      res.status(500).json({ message: "Error generating advanced analytics", error });
    }
  });

  // Endorsement routes
  app.post("/api/skills/:id/endorse", ensureAuth, async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      const skill = await storage.getSkill(skillId);
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      // Users can't endorse their own skills
      if (skill.userId === req.user!.id) {
        return res.status(400).json({ message: "You cannot endorse your own skills" });
      }
      
      const parsedData = insertEndorsementSchema.safeParse({
        skillId,
        endorserId: req.user!.id,
        endorseeId: skill.userId,
        comment: req.body.comment
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid endorsement data", 
          errors: parsedData.error.format() 
        });
      }
      
      const endorsement = await storage.createEndorsement(parsedData.data);
      
      // Update the skill's endorsement count
      await storage.updateSkill(skillId, { 
        endorsementCount: (skill.endorsementCount || 0) + 1 
      });
      
      // Create a notification for the skill owner
      await storage.createNotification({
        userId: skill.userId,
        type: "endorsement",
        content: `Your ${skill.name} skill was endorsed by a colleague`,
        relatedSkillId: skillId,
        relatedUserId: req.user!.id
      });
      
      res.status(201).json(endorsement);
    } catch (error) {
      res.status(500).json({ message: "Error creating endorsement", error });
    }
  });
  
  app.get("/api/skills/:id/endorsements", ensureAuth, async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      const skill = await storage.getSkill(skillId);
      
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      const endorsements = await storage.getSkillEndorsements(skillId);
      res.json(endorsements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching endorsements", error });
    }
  });
  
  app.get("/api/user/endorsements", ensureAuth, async (req, res) => {
    try {
      const endorsements = await storage.getUserEndorsements(req.user!.id);
      res.json(endorsements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching endorsements", error });
    }
  });
  
  app.delete("/api/endorsements/:id", ensureAuth, async (req, res) => {
    try {
      const endorsementId = parseInt(req.params.id);
      // Only admins can delete endorsements
      if (!req.user!.is_admin) {
        return res.status(403).json({ message: "Only admins can delete endorsements" });
      }
      
      await storage.deleteEndorsement(endorsementId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting endorsement", error });
    }
  });
  
  // Notification routes
  app.get("/api/notifications", ensureAuth, async (req, res) => {
    try {
      const unreadOnly = req.query.unread === "true";
      const notifications = await storage.getUserNotifications(req.user!.id, unreadOnly);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notifications", error });
    }
  });
  
  app.post("/api/notifications/:id/read", ensureAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.status(200).send();
    } catch (error) {
      res.status(500).json({ message: "Error marking notification as read", error });
    }
  });
  
  app.post("/api/notifications/read-all", ensureAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.status(200).send();
    } catch (error) {
      res.status(500).json({ message: "Error marking notifications as read", error });
    }
  });

  // Pending Skill Updates routes (Approval system)
  app.post("/api/skills/pending", ensureAuth, async (req, res) => {
    try {
      console.log("Received pending skill update request with body:", req.body);
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin || req.user!.is_admin;
      
      // Handle both isUpdate and is_update for backward compatibility
      if (req.body.isUpdate !== undefined && req.body.is_update === undefined) {
        req.body.is_update = req.body.isUpdate;
      }
      
      // Handle both skillId and skill_id for backward compatibility
      if (req.body.skillId !== undefined && req.body.skill_id === undefined) {
        req.body.skill_id = req.body.skillId;
      }
      
      try {
        const pendingSkillData = insertPendingSkillUpdateSchema.parse(req.body);
        console.log("Parsed pending skill data:", pendingSkillData);
        
        // Set the user ID from the authenticated user
        pendingSkillData.userId = userId;
        
        // For admin users, we'll auto-approve updates to their own skills
        if (isAdmin) {
          console.log("Admin user detected, auto-approving skill update");
          
          let approvedSkill;
          
          if (pendingSkillData.isUpdate && pendingSkillData.skillId) {
            // For updates to existing skills, directly update the skill
            console.log("Direct update of existing skill for admin:", pendingSkillData.skillId);
            
            // Extract the relevant skill data from pendingSkillData
            const { 
              userId, skillId, name, category, level, certification, 
              credlyLink, notes, certificationDate, expirationDate 
            } = pendingSkillData;
            
            approvedSkill = await storage.updateSkill(skillId, {
              name,
              category, 
              level,
              certification,
              credlyLink,
              notes,
              certificationDate,
              expirationDate
            });
            
            // Create a skill history entry
            await storage.createSkillHistory({
              skillId: skillId,
              userId: userId,
              previousLevel: level, // Same level as we're just updating other details
              newLevel: level,
              changeNote: `Auto-approved admin update`
            });
            
            console.log("Admin skill directly updated:", approvedSkill);
            return res.status(200).json({
              message: "Skill updated successfully (admin auto-approval)",
              skill: approvedSkill
            });
          } else {
            // For new skills from admin users, create a new skill
            // Create the pending skill update first for record-keeping
            const pendingUpdate = await storage.createPendingSkillUpdate({
              ...pendingSkillData,
              status: 'approved',
              reviewedAt: new Date(),
              reviewedBy: userId,
              reviewNotes: 'Auto-approved (admin user)'
            });
            
            // Create the actual skill
            approvedSkill = await storage.createSkill({
              userId,
              name: pendingSkillData.name,
              category: pendingSkillData.category,
              level: pendingSkillData.level,
              certification: pendingSkillData.certification,
              credlyLink: pendingSkillData.credlyLink,
              notes: pendingSkillData.notes,
              certificationDate: pendingSkillData.certificationDate,
              expirationDate: pendingSkillData.expirationDate
            });
            
            console.log("New admin skill directly created:", approvedSkill);
            return res.status(201).json({
              message: "New skill created successfully (admin auto-approval)",
              skill: approvedSkill
            });
          }
        }
        
        // For non-admin users, create a pending update that requires approval
        const pendingUpdate = await storage.createPendingSkillUpdate(pendingSkillData);
        console.log("Created pending skill update for non-admin:", pendingUpdate);
        res.status(201).json({
          message: "Update submitted for approval",
          pendingUpdate
        });
      } catch (error) {
        console.error("Validation error:", error);
        res.status(400).json({ message: "Validation error", error });
      }
    } catch (error) {
      console.error("Server error in pending skill update:", error);
      res.status(500).json({ message: "Error creating pending skill update", error });
    }
  });

  app.get("/api/user/pending-skills", ensureAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const pendingUpdates = await storage.getPendingSkillUpdatesByUser(userId);
      res.json(pendingUpdates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pending skill updates", error });
    }
  });

  // Admin approval routes
  app.get("/api/admin/pending-skills", ensureAdmin, async (req, res) => {
    try {
      // Get all pending skill updates
      const pendingUpdates = await storage.getPendingSkillUpdates();
      
      // Group by user for easier review
      const pendingByUser: Record<number, Array<any>> = {};
      
      for (const update of pendingUpdates) {
        if (!pendingByUser[update.userId]) {
          pendingByUser[update.userId] = [];
        }
        pendingByUser[update.userId].push(update);
      }
      
      // Get user info for each group
      const result = await Promise.all(
        Object.entries(pendingByUser).map(async ([userIdStr, updates]) => {
          const userId = parseInt(userIdStr);
          const user = await storage.getUser(userId);
          return {
            user: user ? {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            } : { id: userId, username: `User ${userId}`, email: "Unknown" },
            pendingSkills: updates
          };
        })
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pending skill updates", error });
    }
  });

  app.post("/api/admin/pending-skills/:id/approve", ensureAdmin, async (req, res) => {
    try {
      const updateId = parseInt(req.params.id);
      const reviewerId = req.user!.id;
      const { notes } = req.body;
      
      // Approve the pending skill update
      const approvedSkill = await storage.approvePendingSkillUpdate(updateId, reviewerId, notes);
      
      // Create a notification for the user
      await storage.createNotification({
        userId: approvedSkill.userId,
        type: "achievement",
        content: `Your skill ${approvedSkill.name} has been approved`,
        relatedSkillId: approvedSkill.id
      });
      
      res.json(approvedSkill);
    } catch (error) {
      res.status(500).json({ message: "Error approving skill update", error });
    }
  });

  app.post("/api/admin/pending-skills/:id/reject", ensureAdmin, async (req, res) => {
    try {
      const updateId = parseInt(req.params.id);
      const reviewerId = req.user!.id;
      const { notes } = req.body;
      
      // Get the pending update before rejection for notification
      const pendingUpdate = await storage.getPendingSkillUpdate(updateId);
      
      if (!pendingUpdate) {
        return res.status(404).json({ message: "Pending skill update not found" });
      }
      
      // Reject the pending skill update
      await storage.rejectPendingSkillUpdate(updateId, reviewerId, notes);
      
      // Create a notification for the user
      await storage.createNotification({
        userId: pendingUpdate.userId,
        type: "achievement",
        content: `Your skill ${pendingUpdate.name} has been rejected. Please review the feedback.`,
        relatedSkillId: pendingUpdate.skillId
      });
      
      res.status(200).json({ message: "Skill update rejected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error rejecting skill update", error });
    }
  });

  /*
   * Project Management Routes
   */

  // Client routes
  app.get("/api/clients", ensureAuth, async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching clients", error });
    }
  });

  app.get("/api/clients/:id", ensureAuth, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client", error });
    }
  });

  app.post("/api/clients", ensureAdmin, async (req, res) => {
    try {
      const parsedData = insertClientSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({
          message: "Invalid client data",
          errors: parsedData.error.format()
        });
      }
      
      const client = await storage.createClient(parsedData.data);
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Error creating client", error });
    }
  });

  app.patch("/api/clients/:id", ensureAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const updatedClient = await storage.updateClient(clientId, req.body);
      res.json(updatedClient);
    } catch (error) {
      res.status(500).json({ message: "Error updating client", error });
    }
  });

  app.delete("/api/clients/:id", ensureAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      await storage.deleteClient(clientId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting client", error });
    }
  });
  
  // Client Projects endpoint
  app.get("/api/clients/:id/projects", ensureAuth, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const projects = await storage.getClientProjects(clientId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client projects", error });
    }
  });

  // Project routes
  app.get("/api/projects", ensureAuth, async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching projects", error });
    }
  });

  app.get("/api/projects/:id", ensureAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project", error });
    }
  });

  app.post("/api/projects", ensureAdmin, async (req, res) => {
    try {
      console.log("Project creation request body:", JSON.stringify(req.body, null, 2));
      
      // Parse data with lenient schema validation
      const parsedData = insertProjectSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        console.error("Project validation failed:", JSON.stringify(parsedData.error.format(), null, 2));
        return res.status(400).json({
          message: "Invalid project data",
          errors: parsedData.error.format()
        });
      }
      
      // Convert date strings to Date objects if needed
      const data = { ...parsedData.data };
      
      // Handle startDate conversion
      if (typeof data.startDate === 'string' && data.startDate) {
        data.startDate = new Date(data.startDate);
      }
      
      // Handle endDate conversion
      if (typeof data.endDate === 'string' && data.endDate) {
        data.endDate = new Date(data.endDate);
      }
      
      console.log("Processed project data:", JSON.stringify(data, null, 2));
      const project = await storage.createProject(data);
      console.log("Created project:", JSON.stringify(project, null, 2));
      res.status(201).json(project);
    } catch (error) {
      console.error("Server error during project creation:", error);
      res.status(500).json({ message: "Error creating project", error });
    }
  });

  app.patch("/api/projects/:id", ensureAdmin, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "Error updating project", error });
    }
  });

  app.delete("/api/projects/:id", ensureAdmin, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      await storage.deleteProject(projectId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting project", error });
    }
  });

  // Project Resources routes
  app.get("/api/projects/:id/resources", ensureAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const resources = await storage.getProjectResources(projectId);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project resources", error });
    }
  });

  app.post("/api/projects/:id/resources", ensureAdmin, async (req, res) => {
    try {
      console.log("Project resource creation request body:", JSON.stringify(req.body, null, 2));
      
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const parsedData = insertProjectResourceSchema.safeParse({
        ...req.body,
        projectId
      });
      
      if (!parsedData.success) {
        console.error("Resource validation failed:", JSON.stringify(parsedData.error.format(), null, 2));
        return res.status(400).json({
          message: "Invalid resource data",
          errors: parsedData.error.format()
        });
      }
      
      // Convert date strings to Date objects if needed
      const data = { ...parsedData.data };
      
      // Handle startDate conversion
      if (typeof data.startDate === 'string' && data.startDate) {
        data.startDate = new Date(data.startDate);
      }
      
      // Handle endDate conversion
      if (typeof data.endDate === 'string' && data.endDate) {
        data.endDate = new Date(data.endDate);
      }
      
      console.log("Processed resource data:", JSON.stringify(data, null, 2));
      const resource = await storage.createProjectResource(data);
      
      // Create resource history entry
      await storage.createProjectResourceHistory({
        projectId,
        userId: data.userId,
        action: "added",
        newRole: data.role,
        newAllocation: data.allocation,
        performedById: req.user!.id,
        note: "Added to project"
      });
      
      console.log("Created resource:", JSON.stringify(resource, null, 2));
      res.status(201).json(resource);
    } catch (error) {
      console.error("Server error during resource creation:", error);
      res.status(500).json({ message: "Error adding resource to project", error });
    }
  });

  app.delete("/api/projects/resources/:id", ensureAdmin, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const resource = await storage.getProjectResource(resourceId);
      
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Create resource history entry before deleting
      await storage.createProjectResourceHistory({
        projectId: resource.projectId,
        userId: resource.userId,
        action: "removed",
        previousRole: resource.role,
        previousAllocation: resource.allocation,
        performedById: req.user!.id,
        note: "Removed from project"
      });
      
      await storage.deleteProjectResource(resourceId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error removing resource from project", error });
    }
  });

  // Project Skills routes
  app.get("/api/projects/:id/skills", ensureAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const skills = await storage.getProjectSkills(projectId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project skills", error });
    }
  });

  app.post("/api/projects/:id/skills", ensureAdmin, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const parsedData = insertProjectSkillSchema.safeParse({
        ...req.body,
        projectId
      });
      
      if (!parsedData.success) {
        return res.status(400).json({
          message: "Invalid skill data",
          errors: parsedData.error.format()
        });
      }
      
      const projectSkill = await storage.createProjectSkill(parsedData.data);
      res.status(201).json(projectSkill);
    } catch (error) {
      res.status(500).json({ message: "Error adding skill to project", error });
    }
  });

  app.delete("/api/projects/skills/:id", ensureAdmin, async (req, res) => {
    try {
      const projectSkillId = parseInt(req.params.id);
      
      await storage.deleteProjectSkill(projectSkillId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error removing skill from project", error });
    }
  });

  // Project Resource History routes
  app.get("/api/projects/:id/resource-history", ensureAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const history = await storage.getProjectResourceHistory(projectId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project resource history", error });
    }
  });

  // Get user's project history
  app.get("/api/user/projects/history", ensureAuth, async (req, res) => {
    try {
      const history = await storage.getUserProjectHistory(req.user!.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user project history", error });
    }
  });

  // Get projects for a specific user
  app.get("/api/users/:userId/projects", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Get user project resources
      const projectResources = await storage.getUserProjectResources(userId);
      
      // Fetch additional project details if needed
      const enhancedResources = await Promise.all(
        projectResources.map(async (resource) => {
          try {
            const project = await storage.getProject(resource.projectId);
            return {
              ...resource,
              projectName: project?.name || null,
              projectStatus: project?.status || null,
              clientId: project?.clientId || null
            };
          } catch (err) {
            console.error(`Error fetching project ${resource.projectId} details:`, err);
            return resource;
          }
        })
      );

      res.json(enhancedResources);
    } catch (error) {
      console.error("Error fetching user projects:", error);
      res.status(500).json({ message: "Error fetching user projects", error });
    }
  });
  
  // Get project history for a specific user
  app.get("/api/users/:userId/projects/history", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Verify this user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Admin can see any user's history, but regular users should only see their own
      const requestUser = req.user;
      if (!requestUser || (parseInt(String(requestUser.id)) !== userId && !requestUser.is_admin)) {
        return res.status(403).json({ message: "Not authorized to view this user's project history" });
      }

      // Get the user's project history
      const history = await storage.getUserProjectHistory(userId);
      
      // Enhance with project names for better display
      const enhancedHistory = await Promise.all(
        history.map(async (item) => {
          try {
            const project = await storage.getProject(item.projectId);
            return {
              ...item,
              projectName: project?.name || null
            };
          } catch (err) {
            console.error(`Error fetching project ${item.projectId} details:`, err);
            return item;
          }
        })
      );

      res.json(enhancedHistory);
    } catch (error) {
      console.error("Error fetching user project history:", error);
      res.status(500).json({ message: "Error fetching user project history", error });
    }
  });

  // ----- SKILL CATEGORY MANAGEMENT ROUTES -----
  
  // Get all skill categories
  app.get("/api/skill-categories", ensureAuth, async (req, res) => {
    try {
      const categories = await storage.getAllSkillCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching skill categories:", error);
      res.status(500).json({ message: "Error fetching skill categories", error });
    }
  });
  
  // Get a specific skill category
  app.get("/api/skill-categories/:id", ensureAuth, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getSkillCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching skill category:", error);
      res.status(500).json({ message: "Error fetching skill category", error });
    }
  });
  
  // Create a new skill category (admin only)
  app.post("/api/skill-categories", ensureAdmin, async (req, res) => {
    try {
      // Validate the request
      const categoryData = await insertSkillCategorySchema.parseAsync(req.body);
      
      // Create the category
      const newCategory = await storage.createSkillCategory(categoryData);
      
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating skill category:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating skill category", error });
    }
  });
  
  // Update a skill category (admin only)
  app.patch("/api/skill-categories/:id", ensureAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      // Check if category exists
      const existingCategory = await storage.getSkillCategory(categoryId);
      
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Update the category
      const updatedCategory = await storage.updateSkillCategory(categoryId, req.body);
      
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating skill category:", error);
      res.status(500).json({ message: "Error updating skill category", error });
    }
  });
  
  // Delete a skill category (admin only)
  app.delete("/api/skill-categories/:id", ensureAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      // Check if category exists
      const existingCategory = await storage.getSkillCategory(categoryId);
      
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Delete the category
      await storage.deleteSkillCategory(categoryId);
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting skill category:", error);
      res.status(500).json({ message: "Error deleting skill category", error });
    }
  });
  
  // ----- SKILL SUBCATEGORY MANAGEMENT ROUTES -----
  
  // Get all subcategories
  app.get("/api/skill-subcategories", ensureAuth, async (req, res) => {
    try {
      // Optional query param to filter by category ID
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      let subcategories;
      if (categoryId) {
        // Get subcategories for a specific category
        subcategories = await storage.getSubcategoriesByCategory(categoryId);
      } else {
        // Get all subcategories
        subcategories = await storage.getAllSkillSubcategories();
      }
      
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching skill subcategories:", error);
      res.status(500).json({ message: "Error fetching skill subcategories", error });
    }
  });
  
  // Get specific subcategory
  app.get("/api/skill-subcategories/:id", ensureAuth, async (req, res) => {
    try {
      const subcategoryId = parseInt(req.params.id);
      
      if (isNaN(subcategoryId)) {
        return res.status(400).json({ message: "Invalid subcategory ID" });
      }
      
      const subcategory = await storage.getSkillSubcategory(subcategoryId);
      
      if (!subcategory) {
        return res.status(404).json({ message: "Skill subcategory not found" });
      }
      
      res.json(subcategory);
    } catch (error) {
      console.error("Error fetching skill subcategory:", error);
      res.status(500).json({ message: "Error fetching skill subcategory", error });
    }
  });
  
  // Create a subcategory (admin only)
  app.post("/api/skill-subcategories", ensureAdmin, async (req, res) => {
    try {
      // Validate the request body
      const result = insertSkillSubcategorySchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.errors });
      }
      
      // Make sure the parent category exists
      const category = await storage.getSkillCategory(result.data.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Parent category not found" });
      }
      
      const subcategory = await storage.createSkillSubcategory(result.data);
      res.status(201).json(subcategory);
    } catch (error) {
      console.error("Error creating skill subcategory:", error);
      res.status(500).json({ message: "Error creating skill subcategory", error });
    }
  });
  
  // Update a subcategory (admin only)
  app.patch("/api/skill-subcategories/:id", ensureAdmin, async (req, res) => {
    try {
      const subcategoryId = parseInt(req.params.id);
      
      if (isNaN(subcategoryId)) {
        return res.status(400).json({ message: "Invalid subcategory ID" });
      }
      
      const existingSubcategory = await storage.getSkillSubcategory(subcategoryId);
      
      if (!existingSubcategory) {
        return res.status(404).json({ message: "Skill subcategory not found" });
      }
      
      const subcategory = await storage.updateSkillSubcategory(subcategoryId, req.body);
      res.json(subcategory);
    } catch (error) {
      console.error("Error updating skill subcategory:", error);
      res.status(500).json({ message: "Error updating skill subcategory", error });
    }
  });
  
  // Delete a subcategory (admin only)
  app.delete("/api/skill-subcategories/:id", ensureAdmin, async (req, res) => {
    try {
      const subcategoryId = parseInt(req.params.id);
      
      if (isNaN(subcategoryId)) {
        return res.status(400).json({ message: "Invalid subcategory ID" });
      }
      
      const existingSubcategory = await storage.getSkillSubcategory(subcategoryId);
      
      if (!existingSubcategory) {
        return res.status(404).json({ message: "Skill subcategory not found" });
      }
      
      await storage.deleteSkillSubcategory(subcategoryId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting skill subcategory:", error);
      res.status(500).json({ message: "Error deleting skill subcategory", error });
    }
  });
  
  // ----- SKILL APPROVER MANAGEMENT ROUTES -----
  
  // Get all skill approvers
  app.get("/api/skill-approvers", ensureAdmin, async (req, res) => {
    try {
      const approvers = await storage.getAllSkillApprovers();
      
      // Enhance with user display names
      const enhancedApprovers = await Promise.all(
        approvers.map(async (approver) => {
          try {
            const user = await storage.getUser(approver.userId);
            return {
              ...approver,
              userDisplayName: user?.displayName || user?.username || user?.email || `User #${approver.userId}`
            };
          } catch (err) {
            console.error(`Error fetching user ${approver.userId} for approver details:`, err);
            return approver;
          }
        })
      );
      
      res.json(enhancedApprovers);
    } catch (error) {
      console.error("Error fetching skill approvers:", error);
      res.status(500).json({ message: "Error fetching skill approvers", error });
    }
  });
  
  // Get approvers for a specific category
  app.get("/api/skill-categories/:id/approvers", ensureAuth, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      // Get approvers for the category, including those who can approve all
      const approvers = await storage.getApproversForCategory(categoryId);
      
      // Enhance with user display names
      const enhancedApprovers = await Promise.all(
        approvers.map(async (approver) => {
          try {
            const user = await storage.getUser(approver.userId);
            return {
              ...approver,
              userDisplayName: user?.displayName || user?.username || user?.email || `User #${approver.userId}`
            };
          } catch (err) {
            console.error(`Error fetching user ${approver.userId} for approver details:`, err);
            return approver;
          }
        })
      );
      
      res.json(enhancedApprovers);
    } catch (error) {
      console.error("Error fetching approvers for category:", error);
      res.status(500).json({ message: "Error fetching approvers for category", error });
    }
  });
  
  // Get approvers for a specific subcategory
  app.get("/api/skill-subcategories/:id/approvers", ensureAuth, async (req, res) => {
    try {
      const subcategoryId = parseInt(req.params.id);
      
      if (isNaN(subcategoryId)) {
        return res.status(400).json({ message: "Invalid subcategory ID" });
      }
      
      // Get approvers for the subcategory, including category-level and global approvers
      const approvers = await storage.getApproversForSubcategory(subcategoryId);
      
      // Enhance with user display names
      const enhancedApprovers = await Promise.all(
        approvers.map(async (approver) => {
          try {
            const user = await storage.getUser(approver.userId);
            return {
              ...approver,
              userDisplayName: user?.displayName || user?.username || user?.email || `User #${approver.userId}`
            };
          } catch (err) {
            console.error(`Error fetching user ${approver.userId} for approver details:`, err);
            return approver;
          }
        })
      );
      
      res.json(enhancedApprovers);
    } catch (error) {
      console.error("Error fetching approvers for subcategory:", error);
      res.status(500).json({ message: "Error fetching approvers for subcategory", error });
    }
  });
  
  // Create a new skill approver (admin only)
  app.post("/api/skill-approvers", ensureAdmin, async (req, res) => {
    try {
      // Validate the request
      const approverData = await insertSkillApproverSchema.parseAsync(req.body);
      
      // Check if the user exists
      const user = await storage.getUser(approverData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if the category exists (if specified)
      if (approverData.categoryId) {
        const category = await storage.getSkillCategory(approverData.categoryId);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
      }
      
      // Create the approver
      const newApprover = await storage.createSkillApprover(approverData);
      
      res.status(201).json(newApprover);
    } catch (error) {
      console.error("Error creating skill approver:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid approver data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating skill approver", error });
    }
  });
  
  // Delete a skill approver (admin only)
  app.delete("/api/skill-approvers/:id", ensureAdmin, async (req, res) => {
    try {
      const approverId = parseInt(req.params.id);
      
      if (isNaN(approverId)) {
        return res.status(400).json({ message: "Invalid approver ID" });
      }
      
      // Check if approver exists
      const existingApprover = await storage.getSkillApprover(approverId);
      
      if (!existingApprover) {
        return res.status(404).json({ message: "Approver not found" });
      }
      
      // Delete the approver
      await storage.deleteSkillApprover(approverId);
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting skill approver:", error);
      res.status(500).json({ message: "Error deleting skill approver", error });
    }
  });
  
  // Check if current user can approve a skill in a specific category
  app.get("/api/can-approve/:categoryId", ensureAuth, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const userId = req.user!.id;
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const canApprove = await storage.canUserApproveSkill(userId, categoryId);
      
      res.json({ canApprove });
    } catch (error) {
      console.error("Error checking approval permission:", error);
      res.status(500).json({ message: "Error checking approval permission", error });
    }
  });
  
  // Check if current user can approve a skill in a specific subcategory
  app.get("/api/can-approve/:categoryId/:subcategoryId", ensureAuth, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const subcategoryId = parseInt(req.params.subcategoryId);
      const userId = req.user!.id;
      
      if (isNaN(categoryId) || isNaN(subcategoryId)) {
        return res.status(400).json({ message: "Invalid category or subcategory ID" });
      }
      
      const canApprove = await storage.canUserApproveSkill(userId, categoryId, subcategoryId);
      
      res.json({ canApprove });
    } catch (error) {
      console.error("Error checking subcategory approval permission:", error);
      res.status(500).json({ message: "Error checking subcategory approval permission", error });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
