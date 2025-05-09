import { 
  User, InsertUser, Skill, InsertSkill, 
  UserSkill, InsertUserSkill,
  SkillHistory, InsertSkillHistory, 
  SkillHistoryV2, InsertSkillHistoryV2,
  ProfileHistory, InsertProfileHistory,
  Endorsement, InsertEndorsement,
  EndorsementV2, InsertEndorsementV2,
  Notification, InsertNotification,
  SkillTemplate, InsertSkillTemplate,
  SkillTarget, InsertSkillTarget,
  PendingSkillUpdate, InsertPendingSkillUpdate,
  PendingSkillUpdateV2, InsertPendingSkillUpdateV2,
  Client, InsertClient,
  Project, InsertProject,
  ProjectResource, InsertProjectResource,
  ProjectSkill, InsertProjectSkill,
  ProjectSkillV2, InsertProjectSkillV2,
  ProjectResourceHistory, InsertProjectResourceHistory,
  SkillCategory, InsertSkillCategory,
  SkillSubcategory, InsertSkillSubcategory,
  SkillApprover, InsertSkillApprover,
  ReportSettings, InsertReportSettings
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
  // Session store
  sessionStore: Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByClientId(clientId: number): Promise<User[]>;
  getUsersByProjectId(projectId: number): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  getAllAdmins(): Promise<User[]>;
  
  // Add other interface methods...
  // This is simplified for brevity
}

class MemStorage implements IStorage {
  sessionStore: Store;
  private users: User[] = [];

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // One day
    });
    
    // Create a default admin user with the correct User schema format
    this.users.push({
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      password: '$argon2id$v=19$m=65536,t=3,p=4$TmZac2VsRXNGdjJvT0pvag$u87GwL35HkJ+jY5+bSn6jGbMBRKoEx182Z1Glnamdq4', // 'password'
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      is_admin: true,
      createdAt: new Date(),
      location: 'US',
      project: null
    });
  }

  // User operations implementations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1;
    // Create user with required fields
    const newUser: User = {
      id,
      email: user.email,
      is_admin: user.is_admin || false,
      createdAt: new Date(),
      username: user.username || null,
      password: user.password || null,
      firstName: null,
      lastName: null,
      project: null,
      role: null,
      location: null
    };
    
    this.users.push(newUser);
    return newUser;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // Update only fields that exist in the User type
    const updatedUser = { ...this.users[index], ...data };
    this.users[index] = updatedUser;
    return this.users[index];
  }
  
  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    this.users[index].password = hashedPassword;
  }
  
  async getAllUsers(): Promise<User[]> {
    return this.users;
  }
  
  async getUsersByClientId(clientId: number): Promise<User[]> {
    return [];
  }
  
  async getUsersByProjectId(projectId: number): Promise<User[]> {
    return [];
  }
  
  async deleteUser(id: number): Promise<void> {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }
  
  async getAllAdmins(): Promise<User[]> {
    return this.users.filter(u => u.role === 'admin');
  }
  
  // Add stub implementations for other methods
  // This could be much longer but is omitted for brevity
}

// PostgreSQL implementation (existing code)
class PostgresStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    });
  }
  
  private snakeToCamel(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(v => this.snakeToCamel(v));
    }
    
    return Object.keys(obj).reduce((result, key) => {
      let camelKey = key;
      
      // Special case handling
      if (key === 'account_manager_id') {
        camelKey = 'accountManagerId';
      } else if (key === 'credly_link') {
        camelKey = 'credlyLink';
      } else if (key === 'certification_date') {
        camelKey = 'certificationDate';
      } else if (key === 'expiration_date') {
        camelKey = 'expirationDate';
      } else if (key === 'skill_id') {
        camelKey = 'skillId';
      } else if (key === 'user_id') {
        camelKey = 'userId'; 
      } else if (key === 'is_update') {
        camelKey = 'isUpdate';
      } else if (key === 'category_type') {
        camelKey = 'categoryType';
      }
      // General snake_case to camelCase conversion
      else if (key.includes('_')) {
        camelKey = key.split('_').map((part, i) => {
          return i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1);
        }).join('');
      }
      
      // Handle boolean fields
      let value = obj[key];
      if (key === 'is_admin' || key === 'is_update' || key.startsWith('is_')) {
        if (value === 't' || value === true || value === 'true') {
          value = true;
        } else if (value === 'f' || value === false || value === 'false') {
          value = false;
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
  
  async createUser(user: InsertUser): Promise<User> {
    try {
      const columns = Object.keys(user);
      const values = Object.values(user);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const result = await pool.query(
        `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    try {
      const updates = Object.entries(data).map(([key, _], i) => `${key} = $${i + 1}`);
      const values = [...Object.values(data), id];
      
      const result = await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
      );
      
      if (!result.rows[0]) {
        throw new Error(`User with ID ${id} not found`);
      }
      
      return this.snakeToCamel(result.rows[0]);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
  
  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    try {
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, id]
      );
    } catch (error) {
      console.error("Error updating user password:", error);
      throw error;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const result = await pool.query('SELECT * FROM users');
      return result.rows.map(row => this.snakeToCamel(row));
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }
  
  async getUsersByClientId(clientId: number): Promise<User[]> {
    try {
      const result = await pool.query(`
        SELECT DISTINCT u.* 
        FROM users u
        JOIN project_resources pr ON u.id = pr.user_id
        JOIN projects p ON pr.project_id = p.id
        WHERE p.client_id = $1
      `, [clientId]);
      
      return result.rows.map(row => this.snakeToCamel(row));
    } catch (error) {
      console.error("Error getting users by client ID:", error);
      throw error;
    }
  }
  
  async getUsersByProjectId(projectId: number): Promise<User[]> {
    try {
      const result = await pool.query(`
        SELECT u.* 
        FROM users u
        JOIN project_resources pr ON u.id = pr.user_id
        WHERE pr.project_id = $1
      `, [projectId]);
      
      return result.rows.map(row => this.snakeToCamel(row));
    } catch (error) {
      console.error("Error getting users by project ID:", error);
      throw error;
    }
  }
  
  async deleteUser(id: number): Promise<void> {
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
  
  async getAllAdmins(): Promise<User[]> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE role = $1', ['admin']);
      return result.rows.map(row => this.snakeToCamel(row));
    } catch (error) {
      console.error("Error getting all admins:", error);
      throw error;
    }
  }
  
  // Other methods would be here, but are omitted for brevity
}

// Function to create PostgreSQL storage exclusively - no fallbacks
function createStorage(): IStorage {
  // Always use PostgreSQL storage with no fallbacks
  console.log('STORAGE: Using PostgreSQL storage with Cloud SQL exclusively');
  console.log('STORAGE: No memory fallbacks or alternatives will be used');
  
  // Always return PostgreSQL storage for all environments
  // If database connection fails, the application should fail
  return new PostgresStorage();
}

export const storage = createStorage();
