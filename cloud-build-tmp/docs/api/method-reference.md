# API Method Reference

This document provides a detailed reference of the backend API methods used in the Skills Management Platform. It's intended for developers who need to understand the server-side implementation.

## Storage Methods

### User Methods

#### `getUser(id: number): Promise<User | undefined>`

Retrieves a user by their ID.

**Implementation:**
```typescript
async getUser(id: number): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id));

  if (result.length === 0) {
    return undefined;
  }

  const user = this.snakeToCamel(result[0]);
  
  // Ensure isAdmin is available under both camelCase and snake_case
  const adminStatus = await this.checkIsUserAdmin(user.email);
  user.isAdmin = adminStatus;
  user.is_admin = adminStatus;
  
  return user;
}
```

**Usage:**
```typescript
const user = await storage.getUser(1);
if (user) {
  console.log(`Found user: ${user.username}`);
}
```

#### `getUserByEmail(email: string): Promise<User | undefined>`

Retrieves a user by their email address.

**Implementation:**
```typescript
async getUserByEmail(email: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (result.length === 0) {
    return undefined;
  }

  const user = this.snakeToCamel(result[0]);
  
  // Ensure isAdmin is available under both camelCase and snake_case
  const adminStatus = await this.checkIsUserAdmin(email);
  user.isAdmin = adminStatus;
  user.is_admin = adminStatus;
  
  return user;
}
```

**Usage:**
```typescript
const user = await storage.getUserByEmail('user@example.com');
```

#### `createUser(user: InsertUser): Promise<User>`

Creates a new user in the database.

**Implementation:**
```typescript
async createUser(insertUser: InsertUser & { username?: string, password?: string, firstName?: string, lastName?: string, project?: string, role?: string, location?: string }): Promise<User> {
  // Hash password if provided
  let hashedPassword = insertUser.password;
  if (hashedPassword) {
    hashedPassword = await bcrypt.hash(hashedPassword, 10);
  }

  const valuesToInsert = {
    username: insertUser.username,
    email: insertUser.email,
    password: hashedPassword,
    is_admin: insertUser.isAdmin || false,
    first_name: insertUser.firstName,
    last_name: insertUser.lastName,
    project: insertUser.project,
    role: insertUser.role,
    location: insertUser.location,
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await db
    .insert(users)
    .values(valuesToInsert)
    .returning();

  if (result.length === 0) {
    throw new Error('Failed to create user');
  }

  // Ensure isAdmin is available under both camelCase and snake_case
  const user = this.snakeToCamel(result[0]);
  user.isAdmin = user.is_admin;
  
  return user;
}
```

**Usage:**
```typescript
const newUser = await storage.createUser({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'securepassword',
  firstName: 'John',
  lastName: 'Doe',
  role: 'Developer',
  isAdmin: false
});
```

#### `updateUser(id: number, data: Partial<User>): Promise<User>`

Updates an existing user's information.

**Implementation:**
```typescript
async updateUser(id: number, data: Partial<User>): Promise<User> {
  // Convert camelCase properties to snake_case for database
  const updateData: any = {};
  if (data.firstName !== undefined) updateData.first_name = data.firstName;
  if (data.lastName !== undefined) updateData.last_name = data.lastName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.username !== undefined) updateData.username = data.username;
  if (data.isAdmin !== undefined) updateData.is_admin = data.isAdmin;
  if (data.project !== undefined) updateData.project = data.project;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.location !== undefined) updateData.location = data.location;
  updateData.updated_at = new Date();

  // Create profile history entries for changed fields
  const user = await this.getUser(id);
  if (user) {
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'updated_at' && user[key] !== value) {
        await this.createProfileHistory({
          userId: id,
          field: key,
          previousValue: user[key]?.toString() || null,
          newValue: value?.toString() || '',
          date: new Date()
        });
      }
    }
  }

  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  if (result.length === 0) {
    throw new Error('User not found');
  }

  // Ensure isAdmin is available under both camelCase and snake_case
  const updatedUser = this.snakeToCamel(result[0]);
  updatedUser.isAdmin = updatedUser.is_admin;
  
  return updatedUser;
}
```

**Usage:**
```typescript
const updatedUser = await storage.updateUser(1, {
  firstName: 'John',
  lastName: 'Smith',
  role: 'Senior Developer'
});
```

### Skill Methods

#### `getSkill(id: number): Promise<Skill | undefined>`

Retrieves a skill by its ID.

