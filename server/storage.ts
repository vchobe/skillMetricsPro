import { 
  User, InsertUser, Skill, InsertSkill, 
  SkillHistory, InsertSkillHistory, 
  ProfileHistory, InsertProfileHistory,
  Endorsement, InsertEndorsement,
  Notification, InsertNotification
} from "@shared/schema";
import session from "express-session";
import { Store } from "express-session";
import createMemoryStore from "memorystore";
import pg from "pg";
import connectPg from "connect-pg-simple";

const { Pool } = pg;

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
  
  // Session store
  sessionStore: Store;
}

// PostgreSQL implementation
export class PostgresStorage implements IStorage {
  private pool: ReturnType<typeof pg.Pool>;
  sessionStore: Store;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    this.sessionStore = new PostgresSessionStore({
      pool: this.pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0] || undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || undefined;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser & { username?: string, password?: string }): Promise<User> {
    try {
      console.log("Creating user with data:", insertUser);
      const result = await this.pool.query(
        `INSERT INTO users (email, is_admin, username, password) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          insertUser.email, 
          insertUser.isAdmin || false,
          insertUser.username || insertUser.email.split('@')[0], // Use username if provided, otherwise derive from email
          insertUser.password || '' // Use empty string as default password
        ]
      );
      console.log("User created:", result.rows[0]);
      return result.rows[0];
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
        // Convert camelCase to snake_case for database column names
        const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(`${columnName} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
      
      if (sets.length === 0) {
        return await this.getUser(id) as User;
      }
      
      params.push(id); // Add id as the last parameter
      
      const result = await this.pool.query(
        `UPDATE users SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );
      
      if (result.rows.length === 0) {
        throw new Error("User not found");
      }
      
      return result.rows[0];
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
  
  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    try {
      const result = await this.pool.query(
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
      const result = await this.pool.query('SELECT * FROM users ORDER BY id');
      return result.rows;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  // Skill operations
  async getUserSkills(userId: number): Promise<Skill[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM skills WHERE user_id = $1 ORDER BY last_updated DESC',
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting user skills:", error);
      throw error;
    }
  }
  
  async getSkill(id: number): Promise<Skill | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM skills WHERE id = $1', [id]);
      return result.rows[0] || undefined;
    } catch (error) {
      console.error("Error getting skill:", error);
      throw error;
    }
  }
  
  async createSkill(skill: InsertSkill): Promise<Skill> {
    try {
      const result = await this.pool.query(
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
      return result.rows[0];
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
      
      const result = await this.pool.query(
        `UPDATE skills SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );
      
      if (result.rows.length === 0) {
        throw new Error("Skill not found");
      }
      
      return result.rows[0];
    } catch (error) {
      console.error("Error updating skill:", error);
      throw error;
    }
  }
  
  async deleteSkill(id: number): Promise<void> {
    try {
      const result = await this.pool.query('DELETE FROM skills WHERE id = $1', [id]);
      
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
      const result = await this.pool.query('SELECT * FROM skills ORDER BY last_updated DESC');
      return result.rows;
    } catch (error) {
      console.error("Error getting all skills:", error);
      throw error;
    }
  }
  
  async searchSkills(query: string): Promise<Skill[]> {
    try {
      // Search for skills by name, category, level, certification
      const searchQuery = `%${query.toLowerCase()}%`;
      const result = await this.pool.query(
        `SELECT * FROM skills 
         WHERE LOWER(name) LIKE $1 
         OR LOWER(category) LIKE $1 
         OR LOWER(level) LIKE $1 
         OR LOWER(certification) LIKE $1
         OR LOWER(notes) LIKE $1
         ORDER BY last_updated DESC`,
        [searchQuery]
      );
      return result.rows;
    } catch (error) {
      console.error("Error searching skills:", error);
      throw error;
    }
  }

  // Skill history operations
  async getSkillHistory(skillId: number): Promise<SkillHistory[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM skill_histories WHERE skill_id = $1 ORDER BY created_at DESC',
        [skillId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting skill history:", error);
      throw error;
    }
  }
  
  async getUserSkillHistory(userId: number): Promise<SkillHistory[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM skill_histories WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting user skill history:", error);
      throw error;
    }
  }
  
