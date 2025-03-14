# Frontend Components Documentation

The Skills Management Platform frontend is built using React.js with TypeScript. This document provides an overview of the component structure and organization.

## Project Structure

The frontend code is organized in the following structure:

```
client/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Basic UI components based on shadcn/ui
│   │   └── ...          # Application-specific components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and services
│   ├── pages/           # Page components
│   ├── App.tsx          # Main application component
│   ├── index.css        # Global CSS
│   └── main.tsx         # Application entry point
└── index.html           # HTML entry point
```

## Component Categories

The components are organized into the following categories:

### UI Components

Located in `client/src/components/ui/`, these are basic UI components based on the shadcn/ui library. They provide a consistent design system for the application.

Examples:
- `button.tsx`: Button component with various styles
- `card.tsx`: Card component for displaying content
- `dialog.tsx`: Modal dialog component
- `form.tsx`: Form components with validation
- `input.tsx`: Input component for forms
- `table.tsx`: Table component for displaying data

See [UI Components](./ui_components.md) for detailed documentation.

### Application Components

Located in `client/src/components/`, these are application-specific components that use the UI components to build more complex functionality.

Examples:
- `activity-feed.tsx`: Displays a feed of user activity
- `add-skill-modal.tsx`: Modal for adding or editing skills
- `endorsement-card.tsx`: Card for displaying endorsements
- `skill-card.tsx`: Card for displaying skills
- `notification-dropdown.tsx`: Dropdown for displaying notifications

### Pages

Located in `client/src/pages/`, these are top-level components that represent entire pages in the application.

Examples:
- `admin-dashboard.tsx`: Admin dashboard page
- `auth-page.tsx`: Authentication page
- `profile-page.tsx`: User profile page
- `skills-page.tsx`: Skills management page

See [Pages](./pages.md) for detailed documentation.

## Hooks

Custom React hooks are located in `client/src/hooks/`. These hooks encapsulate reusable logic that can be shared across components.

Examples:
- `use-auth.tsx`: Authentication logic
- `use-mobile.tsx`: Mobile device detection
- `use-toast.ts`: Toast notification system

See [Hooks](./hooks.md) for detailed documentation.

## Utilities

Utility functions and services are located in `client/src/lib/`. These provide common functionality used throughout the application.

Examples:
- `date-utils.ts`: Date formatting and manipulation
- `protected-route.tsx`: Route protection for authenticated pages
- `queryClient.ts`: TanStack Query client configuration
- `utils.ts`: General utility functions

See [Utilities](./utilities.md) for detailed documentation.

## Component Design Patterns

The application follows these design patterns:

### Container/Presentation Pattern

Many components are split into container components (which handle data fetching and state) and presentation components (which render the UI).

### Composition

Components are composed of smaller, reusable components. For example, a page might be composed of several cards, each with its own content.

### Context API

React Context is used for global state management, particularly for authentication state.

### Hooks for Logic

Custom hooks are used to encapsulate complex logic and make it reusable across components.

## State Management

State management in the application is handled through several mechanisms:

1. **Local Component State**: For component-specific state
2. **React Query**: For server state management
3. **React Context**: For global application state
4. **Form State**: Managed by react-hook-form

## Data Fetching

Data fetching is handled by TanStack Query, which provides caching, loading states, and error handling.

Example:
```typescript
const { data: skills, isLoading, error } = useQuery({
  queryKey: ['/api/skills'],
  queryFn: () => apiRequest('/api/skills')
});
```

## Form Handling

Forms are handled by react-hook-form with Zod validation.

Example:
```typescript
const form = useForm<z.infer<typeof skillSchema>>({
  resolver: zodResolver(skillSchema),
  defaultValues: {
    name: '',
    category: '',
    level: 'beginner'
  }
});
```

## Styling

The application uses Tailwind CSS for styling, with a custom theme defined in `theme.json`. Components from shadcn/ui are customized using the Tailwind class system.

## Routing

Routing is handled by the wouter library, with routes defined in `App.tsx`:

```typescript
<Route path="/profile" component={ProfilePage} />
<Route path="/skills" component={SkillsPage} />
```

Protected routes use the `ProtectedRoute` component to ensure the user is authenticated.

## Documentation Sections

- [Pages](./pages.md)
- [UI Components](./ui_components.md)
- [Hooks](./hooks.md)
- [Utilities](./utilities.md)