**Implementation:**
```typescript
async getSkill(id: number): Promise<Skill | undefined> {
  const result = await db
    .select()
    .from(skills)
    .where(eq(skills.id, id));

  if (result.length === 0) {
    return undefined;
  }

  return this.snakeToCamel(result[0]);
}
```

**Usage:**
```typescript
const skill = await storage.getSkill(1);
if (skill) {
  console.log(`Found skill: ${skill.name}`);
}
```

#### `getUserSkills(userId: number): Promise<Skill[]>`

Retrieves all skills for a specific user.

**Implementation:**
```typescript
async getUserSkills(userId: number): Promise<Skill[]> {
  const result = await db
    .select()
    .from(skills)
    .where(eq(skills.userId, userId));

  return result.map(this.snakeToCamel);
}
```

**Usage:**
```typescript
const userSkills = await storage.getUserSkills(1);
console.log(`User has ${userSkills.length} skills`);
```

#### `createSkill(skill: InsertSkill): Promise<Skill>`

Creates a new skill record.

**Implementation:**
```typescript
async createSkill(skill: InsertSkill): Promise<Skill> {
  // Convert camelCase properties to snake_case for database
  const valuesToInsert = {
    user_id: skill.userId,
    name: skill.name,
    category: skill.category,
    level: skill.level,
    years_of_experience: skill.yearsOfExperience,
    description: skill.description,
    certification: skill.certification,
    certification_link: skill.certificationLink,
    certification_date: skill.certificationDate,
    created_at: new Date(),
    updated_at: new Date()
  };

  // Use a transaction to insert the skill and create a history record
  return db.transaction(async (tx) => {
    const result = await tx
      .insert(skills)
      .values(valuesToInsert)
      .returning();

    if (result.length === 0) {
      throw new Error('Failed to create skill');
    }

    const newSkill = this.snakeToCamel(result[0]);

    // Create history entry for new skill
    await tx.insert(skillHistories).values({
      skill_id: newSkill.id,
      user_id: skill.userId,
      previous_level: null,
      new_level: skill.level,
      date: new Date(),
      note: `Added new skill: ${skill.name}`
    });

    return newSkill;
  });
}
```

**Usage:**
```typescript
const newSkill = await storage.createSkill({
  userId: 1,
  name: 'JavaScript',
  category: 'Programming',
  level: 'intermediate',
  description: 'Modern JavaScript programming'
});
```

#### `updateSkill(id: number, data: Partial<Skill>): Promise<Skill>`

Updates an existing skill record.

