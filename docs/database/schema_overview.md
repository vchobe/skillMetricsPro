# Database Schema Overview

The Skills Management Platform uses a PostgreSQL database with the following schema:

## Entity Relationship Diagram

```
+---------------+     +----------------+     +-----------------+
|     users     |     |     skills     |     |   endorsements  |
+---------------+     +----------------+     +-----------------+
| id            |1---*| id             |1---*| id              |
| username      |     | userId         |     | skillId         |
| email         |     | name           |     | endorserId      |
| password      |     | category       |     | comment         |
| firstName     |     | level          |     | createdAt       |
| lastName      |     | description    |     +-----------------+
| role          |     | certification  |
| isAdmin       |     | createdAt      |
| project       |     | updatedAt      |
| location      |     +----------------+
| createdAt     |            |
| updatedAt     |            |1
+---------------+            |
       |                     |
       |1                    |
       |               +-----*-------+     +-----------------+
       |               | skillHistory|     | notifications   |
       |               +-------------+     +-----------------+
       |               | id          |     | id              |
       |               | skillId     |     | userId          |
       |               | userId      |     | type            |
       |               | previousLevel|    | message         |
       |               | newLevel    |     | read            |
       |               | date        |     | createdAt       |
       |               | note        |     | relatedId       |
       |               +-------------+     +-----------------+
       |                                          |*
       |1                                         |
+------*--------+                                 |1
| profileHistory|                         +-------*------+
+---------------+                         | skillTargets |
| id            |                         +--------------+
| userId        |                         | id           |
| field         |                         | name         |
| previousValue |                         | description  |
| newValue      |                         | targetLevel  |
| date          |                         | targetDate   |
| note          |                         | createdAt    |
+---------------+                         | updatedAt    |
                                          +--------------+
                                                 |
                                                 |1
                                                 |
                                          +------*-------+
                                          | skillTargetUsers |
                                          +----------------+
                                          | targetId       |
                                          | userId         |
                                          +----------------+
                                              
                                          +----------------+
                                          | skillTargetSkills |
                                          +----------------+
                                          | targetId       |
                                          | skillId        |
                                          +----------------+

+---------------+     
| skillTemplates|     
+---------------+     
| id            |     
| name          |     
| category      |     
| description   |     
| isRecommended |     
| createdAt     |     
| updatedAt     |     
+---------------+     
```

## Tables and Columns

### users

This table stores user information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `serial` | Primary key |
| `username` | `text` | Unique username |
| `email` | `text` | Unique email address |
| `password` | `text` | Hashed password |
| `firstName` | `text` | User's first name |
| `lastName` | `text` | User's last name |
| `role` | `text` | User's job role |
| `isAdmin` | `boolean` | Whether the user is an admin |
| `project` | `text` | User's current project |
| `location` | `text` | User's location |
| `createdAt` | `timestamp` | When the user was created |
| `updatedAt` | `timestamp` | When the user was last updated |

### skills

This table stores skills associated with users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `serial` | Primary key |
| `userId` | `integer` | Foreign key to users.id |
| `name` | `text` | Skill name |
| `category` | `text` | Skill category |
| `level` | `enum` | Skill level (beginner, intermediate, expert) |
| `description` | `text` | Skill description |
| `certification` | `text` | Certification URL or ID |
| `certificationDate` | `date` | When certification was obtained |
| `certificationName` | `text` | Name of certification |
| `createdAt` | `timestamp` | When the skill was created |
| `updatedAt` | `timestamp` | When the skill was last updated |

### skillHistories

This table tracks changes to skills over time.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `serial` | Primary key |
| `skillId` | `integer` | Foreign key to skills.id |
| `userId` | `integer` | Foreign key to users.id |
| `previousLevel` | `enum` | Previous skill level |
| `newLevel` | `enum` | New skill level |
| `date` | `timestamp` | When the change occurred |
| `note` | `text` | Note about the change |

### profileHistories

This table tracks changes to user profiles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `serial` | Primary key |
| `userId` | `integer` | Foreign key to users.id |
| `field` | `text` | Profile field that changed |
| `previousValue` | `text` | Previous value |
| `newValue` | `text` | New value |
| `date` | `timestamp` | When the change occurred |
| `note` | `text` | Note about the change |

### endorsements

This table stores skill endorsements between users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `serial` | Primary key |
| `skillId` | `integer` | Foreign key to skills.id |
| `endorserId` | `integer` | Foreign key to users.id (who gave the endorsement) |
| `comment` | `text` | Endorsement comment |
| `createdAt` | `timestamp` | When the endorsement was created |

### notifications

This table stores user notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `serial` | Primary key |
| `userId` | `integer` | Foreign key to users.id |
| `type` | `enum` | Notification type (endorsement, level_up, achievement) |
| `message` | `text` | Notification message |
| `read` | `boolean` | Whether the notification has been read |
| `createdAt` | `timestamp` | When the notification was created |
| `relatedId` | `integer` | Related entity ID (skill, endorsement, etc.) |

### skillTemplates

This table stores predefined skill templates that users can adopt.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `serial` | Primary key |
| `name` | `text` | Template name |
| `category` | `text` | Skill category |
| `description` | `text` | Template description |
| `isRecommended` | `boolean` | Whether this is a recommended template |
| `createdAt` | `timestamp` | When the template was created |
| `updatedAt` | `timestamp` | When the template was last updated |

### skillTargets

This table stores skill targets for the organization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `serial` | Primary key |
| `name` | `text` | Target name |
| `description` | `text` | Target description |
| `targetLevel` | `enum` | Target skill level |
| `targetDate` | `date` | Target completion date |
| `createdAt` | `timestamp` | When the target was created |
| `updatedAt` | `timestamp` | When the target was last updated |

### skillTargetSkills

This table maps skills to skill targets (many-to-many).

| Column | Type | Description |
|--------|------|-------------|
| `targetId` | `integer` | Foreign key to skillTargets.id |
| `skillId` | `integer` | Foreign key to skills.id |

### skillTargetUsers

This table maps users to skill targets (many-to-many).

| Column | Type | Description |
|--------|------|-------------|
| `targetId` | `integer` | Foreign key to skillTargets.id |
| `userId` | `integer` | Foreign key to users.id |

## Enums

The database uses the following enum types:

### skill_level
- `beginner`
- `intermediate`
- `expert`

### notification_type
- `endorsement`
- `level_up`
- `achievement`

## Indexes

Important indexes for performance optimization:

- `users_email_idx`: Index on `users.email`
- `users_username_idx`: Index on `users.username`
- `skills_userId_idx`: Index on `skills.userId`
- `skills_category_idx`: Index on `skills.category`
- `endorsements_skillId_idx`: Index on `endorsements.skillId`
- `notifications_userId_idx`: Index on `notifications.userId`
- `skillTargetSkills_targetId_idx`: Index on `skillTargetSkills.targetId`
- `skillTargetUsers_targetId_idx`: Index on `skillTargetUsers.targetId`

## Constraints

Key constraints in the database:

- `users_email_unique`: Unique constraint on `users.email`
- `users_username_unique`: Unique constraint on `users.username`
- `skills_userId_name_unique`: Unique constraint on `skills.userId` and `skills.name`
- `endorsements_skillId_endorserId_unique`: Unique constraint preventing duplicate endorsements