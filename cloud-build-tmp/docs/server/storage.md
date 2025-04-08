# Storage Module Documentation

The `server/storage.ts` file implements the data storage interface, providing CRUD operations for all entities in the application.

## Interface Overview

The `IStorage` interface defines all operations that can be performed on the database:

```typescript
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
```

## PostgresStorage Implementation

The `PostgresStorage` class implements the `IStorage` interface using PostgreSQL with Drizzle ORM:

```typescript
export class PostgresStorage implements IStorage {
  sessionStore: Store;
  
  constructor() {
    // Initialize session store and other setup
  }
  
  // ... method implementations
}
```

## Method Documentation

### User Operations

#### getUser(id: number): Promise<User | undefined>
Retrieves a user by their ID.

**Parameters:**
- `id`: The user's ID

**Returns:**
- A Promise resolving to a User object or undefined if not found

**Example:**
```typescript
const user = await storage.getUser(1);
if (user) {
  console.log(`Found user: ${user.username}`);
}
```

#### getUserByUsername(username: string): Promise<User | undefined>
Retrieves a user by their username.

**Parameters:**
- `username`: The user's username

**Returns:**
- A Promise resolving to a User object or undefined if not found

**Example:**
```typescript
const user = await storage.getUserByUsername('johndoe');
```

#### getUserByEmail(email: string): Promise<User | undefined>
Retrieves a user by their email address.

**Parameters:**
- `email`: The user's email address

**Returns:**
- A Promise resolving to a User object or undefined if not found

**Example:**
```typescript
const user = await storage.getUserByEmail('john@example.com');
```

#### createUser(user: InsertUser): Promise<User>
Creates a new user.

**Parameters:**
- `user`: An object containing user properties conforming to the InsertUser type

**Returns:**
- A Promise resolving to the created User object

**Example:**
```typescript
const newUser = await storage.createUser({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'hashedPassword',
  firstName: 'John',
  lastName: 'Doe',
  role: 'Developer',
  isAdmin: false
});
```

#### updateUser(id: number, data: Partial<User>): Promise<User>
Updates an existing user.

**Parameters:**
- `id`: The user's ID
- `data`: An object containing the properties to update

**Returns:**
- A Promise resolving to the updated User object

**Example:**
```typescript
const updatedUser = await storage.updateUser(1, {
  firstName: 'John',
  lastName: 'Smith'
});
```

#### updateUserPassword(id: number, hashedPassword: string): Promise<void>
Updates a user's password.

**Parameters:**
- `id`: The user's ID
- `hashedPassword`: The new hashed password

**Returns:**
- A Promise resolving when the password is updated

**Example:**
```typescript
await storage.updateUserPassword(1, 'newHashedPassword');
```

#### getAllUsers(): Promise<User[]>
Retrieves all users.

**Returns:**
- A Promise resolving to an array of User objects

**Example:**
```typescript
const users = await storage.getAllUsers();
console.log(`Found ${users.length} users`);
```

### Skill Operations

#### getUserSkills(userId: number): Promise<Skill[]>
Retrieves all skills for a specific user.

**Parameters:**
- `userId`: The user's ID

**Returns:**
- A Promise resolving to an array of Skill objects

**Example:**
```typescript
const skills = await storage.getUserSkills(1);
console.log(`User has ${skills.length} skills`);
```

#### getSkill(id: number): Promise<Skill | undefined>
Retrieves a skill by its ID.

**Parameters:**
- `id`: The skill's ID

**Returns:**
- A Promise resolving to a Skill object or undefined if not found

**Example:**
```typescript
const skill = await storage.getSkill(1);
if (skill) {
  console.log(`Found skill: ${skill.name}`);
}
```

#### createSkill(skill: InsertSkill): Promise<Skill>
Creates a new skill.

**Parameters:**
- `skill`: An object containing skill properties conforming to the InsertSkill type

**Returns:**
- A Promise resolving to the created Skill object