  async createSkillHistory(history: InsertSkillHistory): Promise<SkillHistory> {
    try {
      const result = await this.pool.query(
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
      return result.rows[0];
    } catch (error) {
      console.error("Error creating skill history:", error);
      throw error;
    }
  }

  // Profile history operations
  async getUserProfileHistory(userId: number): Promise<ProfileHistory[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM profile_histories WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting user profile history:", error);
      throw error;
    }
  }
  
  async createProfileHistory(history: InsertProfileHistory): Promise<ProfileHistory> {
    try {
      const result = await this.pool.query(
        `INSERT INTO profile_histories (user_id, field, old_value, new_value) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          history.userId, 
          history.field, 
          history.oldValue || '', 
          history.newValue
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating profile history:", error);
      throw error;
    }
  }
  
  // Endorsement operations
  async getSkillEndorsements(skillId: number): Promise<Endorsement[]> {
    try {
      const result = await this.pool.query(
        'SELECT e.*, u.email as endorser_email FROM endorsements e JOIN users u ON e.endorser_id = u.id WHERE skill_id = $1 ORDER BY created_at DESC',
        [skillId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting skill endorsements:", error);
      throw error;
    }
  }
  
  async getUserEndorsements(userId: number): Promise<Endorsement[]> {
    try {
      const result = await this.pool.query(
        'SELECT e.*, s.name as skill_name, u.email as endorser_email FROM endorsements e JOIN skills s ON e.skill_id = s.id JOIN users u ON e.endorser_id = u.id WHERE e.endorsee_id = $1 ORDER BY e.created_at DESC',
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting user endorsements:", error);
      throw error;
    }
  }
  
  async createEndorsement(endorsement: InsertEndorsement): Promise<Endorsement> {
    try {
      // First check if the endorsement already exists
      const existingEndorsement = await this.pool.query(
        'SELECT * FROM endorsements WHERE skill_id = $1 AND endorser_id = $2',
        [endorsement.skillId, endorsement.endorserId]
      );
      
      if (existingEndorsement.rows.length > 0) {
        // Update existing endorsement with new comment
        const result = await this.pool.query(
          `UPDATE endorsements SET comment = $1, created_at = CURRENT_TIMESTAMP 
           WHERE skill_id = $2 AND endorser_id = $3 
           RETURNING *`,
          [endorsement.comment || '', endorsement.skillId, endorsement.endorserId]
        );
        
        // Also increment the endorsement count if we're updating
        await this.pool.query(
          'UPDATE skills SET endorsement_count = endorsement_count + 1 WHERE id = $1',
          [endorsement.skillId]
        );
        
        return result.rows[0];
      }
      
      // Create new endorsement
      const result = await this.pool.query(
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
      await this.pool.query(
        'UPDATE skills SET endorsement_count = endorsement_count + 1 WHERE id = $1',
        [endorsement.skillId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error("Error creating endorsement:", error);
      throw error;
    }
  }
  
  async deleteEndorsement(endorsementId: number): Promise<void> {
    try {
      // First get the endorsement to know which skill to update
      const endorsement = await this.pool.query(
        'SELECT skill_id FROM endorsements WHERE id = $1',
        [endorsementId]
      );
      
      if (endorsement.rows.length === 0) {
        throw new Error("Endorsement not found");
      }
      
      const skillId = endorsement.rows[0].skill_id;
      
      // Delete the endorsement
      await this.pool.query('DELETE FROM endorsements WHERE id = $1', [endorsementId]);
      
      // Decrement the endorsement count
      await this.pool.query(
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
      
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw error;
    }
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const result = await this.pool.query(
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
      const result = await this.pool.query(
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
      await this.pool.query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
        [userId]
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }
}

export const storage = new PostgresStorage();
