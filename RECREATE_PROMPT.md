# Skill Metrics — Full Application Recreation Prompt

## Overview

Build a full-stack internal workforce skills management platform called **"Skill Metrics"** for a consulting/IT services company (Atyeti Inc.). The platform allows employees to self-report and track their professional skills, earn peer endorsements, attach certifications, and participate in a company-wide skill leaderboard. Administrators manage skill categories, approve/reject skill submissions, oversee projects and clients, and generate weekly resource reports via email.

The application is restricted exclusively to users with an `@atyeti.com` email address.

---

## Tech Stack

- **Frontend**: React + TypeScript, Vite, TailwindCSS, shadcn/ui components, TanStack Query (v5), wouter for routing, react-hook-form + Zod for forms, Recharts for charts, Framer Motion for animations, lucide-react for icons
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Session-based authentication with express-session and connect-pg-simple
- **Email**: Gmail API via OAuth2 (with Mailjet fallback) for skill approval/rejection notifications

---

## Database Schema

### Users
```
id, email (unique, @atyeti.com only), is_admin (boolean), username, password (hashed), firstName, lastName, project, role, location, createdAt
```

### Skill Categories
```
id, name, description, tabOrder (integer), visibility (visible/hidden), color (hex), icon (string), categoryType (technical/functional), createdAt, updatedAt
```

### Skill Subcategories
```
id, name, description, categoryId (FK), color, icon, createdAt, updatedAt
```

### Skill Templates (master list of available skills)
```
id, name, category (legacy text), categoryId (FK), subcategoryId (FK), description, isRecommended (boolean), targetLevel, targetDate
```

### User Skills (a user's claimed skill)
```
id, userId (FK), skillTemplateId (FK), level (beginner/intermediate/expert), lastUpdated, certification, credlyLink, notes, endorsementCount, certificationDate, expirationDate
```

### Skills (legacy table for backward compatibility)
```
id, userId, name, category, categoryId, subcategoryId, level, lastUpdated, certification, credlyLink, notes, endorsementCount, certificationDate, expirationDate
```

### Pending Skill Updates (approval queue)
```
id, userId, skillTemplateId, requestedLevel, status (pending/approved/rejected), reviewerComments, createdAt, reviewedAt, reviewedBy, skillName
```

### Skill History
```
id, skillId, userId, previousLevel, newLevel, createdAt, changeNote, userSkillId, changeById, approvalId
```

### Profile History
```
id, userId, changedField, previousValue, newValue, createdAt
```

### Endorsements
```
id, skillId, endorserId, endorseeId, comment, createdAt, userSkillId, userId, level, updatedAt
```

### Notifications
```
id, userId, type (endorsement/level_up/achievement), content, isRead, relatedSkillId, relatedUserSkillId, relatedUserId, createdAt
```

### Skill Approvers
```
id, userId, categoryId, subcategoryId, skillTemplateId, canApproveAll, createdAt
```

### Skill Targets (org-wide learning goals)
```
id, name, description, targetLevel, targetDate, targetNumber, skillIds (array)
```

### Clients
```
id, name, industry, description, website, accountManagerId (FK to users), address, createdAt
```

### Projects
```
id, name, description, clientId (FK), startDate, endDate, location, confluenceLink, leadId (FK to users), deliveryLeadId (FK to users), status (active/completed/on-hold)
```

### Project Resources (user assigned to a project)
```
id, projectId (FK), userId (FK), role, allocation (percent integer), startDate, endDate
```

### Project Skills (skills required by a project)
```
id, projectId (FK), skillId/skillTemplateId (FK), requiredLevel
```

### Report Settings
```
id, name, recipientEmail, clientId, baseUrl, description, schedule (weekly/etc), createdAt
```

---

## Application Layout

The app uses a **persistent left sidebar + top header** layout on every authenticated page.

