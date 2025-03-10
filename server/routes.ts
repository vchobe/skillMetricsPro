import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import {
  insertSkillSchema,
  insertSkillHistorySchema,
  insertProfileHistorySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to ensure user is authenticated
  const ensureAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
  
  // Middleware to ensure user is admin
  const ensureAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
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

  app.patch("/api/user/profile", ensureAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create profile history for each changed field
      const updateData: Partial<typeof user> = {};
      
      // Track changes for history
      for (const [key, value] of Object.entries(req.body)) {
        if (key in user && key !== 'id' && key !== 'password' && user[key as keyof typeof user] !== value) {
          const oldValue = user[key as keyof typeof user]?.toString() || '';
          const newValue = value?.toString() || '';
          
          // Add to update data
          updateData[key as keyof typeof updateData] = value;
          
          // Create history entry
          await storage.createProfileHistory({
            userId,
            field: key,
            oldValue,
            newValue
          });
        }
      }
      
      if (Object.keys(updateData).length > 0) {
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
      if (skill.userId !== req.user!.id && !req.user!.isAdmin) {
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
      if (skill.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // If level is changed, record history
      if (req.body.level && req.body.level !== skill.level) {
        await storage.createSkillHistory({
          skillId,
          userId: req.user!.id,
          previousLevel: skill.level,
          newLevel: req.body.level,
          changeNote: req.body.changeNote || `Updated from ${skill.level} to ${req.body.level}`
        });
      }
      
      const updatedSkill = await storage.updateSkill(skillId, req.body);
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
      if (skill.userId !== req.user!.id && !req.user!.isAdmin) {
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
      if (skill.userId !== req.user!.id && !req.user!.isAdmin) {
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

  app.get("/api/admin/skills", ensureAdmin, async (req, res) => {
    try {
      const skills = await storage.getAllSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skills", error });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
