# Database Schema Overview

The Skills Management Platform uses PostgreSQL with Drizzle ORM. This document outlines the database schema defined in `shared/schema.ts`.

## Entity Relationships

![Entity Relationship Diagram](../assets/erd.png)

```
users (1)--(*) skills
skills (1)--(*) skill_histories
users (1)--(*) profile_histories
skills (1)--(*) endorsements
users (1)--(*) notifications
users (1)--(*) skill_target_users
skills (1)--(*) skill_target_skills
```

## Tables and Schemas

### Users Table

The `users` table stores information about users of the platform.

```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  project: text("project"),
  role: text("role"),
  location: text("location"),
});
```

**Key Constraints:**
- Primary Key: `id`
- Unique: `username`, `email`

**Fields Description:**
- `id`: Auto-incrementing identifier
- `username`: User's login username
- `email`: User's email address
- `password`: Hashed password
- `isAdmin`: Admin privilege flag
- `createdAt`: Account creation timestamp
- `updatedAt`: Account last update timestamp
- `firstName`: User's first name
- `lastName`: User's last name
- `project`: Current project assignment
- `role`: Job role or title
- `location`: Work location

### Skills Table

The `skills` table stores skills possessed by users.

```typescript
export const skillLevelEnum = pgEnum("skill_level", ["beginner", "intermediate", "expert"]);

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  level: skillLevelEnum("level").notNull(),
  yearsOfExperience: numeric("years_of_experience"),
  description: text("description"),
  certification: text("certification"),
  certificationLink: text("certification_link"),
  certificationDate: timestamp("certification_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Key Constraints:**
- Primary Key: `id`
- Foreign Key: `userId` references `users.id`

**Fields Description:**
- `id`: Auto-incrementing identifier
- `userId`: Reference to user who possesses this skill
- `name`: Skill name
- `category`: Skill category
- `level`: Skill proficiency level (beginner, intermediate, expert)
- `yearsOfExperience`: Years of experience with the skill
- `description`: Detailed description of the skill
- `certification`: Name of certification, if any
- `certificationLink`: URL to certification verification
- `certificationDate`: Date when certification was obtained
- `createdAt`: Skill record creation timestamp
- `updatedAt`: Skill record last update timestamp

### Skill Histories Table

The `skill_histories` table tracks changes to skill levels over time.

```typescript
export const skillHistories = pgTable("skill_histories", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  previousLevel: skillLevelEnum("previous_level"),
  newLevel: skillLevelEnum("new_level").notNull(),
  date: timestamp("date").defaultNow(),
  note: text("note"),
});
```

**Key Constraints:**
- Primary Key: `id`
- Foreign Keys: 
  - `skillId` references `skills.id`
  - `userId` references `users.id`

**Fields Description:**
- `id`: Auto-incrementing identifier
- `skillId`: Reference to the skill being updated
- `userId`: Reference to the user who owns the skill
- `previousLevel`: Previous skill level
- `newLevel`: New skill level
- `date`: Date of the change
- `note`: Optional note about the change

### Profile Histories Table

The `profile_histories` table tracks changes to user profiles.

```typescript
export const profileHistories = pgTable("profile_histories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  field: text("field").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value").notNull(),
  date: timestamp("date").defaultNow(),
});
```

**Key Constraints:**
- Primary Key: `id`
- Foreign Key: `userId` references `users.id`

**Fields Description:**
- `id`: Auto-incrementing identifier
- `userId`: Reference to the user whose profile changed
- `field`: Name of the profile field that changed
- `previousValue`: Previous field value
- `newValue`: New field value
- `date`: Date of the change

### Notifications Table

The `notifications` table stores system notifications for users.

```typescript
export const notificationTypeEnum = pgEnum("notification_type", ["endorsement", "level_up", "achievement"]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  relatedSkillId: integer("related_skill_id").references(() => skills.id, { onDelete: "set null" }),
  relatedUserId: integer("related_user_id").references(() => users.id, { onDelete: "set null" }),
});
```

**Key Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `userId` references `users.id`
  - `relatedSkillId` references `skills.id`
  - `relatedUserId` references `users.id`

**Fields Description:**
- `id`: Auto-incrementing identifier
- `userId`: Reference to the notification recipient
- `type`: Notification type (endorsement, level_up, achievement)
- `message`: Notification message content
- `isRead`: Flag indicating if notification has been read
- `createdAt`: Notification creation timestamp
- `relatedSkillId`: Optional reference to a skill related to the notification
- `relatedUserId`: Optional reference to a user related to the notification

### Endorsements Table

The `endorsements` table stores skill endorsements between users.

```typescript
export const endorsements = pgTable("endorsements", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  endorserId: integer("endorser_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Key Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `skillId` references `skills.id`
  - `endorserId` references `users.id`

**Fields Description:**
- `id`: Auto-incrementing identifier
- `skillId`: Reference to the endorsed skill
- `endorserId`: Reference to the user who made the endorsement
- `comment`: Optional endorsement comment
- `createdAt`: Endorsement creation timestamp

### Skill Templates Table

The `skill_templates` table stores predefined skill templates for organizations.

```typescript
export const skillTemplates = pgTable("skill_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  isRecommended: boolean("is_recommended").default(false),
  targetLevel: skillLevelEnum("target_level"),
  targetDate: timestamp("target_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Key Constraints:**
- Primary Key: `id`

**Fields Description:**
- `id`: Auto-incrementing identifier
- `name`: Template skill name
- `category`: Skill category
- `description`: Detailed description
- `isRecommended`: Flag for organization-recommended skills
- `targetLevel`: Recommended target skill level
- `targetDate`: Suggested date for reaching target level
- `createdAt`: Template creation timestamp
- `updatedAt`: Template last update timestamp

### Skill Targets Table

The `skill_targets` table defines skill targets for individuals or groups.

```typescript
export const skillTargets = pgTable("skill_targets", {
  id: serial("id").primaryKey(),
  name: text("name"),
  description: text("description"),
  targetLevel: skillLevelEnum("target_level").notNull(),
  targetDate: timestamp("target_date"),
  targetNumber: integer("target_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const skillTargetSkills = pgTable("skill_target_skills", {
  targetId: integer("target_id").notNull().references(() => skillTargets.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.targetId, t.skillId] }),
}));

