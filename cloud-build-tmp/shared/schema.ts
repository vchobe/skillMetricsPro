import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Approval status enum
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  is_admin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Optional fields with defaults
  username: text("username").default(''),
  password: text("password").default(''),
  firstName: text("first_name").default(''),
  lastName: text("last_name").default(''),
  project: text("project").default(''),
  role: text("role").default(''),
  location: text("location").default(''),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    email: true,
  })
  .extend({
    is_admin: z.boolean().default(false).optional(),
    password: z.string().optional(), // Password is generated on server
  });

// Registration schema only needs email, and must be an @atyeti.com domain
export const registerSchema = z.object({
  email: z.string()
    .email("Valid email is required")
    .refine(email => email.endsWith('@atyeti.com'), {
      message: "Only @atyeti.com email addresses are allowed"
    }),
});

export const loginUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

// Skill level enum
export const skillLevelEnum = pgEnum("skill_level", ["beginner", "intermediate", "expert"]);

// Skills schema
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  level: skillLevelEnum("level").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  certification: text("certification"),
  credlyLink: text("credly_link"),
  notes: text("notes"),
  endorsementCount: integer("endorsement_count").default(0),
  certificationDate: timestamp("certification_date"),
  expirationDate: timestamp("expiration_date"),
});

export const insertSkillSchema = createInsertSchema(skills).pick({
  userId: true,
  name: true,
  category: true,
  level: true,
  certification: true,
  credlyLink: true,
  notes: true,
  certificationDate: true,
  expirationDate: true,
});

// Skill history schema
export const skillHistories = pgTable("skill_histories", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull(),
  userId: integer("user_id").notNull(),
  previousLevel: skillLevelEnum("previous_level"),
  newLevel: skillLevelEnum("new_level").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  changeNote: text("change_note"),
});

export const insertSkillHistorySchema = createInsertSchema(skillHistories).pick({
  skillId: true,
  userId: true,
  previousLevel: true,
  newLevel: true,
  changeNote: true,
});

// Profile history schema
export const profileHistories = pgTable("profile_histories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  changedField: text("changed_field").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProfileHistorySchema = createInsertSchema(profileHistories).pick({
  userId: true,
  changedField: true,
  previousValue: true,
  newValue: true,
});

// Notification type enum
export const notificationTypeEnum = pgEnum("notification_type", ["endorsement", "level_up", "achievement"]);

// Notifications schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  relatedSkillId: integer("related_skill_id"),
  relatedUserId: integer("related_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  content: true,
  relatedSkillId: true,
  relatedUserId: true,
});

// Endorsements schema
export const endorsements = pgTable("endorsements", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull(),
  endorserId: integer("endorser_id").notNull(),
  endorseeId: integer("endorsee_id").notNull(), 
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEndorsementSchema = createInsertSchema(endorsements).pick({
  skillId: true,
  endorserId: true,
  endorseeId: true,
  comment: true,
});

// Export types
export type User = typeof users.$inferSelect & {
  // Additional runtime properties that might be added during processing
  isAdmin?: boolean;
};
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;

export type SkillHistory = typeof skillHistories.$inferSelect;
export type InsertSkillHistory = z.infer<typeof insertSkillHistorySchema>;

export type ProfileHistory = typeof profileHistories.$inferSelect;
export type InsertProfileHistory = z.infer<typeof insertProfileHistorySchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Endorsement = typeof endorsements.$inferSelect;
export type InsertEndorsement = z.infer<typeof insertEndorsementSchema>;

// Skill Templates schema
export const skillTemplates = pgTable("skill_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  isRecommended: boolean("is_recommended").default(false),
  targetLevel: skillLevelEnum("target_level"),
  targetDate: date("target_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSkillTemplateSchema = createInsertSchema(skillTemplates).pick({
  name: true,
  category: true,
  description: true,
  isRecommended: true,
  targetLevel: true,
  targetDate: true,
});

// Skill Targets schema
export const skillTargets = pgTable("skill_targets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Required in database but optional in UI
  description: text("description"),
  targetLevel: skillLevelEnum("target_level").notNull(),
  targetDate: date("target_date"),
  targetNumber: integer("target_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const skillTargetSkills = pgTable("skill_target_skills", {
  id: serial("id").primaryKey(),
  targetId: integer("target_id").notNull(),
  skillId: integer("skill_id").notNull(),
});

export const skillTargetUsers = pgTable("skill_target_users", {
  id: serial("id").primaryKey(),
  targetId: integer("target_id").notNull(),
  userId: integer("user_id").notNull(),
});

export const insertSkillTargetSchema = createInsertSchema(skillTargets).pick({
  name: true,
  description: true,
  targetLevel: true,
  targetDate: true,
  targetNumber: true,
});

export type SkillTemplate = typeof skillTemplates.$inferSelect;
export type InsertSkillTemplate = z.infer<typeof insertSkillTemplateSchema>;

export type SkillTarget = typeof skillTargets.$inferSelect;
export type InsertSkillTarget = z.infer<typeof insertSkillTargetSchema>;

// Pending Skill Updates schema
export const pendingSkillUpdates = pgTable("pending_skill_updates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skillId: integer("skill_id"), // Null for new skills
  name: text("name").notNull(),
  category: text("category").notNull(),
  level: skillLevelEnum("level").notNull(),
  certification: text("certification"),
  credlyLink: text("credly_link"),
  notes: text("notes"),
  certificationDate: timestamp("certification_date"),
  expirationDate: timestamp("expiration_date"),
  status: approvalStatusEnum("status").default("pending").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by"),
  reviewNotes: text("review_notes"),
  isUpdate: boolean("is_update").default(false).notNull(), // true for updates, false for new skills
});

