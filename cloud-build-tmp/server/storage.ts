import { 
  User, InsertUser, Skill, InsertSkill, 
  SkillHistory, InsertSkillHistory, 
  ProfileHistory, InsertProfileHistory,
  Endorsement, InsertEndorsement,
  Notification, InsertNotification,
  SkillTemplate, InsertSkillTemplate,
  SkillTarget, InsertSkillTarget,
  PendingSkillUpdate, InsertPendingSkillUpdate,
  Client, InsertClient,
  Project, InsertProject,
  ProjectResource, InsertProjectResource,
  ProjectSkill, InsertProjectSkill,
  ProjectResourceHistory, InsertProjectResourceHistory
} from "@shared/schema";
import session from "express-session";
import { Store } from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { pool } from "./db"; // Import the pool from db.ts

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Storage interface with all required CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  
  // Skill operations
  getUserSkills(userId: number): Promise<Skill[]>;
  getSkill(id: number): Promise<Skill | undefined>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: number, data: Partial<Skill>): Promise<Skill>;
  deleteSkill(id: number): Promise<void>;
  getAllSkills(): Promise<Skill[]>;
  searchSkills(query: string): Promise<Skill[]>;
  
  // Skill history operations
  getSkillHistory(skillId: number): Promise<SkillHistory[]>;
  getUserSkillHistory(userId: number): Promise<SkillHistory[]>;
  getAllSkillHistories(): Promise<SkillHistory[]>;
  createSkillHistory(history: InsertSkillHistory): Promise<SkillHistory>;
  
  // Profile history operations
  getUserProfileHistory(userId: number): Promise<ProfileHistory[]>;
  createProfileHistory(history: InsertProfileHistory): Promise<ProfileHistory>;
  
  // Endorsement operations
  getSkillEndorsements(skillId: number): Promise<Endorsement[]>;
  getUserEndorsements(userId: number): Promise<Endorsement[]>;
  createEndorsement(endorsement: InsertEndorsement): Promise<Endorsement>;
  deleteEndorsement(endorsementId: number): Promise<void>;
  
  // Notification operations
  getUserNotifications(userId: number, unreadOnly?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // Skill Template operations
  getAllSkillTemplates(): Promise<SkillTemplate[]>;
  getSkillTemplate(id: number): Promise<SkillTemplate | undefined>;
  createSkillTemplate(template: InsertSkillTemplate): Promise<SkillTemplate>;
  updateSkillTemplate(id: number, data: Partial<SkillTemplate>): Promise<SkillTemplate>;
  deleteSkillTemplate(id: number): Promise<void>;
  
  // Skill Target operations
  getAllSkillTargets(): Promise<SkillTarget[]>;
  getSkillTarget(id: number): Promise<SkillTarget | undefined>;
  createSkillTarget(target: InsertSkillTarget): Promise<SkillTarget>;
  updateSkillTarget(id: number, data: Partial<SkillTarget>): Promise<SkillTarget>;
  deleteSkillTarget(id: number): Promise<void>;
  getSkillTargetSkills(targetId: number): Promise<number[]>;
  addSkillToTarget(targetId: number, skillId: number): Promise<void>;
  removeSkillFromTarget(targetId: number, skillId: number): Promise<void>;
  getSkillTargetUsers(targetId: number): Promise<number[]>;
  addUserToTarget(targetId: number, userId: number): Promise<void>;
  removeUserFromTarget(targetId: number, userId: number): Promise<void>;
  
  // Pending Skill Updates operations
  getPendingSkillUpdates(): Promise<PendingSkillUpdate[]>;
  getPendingSkillUpdatesByUser(userId: number): Promise<PendingSkillUpdate[]>;
  getPendingSkillUpdate(id: number): Promise<PendingSkillUpdate | undefined>;
  createPendingSkillUpdate(update: InsertPendingSkillUpdate): Promise<PendingSkillUpdate>;
  approvePendingSkillUpdate(id: number, reviewerId: number, notes?: string): Promise<Skill>;
  rejectPendingSkillUpdate(id: number, reviewerId: number, notes?: string): Promise<void>;
  
  // Client operations
  getAllClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, data: Partial<Client>): Promise<Client>;
  deleteClient(id: number): Promise<void>;
  searchClients(query: string): Promise<Client[]>;
  
  // Project operations
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<Project>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  getUserProjects(userId: number): Promise<Project[]>;
  getClientProjects(clientId: number): Promise<Project[]>;
  searchProjects(query: string): Promise<Project[]>;
  
  // Project Resources operations
  getProjectResources(projectId: number): Promise<ProjectResource[]>;
  getUserProjectResources(userId: number): Promise<ProjectResource[]>;
  getProjectResource(id: number): Promise<ProjectResource | undefined>;
  createProjectResource(resource: InsertProjectResource): Promise<ProjectResource>;
  updateProjectResource(id: number, data: Partial<ProjectResource>): Promise<ProjectResource>;
  deleteProjectResource(id: number): Promise<void>;
  
  // Project Skills operations
  getProjectSkills(projectId: number): Promise<ProjectSkill[]>;
  getSkillProjects(skillId: number): Promise<ProjectSkill[]>;
  createProjectSkill(projectSkill: InsertProjectSkill): Promise<ProjectSkill>;
  deleteProjectSkill(id: number): Promise<void>;
  
  // Project Resource History operations
  getProjectResourceHistory(projectId: number): Promise<ProjectResourceHistory[]>;
  getUserProjectHistory(userId: number): Promise<ProjectResourceHistory[]>;
  createProjectResourceHistory(history: InsertProjectResourceHistory): Promise<ProjectResourceHistory>;
  
  // Session store
  sessionStore: Store;
}