### Sidebar (dark background, `bg-gray-800`, white text)
- Collapsible on desktop (shows icon-only when collapsed, full labels when open)
- On mobile: slides in as a drawer with a dark overlay
- Header area: "Skill Metrics" title with a chevron toggle button
- Navigation links (with lucide-react icons):
  - **Dashboard** (`/`) — LayoutDashboard icon
  - **My Skills** (`/skills`) — Brain icon
  - **Skill History** (`/history`) — Clock icon
  - **My Profile** (`/profile`) — UserCircle icon
  - **Leaderboard** (`/leaderboard`) — Trophy icon
  - **Projects** (`/projects`) — Briefcase icon
  - **Clients** (`/clients`) — Building icon
  - **Skill Management** (`/skill-management`) — Box icon (visible to admins and approvers)
  - **Admin Dashboard** (`/admin`) — BarChart4 icon (visible to admins only)
- Bottom section: user avatar + name/email + logout button
- Active link is highlighted (lighter background, white text)

### Header (top bar)
- Hamburger/menu icon to toggle sidebar
- Page title (changes per page)
- Right side: notification bell with unread count badge + user avatar

---

## Pages & Features

---

### 1. Authentication Page (`/auth`)

**Login form:**
- Email field + Password field
- "Sign In" submit button (shows spinner while loading)
- Toggle to switch to Register tab

**Register form:**
- Email field only (password is auto-generated by the server and emailed)
- Validates email ends with `@atyeti.com`
- On success, shows confirmation that credentials were sent

Both forms use shadcn Card layout. Error messages displayed via toast notifications.

---

### 2. Home / Dashboard (`/`)

**Summary stats row (4 cards):**
- Total Skills count
- Expert-level skills count
- Certifications count
- Endorsements received count

**Tabs:**
- **My Skills tab**: Displays a skill distribution pie/donut chart (by category) and a list of the user's most recent skills as cards with level badges
- **Activity tab**: Two sub-tabs:
  - *My Activity*: chronological feed of the user's own skill changes (added skill, leveled up, etc.)
  - *Org Activity*: same feed but company-wide
- **Skill Targets tab**: Shows org-wide learning goals with progress bars per target. Each target shows: name, target level, target date, number of matching skills acquired vs. total needed, and a completion percentage bar

**Quick action buttons**: "Add Skills" button linking to `/skills`

---

### 3. My Skills / Add Skills Page (`/skills`)

This is the primary page for users to declare and manage their skills.

**Layout**: Tabs across the top for skill category types. Three main tabs:
- **Technical**
- **Functional**
- **Other**

Within each tab, a secondary horizontal tab bar shows subcategories (e.g., Programming Languages, Cloud Platforms, Databases, DevOps, Testing, Messaging & Streaming, BigData, Log Aggregation & Search, etc.). These subcategories are loaded dynamically from the database.

**Within each subcategory tab:**
- A searchable table of all skill templates in that category
- Each row has:
  - Checkbox to select the skill
  - Skill name
  - Description (if any)
  - Level selector (Beginner / Intermediate / Expert dropdown)
  - Certification name field (text input)
  - Certification link field (URL input, links to Credly or similar)
  - Notes field (textarea)
  - Certification Date picker
  - Expiration Date picker

**Already-acquired skills:**
- Displayed separately at the top of the tab as cards showing current level badge, cert info, and an "Update Level" button
- Updating triggers a pending approval request

**Pending skills:** 
- Skills awaiting approval shown with a "Pending" badge in amber/yellow
- Cannot be updated while pending

**Submit button:**
- Submits all checked skills for review (creates `PendingSkillUpdate` records)
- Shows toast on success

**Existing user skills section:**
- Below the add-skills table, shows a full list of the user's currently approved skills in a card/table layout
- Each skill shows: name, category badge (colored per category), level badge (blue=beginner, purple=intermediate, orange=expert), certification link if present, notes, last updated date
- Delete button per skill (with confirmation dialog)
- Endorsement count badge

---

### 4. Skill History Page (`/history`)

Two tabs:
- **My History**: Table of all the user's skill changes with columns: Skill Name, Category, Previous Level, New Level, Date, Change Note
- **Org History**: Same but across the entire company. Has a search bar to filter by name.

Each row shows level transition with colored badges (e.g., "beginner → intermediate").

---

### 5. Profile Page (`/profile`)

Two tabs:

**Profile tab:**
- Avatar (initials-based fallback, circular)
- Read-only: email, member since date
- Editable fields: First Name, Last Name, Project (current), Role, Location
- "Save Changes" button