export const insertPendingSkillUpdateSchema = createInsertSchema(pendingSkillUpdates).pick({
  userId: true,
  skillId: true,
  name: true,
  category: true,
  level: true,
  certification: true,
  credlyLink: true,
  notes: true,
  certificationDate: true,
  expirationDate: true,
  isUpdate: true,
});

export type PendingSkillUpdate = typeof pendingSkillUpdates.$inferSelect;
export type InsertPendingSkillUpdate = z.infer<typeof insertPendingSkillUpdateSchema>;

// Client schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  logoUrl: text("logo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  industry: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  website: true,
  logoUrl: true,
  notes: true
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

// Project schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  clientId: integer("client_id").references(() => clients.id),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  location: text("location"),
  confluenceLink: text("confluence_link"),
  leadId: integer("lead_id").references(() => users.id),
  deliveryLeadId: integer("delivery_lead_id").references(() => users.id),
  hrCoordinatorEmail: text("hr_coordinator_email"),
  financeTeamEmail: text("finance_team_email"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertProjectSchema = createInsertSchema(projects)
  .pick({
    name: true,
    description: true,
    clientId: true,
    startDate: true,
    endDate: true,
    location: true,
    confluenceLink: true,
    leadId: true,
    deliveryLeadId: true,
    hrCoordinatorEmail: true,
    financeTeamEmail: true,
    status: true
  })
  .extend({
    // Allow string dates that will be converted to Date objects on the server
    startDate: z.union([z.string(), z.date(), z.null()]).optional(),
    endDate: z.union([z.string(), z.date(), z.null()]).optional(),
    // Email validation
    hrCoordinatorEmail: z.string().email("Invalid HR coordinator email").optional(),
    financeTeamEmail: z.string().email("Invalid finance team email").optional(),
  });

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

// Project Resources (Users assigned to Projects)
export const projectResources = pgTable("project_resources", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role"),
  allocation: integer("allocation").default(100), // Percentage of time allocated
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertProjectResourceSchema = createInsertSchema(projectResources)
  .pick({
    projectId: true,
    userId: true,
    role: true,
    allocation: true,
    startDate: true,
    endDate: true,
    notes: true
  })
  .extend({
    // Allow string dates that will be converted to Date objects on the server
    startDate: z.union([z.string(), z.date(), z.null()]).optional(),
    endDate: z.union([z.string(), z.date(), z.null()]).optional(),
  });

export type ProjectResource = typeof projectResources.$inferSelect;
export type InsertProjectResource = z.infer<typeof insertProjectResourceSchema>;

// Project Skills (Skills required/used in Projects)
export const projectSkills = pgTable("project_skills", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  requiredLevel: skillLevelEnum("required_level").default("beginner"), // beginner, intermediate, expert
  createdAt: timestamp("created_at").defaultNow()
});

export const insertProjectSkillSchema = createInsertSchema(projectSkills).pick({
  projectId: true,
  skillId: true,
  requiredLevel: true
});

export type ProjectSkill = typeof projectSkills.$inferSelect;
export type InsertProjectSkill = z.infer<typeof insertProjectSkillSchema>;

// Project Resource History (tracking changes in project assignments)
export const projectResourceHistories = pgTable("project_resource_histories", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // added, removed, role_changed, allocation_changed
  previousRole: text("previous_role"),
  newRole: text("new_role"),
  previousAllocation: integer("previous_allocation"),
  newAllocation: integer("new_allocation"),
  date: timestamp("date").defaultNow(),
  performedById: integer("performed_by_id").references(() => users.id),
  note: text("note")
});

export const insertProjectResourceHistorySchema = createInsertSchema(projectResourceHistories).pick({
  projectId: true,
  userId: true,
  action: true,
  previousRole: true,
  newRole: true,
  previousAllocation: true,
  newAllocation: true,
  date: true,
  performedById: true,
  note: true
});

export type ProjectResourceHistory = typeof projectResourceHistories.$inferSelect;
export type InsertProjectResourceHistory = z.infer<typeof insertProjectResourceHistorySchema>;