export const skillTargetUsers = pgTable("skill_target_users", {
  targetId: integer("target_id").notNull().references(() => skillTargets.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.targetId, t.userId] }),
}));
```

**Key Constraints:**
- Primary Keys:
  - `id` for `skillTargets`
  - Composite of `targetId` and `skillId` for `skillTargetSkills`
  - Composite of `targetId` and `userId` for `skillTargetUsers`
- Foreign Keys:
  - `targetId` references `skillTargets.id`
  - `skillId` references `skills.id`
  - `userId` references `users.id`

**Fields Description:**
- `id`: Auto-incrementing identifier
- `name`: Target name
- `description`: Target description
- `targetLevel`: Required skill level
- `targetDate`: Target date for completion
- `targetNumber`: Required number of skills to meet target
- `createdAt`: Target creation timestamp
- `updatedAt`: Target last update timestamp

## TypeScript Types

The schema defines TypeScript types for all entities:

```typescript
export type User = typeof users.$inferSelect & {
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

export type SkillTemplate = typeof skillTemplates.$inferSelect;
export type InsertSkillTemplate = z.infer<typeof insertSkillTemplateSchema>;

export type SkillTarget = typeof skillTargets.$inferSelect;
export type InsertSkillTarget = z.infer<typeof insertSkillTargetSchema>;
```

## Validation Schemas

The schema also defines Zod validation schemas for data insertion:

```typescript
export const insertUserSchema = createInsertSchema(users);
export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
export const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const insertSkillSchema = createInsertSchema(skills).pick({
  userId: true,
  name: true,
  category: true,
  level: true,
  yearsOfExperience: true,
  description: true,
  certification: true,
  certificationLink: true,
  certificationDate: true,
});

// Additional validation schemas for other entities...
```

## Migration and Database Management

The platform uses Drizzle for database migrations:

1. Database schema changes are made in `shared/schema.ts`
2. Run `npm run db:push` to update the database schema

For complete database migration scripts, refer to:
- `db-push.js` - Handles schema migrations
- `scripts/regenerate-data.js` - Resets and regenerates test data
- `deployment/setup-database.sh` - Sets up the database in production

## Schema Best Practices

1. Use appropriate column types (e.g., `text()` for strings, `integer()` for numbers)
2. Define foreign key relationships with `references()`
3. Set cascading deletes where appropriate with `{ onDelete: "cascade" }`
4. Use enums for fields with a fixed set of values
5. Include timestamps for audit purposes (`createdAt`, `updatedAt`)
6. Add meaningful constraints and defaults