**Security tab:**
- Change Password form with three fields: Current Password, New Password, Confirm New Password
- Password validation rules: min 8 chars, uppercase, lowercase, number, special character

**Profile History** section at the bottom:
- Table showing all profile field changes with: Field Changed, Previous Value, New Value, Date

---

### 6. User Profile Page (`/users/:id`)

Public view of another user's profile (visible to all logged-in users).

- Avatar + name + role + location + email
- Skills displayed as grouped category cards
- Each skill card: name, level badge, certification badge (if certified), endorsement count
- Endorsement button (if viewing someone else's profile): opens endorsement form dialog

**Endorsement form:**
- Skill selector (dropdown of user's skills)
- Skill level field
- Comment textarea
- Submit button

---

### 7. Users Page (`/users`)

Employee directory.

- Search bar (searches name, email, role)
- Table with columns: Name (linked to profile), Email, Role, Location, Skills Count, Admin badge
- Click a row → opens a UserProfileDialog (modal overlay) showing the full profile summary
- Pagination if many users

---

### 8. Leaderboard Page (`/leaderboard`)

**Tabs:**
- **Overall** — ranked by a composite score (expert skills × 3 + intermediate × 1 + certifications × 2)
- **Expertise** — ranked by number of expert-level skills
- **Certifications** — ranked by number of certifications
- **Category Leaders** — for each skill category, shows the top 3 users with the most expert skills

**Table columns (Overall/Expertise/Certifications tabs):**
- Rank (with gold/silver/bronze trophy icons for top 3)
- User avatar + name + role
- Total Skills
- Expert count
- Intermediate count
- Beginner count
- Certifications count

**Filtering:**
- Search bar (filter by name)
- Category filter dropdown (filter by skill category)

Clicking a user opens the UserProfileDialog modal.

---

### 9. Projects Page (`/projects`)

**Header:** "Projects" title + "Add Project" button (admin only)

**Search bar** to filter projects by name, client, or status.

**Projects table:**
- Name (linked to detail page)
- Client
- Status badge (active=green, completed=gray, on-hold=amber)
- Start Date / End Date
- Lead (linked to user profile)
- Delivery Lead (linked to user profile)
- Resource count
- Actions: View button; Delete button (red outline, admin only) with confirmation AlertDialog

**Add/Edit Project Dialog** (modal form):
- Fields: Name, Description, Client (dropdown), Status, Start Date, End Date, Location, Confluence Link, Lead (user dropdown), Delivery Lead (user dropdown)

---

### 10. Project Detail Page (`/projects/:id`)

- Project header card: name, client, status badge, dates, location, Confluence link, lead, delivery lead
- **Resources tab**: Table of assigned team members with columns: Name, Role, Allocation %, Start Date, End Date, Skills. "Add Resource" button (admin/lead only)
- **Required Skills tab**: Table of skills required for the project with columns: Skill Name, Category, Required Level badge. "Add Required Skill" button (admin only)
- **Skill Gap Analysis**: Shows which required skills are covered by current resources and which are gaps (red badge for missing, green for covered)

---

### 11. Client Detail Page (`/clients/:id`)

- Client header card: name, industry, description, website link, account manager, address
- **Projects list**: All projects belonging to this client, each expandable to show resources and required skills (accordion style)
- Edit/Delete buttons (admin/super-user only)

---

### 12. Clients Page (`/clients`)

**Header:** "Clients" title + "Add Client" button (admin only; edit/delete visible only to super user = admin@atyeti.com)

**Clients table:**
- Name (linked to detail page)
- Industry
- Account Manager
- Projects count
- Actions: View, Edit, Delete (Delete only for super-user)

**Add/Edit Client Dialog:**
- Fields: Name, Industry, Description, Website URL, Account Manager (user dropdown), Address

**Delete Client:**
- Uses AlertDialog confirmation
- Only visible/accessible to the super user account (admin@atyeti.com)

---

### 13. Skill Management Page (`/skill-management`) — Admin/Approver

Three tabs:

**Templates tab:**
- Searchable table of all skill templates
- Columns: Name, Category, Subcategory, Description, Recommended badge, Actions (Edit, Delete)
- "Add Template" button → dialog form: Name, Category (dropdown), Subcategory (dropdown, filtered by category), Description, Is Recommended (toggle)
- Edit opens pre-filled form; Delete uses confirmation dialog

**Targets tab:**
- Table of org-wide skill targets
- Each target: Name, Target Level badge, Target Date, Description, Skills (multi-select pill list), Target Number
- "Add Target" button → dialog with: Name, Description, Target Level, Target Date, Target Number, Skills (multi-select from templates list)

**Approvers tab:**
- Manage which users can approve skills for which categories
- Table: User, Category, Subcategory, Can Approve All (boolean)
- Add/Remove approver functionality

---

### 14. Admin Dashboard (`/admin/:tab?`) — Admin Only

A comprehensive command center with multiple tabs:

#### Tab 1: Overview / Analytics
- **Stats row** (4 metric cards): Total Users, Total Skills, Pending Approvals, Certifications
- **Bar Chart**: Top 10 most popular skills (by user count), colored bars
- **Pie Chart**: Skill distribution by category
- **Bar Chart**: Skills by level (beginner/intermediate/expert) per category
- **Line Chart**: Skill growth over time (new skills added per month)
- **Treemap**: Skill density visualization by category
- **Export button**: Downloads skill data as CSV

#### Tab 2: Pending Approvals
- List of all pending skill update requests
- Each card shows: User name + avatar, Skill name, Category, Requested level badge, Date submitted
- **Approve button** (green, ThumbsUp icon): approves the skill, triggers email to user
- **Reject button** (red, ThumbsDown icon): opens a dialog for reviewer comments, then rejects and emails the user
- Email sent on approval/rejection uses Gmail API OAuth2, same template for both:
  - Subject: "Your skill [SkillName] has been [approved/rejected]"
  - Body includes: greeting with first name, skill name, decision, reviewer name, comments (for rejection), app link
  - Fallback to Mailjet if Gmail fails

#### Tab 3: Users Management
- Full user table: Name, Email, Role, Location, Admin badge, Actions
- **Actions per user** (AdminUserActions component):
  - Promote to Admin / Demote from Admin toggle
  - Reset Password (generates new temporary password)
  - View Profile link
- **AdminUsersManagement** component: bulk operations, search/filter users

#### Tab 4: Skill Templates
- Same interface as `/skill-management` Templates tab (embedded)

#### Tab 5: Categories Management
- Table of all skill categories
- Columns: Name, Type (Technical/Functional), Color swatch, Icon, Tab Order, Visibility toggle, Subcategories count, Actions
- "Add Category" button → form: Name, Description, Type (Technical/Functional), Color picker, Icon, Tab Order, Visibility
- Edit / Delete per category
- Subcategories management per category (nested accordion or separate section)

#### Tab 6: Project Hierarchy View
- Expandable tree: Client → Projects → Resources
- Each client is a Card with expand/collapse toggle
- Expanded client shows its projects as Accordions
- Expanded project shows two sections:
  - **Resources table**: Name (linked), Role, Allocation %, Skills (first 3 as colored badges + "+N more")
  - **Required Skills table**: Skill Name (linked), Category, Required Level badge
- All names are clickable links to their respective detail pages

#### Tab 7: Skill Hierarchy View
- Expandable tree: Category → Subcategory → Skills → Users
- Category cards expandable to show subcategories
- Subcategory expandable to show all skill templates within it
- Each skill template shows the list of users who have that skill with their level

#### Tab 8: Reports
- **Send Weekly Report Now** button: opens dialog to pick a report configuration or use default, then POSTs to trigger immediate email send
- **Report Settings Manager** (ReportSettingsManager component):
  - List of configured report settings
  - Each setting: Name, Recipient Email, Client Filter, Schedule, Custom Base URL, Description
  - Add/Edit/Delete report settings
  - Schedule options: weekly on a specific day/time

---

## Skill Level Color Coding (used throughout the app)

| Level | Color |
|---|---|
| Beginner | Blue (`rgba(59, 130, 246, ...)`) |
| Intermediate | Purple (`rgba(139, 92, 246, ...)`) |
| Expert | Orange (`rgba(234, 88, 12, ...)`) |

Skill badges are colored capsules (rounded-full) with white text. Category colors are user-defined hex values stored in the database.

---

## Permission Model

| Feature | Regular User | Approver | Admin | Super User (admin@atyeti.com) |
|---|---|---|---|---|
| View own skills | ✓ | ✓ | ✓ | ✓ |
| Add/update skills (pending) | ✓ | ✓ | ✓ | ✓ |
| Approve/reject skills | — | ✓ (own categories) | ✓ | ✓ |
| Manage skill templates | — | ✓ | ✓ | ✓ |
| Manage categories | — | — | ✓ | ✓ |
| Admin dashboard | — | — | ✓ | ✓ |
| Add/edit clients | — | — | ✓ | ✓ |
| Delete clients | — | — | — | ✓ |
| Add/edit/delete projects | — | — | ✓ | ✓ |
| User management | — | — | ✓ | ✓ |

---

## Notification System

- Bell icon in header with unread count badge
- Dropdown panel showing latest notifications
- Types: `endorsement`, `level_up`, `achievement`
- Mark as read on click
- "Mark all as read" button
- Links from notification to relevant skill or user

---

## Email Notifications (Gmail API + OAuth2)

- Triggered on skill approval and rejection
- Both use the **same template structure**:
  - Subject: `Your skill "[Skill Name]" has been [Approved/Rejected]`
  - HTML body with:
    - Greeting: "Hi [FirstName],"
    - Decision summary with skill name and status
    - Reviewer name
    - For rejections: reviewer comments section
    - CTA button: "View Your Skills" linking to the app
    - Footer with company branding
- Gmail OAuth2 flow: initial auth via `/auth/gmail` route, token stored in `gmail-token.json`
- Fallback: if Gmail API fails, retries via Mailjet API

---

## Category Management (Dynamic Tabs)

- Skill categories are loaded from the database, not hardcoded
- Categories have a `categoryType` of either `technical` or `functional`
- Technical categories appear under the "Technical" main tab on the skills page
- Functional categories appear under the "Functional" main tab
- Categories with `visibility = "hidden"` are not shown to users
- Categories are ordered by `tabOrder` field
- Each category has optional subcategories

The fixed main tabs are: **Technical**, **Functional**, **Other**. Dynamic subcategory tabs appear within each based on database records.

---

## Key UI Patterns

1. **Loading states**: Skeleton loaders or centered `<Loader2 className="animate-spin">` spinner
2. **Error states**: Destructive toast notifications (`variant: "destructive"`)
3. **Confirmation dialogs**: shadcn AlertDialog for destructive actions (delete, reject)
4. **Forms**: shadcn Form + react-hook-form + zodResolver. All forms show inline validation errors
5. **Data tables**: shadcn Table component with sortable headers where applicable
6. **Empty states**: Centered illustration + message when no data (e.g., "No skills found")
7. **Badges**: Colored pill badges for levels, categories, statuses
8. **Accordion**: Used in hierarchy views (expand/collapse)
9. **Tabs**: Used on almost every major page to organize sections
10. **Dialog/Sheet**: Used for create/edit forms (modal overlays)
11. **Tooltips**: On icon-only buttons to show action labels
12. **Responsive**: Sidebar collapses on mobile, tables scroll horizontally

---

## Routing Summary

| Path | Page | Auth Required | Admin Only |
|---|---|---|---|
| `/auth` | Login / Register | No | No |
| `/` | Home Dashboard | Yes | No |
| `/skills` | Add/Manage My Skills | Yes | No |
| `/history` | Skill History | Yes | No |
| `/profile` | My Profile | Yes | No |
| `/users` | Employee Directory | Yes | No |
| `/users/:id` | User Profile View | Yes | No |
| `/leaderboard` | Leaderboard | Yes | No |
| `/projects` | Projects List | Yes | No |
| `/projects/:id` | Project Detail | Yes | No |
| `/clients` | Clients List | Yes | No |
| `/clients/:id` | Client Detail | Yes | No |
| `/skill-management` | Skill Templates & Targets | Yes | Approver+ |
| `/admin` | Admin Dashboard | Yes | Admin only |
| `/admin/:tab` | Admin Dashboard Tab | Yes | Admin only |

---

## API Endpoint Summary

### Auth
- `POST /api/register` — register new user (email only, @atyeti.com required)
- `POST /api/login` — login
- `POST /api/logout` — logout
- `GET /api/user` — get current user

### Users
- `GET /api/users` — all users (admin)
- `GET /api/users/:id` — user by ID
- `PATCH /api/users/:id` — update profile
- `POST /api/users/:id/change-password` — change password
- `POST /api/admin/users/:id/make-admin` — promote to admin
- `POST /api/admin/users/:id/reset-password` — reset password

### Skills
- `GET /api/skills` — current user's skills
- `POST /api/skills` — add skill (creates pending approval)
- `DELETE /api/skills/:id` — delete a skill
- `GET /api/all-skills` — all skills (org-wide)
- `GET /api/skill-templates` — all skill templates
- `POST /api/skill-templates` — create template (admin)
- `PATCH /api/skill-templates/:id` — update template (admin)
- `DELETE /api/skill-templates/:id` — delete template (admin)
- `GET /api/skill-targets` — org skill targets
- `POST /api/skill-targets` — create target (admin)

### Pending Approvals
- `GET /api/pending-skill-updates` — all pending requests (admin/approver)
- `POST /api/pending-skill-updates/:id/approve` — approve
- `POST /api/pending-skill-updates/:id/reject` — reject with comments

### Categories
- `GET /api/skill-categories` — all categories
- `POST /api/skill-categories` — create (admin)
- `PATCH /api/skill-categories/:id` — update (admin)
- `DELETE /api/skill-categories/:id` — delete (admin)
- `GET /api/skill-subcategories` — all subcategories
- `POST /api/skill-subcategories` — create (admin)

### Skill History & Activity
- `GET /api/user/skills/history` — current user's skill history
- `GET /api/org/skills/history` — org-wide skill history

### Endorsements
- `POST /api/endorsements` — create endorsement
- `GET /api/endorsements/user/:id` — endorsements for a user

### Notifications
- `GET /api/notifications` — current user's notifications
- `PATCH /api/notifications/:id/read` — mark as read
- `POST /api/notifications/read-all` — mark all as read

### Clients
- `GET /api/clients` — all clients
- `GET /api/clients/:id` — client by ID
- `POST /api/clients` — create client (admin)
- `PATCH /api/clients/:id` — update client (admin)
- `DELETE /api/clients/:id` — delete client (super-user only)

### Projects
- `GET /api/projects` — all projects
- `GET /api/projects/:id` — project by ID
- `POST /api/projects` — create project (admin)
- `PATCH /api/projects/:id` — update project (admin)
- `DELETE /api/projects/:id` — delete project (admin)
- `GET /api/projects/:id/resources` — project resources
- `POST /api/projects/:id/resources` — add resource
- `DELETE /api/projects/:id/resources/:resourceId` — remove resource
- `GET /api/projects/:id/skills` — required skills
- `POST /api/projects/:id/skills` — add required skill

### Admin / Reports
- `GET /api/admin/hierarchy` — client → project → resource hierarchy
- `GET /api/admin/skill-hierarchy` — category → subcategory → skill → user hierarchy
- `GET /api/admin/report-settings` — report configurations
- `POST /api/admin/report-settings` — create report config
- `POST /api/admin/reports/weekly-resource-report/send` — trigger immediate report

### Gmail OAuth
- `GET /auth/gmail` — initiate OAuth2 flow
- `GET /oauth2callback` — OAuth2 callback handler
- `GET /auth/gmail/status` — check if Gmail is authenticated

---

## Theme / Styling

- `theme.json`: `{ "primary": "#3B82F6", "variant": "professional", "appearance": "light", "radius": 0.5 }`
- Primary color: Blue (#3B82F6)
- Sidebar: dark gray (`bg-gray-800`) with white text
- Cards: white background with subtle border and shadow
- Badges: rounded-full colored pills
- Buttons: follow shadcn conventions (default=primary blue, outline=bordered, destructive=red)
- Skill level colors embedded via inline `style` prop (not Tailwind classes) to allow dynamic color application
- Category colors rendered as colored dots/swatches using the hex value from the database
