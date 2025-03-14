# Components Documentation

This document provides an overview of the key React components used in the Skills Management Platform.

## Component Architecture

The Skills Management Platform follows a modular component architecture with:

- **UI Components**: Reusable, generic UI elements (buttons, cards, inputs)
- **Feature Components**: Specific functionality (skill cards, endorsement forms)
- **Page Components**: Full pages that combine multiple components
- **Layout Components**: Structural components (sidebar, header)

## UI Components

These are base UI components built on top of [shadcn/ui](https://ui.shadcn.com/) and Tailwind CSS.

### Button

```tsx
import { Button } from "@/components/ui/button";

// Usage
<Button variant="default">Click Me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Menu</Button>
<Button variant="link">Learn More</Button>
```

**Props:**
- `variant`: `"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"`
- `size`: `"default" | "sm" | "lg" | "icon"`
- `asChild`: `boolean` - Merge props onto child element instead of button element

### Card

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Usage
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
  <CardFooter>
    <p>Card Footer</p>
  </CardFooter>
</Card>
```

### Form Components

```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Usage
const formSchema = z.object({
  username: z.string().min(2).max(50),
});

function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle form submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Usage
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog Description
      </DialogDescription>
    </DialogHeader>
    <div>Dialog Content</div>
  </DialogContent>
</Dialog>
```

### Toast Notifications

```tsx
import { useToast } from "@/hooks/use-toast";

// Usage
function MyComponent() {
  const { toast } = useToast();
  
  const showToast = () => {
    toast({
      title: "Success",
      description: "Operation completed successfully",
      variant: "default", // or "destructive"
    });
  };
  
  return <Button onClick={showToast}>Show Toast</Button>;
}
```

## Feature Components

These are domain-specific components built for the Skills Management Platform.

### SkillCard

Displays a user's skill with its details.

```tsx
import SkillCard from "@/components/skill-card";

// Usage
<SkillCard
  skill={skill}
  onEdit={() => handleEdit(skill.id)}
  onDelete={() => handleDelete(skill.id)}
  icon={<CodeIcon className="h-5 w-5" />}
/>
```

**Props:**
- `skill`: Skill object
- `onEdit`: Function to handle edit action
- `onDelete`: Function to handle delete action
- `icon`: React node for the skill icon

### EndorsementCard

Displays an endorsement with the endorser's information.

```tsx
import EndorsementCard from "@/components/endorsement-card";

// Usage
<EndorsementCard
  endorsement={endorsement}
  endorser={endorser}
  showSkillName={true}
  skillName="JavaScript"
/>
```

**Props:**
- `endorsement`: Endorsement object
- `endorser`: User object of the endorser
- `showSkillName`: Boolean to show/hide skill name
- `skillName`: Name of the skill being endorsed

### EndorsementForm

Form for creating new endorsements.

```tsx
import EndorsementForm from "@/components/endorsement-form";

// Usage
<EndorsementForm 
  skill={skill}
  onSuccess={() => setShowForm(false)}
/>
```

**Props:**
- `skill`: Skill object to endorse
- `onSuccess`: Callback function after successful submission

### AddSkillModal

Modal dialog for adding or editing skills.

```tsx
import AddSkillModal from "@/components/add-skill-modal";

// Usage
<AddSkillModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  skillId={editingSkillId} // null for new skill
/>
```

**Props:**
- `isOpen`: Boolean to control modal visibility
- `onClose`: Function to handle modal close
- `skillId`: ID of skill to edit, or null for creating new skill

### SkillLevelBadge

Displays a skill level with appropriate styling.

```tsx
import SkillLevelBadge from "@/components/skill-level-badge";

// Usage
<SkillLevelBadge level="expert" size="md" />
```

**Props:**
- `level`: Skill level (`"beginner"`, `"intermediate"`, `"expert"`)
- `size`: Badge size (`"sm"`, `"md"`)
- `className`: Additional CSS classes

### ActivityFeed

Displays a feed of skill and profile update activities.

```tsx
import ActivityFeed from "@/components/activity-feed";

// Usage
<ActivityFeed
  activities={activities}
  skills={skills}
  showAll={false}
  isPersonal={true}
  users={users} // Optional
/>
```

**Props:**
- `activities`: Array of activity objects
- `skills`: Array of skill objects for reference
- `showAll`: Boolean to show all activities or limit
- `isPersonal`: Boolean indicating if feed is for current user
- `users`: Optional array of user objects for reference

### UserProfileDialog

Modal dialog to view a user's profile.

```tsx
import UserProfileDialog from "@/components/user-profile-dialog";

// Usage
<UserProfileDialog
  userId={userId}
  isOpen={isProfileOpen}
  onClose={() => setIsProfileOpen(false)}
/>
```

**Props:**
- `userId`: ID of user to display
- `isOpen`: Boolean to control dialog visibility
- `onClose`: Function to handle dialog close

## Layout Components

These components provide structure to the application.

### Header

Top navigation bar with title and user menu.

```tsx
import Header from "@/components/header";

// Usage
<Header
  title="Dashboard"
  toggleSidebar={toggleSidebar}
  isSidebarOpen={isSidebarOpen}
/>
```

**Props:**
- `title`: Page title to display
- `toggleSidebar`: Function to toggle sidebar visibility
- `isSidebarOpen`: Boolean indicating sidebar state

### Sidebar

Main navigation sidebar.

```tsx
import Sidebar from "@/components/sidebar";

// Usage
<Sidebar
  isOpen={isSidebarOpen}
  setIsOpen={setIsSidebarOpen}
  currentPath={location}
/>
```

**Props:**
- `isOpen`: Boolean indicating if sidebar is open
- `setIsOpen`: Function to update sidebar state
- `currentPath`: Current route path

### NotificationDropdown

Dropdown menu displaying user notifications.

```tsx
import NotificationDropdown from "@/components/notification-dropdown";

// Usage
<NotificationDropdown />
```

## Page Components

These components represent entire pages in the application.

### AdminDashboard

Dashboard page for administrators.

```tsx
import AdminDashboard from "@/pages/admin-dashboard";

// Usage in router
<Route path="/admin" component={AdminDashboard} />
```

### SkillsPage

Page for managing a user's skills.

```tsx
import SkillsPage from "@/pages/skills-page";

// Usage in router
<Route path="/skills" component={SkillsPage} />
```

### ProfilePage

Page for viewing and editing user profile.

```tsx
import ProfilePage from "@/pages/profile-page";

// Usage in router
<Route path="/profile" component={ProfilePage} />
```

### OrgDashboard

Organization dashboard with user and skill analytics.

```tsx
import OrgDashboard from "@/pages/org-dashboard";

// Usage in router
<Route path="/dashboard" component={OrgDashboard} />
```

### LeaderboardPage

Leaderboard showing users ranked by skills.

```tsx
import LeaderboardPage from "@/pages/leaderboard-page";

// Usage in router
<Route path="/leaderboard" component={LeaderboardPage} />
```

## Hooks and Utilities

### useAuth

Hook for authentication state and functions.

```tsx
import { useAuth } from "@/hooks/use-auth";

// Usage
function MyComponent() {
  const { user, loginMutation, logoutMutation } = useAuth();
  
  return (
    <div>
      {user ? (
        <Button onClick={() => logoutMutation.mutate()}>Logout</Button>
      ) : (
        <Button onClick={() => loginMutation.mutate({ email, password })}>
          Login
        </Button>
      )}
    </div>
  );
}
```

### useIsMobile

Hook for responsive design.

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

// Usage
function MyComponent() {
  const isMobile = useIsMobile();
  
  return (
    <div>
      {isMobile ? (
        <MobileView />
      ) : (
        <DesktopView />
      )}
    </div>
  );
}
```

### Date Utilities

Utility functions for handling dates.

```tsx
import { formatDate, formatRelativeTime } from "@/lib/date-utils";

// Usage
const formattedDate = formatDate(someDate, "MMM dd, yyyy");
const relativeTime = formatRelativeTime(someDate); // "2 days ago"
```

## Component Best Practices

1. **Component Composition**: Prefer composition over prop-drilling for complex components
2. **Loading States**: Always handle loading states with Skeletons or loading indicators
3. **Error Handling**: Add appropriate error handling with user-friendly messages
4. **Accessibility**: Ensure components are accessible with proper ARIA attributes
5. **Responsiveness**: Make components adaptable to different screen sizes
6. **Reusability**: Extract reusable logic into custom hooks
7. **Prop Validation**: Use TypeScript for proper prop typing

## Theme Customization

The application uses a theme configuration in `theme.json`:

```json
{
  "primary": "#3b82f6",
  "variant": "professional",
  "appearance": "light",
  "radius": 0.5
}
```

To customize component appearance, modify this file rather than modifying component styles directly.