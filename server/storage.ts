import { 
  User, InsertUser, Skill, InsertSkill, 
  SkillHistory, InsertSkillHistory, 
  ProfileHistory, InsertProfileHistory,
  Endorsement, InsertEndorsement,
  Notification, InsertNotification,
  SkillTemplate, InsertSkillTemplate,
  SkillTarget, InsertSkillTarget
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
      const dateFields = ['createdAt', 'updatedAt', 'lastUpdated', 'targetDate', 'certificationDate'];
      
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
        `INSERT INTO skill_targets (name, description, target_level, target_date) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          target.name,
          target.description || '',
          target.targetLevel,
          target.targetDate || null
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
}

export const storage = new PostgresStorage();
