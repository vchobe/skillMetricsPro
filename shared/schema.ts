import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Optional fields with defaults
  username: text("username").default(''),
  password: text("password").default(''),
  firstName: text("first_name").default(''),
  lastName: text("last_name").default(''),
  project: text("project").default(null),
  role: text("role").default(null),
  location: text("location").default(null),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    email: true,
  })
  .extend({
    isAdmin: z.boolean().default(false).optional(),
  });

export const loginUserSchema = z.object({
  email: z.string().email("Valid email is required"),
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
});

export const insertSkillSchema = createInsertSchema(skills).pick({
  userId: true,
  name: true,
  category: true,
  level: true,
  certification: true,
  credlyLink: true,
  notes: true,
});

// Skill history schema
export const skillHistories = pgTable("skill_histories", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull(),
  userId: integer("user_id").notNull(),
  previousLevel: skillLevelEnum("previous_level"),
  newLevel: skillLevelEnum("new_level").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProfileHistorySchema = createInsertSchema(profileHistories).pick({
  userId: true,
  field: true,
  oldValue: true,
  newValue: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;

export type SkillHistory = typeof skillHistories.$inferSelect;
export type InsertSkillHistory = z.infer<typeof insertSkillHistorySchema>;

export type ProfileHistory = typeof profileHistories.$inferSelect;
export type InsertProfileHistory = z.infer<typeof insertProfileHistorySchema>;