**Implementation:**
```typescript
async updateSkill(id: number, data: Partial<Skill>): Promise<Skill> {
  // Get current skill before update
  const currentSkill = await this.getSkill(id);
  if (!currentSkill) {
    throw new Error('Skill not found');
  }

  // Convert camelCase properties to snake_case for database
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.level !== undefined) updateData.level = data.level;
  if (data.yearsOfExperience !== undefined) updateData.years_of_experience = data.yearsOfExperience;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.certification !== undefined) updateData.certification = data.certification;
  if (data.certificationLink !== undefined) updateData.certification_link = data.certificationLink;
  if (data.certificationDate !== undefined) updateData.certification_date = data.certificationDate;
  updateData.updated_at = new Date();

  // Use a transaction to update the skill and create a history record if level changed
  return db.transaction(async (tx) => {
    const result = await tx
      .update(skills)
      .set(updateData)
      .where(eq(skills.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Skill not found');
    }

    const updatedSkill = this.snakeToCamel(result[0]);

    // If level changed, create a skill history entry
    if (data.level && data.level !== currentSkill.level) {
      await tx.insert(skillHistories).values({
        skill_id: id,
        user_id: currentSkill.userId,
        previous_level: currentSkill.level,
        new_level: data.level,
        date: new Date(),
        note: data.note || `Updated skill level from ${currentSkill.level} to ${data.level}`
      });

      // If level changed to expert, create an achievement notification
      if (data.level === 'expert') {
        await tx.insert(notifications).values({
          user_id: currentSkill.userId,
          type: 'achievement',
          message: `Congratulations! You've reached expert level in ${currentSkill.name}`,
          is_read: false,
          created_at: new Date(),
          related_skill_id: id
        });
      } else if (currentSkill.level !== data.level) {
        // For other level changes, create a level_up notification
        await tx.insert(notifications).values({
          user_id: currentSkill.userId,
          type: 'level_up',
          message: `Your ${currentSkill.name} skill has been updated to ${data.level}`,
          is_read: false,
          created_at: new Date(),
          related_skill_id: id
        });
      }
    }

    return updatedSkill;
  });
}
```

**Usage:**
```typescript
const updatedSkill = await storage.updateSkill(1, {
  level: 'expert',
  yearsOfExperience: 3,
  description: 'Advanced JavaScript development',
  note: 'Updated after completing advanced certification'
});
```

### Endorsement Methods

#### `createEndorsement(endorsement: InsertEndorsement): Promise<Endorsement>`

Creates a new endorsement for a skill.

**Implementation:**
```typescript
async createEndorsement(endorsement: InsertEndorsement): Promise<Endorsement> {
  // Use a transaction to create the endorsement and notification
  return db.transaction(async (tx) => {
    // Get the skill to find the skill owner
    const skill = await tx
      .select()
      .from(skills)
      .where(eq(skills.id, endorsement.skillId));

    if (skill.length === 0) {
      throw new Error('Skill not found');
    }

    const skillOwner = skill[0].user_id;
    
    // Get the endorser's name
    const endorser = await tx
      .select()
      .from(users)
      .where(eq(users.id, endorsement.endorserId));
    
    const endorserName = endorser.length > 0 
      ? `${endorser[0].first_name || ''} ${endorser[0].last_name || ''}`.trim() || 'A colleague'
      : 'A colleague';

    // Create the endorsement
    const valuesToInsert = {
      skill_id: endorsement.skillId,
      endorser_id: endorsement.endorserId,
      comment: endorsement.comment,
      created_at: new Date()
    };

    const result = await tx
      .insert(endorsements)
      .values(valuesToInsert)
      .returning();

    if (result.length === 0) {
      throw new Error('Failed to create endorsement');
    }

    // Create a notification for the skill owner
    if (skillOwner !== endorsement.endorserId) {
      await tx.insert(notifications).values({
        user_id: skillOwner,
        type: 'endorsement',
        message: `${endorserName} has endorsed your ${skill[0].name} skill`,
        is_read: false,
        created_at: new Date(),
        related_skill_id: endorsement.skillId,
        related_user_id: endorsement.endorserId
      });
    }

    return this.snakeToCamel(result[0]);
  });
}
```

**Usage:**
```typescript
const newEndorsement = await storage.createEndorsement({
  skillId: 1,
  endorserId: 2,
  comment: 'Great work on the JavaScript project!'
});
```

### Notification Methods

#### `markNotificationAsRead(notificationId: number): Promise<void>`

Marks a specific notification as read.

**Implementation:**
```typescript
async markNotificationAsRead(notificationId: number): Promise<void> {
  await db
    .update(notifications)
    .set({ is_read: true })
    .where(eq(notifications.id, notificationId));
}
```

**Usage:**
```typescript
await storage.markNotificationAsRead(1);
```

#### `markAllNotificationsAsRead(userId: number): Promise<void>`

Marks all notifications for a user as read.

**Implementation:**
```typescript
async markAllNotificationsAsRead(userId: number): Promise<void> {
  await db
    .update(notifications)
    .set({ is_read: true })
    .where(eq(notifications.userId, userId));
}
```

**Usage:**
```typescript
await storage.markAllNotificationsAsRead(1);
```

### Skill Target Methods

#### `createSkillTarget(target: InsertSkillTarget): Promise<SkillTarget>`

Creates a new skill target.

**Implementation:**
```typescript
async createSkillTarget(target: InsertSkillTarget): Promise<SkillTarget> {
  const valuesToInsert = {
    name: target.name,
    description: target.description,
    target_level: target.targetLevel,
    target_date: target.targetDate,
    target_number: target.targetNumber,
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await db
    .insert(skillTargets)
    .values(valuesToInsert)
    .returning();

  if (result.length === 0) {
    throw new Error('Failed to create skill target');
  }

  return this.snakeToCamel(result[0]);
}
```

**Usage:**
```typescript
const newTarget = await storage.createSkillTarget({
  name: 'Web Development Skills',
  description: 'Essential skills for web developers',
  targetLevel: 'intermediate',
  targetDate: new Date('2025-12-31'),
  targetNumber: 5
});
```

## Authentication Methods

### `hashPassword(password: string): Promise<string>`

Hashes a password using bcrypt.

**Implementation:**
```typescript
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}
```

**Usage:**
```typescript
const hashedPassword = await hashPassword('userpassword');
```

### `comparePasswords(supplied: string, stored: string): Promise<boolean>`

Compares a plaintext password with a hashed password.

**Implementation:**
```typescript
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}
```

**Usage:**
```typescript
const passwordMatches = await comparePasswords('userpassword', hashedPasswordFromDb);
```

## Route Middleware Methods

### `ensureAuth(req: Request, res: Response, next: Function)`

Middleware that ensures a user is authenticated.

**Implementation:**
```typescript
const ensureAuth = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};
```

**Usage:**
```typescript
app.get('/api/skills', ensureAuth, async (req, res) => {
  // Route implementation...
});
```

### `ensureAdmin(req: Request, res: Response, next: Function)`

Middleware that ensures a user is authenticated and has admin privileges.

**Implementation:**
```typescript
const ensureAdmin = async (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user && await checkIsUserAdminDirectly(req.user.id)) {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};
```

**Usage:**
```typescript
app.get('/api/admin/users', ensureAuth, ensureAdmin, async (req, res) => {
  // Admin-only route implementation...
});
```

## Utility Methods

### `snakeToCamel(obj: any): any`

Converts snake_case object keys to camelCase.

**Implementation:**
```typescript
private snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(v => this.snakeToCamel(v));
  }

  return Object.keys(obj).reduce((result, key) => {
    // Convert key from snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Recursively convert nested objects
    result[camelKey] = this.snakeToCamel(obj[key]);
    
    return result;
  }, {});
}
```

**Usage:**
```typescript
// Used internally in storage methods
const camelCaseUser = snakeToCamel(dbUser);
```

### `checkIsUserAdmin(email: string): Promise<boolean>`

Checks if a user has admin privileges.

**Implementation:**
```typescript
private async checkIsUserAdmin(email: string): Promise<boolean> {
  try {
    const result = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.email, email));
    
    console.log(`Direct DB admin check for ${email}: raw value = ${result[0]?.isAdmin} (${typeof result[0]?.isAdmin})`);
    
    return result.length > 0 && Boolean(result[0].isAdmin);
  } catch (error) {
    console.error(`Error checking admin status for ${email}:`, error);
    return false;
  }
}
```

**Usage:**
```typescript
// Used internally in user retrieval methods
const isAdmin = await checkIsUserAdmin('user@example.com');
```

## Database Schema Methods

### `createInsertSchema(table)`

Creates a Zod validation schema for inserting records.

**Implementation:**
```typescript
// From drizzle-zod
import { createInsertSchema } from 'drizzle-zod';