**Example:**
```typescript
const newSkill = await storage.createSkill({
  userId: 1,
  name: 'JavaScript',
  category: 'Programming',
  level: 'intermediate',
  description: 'Modern JavaScript programming'
});
```

#### updateSkill(id: number, data: Partial<Skill>): Promise<Skill>
Updates an existing skill.

**Parameters:**
- `id`: The skill's ID
- `data`: An object containing the properties to update

**Returns:**
- A Promise resolving to the updated Skill object

**Example:**
```typescript
const updatedSkill = await storage.updateSkill(1, {
  level: 'expert',
  description: 'Advanced JavaScript programming'
});
```

#### deleteSkill(id: number): Promise<void>
Deletes a skill.

**Parameters:**
- `id`: The skill's ID

**Returns:**
- A Promise resolving when the skill is deleted

**Example:**
```typescript
await storage.deleteSkill(1);
```

#### getAllSkills(): Promise<Skill[]>
Retrieves all skills.

**Returns:**
- A Promise resolving to an array of Skill objects

**Example:**
```typescript
const skills = await storage.getAllSkills();
console.log(`Found ${skills.length} skills total`);
```

#### searchSkills(query: string): Promise<Skill[]>
Searches for skills by name or category.

**Parameters:**
- `query`: The search query string

**Returns:**
- A Promise resolving to an array of matching Skill objects

**Example:**
```typescript
const javascriptSkills = await storage.searchSkills('JavaScript');
```

### Skill History Operations

#### getSkillHistory(skillId: number): Promise<SkillHistory[]>
Retrieves the history for a specific skill.

**Parameters:**
- `skillId`: The skill's ID

**Returns:**
- A Promise resolving to an array of SkillHistory objects

**Example:**
```typescript
const history = await storage.getSkillHistory(1);
```

#### getUserSkillHistory(userId: number): Promise<SkillHistory[]>
Retrieves all skill history for a specific user.

**Parameters:**
- `userId`: The user's ID

**Returns:**
- A Promise resolving to an array of SkillHistory objects

**Example:**
```typescript
const history = await storage.getUserSkillHistory(1);
```

#### getAllSkillHistories(): Promise<SkillHistory[]>
Retrieves all skill histories.

**Returns:**
- A Promise resolving to an array of SkillHistory objects

**Example:**
```typescript
const histories = await storage.getAllSkillHistories();
```

#### createSkillHistory(history: InsertSkillHistory): Promise<SkillHistory>
Creates a new skill history entry.

**Parameters:**
- `history`: An object containing history properties conforming to the InsertSkillHistory type

**Returns:**
- A Promise resolving to the created SkillHistory object

**Example:**
```typescript
const newHistory = await storage.createSkillHistory({
  skillId: 1,
  userId: 1,
  previousLevel: 'beginner',
  newLevel: 'intermediate',
  date: new Date(),
  note: 'Completed advanced training course'
});
```

### Additional Operations

The documentation includes many more methods for operations related to:

- Profile history management
- Endorsement operations
- Notification operations
- Skill template operations
- Skill target operations

Each method follows a similar pattern of accepting parameters and returning Promise-based results.

## Utility Methods

### snakeToCamel(obj: any): any
A utility method to convert snake_case database column names to camelCase for JavaScript.

**Parameters:**
- `obj`: The object with snake_case properties

**Returns:**
- An object with camelCase properties

**Example:**
```typescript
const result = storage.snakeToCamel({
  user_id: 1,
  first_name: 'John'
});
// Result: { userId: 1, firstName: 'John' }
```

## Session Store

The PostgresStorage class also initializes and manages a session store for Express.js session management:

```typescript
this.sessionStore = new PgStore({
  pool,
  tableName: 'sessions'
});
```

## Storage Instantiation

The module exports a singleton instance of PostgresStorage:

```typescript
export const storage = new PostgresStorage();
```

This ensures all parts of the application use the same storage instance.