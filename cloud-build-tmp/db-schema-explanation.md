# Employee Skills Management Platform - Database Schema Documentation

This document provides detailed information about the database schema for the Employee Skills Management Platform.

## Overview

The database uses PostgreSQL and is designed to efficiently track user skills, skill histories, endorsements, targets, and more. The schema features relational tables with appropriate constraints and relationships.

## Table Definitions

### `users` Table

Stores all user account information.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for each user |
| username | VARCHAR(255) | | User's username (optional) |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| is_admin | BOOLEAN | DEFAULT FALSE | Admin privilege flag |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| first_name | VARCHAR(255) | | User's first name |
| last_name | VARCHAR(255) | | User's last name |
| project | VARCHAR(255) | | Current project assignment |
| role | VARCHAR(255) | | Job role or title |
| location | VARCHAR(255) | | Work location |

### `skills` Table

Records skills associated with users.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for each skill |
| user_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | User who owns this skill |
| name | VARCHAR(255) | NOT NULL | Skill name |
| category | VARCHAR(255) | | Skill category (e.g., Programming, Database) |
| level | skill_level | NOT NULL | Proficiency level (beginner, intermediate, expert) |
| certification | VARCHAR(255) | | Certification details if certified |
| credly_link | VARCHAR(255) | | Link to Credly badge if available |
| notes | TEXT | | Additional notes about skill |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Skill creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| last_updated | TIMESTAMP | | When the skill was last modified |

### `skill_histories` Table

Tracks changes to skills over time.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for each history entry |
| skill_id | INTEGER | REFERENCES skills(id) ON DELETE CASCADE | Skill being modified |
| user_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | User who owns the skill |
| previous_level | skill_level | | Previous proficiency level |
| new_level | skill_level | NOT NULL | New proficiency level |
| change_note | TEXT | | Note explaining the change |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When this history entry was created |

### `profile_histories` Table

Tracks changes to user profiles.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for each history entry |
| user_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | User whose profile was changed |
| field_name | VARCHAR(255) | NOT NULL | Name of the field that changed |
| previous_value | TEXT | | Previous field value |
| new_value | TEXT | NOT NULL | New field value |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When this history entry was created |

### `notifications` Table

Stores user notifications.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for each notification |
| user_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | User receiving the notification |
| type | notification_type | NOT NULL | Type of notification (endorsement, level_up, achievement) |
| message | TEXT | NOT NULL | Notification message content |
| related_id | INTEGER | | ID of the related entity (skill, endorsement, etc.) |
| read | BOOLEAN | DEFAULT FALSE | Whether the notification has been read |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the notification was created |

### `endorsements` Table

Records skill endorsements between users.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for each endorsement |
| skill_id | INTEGER | REFERENCES skills(id) ON DELETE CASCADE | Skill being endorsed |
| endorser_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | User providing the endorsement |
| note | TEXT | | Endorsement note |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the endorsement was created |

### `skill_templates` Table

Defines recommended skill templates.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for each template |
| name | VARCHAR(255) | NOT NULL | Template name |
| category | VARCHAR(255) | | Skill category |
| description | TEXT | | Template description |
| is_recommended | BOOLEAN | DEFAULT FALSE | Whether this template is recommended |
| target_level | skill_level | | Recommended proficiency level |
| target_date | DATE | | Target date for acquisition |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the template was created |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the template was last updated |

### `skill_targets` Table

Defines organizational skill targets.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for each target |
| name | VARCHAR(255) | | Target name |
| description | TEXT | | Target description |
| target_level | skill_level | NOT NULL | Required proficiency level |
| target_date | DATE | | Target date for achievement |
| target_number | INTEGER | | Number of skills required |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the target was created |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the target was last updated |

### `skill_target_skills` Table

Links skills to targets (many-to-many relationship).

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|------------|-------------|
| target_id | INTEGER | REFERENCES skill_targets(id) ON DELETE CASCADE | Target ID |
| skill_id | INTEGER | NOT NULL | Skill ID |
| | | PRIMARY KEY (target_id, skill_id) | Composite primary key |

### `skill_target_users` Table

Assigns targets to users (many-to-many relationship).

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|------------|-------------|
| target_id | INTEGER | REFERENCES skill_targets(id) ON DELETE CASCADE | Target ID |
| user_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | User ID |
| | | PRIMARY KEY (target_id, user_id) | Composite primary key |

## Enumerated Types

The schema defines two ENUM types:

### `skill_level` ENUM
```sql
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'expert');
```

### `notification_type` ENUM
```sql
CREATE TYPE notification_type AS ENUM ('endorsement', 'level_up', 'achievement');
```

## Entity Relationships

### One-to-Many Relationships
- A user has many skills
- A user has many profile history entries
- A user has many notifications
- A user can provide many endorsements
- A skill has many skill history entries
- A skill can have many endorsements

### Many-to-Many Relationships
- Skill targets can include multiple skills (via skill_target_skills)
- Skill targets can be assigned to multiple users (via skill_target_users)

## Cascade Behavior

Foreign key constraints are defined with CASCADE delete behavior, which means:
- When a user is deleted, all their skills, histories, notifications, and endorsements are also deleted
- When a skill is deleted, all its histories and endorsements are also deleted
- When a skill target is deleted, all its skill and user associations are also deleted

## Indices and Performance

The schema includes indices on frequently queried fields to optimize performance:
- Primary key indices on all tables
- Foreign key indices for join operations
- Indices on common search fields (email, skill name, categories)

## Data Migration and Schema Evolution

The database schema is designed to be extensible. When making changes:

1. New columns should be added with DEFAULT values when possible
2. Consider using nullable columns for backward compatibility
3. Use database migrations (via Drizzle Kit) to manage schema changes
4. Test migrations thoroughly on a clone of production data before applying to production

## Example Queries

### Get a user's skills with their levels
```sql
SELECT s.name, s.category, s.level 
FROM skills s 
WHERE s.user_id = :userId
ORDER BY s.category, s.name;
```

### Get skill history for a specific skill
```sql
SELECT sh.previous_level, sh.new_level, sh.change_note, sh.created_at 
FROM skill_histories sh 
WHERE sh.skill_id = :skillId
ORDER BY sh.created_at DESC;
```

### Get users with a specific skill at expert level
```sql
SELECT u.username, u.email, u.role 
FROM users u
JOIN skills s ON u.id = s.user_id
WHERE s.name = :skillName AND s.level = 'expert';
```

### Get skill gap analysis for a target
```sql
SELECT 
  t.name AS target_name,
  t.target_level,
  COUNT(DISTINCT s.id) AS skills_meeting_target,
  (SELECT COUNT(*) FROM skill_target_skills WHERE target_id = t.id) AS total_required_skills
FROM skill_targets t
LEFT JOIN skill_target_skills sts ON t.id = sts.target_id
LEFT JOIN skills s ON sts.skill_id = s.id AND s.level >= t.target_level
WHERE t.id = :targetId
GROUP BY t.id, t.name, t.target_level;
```