// Usage in schema.ts
export const insertUserSchema = createInsertSchema(users);
```

**Usage:**
```typescript
// Validate user input against schema
const validatedInput = insertUserSchema.parse(req.body);
```

## Advanced Query Methods

### `searchSkills(query: string): Promise<Skill[]>`

Searches for skills by name or category.

**Implementation:**
```typescript
async searchSkills(query: string): Promise<Skill[]> {
  const lowerQuery = `%${query.toLowerCase()}%`;
  
  const result = await db
    .select()
    .from(skills)
    .where(
      or(
        sql`LOWER(${skills.name}) LIKE ${lowerQuery}`,
        sql`LOWER(${skills.category}) LIKE ${lowerQuery}`
      )
    );

  return result.map(this.snakeToCamel);
}
```

**Usage:**
```typescript
const javascriptSkills = await storage.searchSkills('JavaScript');
```

### `getSkillsDistribution(): Promise<SkillDistribution>`

Gets the distribution of skills by level and category.

**Implementation:**
```typescript
async getSkillsDistribution(): Promise<SkillDistribution> {
  // Get distribution by level
  const levelResult = await db
    .select({
      level: skills.level,
      count: sql<number>`count(*)`,
    })
    .from(skills)
    .groupBy(skills.level);

  // Get distribution by category
  const categoryResult = await db
    .select({
      category: skills.category,
      count: sql<number>`count(*)`,
    })
    .from(skills)
    .groupBy(skills.category);

  // Format results
  const byLevel = {};
  levelResult.forEach(row => {
    byLevel[row.level] = row.count;
  });

  const byCategory = {};
  categoryResult.forEach(row => {
    byCategory[row.category] = row.count;
  });

  return { byLevel, byCategory };
}
```

**Usage:**
```typescript
const distribution = await storage.getSkillsDistribution();
console.log('Beginner skills:', distribution.byLevel.beginner);
console.log('Programming skills:', distribution.byCategory.Programming);
```

## Transaction Examples

### `addSkillWithCertificationAndHistory`

Example of a complex transaction that creates a skill, adds certification info, and records history.

**Implementation:**
```typescript
async addSkillWithCertificationAndHistory(
  skillData: InsertSkill,
  certificationData: {
    name: string,
    link: string,
    date: Date
  },
  historyNote: string
): Promise<Skill> {
  return db.transaction(async (tx) => {
    // Add certification data to skill
    const skillToInsert = {
      ...skillData,
      certification: certificationData.name,
      certificationLink: certificationData.link,
      certificationDate: certificationData.date
    };

    // Create the skill
    const result = await tx
      .insert(skills)
      .values({
        user_id: skillToInsert.userId,
        name: skillToInsert.name,
        category: skillToInsert.category,
        level: skillToInsert.level,
        years_of_experience: skillToInsert.yearsOfExperience,
        description: skillToInsert.description,
        certification: skillToInsert.certification,
        certification_link: skillToInsert.certificationLink,
        certification_date: skillToInsert.certificationDate,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning();

    if (result.length === 0) {
      throw new Error('Failed to create skill');
    }

    const newSkill = this.snakeToCamel(result[0]);

    // Create history entry
    await tx.insert(skillHistories).values({
      skill_id: newSkill.id,
      user_id: skillToInsert.userId,
      previous_level: null,
      new_level: skillToInsert.level,
      date: new Date(),
      note: historyNote || `Added new skill: ${skillToInsert.name} with certification: ${certificationData.name}`
    });

    // Create achievement notification for certification
    await tx.insert(notifications).values({
      user_id: skillToInsert.userId,
      type: 'achievement',
      message: `Congratulations on your new certification: ${certificationData.name}`,
      is_read: false,
      created_at: new Date(),
      related_skill_id: newSkill.id
    });

    return newSkill;
  });
}
```

**Usage:**
```typescript
const newSkill = await storage.addSkillWithCertificationAndHistory(
  {
    userId: 1,
    name: 'JavaScript',
    category: 'Programming',
    level: 'expert',
    description: 'Advanced JavaScript development'
  },
  {
    name: 'JavaScript Certified Developer',
    link: 'https://example.com/cert/123',
    date: new Date('2024-01-15')
  },
  'Added with professional certification'
);
```

## Error Handling Methods

### `handleDatabaseError(error: any): Error`

Standardizes database error handling.

**Implementation:**
```typescript
private handleDatabaseError(error: any): Error {
  console.error('Database error:', error);
  
  // Handle specific database error codes
  if (error.code === '23505') {  // Unique violation
    return new Error('Record already exists with the same unique constraints');
  } else if (error.code === '23503') {  // Foreign key violation
    return new Error('Referenced record does not exist');
  } else if (error.code === '42P01') {  // Undefined table
    return new Error('Database schema error: table does not exist');
  }
  
  // Generic error handling
  return new Error(`Database operation failed: ${error.message || 'Unknown error'}`);
}
```

**Usage:**
```typescript
try {
  // Database operation
} catch (error) {
  throw handleDatabaseError(error);
}
```

## Session Management Methods

### `setupSessionStore(): Store`

Sets up the PostgreSQL session store.

**Implementation:**
```typescript
private setupSessionStore(): Store {
  const pgSession = PgStore(session);
  
  return new pgSession({
    pool,
    tableName: 'sessions',
    createTableIfMissing: true
  });
}
```

**Usage:**
```typescript
// Used in storage constructor
this.sessionStore = this.setupSessionStore();

// Used in Express setup
app.use(session({
  store: storage.sessionStore,
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));
```

## Performance Monitoring Methods

### `logQueryPerformance(query: string, startTime: number): void`

Logs query performance metrics.

**Implementation:**
```typescript
private logQueryPerformance(query: string, startTime: number): void {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (duration > 100) {  // Log slow queries (> 100ms)
    console.warn(`Slow query (${duration.toFixed(2)}ms): ${query.substring(0, 100)}...`);
  } else if (process.env.NODE_ENV === 'development') {
    console.log(`Query executed in ${duration.toFixed(2)}ms: ${query.substring(0, 50)}...`);
  }
}
```

**Usage:**
```typescript
async function executeQuery(query) {
  const startTime = performance.now();
  try {
    return await db.execute(query);
  } finally {
    logQueryPerformance(query, startTime);
  }
}
```