import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import {
  insertSkillSchema,
  insertSkillHistorySchema,
  insertProfileHistorySchema,
  insertEndorsementSchema,
  insertNotificationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Health check endpoint for testing
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Middleware to ensure user is authenticated
  const ensureAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
  
  // Middleware to ensure user is admin
  const ensureAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated() || !req.user?.is_admin) {
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
          if (typeof value !== 'undefined') {
            updateData[key as keyof typeof updateData] = value;
          }
          
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
      if (skill.userId !== req.user!.id && !req.user!.is_admin) {
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
      if (skill.userId !== req.user!.id && !req.user!.is_admin) {
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
      if (skill.userId !== req.user!.id && !req.user!.is_admin) {
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
      if (skill.userId !== req.user!.id && !req.user!.is_admin) {
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
  
  // Get all skill histories across all users for admin
  app.get("/api/admin/skill-history", ensureAdmin, async (req, res) => {
    try {
      const histories = await storage.getAllSkillHistories();
      res.json(histories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching skill histories", error });
    }
  });
  
  // Get certification report
  app.get("/api/admin/certification-report", ensureAdmin, async (req, res) => {
    try {
      console.log("Running certification report for user:", req.user);
      
      const skills = await storage.getAllSkills();
      // Filter out skills where certification is 'true'/'false' or null/undefined
      const certifiedSkills = skills.filter(skill => 
        skill.certification && 
        skill.certification !== 'true' && 
        skill.certification !== 'false'
      );
      
      console.log("Certification report - Total skills:", skills.length);
      console.log("Certification report - Certified skills:", certifiedSkills.length);
      console.log("Certification report - First 3 certified skills:", certifiedSkills.slice(0, 3));
      
      // Group by user
      const userMap = new Map();
      
      for (const skill of certifiedSkills) {
        try {
          if (!userMap.has(skill.userId)) {
            const user = await storage.getUser(skill.userId);
            if (user) {
              const { password, ...userWithoutPassword } = user;
              userMap.set(skill.userId, {
                user: userWithoutPassword,
                certifications: []
              });
            }
          }
          
          if (userMap.has(skill.userId)) {
            userMap.get(skill.userId).certifications.push({
              skillId: skill.id,
              name: skill.name,
              category: skill.category,
              level: skill.level,
              certification: skill.certification,
              credlyLink: skill.credlyLink,
              acquired: skill.certificationDate || skill.lastUpdated,
              expirationDate: skill.expirationDate,
              isExpired: skill.expirationDate ? new Date(skill.expirationDate) < new Date() : false
            });
          }
        } catch (err) {
          console.error(`Error processing skill ${skill.id} for user ${skill.userId}:`, err);
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
        const date = new Date(history.updatedAt);
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
        const date = new Date(history.updatedAt);
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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
