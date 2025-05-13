# API Method Reference

## User Management

### Get Current User
```
GET /api/user
Response: {
  id: number
  email: string
  username: string
  isAdmin: boolean
}
```

### Update User Profile
```
PATCH /api/user/profile
Body: {
  username?: string
  email?: string
  role?: string
}
```

## Skills Management

### Get User Skills
```
GET /api/skills
Response: Skill[]
```

### Create Skill
```
POST /api/skills
Body: {
  name: string
  category: string
  level: string
  certification?: string
}
```

### Update Skill
```
PATCH /api/skills/:id
Body: {
  level?: string
  certification?: string
  notes?: string
}
```

## Project Management

### Get Projects
```
GET /api/projects
Response: Project[]
```

### Create Project
```
POST /api/projects
Body: {
  name: string
  clientId: number
  description?: string
  startDate?: string
  endDate?: string
}
```

## Administrative Functions

### Get All Users
```
GET /api/admin/users
Authorization: Admin only
Response: User[]
```

### Manage Skill Templates
```
POST /api/admin/skill-templates
Authorization: Admin only
Body: {
  name: string
  category: string
  isRecommended?: boolean
}
```

## Authentication

### Login
```
POST /api/auth
Body: {
  email: string
  password: string
}
```

### Register
```
POST /api/register
Body: {
  email: string
  password: string
}
```

## Response Formats

### Success Response
```json
{
  "data": [Object|Array],
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Optional error details"
}