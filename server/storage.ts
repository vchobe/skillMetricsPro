import { 
  User, InsertUser, Skill, InsertSkill, 
  SkillHistory, InsertSkillHistory, 
  ProfileHistory, InsertProfileHistory 
} from "@shared/schema";
import session from "express-session";
import { Store } from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  
  // Skill history operations
  getSkillHistory(skillId: number): Promise<SkillHistory[]>;
  getUserSkillHistory(userId: number): Promise<SkillHistory[]>;
  createSkillHistory(history: InsertSkillHistory): Promise<SkillHistory>;
  
  // Profile history operations
  getUserProfileHistory(userId: number): Promise<ProfileHistory[]>;
  createProfileHistory(history: InsertProfileHistory): Promise<ProfileHistory>;
  
  // Session store
  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private skills: Map<number, Skill>;
  private skillHistories: Map<number, SkillHistory>;
  private profileHistories: Map<number, ProfileHistory>;
  
  userId: number;
  skillId: number;
  skillHistoryId: number;
  profileHistoryId: number;
  
  sessionStore: Store;

  constructor() {
    this.users = new Map();
    this.skills = new Map();
    this.skillHistories = new Map();
    this.profileHistories = new Map();
    
    this.userId = 1;
    this.skillId = 1;
    this.skillHistoryId = 1;
    this.profileHistoryId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Add a default admin user - this is only for the email-only authentication implementation
    this.users.set(1, {
      id: 1,
      email: "admin@example.com",
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      project: null,
      role: null,
      location: null,
      isAdmin: true,
      createdAt: new Date()
    });
    this.userId = 2; // Increment the ID counter
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    
    // Create user with email-only and apply default values for other fields
    const user: User = { 
      id,
      email: insertUser.email,
      isAdmin: insertUser.isAdmin || false,
      createdAt: now,
      // Default values for required fields
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      project: null,
      role: null,
      location: null
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    user.password = hashedPassword;
    this.users.set(id, user);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Skill operations
  async getUserSkills(userId: number): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(
      (skill) => skill.userId === userId,
    );
  }
  
  async getSkill(id: number): Promise<Skill | undefined> {
    return this.skills.get(id);
  }
  
  async createSkill(skill: InsertSkill): Promise<Skill> {
    const id = this.skillId++;
    const now = new Date();
    // Ensure null values for optional fields
    const newSkill: Skill = { 
      ...skill, 
      id, 
      lastUpdated: now,
      certification: skill.certification || null,
      credlyLink: skill.credlyLink || null,
      notes: skill.notes || null
    };
    this.skills.set(id, newSkill);
    return newSkill;
  }
  
  async updateSkill(id: number, data: Partial<Skill>): Promise<Skill> {
    const skill = await this.getSkill(id);
    if (!skill) {
      throw new Error("Skill not found");
    }
    
    const now = new Date();
    const updatedSkill = { ...skill, ...data, lastUpdated: now };
    this.skills.set(id, updatedSkill);
    return updatedSkill;
  }
  
  async deleteSkill(id: number): Promise<void> {
    if (!this.skills.has(id)) {
      throw new Error("Skill not found");
    }
    
    this.skills.delete(id);
  }
  
  async getAllSkills(): Promise<Skill[]> {
    return Array.from(this.skills.values());
  }

  // Skill history operations
  async getSkillHistory(skillId: number): Promise<SkillHistory[]> {
    return Array.from(this.skillHistories.values())
      .filter((history) => history.skillId === skillId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async getUserSkillHistory(userId: number): Promise<SkillHistory[]> {
    return Array.from(this.skillHistories.values())
      .filter((history) => history.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async createSkillHistory(history: InsertSkillHistory): Promise<SkillHistory> {
    const id = this.skillHistoryId++;
    const now = new Date();
    const newHistory: SkillHistory = { 
      ...history, 
      id, 
      updatedAt: now,
      previousLevel: history.previousLevel || null,
      changeNote: history.changeNote || null
    };
    this.skillHistories.set(id, newHistory);
    return newHistory;
  }

  // Profile history operations
  async getUserProfileHistory(userId: number): Promise<ProfileHistory[]> {
    return Array.from(this.profileHistories.values())
      .filter((history) => history.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async createProfileHistory(history: InsertProfileHistory): Promise<ProfileHistory> {
    const id = this.profileHistoryId++;
    const now = new Date();
    const newHistory: ProfileHistory = { 
      ...history, 
      id, 
      updatedAt: now,
      oldValue: history.oldValue || null
    };
    this.profileHistories.set(id, newHistory);
    return newHistory;
  }
}

export const storage = new MemStorage();