// PostgreSQL implementation
export class PostgresStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    // Use the shared pool from db.ts
    this.sessionStore = new PostgresSessionStore({
      pool: pool as any, // Type conversion needed due to differences between pg Pool and neon Pool
      createTableIfMissing: true,
      tableName: 'session' // Explicitly name the session table
    });
  }

  // Helper function to convert snake_case to camelCase and standardize dates
  private snakeToCamel(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(v => this.snakeToCamel(v));
    }
    
    return Object.keys(obj).reduce((result, key) => {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Standard date fields that should be properly formatted
      const dateFields = [
        'createdAt', 'updatedAt', 'lastUpdated', 'targetDate', 'certificationDate',
        'startDate', 'endDate', 'dueDate', 'date' // Added project and resource date fields
      ];
      
      let value = obj[key];
      
      // Specific handling for boolean fields from PostgreSQL
      if (key === 'is_admin') {
        // PostgreSQL returns booleans as 't' or 'f' strings sometimes
        if (value === 't' || value === true || value === 'true') {
          value = true;
        } else if (value === 'f' || value === false || value === 'false') {
          value = false;
        }
        console.log(`Converting is_admin from ${obj[key]} to ${value}`);
      }
      
      // Standardize date formats if the field is a known date field and contains a valid date
      if (dateFields.includes(camelKey) && value !== null && value !== undefined) {
        // Convert PostgreSQL timestamps to ISO strings
        if (value instanceof Date) {
          value = value.toISOString();
        } else if (typeof value === 'string') {
          try {
            // Attempt to convert string to standard ISO format
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
              value = dateObj.toISOString();
            }
          } catch (e) {
            console.error(`Error standardizing date for field ${camelKey}:`, e);
          }
        }
      }
      
      result[camelKey] = this.snakeToCamel(value);
      return result;
    }, {} as any);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (!result.rows[0]) return undefined;
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (!result.rows[0]) return undefined;
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (!result.rows[0]) return undefined;
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser & { username?: string, password?: string, firstName?: string, lastName?: string, project?: string, role?: string, location?: string }): Promise<User> {
    try {
      console.log("Creating user with data:", insertUser);
      const result = await pool.query(
        `INSERT INTO users (
          email, is_admin, username, password, first_name, last_name, project, role, location
         ) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [
          insertUser.email, 
          insertUser.is_admin || false,
          insertUser.username || insertUser.email.split('@')[0], // Use username if provided, otherwise derive from email
          insertUser.password || '', // Use empty string as default password
          insertUser.firstName || '',
          insertUser.lastName || '',
          insertUser.project || '',
          insertUser.role || '',
          insertUser.location || ''
        ]
      );
      console.log("User created:", result.rows[0]);
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    try {
      const sets: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      // Build SET clause and parameters
      for (const [key, value] of Object.entries(data)) {
        // Special case handling for isAdmin -> is_admin
        let columnName;
        if (key === 'isAdmin') {
          columnName = 'is_admin';
        } else {
          // Convert camelCase to snake_case for database column names
          columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        }
        console.log(`Converting property ${key} to column ${columnName} with value ${value}`);
        sets.push(`${columnName} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
      
      if (sets.length === 0) {
        return await this.getUser(id) as User;
      }
      
      params.push(id); // Add id as the last parameter
      
      const result = await pool.query(
        `UPDATE users SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );
      
      if (result.rows.length === 0) {
        throw new Error("User not found");
      }
      
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
  
  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    try {
      const result = await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, id]
      );
      
      if (result.rowCount === 0) {
        throw new Error("User not found");
      }
    } catch (error) {
      console.error("Error updating user password:", error);
      throw error;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const result = await pool.query('SELECT * FROM users ORDER BY id');
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }
  
  async deleteUser(id: number): Promise<void> {
    try {
      // Delete related records first to maintain referential integrity
      
      // 1. Delete user's skills and associated histories
      const userSkills = await this.getUserSkills(id);
      for (const skill of userSkills) {
        await this.deleteSkill(skill.id);
      }
      
      // 2. Remove user from skill targets
      const allTargets = await this.getAllSkillTargets();
      for (const target of allTargets) {
        const userIds = await this.getSkillTargetUsers(target.id);
        if (userIds.includes(id)) {
          await this.removeUserFromTarget(target.id, id);
        }
      }
      
      // 3. Delete profile histories
      await pool.query('DELETE FROM profile_histories WHERE user_id = $1', [id]);
      
      // 4. Delete skill histories
      await pool.query('DELETE FROM skill_histories WHERE user_id = $1', [id]);
      
      // 5. Delete notifications
      await pool.query('DELETE FROM notifications WHERE user_id = $1', [id]);
      
      // 6. Delete endorsements given by this user
      await pool.query('DELETE FROM endorsements WHERE endorser_id = $1', [id]);
      
      // 7. Delete endorsements received by this user's skills
      await pool.query(
        'DELETE FROM endorsements WHERE skill_id IN (SELECT id FROM skills WHERE user_id = $1)',
        [id]
      );
      
      // 8. Finally, delete the user
      const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error("User not found");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  // Skill operations
  async getUserSkills(userId: number): Promise<Skill[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM skills WHERE user_id = $1 ORDER BY last_updated DESC',
        [userId]
      );
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting user skills:", error);
      throw error;
    }
  }
  
  async getSkill(id: number): Promise<Skill | undefined> {
    try {
      const result = await pool.query('SELECT * FROM skills WHERE id = $1', [id]);
      if (!result.rows[0]) return undefined;
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error getting skill:", error);
      throw error;
    }
  }
  
  async createSkill(skill: InsertSkill): Promise<Skill> {
    try {
      const result = await pool.query(
        `INSERT INTO skills (user_id, name, category, level, certification, credly_link, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [
          skill.userId, 
          skill.name, 
          skill.category, 
          skill.level, 
          skill.certification || '', 
          skill.credlyLink || '',
          skill.notes || ''
        ]
      );
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error creating skill:", error);
      throw error;
    }
  }
  
  async updateSkill(id: number, data: Partial<Skill>): Promise<Skill> {
    try {
      const sets: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      // Add last_updated timestamp
      sets.push(`last_updated = CURRENT_TIMESTAMP`);
      
      // Build SET clause and parameters
      for (const [key, value] of Object.entries(data)) {
        if (key === 'id' || key === 'userId') continue; // Skip id and userId
        
        // Convert camelCase to snake_case for database column names
        const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(`${columnName} = $${paramIndex}`);
        params.push(value === null ? '' : value); // Convert null to empty string
        paramIndex++;
      }
      
      params.push(id); // Add id as the last parameter
      
      const result = await pool.query(
        `UPDATE skills SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );
      
      if (result.rows.length === 0) {
        throw new Error("Skill not found");
      }
      
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error updating skill:", error);
      throw error;
    }
  }
  
  async deleteSkill(id: number): Promise<void> {
    try {
      const result = await pool.query('DELETE FROM skills WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error("Skill not found");
      }
    } catch (error) {
      console.error("Error deleting skill:", error);
      throw error;
    }
  }
  
  async getAllSkills(): Promise<Skill[]> {
    try {
      const result = await pool.query('SELECT * FROM skills ORDER BY last_updated DESC');
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting all skills:", error);
      throw error;
    }
  }
  
  async searchSkills(query: string): Promise<Skill[]> {
    try {
      // Search for skills by name, category, level, certification
      const searchQuery = `%${query.toLowerCase()}%`;
      const result = await pool.query(
        `SELECT * FROM skills 
         WHERE LOWER(name) LIKE $1 
         OR LOWER(category) LIKE $1 
         OR LOWER(level) LIKE $1 
         OR LOWER(certification) LIKE $1
         OR LOWER(notes) LIKE $1
         ORDER BY last_updated DESC`,
        [searchQuery]
      );
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error searching skills:", error);
      throw error;
    }
  }

  // Skill history operations
  async getSkillHistory(skillId: number): Promise<SkillHistory[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM skill_histories WHERE skill_id = $1 ORDER BY created_at DESC',
        [skillId]
      );
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting skill history:", error);
      throw error;
    }
  }
  
  async getUserSkillHistory(userId: number): Promise<SkillHistory[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM skill_histories WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting user skill history:", error);
      throw error;
    }
  }

  async getAllSkillHistories(): Promise<SkillHistory[]> {
    try {
      const result = await pool.query(
        'SELECT sh.*, s.name as skill_name, u.email as user_email ' +
        'FROM skill_histories sh ' +
        'JOIN skills s ON sh.skill_id = s.id ' +
        'JOIN users u ON sh.user_id = u.id ' +
        'ORDER BY sh.created_at DESC'
      );
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting all skill histories:", error);
      throw error;
    }
  }
  
  async createSkillHistory(history: InsertSkillHistory): Promise<SkillHistory> {
    try {
      const result = await pool.query(
        `INSERT INTO skill_histories (skill_id, user_id, previous_level, new_level, change_note) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          history.skillId, 
          history.userId, 
          history.previousLevel || null, 
          history.newLevel,
          history.changeNote || ''
        ]
      );
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error creating skill history:", error);
      throw error;
    }
  }

  // Profile history operations
  async getUserProfileHistory(userId: number): Promise<ProfileHistory[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM profile_histories WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting user profile history:", error);
      throw error;
    }
  }
  
  async createProfileHistory(history: InsertProfileHistory): Promise<ProfileHistory> {
    try {
      const result = await pool.query(
        `INSERT INTO profile_histories (user_id, changed_field, previous_value, new_value) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          history.userId, 
          history.changedField, 
          history.previousValue || '', 
          history.newValue
        ]
      );
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error creating profile history:", error);
      throw error;
    }
  }
  
  // Endorsement operations
  async getSkillEndorsements(skillId: number): Promise<Endorsement[]> {
    try {
      const result = await pool.query(
        'SELECT e.*, u.email as endorser_email FROM endorsements e JOIN users u ON e.endorser_id = u.id WHERE skill_id = $1 ORDER BY created_at DESC',
        [skillId]
      );
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting skill endorsements:", error);
      throw error;
    }
  }
  
  async getUserEndorsements(userId: number): Promise<Endorsement[]> {
    try {
      const result = await pool.query(
        'SELECT e.*, s.name as skill_name, u.email as endorser_email FROM endorsements e JOIN skills s ON e.skill_id = s.id JOIN users u ON e.endorser_id = u.id WHERE e.endorsee_id = $1 ORDER BY e.created_at DESC',
        [userId]
      );
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting user endorsements:", error);
      throw error;
    }
  }
  
  async createEndorsement(endorsement: InsertEndorsement): Promise<Endorsement> {
    try {
      // First check if the endorsement already exists
      const existingEndorsement = await pool.query(
        'SELECT * FROM endorsements WHERE skill_id = $1 AND endorser_id = $2',
        [endorsement.skillId, endorsement.endorserId]
      );
      
      if (existingEndorsement.rows.length > 0) {
        // Update existing endorsement with new comment
        const result = await pool.query(
          `UPDATE endorsements SET comment = $1, created_at = CURRENT_TIMESTAMP 
           WHERE skill_id = $2 AND endorser_id = $3 
           RETURNING *`,
          [endorsement.comment || '', endorsement.skillId, endorsement.endorserId]
        );
        
        // Also increment the endorsement count if we're updating
        await pool.query(
          'UPDATE skills SET endorsement_count = endorsement_count + 1 WHERE id = $1',
          [endorsement.skillId]
        );
        
        return this.snakeToCamel(result.rows[0]);
      }
      
      // Create new endorsement
      const result = await pool.query(
        `INSERT INTO endorsements (skill_id, endorser_id, endorsee_id, comment) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          endorsement.skillId, 
          endorsement.endorserId, 
          endorsement.endorseeId,
          endorsement.comment || ''
        ]
      );
      
      // Increment the endorsement count
      await pool.query(
        'UPDATE skills SET endorsement_count = endorsement_count + 1 WHERE id = $1',
        [endorsement.skillId]
      );
      
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error creating endorsement:", error);
      throw error;
    }
  }
  
  async deleteEndorsement(endorsementId: number): Promise<void> {
    try {
      // First get the endorsement to know which skill to update
      const endorsement = await pool.query(
        'SELECT skill_id FROM endorsements WHERE id = $1',
        [endorsementId]
      );
      
      if (endorsement.rows.length === 0) {
        throw new Error("Endorsement not found");
      }
      
      const skillId = endorsement.rows[0].skill_id;
      
      // Delete the endorsement
      await pool.query('DELETE FROM endorsements WHERE id = $1', [endorsementId]);
      
      // Decrement the endorsement count
      await pool.query(
        'UPDATE skills SET endorsement_count = GREATEST(endorsement_count - 1, 0) WHERE id = $1',
        [skillId]
      );
    } catch (error) {
      console.error("Error deleting endorsement:", error);
      throw error;
    }
  }
  
  // Notification operations
  async getUserNotifications(userId: number, unreadOnly = false): Promise<Notification[]> {
    try {
      let query = 'SELECT * FROM notifications WHERE user_id = $1';
      const params = [userId];
      
      if (unreadOnly) {
        query += ' AND is_read = false';
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw error;
    }
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, content, related_skill_id, related_user_id) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          notification.userId, 
          notification.type, 
          notification.content,
          notification.relatedSkillId || null,
          notification.relatedUserId || null
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }
  
  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      const result = await pool.query(
        'UPDATE notifications SET is_read = true WHERE id = $1',
        [notificationId]
      );
      
      if (result.rowCount === 0) {
        throw new Error("Notification not found");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    try {
      await pool.query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
        [userId]
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }
  
  // Skill Template operations
  async getAllSkillTemplates(): Promise<SkillTemplate[]> {
    try {
      const result = await pool.query('SELECT * FROM skill_templates ORDER BY name');
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting all skill templates:", error);
      throw error;
    }
  }
  
  async getSkillTemplate(id: number): Promise<SkillTemplate | undefined> {
    try {
      const result = await pool.query('SELECT * FROM skill_templates WHERE id = $1', [id]);
      if (!result.rows[0]) return undefined;
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error getting skill template:", error);
      throw error;
    }
  }
  
  async createSkillTemplate(template: InsertSkillTemplate): Promise<SkillTemplate> {
    try {
      const result = await pool.query(
        `INSERT INTO skill_templates (name, category, description, is_recommended, target_level, target_date) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          template.name,
          template.category,
          template.description || '',
          template.isRecommended || false,
          template.targetLevel || null,
          template.targetDate || null
        ]
      );
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error creating skill template:", error);
      throw error;
    }
  }
  
  async updateSkillTemplate(id: number, data: Partial<SkillTemplate>): Promise<SkillTemplate> {
    try {
      const sets: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      // Build SET clause and parameters
      for (const [key, value] of Object.entries(data)) {
        if (key === 'id' || key === 'createdAt') continue; // Skip id and createdAt
        
        // Convert camelCase to snake_case for database column names
        const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(`${columnName} = $${paramIndex}`);
        params.push(value === null ? null : value);
        paramIndex++;
      }
      
      // Add updated_at timestamp
      sets.push(`updated_at = CURRENT_TIMESTAMP`);
      
      params.push(id); // Add id as the last parameter
      
      const result = await pool.query(
        `UPDATE skill_templates SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );
      
      if (result.rows.length === 0) {
        throw new Error("Skill template not found");
      }
      
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error updating skill template:", error);
      throw error;
    }
  }
  
  async deleteSkillTemplate(id: number): Promise<void> {
    try {
      const result = await pool.query('DELETE FROM skill_templates WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error("Skill template not found");
      }
    } catch (error) {
      console.error("Error deleting skill template:", error);
      throw error;
    }
  }
  
  // Skill Target operations
  async getAllSkillTargets(): Promise<SkillTarget[]> {
    try {
      const result = await pool.query('SELECT * FROM skill_targets ORDER BY name');
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting all skill targets:", error);
      throw error;
    }
  }
  
  async getSkillTarget(id: number): Promise<SkillTarget | undefined> {
    try {
      const result = await pool.query('SELECT * FROM skill_targets WHERE id = $1', [id]);
      if (!result.rows[0]) return undefined;
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error getting skill target:", error);
      throw error;
    }
  }
  
  async createSkillTarget(target: InsertSkillTarget): Promise<SkillTarget> {
    try {
      const result = await pool.query(
        `INSERT INTO skill_targets (name, description, target_level, target_date, target_number) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          target.name,
          target.description || '',
          target.targetLevel,
          target.targetDate || null,
          target.targetNumber || null
        ]
      );
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error creating skill target:", error);
      throw error;
    }
  }
  
  async updateSkillTarget(id: number, data: Partial<SkillTarget>): Promise<SkillTarget> {
    try {
      console.log(`Storage: Updating skill target ${id} with data:`, data);
      
      const sets: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      // Build SET clause and parameters
      for (const [key, value] of Object.entries(data)) {
        if (key === 'id' || key === 'createdAt') continue; // Skip id and createdAt
        
        // Convert camelCase to snake_case for database column names
        const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(`${columnName} = $${paramIndex}`);
        params.push(value === null ? null : value);
        console.log(`  - Setting ${columnName} = ${value === null ? 'NULL' : value} (param $${paramIndex})`);
        paramIndex++;
      }
      
      // Add updated_at timestamp
      sets.push(`updated_at = CURRENT_TIMESTAMP`);
      
      params.push(id); // Add id as the last parameter
      
      const result = await pool.query(
        `UPDATE skill_targets SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );
      
      if (result.rows.length === 0) {
        throw new Error("Skill target not found");
      }
      
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error updating skill target:", error);
      throw error;
    }
  }
  
  async deleteSkillTarget(id: number): Promise<void> {
    try {
      // First delete all associated skill-target and user-target mappings
      await pool.query('DELETE FROM skill_target_skills WHERE target_id = $1', [id]);
      await pool.query('DELETE FROM skill_target_users WHERE target_id = $1', [id]);
      
      // Then delete the target
      const result = await pool.query('DELETE FROM skill_targets WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error("Skill target not found");
      }
    } catch (error) {
      console.error("Error deleting skill target:", error);
      throw error;
    }
  }
  
  async getSkillTargetSkills(targetId: number): Promise<number[]> {
    try {
      const result = await pool.query(
        'SELECT skill_id FROM skill_target_skills WHERE target_id = $1',
        [targetId]
      );
      return result.rows.map(row => row.skill_id);
    } catch (error) {
      console.error("Error getting skill target skills:", error);
      throw error;
    }
  }
  
  async addSkillToTarget(targetId: number, skillId: number): Promise<void> {
    try {
      // Check if mapping already exists
      const existsCheck = await pool.query(
        'SELECT 1 FROM skill_target_skills WHERE target_id = $1 AND skill_id = $2',
        [targetId, skillId]
      );
      
      if (existsCheck.rows.length === 0) {
        await pool.query(
          'INSERT INTO skill_target_skills (target_id, skill_id) VALUES ($1, $2)',
          [targetId, skillId]
        );
      }
    } catch (error) {
      console.error("Error adding skill to target:", error);
      throw error;
    }
  }
  
  async removeSkillFromTarget(targetId: number, skillId: number): Promise<void> {
    try {
      await pool.query(
        'DELETE FROM skill_target_skills WHERE target_id = $1 AND skill_id = $2',
        [targetId, skillId]
      );
    } catch (error) {
      console.error("Error removing skill from target:", error);
      throw error;
    }
  }
  
  async getSkillTargetUsers(targetId: number): Promise<number[]> {
    try {
      const result = await pool.query(
        'SELECT user_id FROM skill_target_users WHERE target_id = $1',
        [targetId]
      );
      return result.rows.map(row => row.user_id);
    } catch (error) {
      console.error("Error getting skill target users:", error);
      throw error;
    }
  }
  
  async addUserToTarget(targetId: number, userId: number): Promise<void> {
    try {
      // Check if mapping already exists
      const existsCheck = await pool.query(
        'SELECT 1 FROM skill_target_users WHERE target_id = $1 AND user_id = $2',
        [targetId, userId]
      );
      
      if (existsCheck.rows.length === 0) {
        await pool.query(
          'INSERT INTO skill_target_users (target_id, user_id) VALUES ($1, $2)',
          [targetId, userId]
        );
      }
    } catch (error) {
      console.error("Error adding user to target:", error);
      throw error;
    }
  }
  
  async removeUserFromTarget(targetId: number, userId: number): Promise<void> {
    try {
      await pool.query(
        'DELETE FROM skill_target_users WHERE target_id = $1 AND user_id = $2',
        [targetId, userId]
      );
    } catch (error) {
      console.error("Error removing user from target:", error);
      throw error;
    }
  }

  // Pending Skill Updates operations
  async getPendingSkillUpdates(): Promise<PendingSkillUpdate[]> {
    try {
      const result = await pool.query(
        `SELECT p.*, u.email as user_email, u.username as username
         FROM pending_skill_updates p
         JOIN users u ON p.user_id = u.id
         WHERE p.status = 'pending'
         ORDER BY p.submitted_at DESC`
      );
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting pending skill updates:", error);
      throw error;
    }
  }

  async getPendingSkillUpdatesByUser(userId: number): Promise<PendingSkillUpdate[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM pending_skill_updates
         WHERE user_id = $1
         ORDER BY submitted_at DESC`,
        [userId]
      );
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting pending skill updates by user:", error);
      throw error;
    }
  }

  async getPendingSkillUpdate(id: number): Promise<PendingSkillUpdate | undefined> {
    try {
      const result = await pool.query(
        `SELECT p.*, u.email as user_email, u.username as username
         FROM pending_skill_updates p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = $1`,
        [id]
      );
      if (!result.rows[0]) return undefined;
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error getting pending skill update:", error);
      throw error;
    }
  }

  async createPendingSkillUpdate(update: InsertPendingSkillUpdate): Promise<PendingSkillUpdate> {
    try {
      const result = await pool.query(
        `INSERT INTO pending_skill_updates (
          user_id, skill_id, name, category, level, certification, credly_link, 
          notes, certification_date, expiration_date, is_update
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          update.userId,
          update.skillId || null,
          update.name,
          update.category,
          update.level,
          update.certification || '',
          update.credlyLink || '',
          update.notes || '',
          update.certificationDate || null,
          update.expirationDate || null,
          update.isUpdate || false
        ]
      );
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error creating pending skill update:", error);
      throw error;
    }
  }

  async approvePendingSkillUpdate(id: number, reviewerId: number, notes?: string): Promise<Skill> {
    try {
      // Start a transaction
      await pool.query('BEGIN');

      // First, get the pending update
      const pendingResult = await pool.query(
        'SELECT * FROM pending_skill_updates WHERE id = $1',
        [id]
      );
      
      if (pendingResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        throw new Error('Pending skill update not found');
      }
      
      const pendingUpdate = this.snakeToCamel(pendingResult.rows[0]) as PendingSkillUpdate;
      
      let skill: Skill;
      let previousLevel: string | null = null;
      
      // Handle skill creation or update based on isUpdate flag
      if (pendingUpdate.isUpdate && pendingUpdate.skillId) {
        // Get the existing skill to capture its current level
        const existingSkill = await this.getSkill(pendingUpdate.skillId);
        
        if (!existingSkill) {
          await pool.query('ROLLBACK');
          throw new Error('Skill to update not found');
        }
        
        previousLevel = existingSkill.level;
        
        // Update the existing skill
        skill = await this.updateSkill(pendingUpdate.skillId, {
          name: pendingUpdate.name,
          category: pendingUpdate.category,
          level: pendingUpdate.level,
          certification: pendingUpdate.certification,
          credlyLink: pendingUpdate.credlyLink,
          notes: pendingUpdate.notes,
          certificationDate: pendingUpdate.certificationDate,
          expirationDate: pendingUpdate.expirationDate
        });
      } else {
        // Create a new skill
        skill = await this.createSkill({
          userId: pendingUpdate.userId,
          name: pendingUpdate.name,
          category: pendingUpdate.category,
          level: pendingUpdate.level,
          certification: pendingUpdate.certification,
          credlyLink: pendingUpdate.credlyLink,
          notes: pendingUpdate.notes,
          certificationDate: pendingUpdate.certificationDate,
          expirationDate: pendingUpdate.expirationDate
        });
      }
      
      // Create a skill history entry for tracking
      await this.createSkillHistory({
        skillId: skill.id,
        userId: pendingUpdate.userId,
        previousLevel: previousLevel,
        newLevel: pendingUpdate.level,
        changeNote: `Approved by admin (ID: ${reviewerId})${notes ? ': ' + notes : ''}`
      });
      
      // Create a notification for the user
      await this.createNotification({
        userId: pendingUpdate.userId,
        type: 'achievement',
        content: `Your skill "${pendingUpdate.name}" has been approved!`,
        relatedSkillId: skill.id,
        relatedUserId: reviewerId
      });
      
      // Update the pending update status
      await pool.query(
        `UPDATE pending_skill_updates SET 
         status = 'approved', 
         reviewed_at = CURRENT_TIMESTAMP, 
         reviewed_by = $1,
         review_notes = $2
         WHERE id = $3`,
        [reviewerId, notes || null, id]
      );
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      return skill;
    } catch (error) {
      // Roll back the transaction on error
      await pool.query('ROLLBACK');
      console.error("Error approving pending skill update:", error);
      throw error;
    }
  }

  async rejectPendingSkillUpdate(id: number, reviewerId: number, notes?: string): Promise<void> {
    try {
      // Start a transaction
      await pool.query('BEGIN');
      
      // Get the pending update to be rejected
      const pendingResult = await pool.query(
        'SELECT * FROM pending_skill_updates WHERE id = $1',
        [id]
      );
      
      if (pendingResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        throw new Error('Pending skill update not found');
      }
      
      const pendingUpdate = this.snakeToCamel(pendingResult.rows[0]) as PendingSkillUpdate;
      
      // Update the pending update status
      await pool.query(
        `UPDATE pending_skill_updates SET 
         status = 'rejected', 
         reviewed_at = CURRENT_TIMESTAMP, 
         reviewed_by = $1,
         review_notes = $2
         WHERE id = $3`,
        [reviewerId, notes || null, id]
      );
      
      // Create a notification for the user
      await this.createNotification({
        userId: pendingUpdate.userId,
        type: 'achievement', // Reusing achievement type for now
        content: `Your skill "${pendingUpdate.name}" was not approved. ${notes || 'No reason provided.'}`,
        relatedUserId: reviewerId
      });
      
      // Commit the transaction
      await pool.query('COMMIT');
    } catch (error) {
      // Roll back the transaction on error
      await pool.query('ROLLBACK');
      console.error("Error rejecting pending skill update:", error);
      throw error;
    }
  }

  // Client operations
  async getAllClients(): Promise<Client[]> {
    try {
      const result = await pool.query('SELECT * FROM clients ORDER BY name');
      return result.rows.map(row => this.snakeToCamel(row)) as Client[];
    } catch (error) {
      console.error("Error retrieving clients:", error);
      throw error;
    }
  }

  async getClient(id: number): Promise<Client | undefined> {
    try {
      const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return undefined;
      }
      return this.snakeToCamel(result.rows[0]) as Client;
    } catch (error) {
      console.error(`Error retrieving client ${id}:`, error);
      throw error;
    }
  }

  async createClient(client: InsertClient): Promise<Client> {
    try {
      const result = await pool.query(
        `INSERT INTO clients (name, industry, contact_name, contact_email, contact_phone, website, logo_url, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [
          client.name,
          client.industry || null,
          client.contactName || null,
          client.contactEmail || null,
          client.contactPhone || null,
          client.website || null,
          client.logoUrl || null,
          client.notes || null
        ]
      );
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  }

  async updateClient(id: number, data: Partial<Client>): Promise<Client> {
    try {
      const client = await this.getClient(id);
      if (!client) {
        throw new Error('Client not found');
      }

      const updateFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          updateFields.push(`${this.camelToSnake(key)} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return client;
      }

      values.push(id);
      const query = `UPDATE clients SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
      const result = await pool.query(query, values);

      return this.snakeToCamel(result.rows[0]) as Client;
    } catch (error) {
      console.error(`Error updating client ${id}:`, error);
      throw error;
    }
  }

  async deleteClient(id: number): Promise<void> {
    try {
      // Check if client exists
      const client = await this.getClient(id);
      if (!client) {
        throw new Error('Client not found');
      }

      // Check if client has projects
      const projects = await this.getClientProjects(id);
      if (projects.length > 0) {
        throw new Error('Cannot delete client with associated projects');
      }

      await pool.query('DELETE FROM clients WHERE id = $1', [id]);
    } catch (error) {
      console.error(`Error deleting client ${id}:`, error);
      throw error;
    }
  }

  async searchClients(query: string): Promise<Client[]> {
    try {
      const searchQuery = `%${query}%`;
      const result = await pool.query(
        'SELECT * FROM clients WHERE name ILIKE $1 OR industry ILIKE $1 OR location ILIKE $1 ORDER BY name',
        [searchQuery]
      );
      return result.rows.map(row => this.snakeToCamel(row)) as Client[];
    } catch (error) {
      console.error(`Error searching clients with query '${query}':`, error);
      throw error;
    }
  }

  // Project operations
  async getAllProjects(): Promise<Project[]> {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name as client_name, 
        u1.username as lead_name, 
        u2.username as delivery_lead_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN users u1 ON p.lead_id = u1.id
        LEFT JOIN users u2 ON p.delivery_lead_id = u2.id
        ORDER BY p.name
      `);
      return result.rows.map(row => this.snakeToCamel(row)) as Project[];
    } catch (error) {
      console.error("Error retrieving projects:", error);
      throw error;
    }
  }

  async getProject(id: number): Promise<Project | undefined> {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name as client_name, 
        u1.username as lead_name, 
        u2.username as delivery_lead_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN users u1 ON p.lead_id = u1.id
        LEFT JOIN users u2 ON p.delivery_lead_id = u2.id
        WHERE p.id = $1
      `, [id]);
      if (result.rows.length === 0) {
        return undefined;
      }
      return this.snakeToCamel(result.rows[0]) as Project;
    } catch (error) {
      console.error(`Error retrieving project ${id}:`, error);
      throw error;
    }
  }

  async createProject(project: InsertProject): Promise<Project> {
    try {
      // Start transaction
      await pool.query('BEGIN');
      
      const { 
        name, description, clientId, startDate, endDate, 
        location, confluenceLink, leadId, deliveryLeadId, status,
        hrCoordinatorEmail, financeTeamEmail
      } = project;
      
      const result = await pool.query(
        `INSERT INTO projects (
          name, description, client_id, start_date, end_date, 
          location, confluence_link, lead_id, delivery_lead_id, status,
          hr_coordinator_email, finance_team_email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [name, description, clientId, startDate, endDate, 
         location, confluenceLink, leadId, deliveryLeadId, status,
         hrCoordinatorEmail, financeTeamEmail]
      );
      
      const newProjectId = result.rows[0].id;
      
      // If project lead is specified, add them as a resource
      if (leadId) {
        try {
          await this.addLeadAsResource(newProjectId, leadId, 'Project Lead');
        } catch (err) {
          console.error("Error adding project lead as resource:", err);
          // Continue even if adding the lead as a resource fails
        }
      }
      
      // If delivery lead is specified, add them as a resource
      if (deliveryLeadId) {
        try {
          await this.addLeadAsResource(newProjectId, deliveryLeadId, 'Delivery Lead');
        } catch (err) {
          console.error("Error adding delivery lead as resource:", err);
          // Continue even if adding the delivery lead as a resource fails
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      // Fetch the complete project with joined data
      const createdProject = await this.getProject(newProjectId);
      
      // Send email notification to HR and Finance
      try {
        let clientName = null;
        let leadName = null;
        
        // Get client name if a client is associated
        if (clientId) {
          const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [clientId]);
          if (clientResult.rows.length > 0) {
            clientName = clientResult.rows[0].name;
          }
        }
        
        // Get lead name if a lead is assigned
        if (leadId) {
          const leadResult = await pool.query('SELECT username FROM users WHERE id = $1', [leadId]);
          if (leadResult.rows.length > 0) {
            leadName = leadResult.rows[0].username;
          }
        }
        
        // Import the email functionality
        const { sendProjectCreatedEmail } = await import('./email');
        
        // Send notification with project-specific email addresses if provided
        await sendProjectCreatedEmail(
          name,
          clientName,
          description,
          startDate,
          endDate,
          leadName,
          hrCoordinatorEmail || null,
          financeTeamEmail || null
        );
        
        console.log(`Email notification sent for new project: ${name}`);
      } catch (emailError) {
        // Log the error but don't fail the operation
        console.error("Error sending project creation email notification:", emailError);
      }
      
      return createdProject;
    } catch (error) {
      // Rollback transaction if error occurs
      await pool.query('ROLLBACK');
      console.error("Error creating project:", error);
      throw error;
    }
  }

  async updateProject(id: number, data: Partial<Project>, performedByUserId?: number): Promise<Project> {
    try {
      const project = await this.getProject(id);
      if (!project) {
        throw new Error('Project not found');
      }

      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      // Track changes for notification email
      const changedFields: { field: string, oldValue?: string | null, newValue?: string | null }[] = [];
      
      // Store original lead and client info for email notification
      let clientName: string | null = null;
      let leadName: string | null = null;
      
      // Get client name if needed
      if (project.clientId) {
        try {
          const client = await this.getClient(project.clientId);
          if (client) {
            clientName = client.name;
          }
        } catch (err) {
          console.warn("Could not fetch client name for email notification:", err);
        }
      }
      
      // Get lead name if needed
      if (project.leadId) {
        try {
          const lead = await this.getUser(project.leadId);
          if (lead) {
            leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.username;
          }
        } catch (err) {
          console.warn("Could not fetch lead name for email notification:", err);
        }
      }
      
      // Get performer name if available
      let performerName: string | null = null;
      if (performedByUserId) {
        try {
          const performer = await this.getUser(performedByUserId);
          if (performer) {
            performerName = `${performer.firstName || ''} ${performer.lastName || ''}`.trim() || performer.username;
          }
        } catch (err) {
          console.warn("Could not fetch performer name for email notification:", err);
        }
      }

      for (const [key, value] of Object.entries(data)) {
        // Skip joined fields that aren't in the table
        if (['clientName', 'leadName', 'deliveryLeadName'].includes(key)) {
          continue;
        }
        
        if (value !== undefined) {
          updateFields.push(`${this.camelToSnake(key)} = $${paramCount}`);
          values.push(value);
          paramCount++;
          
          // Track significant field changes for notification
          if (['name', 'status', 'description', 'clientId', 'leadId', 'startDate', 'endDate', 'location'].includes(key)) {
            let oldValueDisplay = (project as any)[key]?.toString() || null;
            let newValueDisplay = value?.toString() || null;
            
            // Format the fields for better readability
            if (key === 'clientId' && value !== null) {
              newValueDisplay = 'New client assignment';
              try {
                // Try to get the new client name
                const newClient = await this.getClient(value as number);
                if (newClient) {
                  newValueDisplay = newClient.name;
                }
              } catch (err) {
                console.warn("Could not fetch new client name for email notification:", err);
              }
              
              if (project.clientId) {
                oldValueDisplay = clientName || 'Unknown client';
              } else {
                oldValueDisplay = 'No client';
              }
            }
            
            if (key === 'leadId' && value !== null) {
              newValueDisplay = 'New project lead';
              try {
                // Try to get the new lead name
                const newLead = await this.getUser(value as number);
                if (newLead) {
                  newValueDisplay = `${newLead.firstName || ''} ${newLead.lastName || ''}`.trim() || newLead.username;
                }
              } catch (err) {
                console.warn("Could not fetch new lead name for email notification:", err);
              }
              
              if (project.leadId) {
                oldValueDisplay = leadName || 'Unknown lead';
              } else {
                oldValueDisplay = 'No lead assigned';
              }
            }
            
            // Format dates in a readable way
            if (['startDate', 'endDate'].includes(key)) {
              if (value) {
                try {
                  const date = new Date(value as string | number | Date);
                  newValueDisplay = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                } catch (err) {
                  console.warn(`Could not format new ${key} for email notification:`, err);
                }
              }
              
              if (project[key as keyof Project]) {
                try {
                  const date = new Date(project[key as keyof Project] as string | number | Date);
                  oldValueDisplay = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                } catch (err) {
                  console.warn(`Could not format old ${key} for email notification:`, err);
                }
              }
            }
            
            // Only add if there's actually a change
            if (oldValueDisplay !== newValueDisplay) {
              let fieldDisplay = key;
              // Make field names more readable
              switch (key) {
                case 'clientId': fieldDisplay = 'Client'; break;
                case 'leadId': fieldDisplay = 'Project Lead'; break;
                case 'startDate': fieldDisplay = 'Start Date'; break;
                case 'endDate': fieldDisplay = 'End Date'; break;
                case 'name': fieldDisplay = 'Project Name'; break;
                default: 
                  // Capitalize first letter of each word
                  fieldDisplay = key.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());
              }
              
              changedFields.push({
                field: fieldDisplay,
                oldValue: oldValueDisplay,
                newValue: newValueDisplay
              });
            }
          }
        }
      }

      if (updateFields.length === 0) {
        return project;
      }

      values.push(id);
      const query = `UPDATE projects SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
      const result = await pool.query(query, values);
      
      // Fetch the updated project with joined data
      const updatedProject = await this.getProject(id);
      
      // Send notification email if there are significant changes
      if (changedFields.length > 0) {
        try {
          const { sendProjectUpdatedEmail } = await import('./email');
          
          // Send notification with project-specific email addresses if provided
          await sendProjectUpdatedEmail(
            project.name,
            clientName,
            project.description,
            project.startDate,
            project.endDate,
            leadName,
            changedFields,
            project.hrCoordinatorEmail || null,
            project.financeTeamEmail || null,
            performerName
          );
          
          console.log(`Email notification sent for project update: ${project.name}`);
        } catch (emailError) {
          // Log the error but don't fail the operation
          console.error("Error sending project update email notification:", emailError);
        }
      }

      return updatedProject;
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      throw error;
    }
  }

  async deleteProject(id: number): Promise<void> {
    try {
      // Check if project exists
      const project = await this.getProject(id);
      if (!project) {
        throw new Error('Project not found');
      }

      // Start transaction
      await pool.query('BEGIN');

      // Delete project resources first (cascading delete)
      await pool.query('DELETE FROM project_resources WHERE project_id = $1', [id]);
      
      // Delete project skills
      await pool.query('DELETE FROM project_skills WHERE project_id = $1', [id]);
      
      // Delete the project
      await pool.query('DELETE FROM projects WHERE id = $1', [id]);
      
      // Commit transaction
      await pool.query('COMMIT');
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    try {
      const result = await pool.query(`
        SELECT DISTINCT p.*, c.name as client_name, 
        u1.username as lead_name, 
        u2.username as delivery_lead_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN users u1 ON p.lead_id = u1.id
        LEFT JOIN users u2 ON p.delivery_lead_id = u2.id
        LEFT JOIN project_resources pr ON p.id = pr.project_id
        WHERE pr.user_id = $1 OR p.lead_id = $1 OR p.delivery_lead_id = $1
        ORDER BY p.name
      `, [userId]);
      return result.rows.map(row => this.snakeToCamel(row)) as Project[];
    } catch (error) {
      console.error(`Error retrieving projects for user ${userId}:`, error);
      throw error;
    }
  }

  async getClientProjects(clientId: number): Promise<Project[]> {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name as client_name, 
        u1.username as lead_name, 
        u2.username as delivery_lead_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN users u1 ON p.lead_id = u1.id
        LEFT JOIN users u2 ON p.delivery_lead_id = u2.id
        WHERE p.client_id = $1
        ORDER BY p.name
      `, [clientId]);
      return result.rows.map(row => this.snakeToCamel(row)) as Project[];
    } catch (error) {
      console.error(`Error retrieving projects for client ${clientId}:`, error);
      throw error;
    }
  }

  async searchProjects(query: string): Promise<Project[]> {
    try {
      const searchQuery = `%${query}%`;
      const result = await pool.query(`
        SELECT p.*, c.name as client_name, 
        u1.username as lead_name, 
        u2.username as delivery_lead_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN users u1 ON p.lead_id = u1.id
        LEFT JOIN users u2 ON p.delivery_lead_id = u2.id
        WHERE p.name ILIKE $1 OR p.description ILIKE $1 OR p.location ILIKE $1 
        OR c.name ILIKE $1 OR u1.username ILIKE $1 OR u2.username ILIKE $1
        ORDER BY p.name
      `, [searchQuery]);
      return result.rows.map(row => this.snakeToCamel(row)) as Project[];
    } catch (error) {
      console.error(`Error searching projects with query '${query}':`, error);
      throw error;
    }
  }

  // Project Resources operations
  async getProjectResources(projectId: number): Promise<ProjectResource[]> {
    try {
      const result = await pool.query(`
        SELECT pr.*, u.username, u.email, u.first_name, u.last_name
        FROM project_resources pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.project_id = $1
        ORDER BY pr.role
      `, [projectId]);
      
      // Log raw database data for debugging
      if (result.rows.length > 0) {
        console.log("Raw project resources from DB:", JSON.stringify(result.rows[0], null, 2));
      }
      
      // Transform and return data with proper date handling
      const resources = result.rows.map(row => {
        // Ensure dates are properly formatted as strings
        if (row.start_date) {
          row.start_date = new Date(row.start_date).toISOString();
        }
        if (row.end_date) {
          row.end_date = new Date(row.end_date).toISOString();
        }
        return this.snakeToCamel(row);
      }) as ProjectResource[];
      
      if (resources.length > 0) {
        console.log("Processed resources with dates:", JSON.stringify(resources[0], null, 2));
      }
      
      return resources;
    } catch (error) {
      console.error(`Error retrieving resources for project ${projectId}:`, error);
      throw error;
    }
  }

  // getUserProjectResources implementation moved to line ~2867

  async getProjectResource(id: number): Promise<ProjectResource | undefined> {
    try {
      const result = await pool.query(`
        SELECT pr.*, u.username, u.email, u.first_name, u.last_name, p.name as project_name
        FROM project_resources pr
        JOIN users u ON pr.user_id = u.id
        JOIN projects p ON pr.project_id = p.id
        WHERE pr.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Log the raw data from database for debugging
      console.log(`Raw project resource ${id} from DB:`, JSON.stringify(result.rows[0], null, 2));
      
      // Ensure dates are properly formatted
      const row = result.rows[0];
      if (row.start_date) {
        row.start_date = new Date(row.start_date).toISOString();
      }
      if (row.end_date) {
        row.end_date = new Date(row.end_date).toISOString();
      }
      
      const resource = this.snakeToCamel(row) as ProjectResource;
      console.log(`Processed resource ${id} with dates:`, JSON.stringify(resource, null, 2));
      
      return resource;
    } catch (error) {
      console.error(`Error retrieving project resource ${id}:`, error);
      throw error;
    }
  }

  async createProjectResource(resource: InsertProjectResource, performedByUserId?: number): Promise<ProjectResource> {
    try {
      const { projectId, userId, role, allocation, startDate, endDate, notes } = resource;
      
      // Debug log for incoming date values
      console.log("Creating resource with dates:", { 
        startDate: startDate ? new Date(startDate).toISOString() : null, 
        endDate: endDate ? new Date(endDate).toISOString() : null 
      });
      
      // Start transaction
      await pool.query('BEGIN');
      
      // Insert the resource
      const result = await pool.query(
        `INSERT INTO project_resources (
          project_id, user_id, role, allocation, start_date, end_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [projectId, userId, role, allocation, startDate, endDate, notes]
      );
      
      // Debug log for raw result
      console.log("Raw resource after insert:", JSON.stringify(result.rows[0], null, 2));
      
      // Add resource history record with the performed by user if available
      const historyPerformedById = performedByUserId || userId;
      
      await pool.query(
        `INSERT INTO project_resource_histories (
          project_id, user_id, action, new_role, new_allocation, performed_by_id, note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [projectId, userId, 'added', role, allocation, historyPerformedById, notes]
      );
      
      // Commit transaction
      await pool.query('COMMIT');
      
      // Get the complete resource info with proper date formatting
      const newResource = await this.getProjectResource(result.rows[0].id);
      
      // Send email notification to HR and Finance about the resource addition
      try {
        // Import the email functionality
        const { sendResourceAddedEmail } = await import('./email');
        
        // Get project and user details for the notification
        const project = await this.getProject(projectId);
        const user = await this.getUser(userId);
        
        // Get the performer's name if available
        let performerName: string | null = null;
        if (performedByUserId && performedByUserId !== userId) {
          try {
            const performer = await this.getUser(performedByUserId);
            if (performer) {
              performerName = `${performer.firstName || ''} ${performer.lastName || ''}`.trim() || performer.username;
            }
          } catch (err) {
            console.warn("Could not fetch performer name for email notification:", err);
          }
        }
        
        if (project && user) {
          // Send the notification email with project-specific email addresses if provided
          await sendResourceAddedEmail(
            project.name,
            user.username,
            user.email,
            role || 'Team Member',
            startDate,
            endDate,
            allocation || 100,
            project.hrCoordinatorEmail || null,
            project.financeTeamEmail || null,
            performerName
          );
          
          console.log(`Email notification sent for resource addition: ${user.username} to ${project.name}`);
        }
      } catch (emailError) {
        // Log the error but don't fail the transaction
        console.error("Error sending resource addition email notification:", emailError);
      }
      
      return newResource;
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error("Error creating project resource:", error);
      throw error;
    }
  }

  async updateProjectResource(id: number, data: Partial<ProjectResource>): Promise<ProjectResource> {
    try {
      const resource = await this.getProjectResource(id);
      if (!resource) {
        throw new Error('Project resource not found');
      }

      // Debug log incoming update data
      console.log(`Updating resource ${id} with data:`, JSON.stringify(data, null, 2));
      
      // Process date fields specifically for logging
      if (data.startDate) {
        console.log(`Start date before processing: ${typeof data.startDate}`, data.startDate);
        if (!(data.startDate instanceof Date) && typeof data.startDate === 'object') {
          console.log("Start date is an object but not a Date, needs conversion");
        }
      }
      
      if (data.endDate) {
        console.log(`End date before processing: ${typeof data.endDate}`, data.endDate);
        if (!(data.endDate instanceof Date) && typeof data.endDate === 'object') {
          console.log("End date is an object but not a Date, needs conversion");
        }
      }

      // Start transaction
      await pool.query('BEGIN');
      
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(data)) {
        // Skip joined fields that aren't in the table
        if (['username', 'email', 'firstName', 'lastName', 'projectName'].includes(key)) {
          continue;
        }
        
        if (value !== undefined) {
          updateFields.push(`${this.camelToSnake(key)} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        await pool.query('ROLLBACK');
        return resource;
      }

      values.push(id);
      const query = `UPDATE project_resources SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
      console.log(`SQL Query: ${query}`);
      console.log(`Values: ${JSON.stringify(values)}`);
      
      const result = await pool.query(query, values);
      console.log(`Raw update result: ${JSON.stringify(result.rows[0], null, 2)}`);
      
      // Add history record if role or allocation changed
      if (data.role !== undefined && data.role !== resource.role) {
        await pool.query(
          `INSERT INTO project_resource_histories (
            project_id, user_id, action, previous_role, new_role, performed_by_id
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [resource.projectId, resource.userId, 'role_changed', resource.role, data.role, data.userId || resource.userId]
        );
      }
      
      if (data.allocation !== undefined && data.allocation !== resource.allocation) {
        await pool.query(
          `INSERT INTO project_resource_histories (
            project_id, user_id, action, previous_allocation, new_allocation, performed_by_id
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [resource.projectId, resource.userId, 'allocation_changed', resource.allocation, data.allocation, data.userId || resource.userId]
        );
      }
      
      // Commit transaction
      await pool.query('COMMIT');

      // Get the updated resource with proper date formatting
      const updatedResource = await this.getProjectResource(id);
      console.log(`Processed updated resource: ${JSON.stringify(updatedResource, null, 2)}`);
      
      return updatedResource;
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error(`Error updating project resource ${id}:`, error);
      throw error;
    }
  }

  async deleteProjectResource(id: number, performedByUserId?: number): Promise<void> {
    try {
      // Check if resource exists
      const resource = await this.getProjectResource(id);
      if (!resource) {
        throw new Error('Project resource not found');
      }

      // Get project details for email notification
      const project = await this.getProject(resource.projectId);
      const user = await this.getUser(resource.userId);
      
      // Get the performer's name if available
      let performerName: string | null = null;
      const historyPerformedById = performedByUserId || resource.userId;
      
      if (performedByUserId && performedByUserId !== resource.userId) {
        try {
          const performer = await this.getUser(performedByUserId);
          if (performer) {
            performerName = `${performer.firstName || ''} ${performer.lastName || ''}`.trim() || performer.username;
          }
        } catch (err) {
          console.warn("Could not fetch performer name for email notification:", err);
        }
      }
      
      // Start transaction
      await pool.query('BEGIN');
      
      // Add resource history record
      await pool.query(
        `INSERT INTO project_resource_histories (
          project_id, user_id, action, previous_role, previous_allocation, performed_by_id, note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          resource.projectId, 
          resource.userId, 
          'removed', 
          resource.role, 
          resource.allocation, 
          historyPerformedById, 
          `Removed from project by ${performerName || 'system'}`
        ]
      );
      
      // Delete the resource
      await pool.query('DELETE FROM project_resources WHERE id = $1', [id]);
      
      // Commit transaction
      await pool.query('COMMIT');
      
      // Send email notification to HR and Finance about the resource removal
      try {
        if (project && user) {
          // Import the email functionality
          const { sendResourceRemovedEmail } = await import('./email');
          
          // Send the notification email with project-specific email addresses if provided
          await sendResourceRemovedEmail(
            project.name,
            user.username,
            user.email,
            resource.role || 'Team Member',
            project.hrCoordinatorEmail || null,
            project.financeTeamEmail || null,
            resource.allocation,
            performerName
          );
          
          console.log(`Email notification sent for resource removal: ${user.username} from ${project.name}`);
        }
      } catch (emailError) {
        // Log the error but don't fail the transaction (already committed)
        console.error("Error sending resource removal email notification:", emailError);
      }
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error(`Error deleting project resource ${id}:`, error);
      throw error;
    }
  }

  // Project Skills operations
  async getProjectSkills(projectId: number): Promise<ProjectSkill[]> {
    try {
      const result = await pool.query(`
        SELECT ps.*, s.name as skill_name, s.category as skill_category, s.level as skill_level
        FROM project_skills ps
        JOIN skills s ON ps.skill_id = s.id
        WHERE ps.project_id = $1
        ORDER BY s.category, s.name
      `, [projectId]);
      return result.rows.map(row => this.snakeToCamel(row)) as ProjectSkill[];
    } catch (error) {
      console.error(`Error retrieving skills for project ${projectId}:`, error);
      throw error;
    }
  }

  async getSkillProjects(skillId: number): Promise<ProjectSkill[]> {
    try {
      const result = await pool.query(`
        SELECT ps.*, p.name as project_name, p.status as project_status
        FROM project_skills ps
        JOIN projects p ON ps.project_id = p.id
        WHERE ps.skill_id = $1
        ORDER BY p.name
      `, [skillId]);
      return result.rows.map(row => this.snakeToCamel(row)) as ProjectSkill[];
    } catch (error) {
      console.error(`Error retrieving projects for skill ${skillId}:`, error);
      throw error;
    }
  }

  async createProjectSkill(projectSkill: InsertProjectSkill): Promise<ProjectSkill> {
    try {
      const { projectId, skillId, importance } = projectSkill;
      
      // Check if this skill is already linked to the project
      const existing = await pool.query(
        'SELECT * FROM project_skills WHERE project_id = $1 AND skill_id = $2',
        [projectId, skillId]
      );
      
      if (existing.rows.length > 0) {
        throw new Error('This skill is already associated with the project');
      }
      
      const result = await pool.query(
        'INSERT INTO project_skills (project_id, skill_id, importance) VALUES ($1, $2, $3) RETURNING *',
        [projectId, skillId, importance]
      );
      
      // Get the full project skill info
      const fullResult = await pool.query(`
        SELECT ps.*, s.name as skill_name, s.category as skill_category, s.level as skill_level, p.name as project_name
        FROM project_skills ps
        JOIN skills s ON ps.skill_id = s.id
        JOIN projects p ON ps.project_id = p.id
        WHERE ps.id = $1
      `, [result.rows[0].id]);
      
      return this.snakeToCamel(fullResult.rows[0]) as ProjectSkill;
    } catch (error) {
      console.error("Error creating project skill:", error);
      throw error;
    }
  }

  async deleteProjectSkill(id: number): Promise<void> {
    try {
      await pool.query('DELETE FROM project_skills WHERE id = $1', [id]);
    } catch (error) {
      console.error(`Error deleting project skill ${id}:`, error);
      throw error;
    }
  }

  // Project Resource History operations
  async getProjectResourceHistory(projectId: number): Promise<ProjectResourceHistory[]> {
    try {
      const result = await pool.query(`
        SELECT prh.*, u.username, u.email, p.name as project_name, 
        performer.username as performed_by_username
        FROM project_resource_histories prh
        JOIN users u ON prh.user_id = u.id
        JOIN projects p ON prh.project_id = p.id
        LEFT JOIN users performer ON prh.performed_by_id = performer.id
        WHERE prh.project_id = $1
        ORDER BY prh.date DESC
      `, [projectId]);
      return result.rows.map(row => this.snakeToCamel(row)) as ProjectResourceHistory[];
    } catch (error) {
      console.error(`Error retrieving resource history for project ${projectId}:`, error);
      throw error;
    }
  }

  async getUserProjectHistory(userId: number): Promise<ProjectResourceHistory[]> {
    try {
      const result = await pool.query(`
        SELECT prh.*, p.name as project_name, 
        performer.username as performed_by_username
        FROM project_resource_histories prh
        JOIN projects p ON prh.project_id = p.id
        LEFT JOIN users performer ON prh.performed_by_id = performer.id
        WHERE prh.user_id = $1
        ORDER BY prh.date DESC
      `, [userId]);
      return result.rows.map(row => this.snakeToCamel(row)) as ProjectResourceHistory[];
    } catch (error) {
      console.error(`Error retrieving project history for user ${userId}:`, error);
      throw error;
    }
  }

  async createProjectResourceHistory(history: InsertProjectResourceHistory): Promise<ProjectResourceHistory> {
    try {
      const { 
        projectId, userId, action, previousRole, newRole, 
        previousAllocation, newAllocation, performedById, note 
      } = history;
      
      const result = await pool.query(
        `INSERT INTO project_resource_histories (
          project_id, user_id, action, previous_role, new_role, 
          previous_allocation, new_allocation, performed_by_id, note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [projectId, userId, action, previousRole, newRole, 
         previousAllocation, newAllocation, performedById, note]
      );
      
      // Get the full history info with joins
      const fullResult = await pool.query(`
        SELECT prh.*, u.username, u.email, p.name as project_name, 
        performer.username as performed_by_username
        FROM project_resource_histories prh
        JOIN users u ON prh.user_id = u.id
        JOIN projects p ON prh.project_id = p.id
        LEFT JOIN users performer ON prh.performed_by_id = performer.id
        WHERE prh.id = $1
      `, [result.rows[0].id]);
      
      return this.snakeToCamel(fullResult.rows[0]) as ProjectResourceHistory;
    } catch (error) {
      console.error("Error creating project resource history:", error);
      throw error;
    }
  }
  
  // Helper method to convert camelCase to snake_case for SQL queries
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  async updateClient(id: number, data: Partial<Client>): Promise<Client> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      // Build update statement
      for (const key in data) {
        if (data.hasOwnProperty(key) && key !== 'id') {
          updateFields.push(`${this.camelToSnake(key)} = $${paramCount}`);
          params.push(data[key as keyof typeof data]);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return await this.getClient(id) as Client;
      }

      params.push(id);
      const result = await pool.query(
        `UPDATE clients SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        params
      );

      if (result.rowCount === 0) {
        throw new Error("Client not found");
      }

      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error updating client:", error);
      throw error;
    }
  }

  async deleteClient(id: number): Promise<void> {
    try {
      // Check if client has associated projects before deleting
      const projectsResult = await pool.query('SELECT id FROM projects WHERE client_id = $1', [id]);
      
      if (projectsResult.rows.length > 0) {
        throw new Error("Cannot delete client with associated projects");
      }
      
      const result = await pool.query('DELETE FROM clients WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error("Client not found");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
  }

  async searchClients(query: string): Promise<Client[]> {
    try {
      const searchTerm = `%${query}%`;
      const result = await pool.query(
        `SELECT * FROM clients 
         WHERE name ILIKE $1 
         OR industry ILIKE $1 
         OR contact_name ILIKE $1 
         ORDER BY name`,
        [searchTerm]
      );
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error searching clients:", error);
      throw error;
    }
  }

  // Project operations
  async getAllProjects(): Promise<Project[]> {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name as client_name 
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        ORDER BY p.start_date DESC
      `);
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting all projects:", error);
      throw error;
    }
  }

  async getProject(id: number): Promise<Project | undefined> {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name as client_name 
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id = $1
      `, [id]);
      
      if (!result.rows[0]) return undefined;
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error getting project:", error);
      throw error;
    }
  }

  async createProject(project: InsertProject): Promise<Project> {
    try {
      // Start transaction
      await pool.query('BEGIN');
      
      const result = await pool.query(
        `INSERT INTO projects (
          name, description, client_id, start_date, end_date, status, 
          location, confluence_link, lead_id, delivery_lead_id
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *`,
        [
          project.name,
          project.description || '',
          project.clientId,
          project.startDate || null,
          project.endDate || null,
          project.status || 'active',
          project.location || '',
          project.confluenceLink || '',
          project.leadId || null,
          project.deliveryLeadId || null
        ]
      );
      
      const projectId = result.rows[0].id;
      
      // Auto-add project lead as a resource if specified
      if (project.leadId) {
        try {
          await this.addLeadAsResource(projectId, project.leadId, 'Project Lead');
        } catch (err) {
          console.error("Error adding project lead as resource:", err);
          // Continue with project creation even if adding lead fails
        }
      }
      
      // Auto-add delivery lead as a resource if specified
      if (project.deliveryLeadId) {
        try {
          await this.addLeadAsResource(projectId, project.deliveryLeadId, 'Delivery Lead');
        } catch (err) {
          console.error("Error adding delivery lead as resource:", err);
          // Continue with project creation even if adding delivery lead fails
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      // Get the project with client name
      return await this.getProject(projectId) as Project;
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error("Error creating project:", error);
      throw error;
    }
  }
  
  // Helper method to add a lead (project or delivery) as a resource
  // Add a project lead or delivery lead as a resource automatically
  private async addLeadAsResource(projectId: number, userId: number, role: string): Promise<void> {
    // Check if the user is already a resource on this project
    const existing = await pool.query(
      'SELECT * FROM project_resources WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (existing.rows.length === 0) {
      // Add the lead as a resource with 100% allocation by default
      await pool.query(
        `INSERT INTO project_resources (
          project_id, user_id, role, allocation, start_date, end_date
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, userId, role, 100, null, null]
      );
      
      // Add to project resource history
      await pool.query(
        `INSERT INTO project_resource_histories (
          project_id, user_id, action, new_role, new_allocation, performed_by_id, note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [projectId, userId, 'added', role, 100, userId, `Added automatically as ${role}`]
      );
      
      // Send email notification to HR and Finance about the resource addition
      try {
        // Get project and user details for the notification
        const project = await this.getProject(projectId);
        const user = await this.getUser(userId);
        
        if (project && user) {
          // Import the email functionality
          const { sendResourceAddedEmail } = await import('./email');
          
          // Send the notification email with project-specific email addresses if provided
          await sendResourceAddedEmail(
            project.name,
            user.username,
            user.email,
            role || "Team Member",
            null, // No specific start date
            null, // No specific end date
            100,  // Default 100% allocation
            project.hrCoordinatorEmail || null,
            project.financeTeamEmail || null,
            "System (Automatic Assignment)" // Indicate this was an automatic action
          );
          
          console.log(`Email notification sent: ${role} (${user.username}) added to project ${project.name}`);
        }
      } catch (emailError) {
        // Log the error but don't fail the operation
        console.error("Error sending lead addition email notification:", emailError);
      }
      
      console.log(`Leader added as resource: ${role} (userId: ${userId}) to project ${projectId}`);
    } else {
      console.log(`User ${userId} is already a resource on project ${projectId}, not adding as ${role}`);
    }
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    try {
      // Start transaction
      await pool.query('BEGIN');
      
      // Get the existing project to check for lead changes
      const existingProject = await this.getProject(id);
      if (!existingProject) {
        throw new Error("Project not found");
      }
      
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      // Build update statement
      for (const key in data) {
        if (data.hasOwnProperty(key) && key !== 'id' && key !== 'clientName') {
          updateFields.push(`${this.camelToSnake(key)} = $${paramCount}`);
          params.push(data[key as keyof typeof data]);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        await pool.query('ROLLBACK');
        return existingProject;
      }

      params.push(id);
      const result = await pool.query(
        `UPDATE projects SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        params
      );

      if (result.rowCount === 0) {
        await pool.query('ROLLBACK');
        throw new Error("Project not found");
      }
      
      // Handle project lead changes
      if (data.leadId && data.leadId !== existingProject.leadId) {
        try {
          await this.addLeadAsResource(id, data.leadId, 'Project Lead');
        } catch (err) {
          console.error("Error adding new project lead as resource:", err);
          // Continue even if adding the lead as a resource fails
        }
      }
      
      // Handle delivery lead changes
      if (data.deliveryLeadId && data.deliveryLeadId !== existingProject.deliveryLeadId) {
        try {
          await this.addLeadAsResource(id, data.deliveryLeadId, 'Delivery Lead');
        } catch (err) {
          console.error("Error adding new delivery lead as resource:", err);
          // Continue even if adding the delivery lead as a resource fails
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      // Get the updated project with joined data
      const updatedProject = await this.getProject(id) as Project;
      
      // Send email notification to HR and Finance about the project update
      try {
        // Determine which fields were changed with before/after values
        const changedFields: {field: string, oldValue?: string | null, newValue?: string | null}[] = [];
        for (const key in data) {
          if (data.hasOwnProperty(key) && key !== 'id' && key !== 'clientName') {
            const fieldName = this.camelToSnake(key).replace(/_/g, ' ');
            // Get old and new values
            const oldValue = existingProject[key as keyof typeof existingProject] as string | null;
            const newValue = data[key as keyof typeof data] as string | null;
            
            changedFields.push({
              field: fieldName,
              oldValue: oldValue !== undefined ? String(oldValue) : null,
              newValue: newValue !== undefined ? String(newValue) : null
            });
          }
        }
        
        if (changedFields.length > 0) {
          let clientName = null;
          let leadName = null;
          
          // Get client name if a client is associated
          if (updatedProject.clientId) {
            const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [updatedProject.clientId]);
            if (clientResult.rows.length > 0) {
              clientName = clientResult.rows[0].name;
            }
          }
          
          // Get lead name if a lead is assigned
          if (updatedProject.leadId) {
            const leadResult = await pool.query('SELECT username FROM users WHERE id = $1', [updatedProject.leadId]);
            if (leadResult.rows.length > 0) {
              leadName = leadResult.rows[0].username;
            }
          }
          
          // Import the email functionality
          const { sendProjectUpdatedEmail } = await import('./email');
          
          // Send notification with project-specific email addresses if available
          await sendProjectUpdatedEmail(
            updatedProject.name,
            clientName,
            updatedProject.description,
            updatedProject.startDate,
            updatedProject.endDate,
            leadName,
            changedFields,
            updatedProject.hrCoordinatorEmail || null,
            updatedProject.financeTeamEmail || null,
            "System (Admin User)" // For now, we'll use a generic identifier until we track the user who made the change
          );
          
          console.log(`Email notification sent for updated project: ${updatedProject.name}`);
        }
      } catch (emailError) {
        // Log the error but don't fail the operation
        console.error("Error sending project update email notification:", emailError);
      }
      
      return updatedProject;
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error("Error updating project:", error);
      throw error;
    }
  }

  async deleteProject(id: number): Promise<void> {
    try {
      // Start a transaction to ensure all related records are deleted
      await pool.query('BEGIN');
      
      try {
        // Delete project resources history first
        await pool.query('DELETE FROM project_resource_histories WHERE project_id = $1', [id]);
        
        // Delete project resources
        await pool.query('DELETE FROM project_resources WHERE project_id = $1', [id]);
        
        // Delete project skills
        await pool.query('DELETE FROM project_skills WHERE project_id = $1', [id]);
        
        // Finally delete the project
        const result = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
          throw new Error("Project not found");
        }
        
        // Commit the transaction
        await pool.query('COMMIT');
      } catch (error) {
        // Rollback the transaction if any query fails
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name as client_name 
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id IN (
          SELECT project_id FROM project_resources WHERE user_id = $1
        )
        ORDER BY p.start_date DESC
      `, [userId]);
      
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting user projects:", error);
      throw error;
    }
  }

  async getClientProjects(clientId: number): Promise<Project[]> {
    try {
      const result = await pool.query(`
        SELECT p.*, c.name as client_name 
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.client_id = $1
        ORDER BY p.start_date DESC
      `, [clientId]);
      
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting client projects:", error);
      throw error;
    }
  }

  async searchProjects(query: string): Promise<Project[]> {
    try {
      const searchTerm = `%${query}%`;
      const result = await pool.query(`
        SELECT p.*, c.name as client_name 
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.name ILIKE $1 
        OR p.description ILIKE $1 
        OR c.name ILIKE $1
        OR p.location ILIKE $1
        OR p.status ILIKE $1
        ORDER BY p.start_date DESC
      `, [searchTerm]);
      
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error searching projects:", error);
      throw error;
    }
  }

  // Project Resources operations
  async getProjectResources(projectId: number): Promise<ProjectResource[]> {
    try {
      const result = await pool.query(`
        SELECT pr.*, u.username, u.email, u.first_name, u.last_name
        FROM project_resources pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.project_id = $1
        ORDER BY pr.start_date DESC
      `, [projectId]);
      
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting project resources:", error);
      throw error;
    }
  }

  async getUserProjectResources(userId: number): Promise<ProjectResource[]> {
    try {
      const result = await pool.query(`
        SELECT pr.*, p.name as project_name
        FROM project_resources pr
        JOIN projects p ON pr.project_id = p.id
        WHERE pr.user_id = $1
        ORDER BY pr.start_date DESC
      `, [userId]);
      
      // Ensure dates are properly formatted for each resource
      return result.rows.map(row => {
        const processed = { ...row };
        // Format dates as ISO strings if they exist
        if (processed.start_date) {
          processed.start_date = new Date(processed.start_date).toISOString();
        }
        if (processed.end_date) {
          processed.end_date = new Date(processed.end_date).toISOString();
        }
        return this.snakeToCamel(processed);
      }) as ProjectResource[];
    } catch (error) {
      console.error("Error getting user project resources:", error);
      throw error;
    }
  }

  async getProjectResource(id: number): Promise<ProjectResource | undefined> {
    try {
      const result = await pool.query(`
        SELECT pr.*, u.username, u.email, u.first_name, u.last_name
        FROM project_resources pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.id = $1
      `, [id]);
      
      if (!result.rows[0]) return undefined;
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error getting project resource:", error);
      throw error;
    }
  }

  async createProjectResource(resource: InsertProjectResource): Promise<ProjectResource> {
    try {
      const result = await pool.query(
        `INSERT INTO project_resources (
          project_id, user_id, role, allocation, start_date, end_date, notes
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          resource.projectId,
          resource.userId,
          resource.role || '',
          resource.allocation || 100,
          resource.startDate || new Date(),
          resource.endDate || null,
          resource.notes || ''
        ]
      );
      
      // Add to project resource history
      await this.createProjectResourceHistory({
        projectId: resource.projectId,
        userId: resource.userId,
        action: 'added',
        newRole: resource.role || '',
        newAllocation: resource.allocation || 100,
        performedById: resource.userId, // Using the same user ID as performed_by for now
        note: resource.notes
      });
      
      // Send email notification to HR and Finance about the resource addition
      try {
        // Get project and user details for the notification
        const project = await this.getProject(resource.projectId);
        const user = await this.getUser(resource.userId);
        
        if (project && user) {
          // Import the email functionality
          const { sendResourceAddedEmail } = await import('./email');
          
          // Send the notification email with project-specific recipients if configured
          await sendResourceAddedEmail(
            project.name,
            user.username,
            user.email,
            resource.role || "Team Member",
            resource.startDate,
            resource.endDate,
            resource.allocation || 100,
            project.hrCoordinatorEmail || null,
            project.financeTeamEmail || null,
            resource.performedById ? `Added by User ID: ${resource.performedById}` : null
          );
          
          console.log(`Email notification sent: ${resource.role || "Team Member"} (${user.username}) added to project ${project.name}`);
        }
      } catch (emailError) {
        // Log the error but don't fail the operation
        console.error("Error sending resource addition email notification:", emailError);
      }
      
      // Get the resource with user details
      return await this.getProjectResource(result.rows[0].id) as ProjectResource;
    } catch (error) {
      console.error("Error creating project resource:", error);
      throw error;
    }
  }

  async updateProjectResource(id: number, data: Partial<ProjectResource>): Promise<ProjectResource> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      // Build update statement
      for (const key in data) {
        if (data.hasOwnProperty(key) && key !== 'id' && key !== 'username' && 
            key !== 'email' && key !== 'firstName' && key !== 'lastName') {
          updateFields.push(`${this.camelToSnake(key)} = $${paramCount}`);
          params.push(data[key as keyof typeof data]);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return await this.getProjectResource(id) as ProjectResource;
      }

      params.push(id);
      const result = await pool.query(
        `UPDATE project_resources SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        params
      );

      if (result.rowCount === 0) {
        throw new Error("Project resource not found");
      }

      // Get the updated resource with user details
      return await this.getProjectResource(id) as ProjectResource;
    } catch (error) {
      console.error("Error updating project resource:", error);
      throw error;
    }
  }

  async deleteProjectResource(id: number): Promise<void> {
    try {
      // Get the resource details before deletion for history and notification
      const resourceResult = await pool.query(
        `SELECT pr.*, p.name as project_name, p.hr_coordinator_email, p.finance_team_email,
         u.username, u.email
         FROM project_resources pr
         JOIN projects p ON pr.project_id = p.id
         JOIN users u ON pr.user_id = u.id
         WHERE pr.id = $1`,
        [id]
      );
      
      if (resourceResult.rowCount === 0) {
        throw new Error("Project resource not found");
      }
      
      const resource = this.snakeToCamel(resourceResult.rows[0]);
      
      // Delete the resource
      const result = await pool.query('DELETE FROM project_resources WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error("Project resource not found");
      }
      
      // Add to project resource history
      await this.createProjectResourceHistory({
        projectId: resource.projectId,
        userId: resource.userId,
        action: 'removed',
        previousRole: resource.role,
        previousAllocation: resource.allocation,
        performedById: resource.userId, // Using the same user ID as performed_by for now
        note: `Resource removed from project ${resource.projectName}`
      });
      
      // Send email notification to HR and Finance about the resource removal
      try {
        // Import the email functionality
        const { sendResourceRemovedEmail } = await import('./email');
        
        // Send the notification email with project-specific recipients if configured
        await sendResourceRemovedEmail(
          resource.projectName,
          resource.username,
          resource.email,
          resource.role || "Team Member",
          resource.hrCoordinatorEmail || null,
          resource.financeTeamEmail || null,
          resource.allocation,
          resource.performedById ? `Removed by User ID: ${resource.performedById}` : null
        );
        
        console.log(`Email notification sent: ${resource.role || "Team Member"} (${resource.username}) removed from project ${resource.projectName}`);
      } catch (emailError) {
        // Log the error but don't fail the operation
        console.error("Error sending resource removal email notification:", emailError);
      }
    } catch (error) {
      console.error("Error deleting project resource:", error);
      throw error;
    }
  }

  // Project Skills operations
  async getProjectSkills(projectId: number): Promise<ProjectSkill[]> {
    try {
      const result = await pool.query(`
        SELECT ps.*, s.name as skill_name, s.category, s.level
        FROM project_skills ps
        JOIN skills s ON ps.skill_id = s.id
        WHERE ps.project_id = $1
        ORDER BY s.category, s.name
      `, [projectId]);
      
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting project skills:", error);
      throw error;
    }
  }

  async getSkillProjects(skillId: number): Promise<ProjectSkill[]> {
    try {
      const result = await pool.query(`
        SELECT ps.*, p.name as project_name, p.status, p.start_date, p.end_date
        FROM project_skills ps
        JOIN projects p ON ps.project_id = p.id
        WHERE ps.skill_id = $1
        ORDER BY p.start_date DESC
      `, [skillId]);
      
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting skill projects:", error);
      throw error;
    }
  }

  async createProjectSkill(projectSkill: InsertProjectSkill): Promise<ProjectSkill> {
    try {
      // Check if this skill is already associated with the project
      const existingResult = await pool.query(
        'SELECT id FROM project_skills WHERE project_id = $1 AND skill_id = $2',
        [projectSkill.projectId, projectSkill.skillId]
      );
      
      if (existingResult.rows.length > 0) {
        throw new Error("This skill is already associated with the project");
      }
      
      const result = await pool.query(
        `INSERT INTO project_skills (project_id, skill_id, required_level, importance) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          projectSkill.projectId,
          projectSkill.skillId,
          projectSkill.requiredLevel || 'beginner',
          projectSkill.importance || 'medium'
        ]
      );
      
      // Return the result with skill details
      const fullResult = await pool.query(`
        SELECT ps.*, s.name as skill_name, s.category, s.level
        FROM project_skills ps
        JOIN skills s ON ps.skill_id = s.id
        WHERE ps.id = $1
      `, [result.rows[0].id]);
      
      return this.snakeToCamel(fullResult.rows[0]);
    } catch (error) {
      console.error("Error creating project skill:", error);
      throw error;
    }
  }

  async deleteProjectSkill(id: number): Promise<void> {
    try {
      const result = await pool.query('DELETE FROM project_skills WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error("Project skill not found");
      }
    } catch (error) {
      console.error("Error deleting project skill:", error);
      throw error;
    }
  }

  // Project Resource History operations
  async getProjectResourceHistory(projectId: number): Promise<ProjectResourceHistory[]> {
    try {
      const result = await pool.query(`
        SELECT prh.*, 
               u.username, u.email, u.first_name, u.last_name,
               pu.username as performed_by_username, pu.email as performed_by_email
        FROM project_resource_histories prh
        JOIN users u ON prh.user_id = u.id
        JOIN users pu ON prh.performed_by_id = pu.id
        WHERE prh.project_id = $1
        ORDER BY prh.date DESC
      `, [projectId]);
      
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting project resource history:", error);
      throw error;
    }
  }

  async getUserProjectHistory(userId: number): Promise<ProjectResourceHistory[]> {
    try {
      const result = await pool.query(`
        SELECT prh.*, 
               p.name as project_name, 
               pu.username as performed_by_username, pu.email as performed_by_email
        FROM project_resource_histories prh
        JOIN projects p ON prh.project_id = p.id
        JOIN users pu ON prh.performed_by_id = pu.id
        WHERE prh.user_id = $1
        ORDER BY prh.date DESC
      `, [userId]);
      
      return this.snakeToCamel(result.rows);
    } catch (error) {
      console.error("Error getting user project history:", error);
      throw error;
    }
  }

  async createProjectResourceHistory(history: InsertProjectResourceHistory): Promise<ProjectResourceHistory> {
    try {
      const result = await pool.query(
        `INSERT INTO project_resource_histories (
          project_id, user_id, action, previous_role, previous_allocation,
          new_role, new_allocation, performed_by_id, note
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [
          history.projectId,
          history.userId,
          history.action,
          history.previousRole || null,
          history.previousAllocation || null,
          history.newRole || null, 
          history.newAllocation || null,
          history.performedById,
          history.note || ''
        ]
      );
      
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error creating project resource history:", error);
      throw error;
    }
  }
}

export const storage = new PostgresStorage();
