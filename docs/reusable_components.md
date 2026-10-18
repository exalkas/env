# Reusable Components Documentation

This document outlines all reusable UI components available in the admin app, their purposes, props, and usage examples.

## 📍 Location

All reusable components are located in: `admin-app/components/shared/`

## 🧩 Available Components

### Form Components

#### FormInput

**Purpose**: A standardized input component with built-in styling, error handling, and proper padding.

**File**: `admin-app/components/shared/FormInput.tsx`

**Features**:

- Consistent padding (`px-3 py-2`)
- Error state styling (red border when error provided)
- Focus management (blue focus ring)
- Disabled state styling
- Support for all HTML input types
- Built-in validation styling

**Props**:

```typescript
interface FormInputProps {
  id?: string;
  name?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}
```

**Usage**:

```typescript
<FormInput
  id="title"
  type="text"
  value={formData.title}
  onChange={(e) => updateField("title", e.target.value)}
  placeholder="Enter title"
  error={errors.title}
  required
/>
```

#### FormTextarea

**Purpose**: A standardized textarea component with consistent styling and error handling.

**File**: `admin-app/components/shared/FormTextarea.tsx`

**Features**:

- Consistent padding (`px-3 py-2`)
- Vertical resize only
- Error state styling
- Configurable rows

**Props**:

```typescript
interface FormTextareaProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  rows?: number;
  className?: string;
}
```

**Usage**:

```typescript
<FormTextarea
  id="description"
  value={formData.description}
  onChange={(e) => updateField("description", e.target.value)}
  placeholder="Enter description"
  rows={4}
  error={errors.description}
  required
/>
```

#### FormSelect

**Purpose**: A standardized select component with consistent styling and error handling.

**File**: `admin-app/components/shared/FormSelect.tsx`

**Features**:

- Consistent padding (`px-3 py-2`)
- Error state styling
- White background
- Proper focus states

**Props**:

```typescript
interface FormSelectProps {
  id?: string;
  name?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}
```

**Usage**:

```typescript
<FormSelect
  id="category"
  value={formData.category}
  onChange={(e) => updateField("category", e.target.value)}
  error={errors.category}
>
  <option value="">Select category</option>
  <option value="news">News</option>
  <option value="analysis">Analysis</option>
</FormSelect>
```

**Form Components Benefits**:

- ✅ **Consistent Padding**: All form inputs have standardized `px-3 py-2` padding
- ✅ **Error Handling**: Automatic red border styling when `error` prop is provided
- ✅ **Focus States**: Blue focus ring and border color for accessibility
- ✅ **Disabled States**: Proper gray styling for disabled inputs
- ✅ **Type Safety**: Full TypeScript support with proper interfaces
- ✅ **Responsive**: Full width with proper mobile handling

---

### LearningPathCard Component

**Purpose**: A reusable card component for displaying learning paths in both available and enrolled states.

**File**: `clients-app/components/shared/LearningPathCard.tsx`

**Features**:

- **Dual Variants**: Supports both available and enrolled learning path display
- **Progress Tracking**: Shows progress bars and completion status for enrolled paths
- **Interactive States**: Loading states during enrollment, completion indicators
- **Consistent Layout**: Bottom-aligned buttons with proper spacing and height consistency
- **Color-Coded Levels**: Visual distinction between beginner, intermediate, advanced, and expert levels
- **Duration Display**: Formatted time display (hours and minutes)
- **Module Count**: Shows number of modules in each learning path
- **Responsive Design**: Works on desktop, tablet, and mobile devices

**Props**:

```typescript
interface LearningPathCardProps {
  path: LearningPath;
  variant: "available" | "enrolled";
  onEnroll?: (pathId: number) => void;
  isEnrolling?: boolean;
  enrollingId?: number | null;
}

interface LearningPath {
  id: number;
  title: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  estimated_duration: number;
  modules_count: number;
  is_active: boolean;
  created_at: string;
  user_progress?: {
    id: number;
    progress_percentage: number;
    completed_modules: number;
    total_modules: number;
    last_accessed: string;
    is_completed: boolean;
  };
}
```

**Usage**:

```tsx
// Available learning path
<LearningPathCard
  path={learningPath}
  variant="available"
  onEnroll={handleEnroll}
  isEnrolling={enrolling !== null}
  enrollingId={enrolling}
/>

// Enrolled learning path
<LearningPathCard
  path={learningPath}
  variant="enrolled"
/>
```

**Variants**:

**Available Variant**:

- Shows "Enroll Now" button
- Displays loading state during enrollment
- Level badge and module count
- Duration information
- No progress tracking

**Enrolled Variant**:

- Shows progress bar with percentage
- Displays completed vs total modules
- Last accessed date
- "Continue Learning" or "Review" button
- Completion checkmark for finished paths

**Level Badge Colors**:

- **Beginner**: Green (`bg-green-100 text-green-800`)
- **Intermediate**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Advanced**: Orange (`bg-orange-100 text-orange-800`)
- **Expert**: Red (`bg-red-100 text-red-800`)

**Benefits**:

- ✅ **Eliminates Code Duplication**: Single component for all learning path cards
- ✅ **Consistent Design**: Unified styling and behavior across the application
- ✅ **Maintainable**: Changes in one place affect all usages
- ✅ **Type Safe**: Full TypeScript support with proper interfaces
- ✅ **Responsive**: Mobile-friendly design with proper touch targets
- ✅ **Accessible**: Proper ARIA labels and keyboard navigation

---

### 1. Button Component

**Purpose**: A comprehensive, reusable button component with multiple variants, sizes, and states.

**File**: `admin-app/components/shared/Button.tsx`

**Features**:

- Multiple variants (primary, secondary, danger, success, warning, ghost)
- Three sizes (sm, md, lg)
- **Enhanced loading states** with spinner and auto-disable
- Icon support (left or right positioning)
- **Icon-only buttons** with optimized spacing
- Link functionality (internal and external)
- Full-width option
- Disabled states
- **Smart spacing** that adapts to content type
- Consistent styling and accessibility

**Props**:

```typescript
interface ButtonProps {
  children?: React.ReactNode; // Button content (optional for icon-only buttons)
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "warning"
    | "ghost"; // Visual style
  size?: "sm" | "md" | "lg"; // Button size
  disabled?: boolean; // Disabled state
  loading?: boolean; // Loading state with spinner (auto-disables button)
  fullWidth?: boolean; // Full container width
  icon?: React.ComponentType<{ className?: string }>; // Icon component
  iconPosition?: "left" | "right"; // Icon placement
  href?: string; // Navigation link
  external?: boolean; // External link (opens in new tab)
  type?: "button" | "submit" | "reset"; // HTML button type
  onClick?: () => void; // Click handler
  className?: string; // Additional CSS classes
  iconOnly?: boolean; // For icon-only buttons with optimized spacing
}
```

**Usage Examples**:

```typescript
// Basic buttons
<Button>Click me</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>

// With icons
<Button icon={PlusIcon}>Create User</Button>
<Button icon={TrashIcon} iconPosition="right" variant="danger">Delete</Button>

// Icon-only buttons (NEW!)
<Button icon={TrashIcon} iconOnly={true} variant="ghost" size="sm" />
<Button icon={PencilIcon} iconOnly={true} variant="secondary" />

// Loading state (auto-disables button)
<Button loading={isSubmitting} disabled={!isValid}>
  Submit Form
</Button>

// Loading with dynamic text
<Button loading={loading}>
  {loading ? "Saving..." : "Save Changes"}
</Button>

// Navigation buttons
<Button href="/users/create" icon={PlusIcon}>
  Create User
</Button>

// External links
<Button href="https://example.com" external icon={ExternalLinkIcon}>
  Open External
</Button>

// Form buttons with loading
<Button type="submit" size="lg" fullWidth loading={submitting}>
  {submitting ? "Creating..." : "Create Assessment"}
</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Icon-only buttons with different sizes
<Button icon={TrashIcon} iconOnly size="sm" variant="ghost" />
<Button icon={PencilIcon} iconOnly size="md" variant="secondary" />
<Button icon={PlusIcon} iconOnly size="lg" variant="primary" />
```

**Variant Examples**:

```typescript
<Button variant="primary">Primary Action</Button>     // Blue
<Button variant="secondary">Secondary</Button>        // White with border
<Button variant="danger">Delete</Button>              // Red
<Button variant="success">Approve</Button>            // Green
<Button variant="warning">Warning</Button>            // Yellow
<Button variant="ghost">Subtle Action</Button>        // Transparent
```

**Loading State Behavior**:

The Button component automatically handles loading states with the following behavior:

```typescript
// Normal state: [Icon] Button Text
<Button icon={PlusIcon}>Create User</Button>

// Loading state: [Spinner] Button Text (button disabled)
<Button icon={PlusIcon} loading={true}>Create User</Button>

// Icon-only normal: [Icon]
<Button icon={TrashIcon} iconOnly={true} />

// Icon-only loading: [Spinner] (button disabled)
<Button icon={TrashIcon} iconOnly={true} loading={true} />
```

**Key Loading Features**:

- ✅ **Auto-disable**: Button becomes disabled when `loading={true}`
- ✅ **Spinner replacement**: Loading spinner replaces the icon
- ✅ **Smart spacing**: Spinner positioning adapts to button content
- ✅ **Visual feedback**: Clear indication of async operations

**Icon-Only Button Features**:

```typescript
// Perfect for action buttons in tables
<Button icon={PencilIcon} iconOnly={true} variant="ghost" size="sm" />
<Button icon={TrashIcon} iconOnly={true} variant="ghost" size="sm" />
<Button icon={EyeIcon} iconOnly={true} variant="ghost" size="sm" />

// Optimized spacing (square padding instead of rectangular)
// sm: p-2, md: p-2, lg: p-3
// No margin between icon and non-existent text
```

---

### 2. DataTable Component

**Purpose**: A comprehensive data table with sorting, searching, pagination, and action buttons.

**File**: `admin-app/components/shared/DataTable.tsx`

**Features**:

- Sortable columns
- Built-in search functionality
- Pagination with configurable page sizes
- Action buttons (view, edit, delete, custom)
- Empty state handling
- Loading states
- Responsive design

**Props**:

```typescript
interface DataTableProps<T> {
  data: T[]; // Array of data items
  columns: Column<T>[]; // Column configuration
  actions?: ActionButton<T>[]; // Action buttons
  loading?: boolean; // Loading state
  emptyState?: {
    // Empty state configuration
    title: string;
    description: string;
    action?: {
      label: string;
      href: string;
    };
  };
  searchable?: boolean; // Enable/disable search
  searchPlaceholder?: string; // Search input placeholder
  initialSort?: {
    // Initial sort configuration
    key: keyof T | string;
    direction: "asc" | "desc";
  };
  pagination?: {
    // Pagination configuration
    pageSize: number;
    showTotal?: boolean;
  };
  className?: string; // Additional CSS classes
}
```

**Column Configuration**:

```typescript
interface Column<T> {
  key: keyof T | string; // Data key
  label: string; // Column header
  sortable?: boolean; // Enable sorting
  render?: (item: T, value: any) => React.ReactNode; // Custom render function
  className?: string; // Column CSS classes
  width?: string; // Column width
}
```

**Action Button Configuration**:

```typescript
interface ActionButton<T> {
  type: "view" | "edit" | "delete" | "custom"; // Button type
  label?: string; // Button label
  icon?: React.ComponentType<{ className?: string }>; // Icon component
  href?: (item: T) => string; // Navigation href
  onClick?: (item: T) => void; // Click handler
  className?: string; // CSS classes
  show?: (item: T) => boolean; // Conditional display
}
```

**Usage Example**:

```typescript
const columns: Column<User>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (user) => (
      <div>
        <div className="font-medium">{user.name}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (user) => <StatusBadge status={user.status} />,
  },
];

const actions: ActionButton<User>[] = [
  { type: "view", href: (user) => `/users/${user.id}` },
  { type: "edit", href: (user) => `/users/${user.id}/edit` },
  { type: "delete", onClick: (user) => handleDelete(user.id) },
];

<DataTable
  data={users}
  columns={columns}
  actions={actions}
  searchable={true}
  pagination={{ pageSize: 20 }}
/>;
```

---

### 2. StatusBadge Component

**Purpose**: Displays status indicators with consistent styling and color coding.

**File**: `admin-app/components/shared/StatusBadge.tsx`

**Features**:

- Auto-detection of status variants based on text
- Multiple sizes (sm, md, lg)
- Consistent color schemes
- Accessible design

**Props**:

```typescript
interface StatusBadgeProps {
  status: string; // Status text
  size?: "sm" | "md" | "lg"; // Badge size
  variant?: "success" | "warning" | "error" | "info" | "neutral"; // Color variant
  className?: string; // Additional CSS classes
}
```

**Auto-detected Variants**:

- **Success**: "active", "completed", "approved", "published", "success"
- **Warning**: "pending", "draft", "warning", "inactive"
- **Error**: "error", "failed", "rejected", "deleted"
- **Info**: "info", "processing", "review"
- **Neutral**: All other statuses

**Usage Example**:

```typescript
<StatusBadge status="Active" size="sm" />
<StatusBadge status="Pending" size="md" />
<StatusBadge status="Error" variant="error" />
```

---

### 3. LoadingSpinner Component

**Purpose**: Provides loading indicators for various states and operations.

**File**: `admin-app/components/shared/LoadingSpinner.tsx`

**Features**:

- Multiple sizes
- Overlay option for full-screen loading
- Optional loading messages
- Consistent animation

**Props**:

```typescript
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"; // Spinner size
  overlay?: boolean; // Full-screen overlay
  message?: string; // Loading message
  className?: string; // Additional CSS classes
}
```

**Usage Example**:

```typescript
// Small inline spinner
<LoadingSpinner size="sm" />

// Medium spinner with message
<LoadingSpinner size="md" message="Loading data..." />

// Full-screen overlay
<LoadingSpinner size="lg" overlay={true} message="Processing..." />
```

---

### 4. SearchInput Component

**Purpose**: Debounced search input for filtering data with performance optimization.

**File**: `admin-app/components/shared/SearchInput.tsx`

**Features**:

- Debounced input (300ms delay)
- Clear button functionality
- Search icon
- Proper accessibility

**Props**:

```typescript
interface SearchInputProps {
  value: string; // Current search value
  onChange: (value: string) => void; // Change handler
  placeholder?: string; // Input placeholder
  debounceMs?: number; // Debounce delay (default: 300ms)
  className?: string; // Additional CSS classes
}
```

**Usage Example**:

```typescript
const [searchQuery, setSearchQuery] = useState("");

<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search users..."
  debounceMs={500}
/>;
```

---

### 5. EmptyState Component

**Purpose**: Displays empty state messages with optional actions.

**File**: `admin-app/components/shared/EmptyState.tsx`

**Features**:

- Customizable icons
- Action buttons (navigation or click handlers)
- Consistent styling
- Responsive design

**Props**:

```typescript
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>; // Icon component
  title: string; // Empty state title
  description: string; // Description text
  action?: {
    // Optional action
    label: string;
    href?: string; // Navigation link
    onClick?: () => void; // Click handler
  };
  className?: string; // Additional CSS classes
}
```

**Usage Example**:

```typescript
<EmptyState
  icon={UserIcon}
  title="No users found"
  description="Get started by creating your first user."
  action={{
    label: "Create User",
    href: "/users/create"
  }}
/>

// With click handler
<EmptyState
  title="No data available"
  description="Try adjusting your filters."
  action={{
    label: "Clear Filters",
    onClick: () => clearFilters()
  }}
/>
```

---

### 6. RichTextEditor Component

**Purpose**: WYSIWYG editor for creating and editing rich content, especially educational materials.

**File**: `admin-app/components/shared/RichTextEditor.tsx`

**Features**:

- React Quill integration
- Educational content-focused toolbar
- Server-side rendering compatibility
- Error handling
- Consistent styling

**Props**:

```typescript
interface RichTextEditorProps {
  value: string; // Editor content (HTML)
  onChange: (content: string) => void; // Content change handler
  placeholder?: string; // Editor placeholder
  readOnly?: boolean; // Read-only mode
  className?: string; // Additional CSS classes
}
```

**Toolbar Features**:

- Headers (H1, H2, H3)
- Text formatting (bold, italic, underline)
- Lists (ordered, unordered)
- Links
- Code blocks
- Blockquotes
- Clean formatting

**Usage Example**:

```typescript
const [content, setContent] = useState("");

<RichTextEditor
  value={content}
  onChange={setContent}
  placeholder="Enter lesson content..."
/>;
```

---

## 🔧 Component Import

All components are exported from the index file for easy importing:

```typescript
import {
  Button,
  DataTable,
  StatusBadge,
  LoadingSpinner,
  SearchInput,
  EmptyState,
  RichTextEditor,
} from "@/components/shared";
```

## 📋 Common Usage Patterns

### 1. Using Button Component Instead of Custom Buttons

**Before** (repetitive button code):

```typescript
// Multiple places in the app
<Link
  href="/users/create"
  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
>
  <PlusIcon className="h-4 w-4 mr-2" />
  Create User
</Link>

<button
  onClick={handleDelete}
  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
>
  <TrashIcon className="h-4 w-4 mr-2" />
  Delete
</button>
```

**After** (using Button component):

```typescript
// Clean, consistent, and reusable
<Button href="/users/create" icon={PlusIcon}>
  Create User
</Button>

<Button variant="danger" icon={TrashIcon} onClick={handleDelete}>
  Delete
</Button>
```

### 1.1. Real-World Assessment System Usage

**Form Submit Buttons with Loading States**:

```typescript
// Assessment creation form
<Button
  type="submit"
  loading={loading}
  disabled={loading}
  className="flex-1 sm:flex-none"
>
  Create Assessment
</Button>

// Assessment edit form
<Button
  type="submit"
  loading={loading}
  disabled={loading}
  className="flex-1 sm:flex-none"
>
  Update Assessment
</Button>
```

**Table Action Buttons**:

```typescript
// Icon-only action buttons in assessment table
<div className="flex items-center justify-end space-x-2">
  <Link href={`/education/assessments/${assessment.id}`}>
    <EyeIcon className="h-5 w-5 text-blue-600 hover:text-blue-900" />
  </Link>

  <Link href={`/education/assessments/${assessment.id}/edit`}>
    <PencilIcon className="h-5 w-5 text-yellow-600 hover:text-yellow-900" />
  </Link>

  <Button
    onClick={() => handleDeleteAssessmentClick(assessment)}
    variant="ghost"
    size="sm"
    icon={TrashIcon}
    iconOnly={true}
    className="text-red-600 hover:text-red-900"
  />
</div>
```

**Navigation Buttons**:

```typescript
// Create button with success variant
<Button
  href="/education/assessments/create"
  variant="success"
  icon={PlusIcon}
>
  Create Assessment
</Button>

// Back navigation
<Button
  variant="ghost"
  size="sm"
  icon={ArrowLeftIcon}
  href="/education/assessments"
>
  Back to Assessments
</Button>
```

### 2. List Pages with DataTable

```typescript
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns: Column<User>[] = [
    // Column definitions
  ];

  const actions: ActionButton<User>[] = [
    // Action definitions
  ];

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <Button href="/users/create" icon={PlusIcon}>
          Create User
        </Button>
      </div>

      <DataTable
        data={users}
        columns={columns}
        actions={actions}
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}
```

### 3. Form Pages with Loading States

```typescript
export default function CreateUserPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [isValid, setIsValid] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // Submit logic
    setLoading(false);
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Creating user..." />;
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      <div className="flex gap-4 mt-6">
        <Button type="submit" loading={loading} disabled={!isValid}>
          Create User
        </Button>
        <Button variant="secondary" href="/users">
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

### 4. Search and Filter Interface

```typescript
export default function SearchablePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div>
      <div className="filters">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Data display */}
    </div>
  );
}
```

## 🎨 Styling Guidelines

### Consistent Color Scheme

- **Primary**: Blue-600 (`bg-blue-600`, `text-blue-600`)
- **Success**: Green-600 (`bg-green-600`, `text-green-600`)
- **Warning**: Yellow-500 (`bg-yellow-500`, `text-yellow-600`)
- **Error**: Red-600 (`bg-red-600`, `text-red-600`)
- **Neutral**: Gray-600 (`bg-gray-600`, `text-gray-600`)

### Typography

- **Headers**: `text-3xl font-bold text-gray-900`
- **Subheaders**: `text-lg font-medium text-gray-900`
- **Body text**: `text-sm text-gray-600`
- **Labels**: `text-sm font-medium text-gray-700`

### Spacing

- **Page padding**: `p-6`
- **Section margins**: `mb-6`, `mb-8`
- **Element gaps**: `gap-4`, `space-y-4`

## 🚀 Best Practices

1. **Always use TypeScript** for component props
2. **Implement loading states** for async operations using Button's `loading` prop
3. **Use icon-only buttons** for table actions with `iconOnly={true}`
4. **Provide empty states** for data collections
5. **Use consistent spacing** with Tailwind classes
6. **Handle errors gracefully** with try-catch blocks
7. **Make components accessible** with proper ARIA labels
8. **Test responsive behavior** on different screen sizes
9. **Document complex props** with JSDoc comments
10. **Always disable buttons during loading** to prevent double-submission

### Loading State Best Practices:

```typescript
// ✅ Good: Proper loading state management
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await submitData();
    // Success notification
  } catch (error) {
    // Error notification
  } finally {
    setLoading(false);
  }
};

<Button type="submit" loading={loading} disabled={loading}>
  {loading ? "Creating..." : "Create Item"}
</Button>

// ✅ Good: Icon-only action buttons
<Button
  onClick={handleDelete}
  variant="ghost"
  size="sm"
  icon={TrashIcon}
  iconOnly={true}
  className="text-red-600 hover:text-red-900"
/>

// ❌ Bad: Manual loading implementation
<button disabled={loading} className="...">
  {loading && <Spinner />}
  {loading ? "Loading..." : "Submit"}
</button>
```

## 🔄 Future Enhancements

Potential additions to the component library:

1. **Modal/Dialog Component** - For confirmations and forms
2. **Toast/Notification Component** - For success/error messages
3. **Form Components** - Input, Select, Checkbox, Radio with validation
4. **Card Component** - For consistent content containers
5. **Breadcrumb Component** - For navigation context
6. **Pagination Component** - Standalone pagination controls
7. **Filter Components** - Date pickers, multi-select filters
8. **Chart Components** - For analytics and data visualization

---

This component library provides a solid foundation for building consistent, accessible, and maintainable admin interfaces. Each component is designed to be flexible, reusable, and easy to customize while maintaining design consistency across the application.

# Reusable Components & Custom Hooks Documentation

This document provides comprehensive documentation for the reusable components and custom hooks in the admin application.

## Table of Contents

- [Shared Components](#shared-components)
- [Custom Hooks](#custom-hooks)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Custom Hooks

The admin app includes several custom hooks that encapsulate common patterns and reduce code duplication across components.

### 1. useNotifications

Manages notification state and provides functions for adding/dismissing notifications.

```typescript
import { useNotifications } from "@/lib/hooks";

const {
  notifications,
  addNotification,
  dismissNotification,
  clearAllNotifications,
} = useNotifications();

// Usage
addNotification(
  "success",
  "Operation Successful",
  "The item was saved successfully!"
);
addNotification("error", "Operation Failed", "An error occurred while saving.");
```

**Key Features:**

- Auto-generates unique IDs for notifications
- Supports success, error, warning, and info types
- Built-in dismiss functionality
- Clear all notifications at once

### 2. useAsyncOperation

Handles async operations with loading states, error handling, and optional notifications/redirects.

```typescript
import { useAsyncOperation } from "@/lib/hooks";

const { loading, error, execute, reset } = useAsyncOperation({
  showNotifications: true,
  addNotification,
  redirectTo: "/success-page",
  redirectDelay: 1500,
});

// Usage
const handleSubmit = async () => {
  await execute(
    async () => {
      // Your async operation
      const response = await apiCall();
      return response.json();
    },
    "Success message",
    "Error message"
  );
};
```

**Key Features:**

- Automatic loading state management
- Error handling with custom messages
- Optional success notifications
- Automatic redirects after success
- Configurable redirect delays

### 3. useFormData

Manages form state with validation, error handling, and field updates.

```typescript
import { useFormData } from "@/lib/hooks";

const { formData, errors, updateField, validate, reset, isDirty, hasErrors } =
  useFormData({
    initialData: {
      title: "",
      description: "",
      isActive: true,
    },
    validator: (data) => {
      const errors = {};
      if (!data.title.trim()) {
        errors.title = "Title is required";
      }
      return errors;
    },
  });

// Usage
<input
  value={formData.title}
  onChange={(e) => updateField("title", e.target.value)}
/>;
{
  errors.title && <span>{errors.title}</span>;
}
```

**Key Features:**

- Type-safe form data management
- Built-in validation with custom validator functions
- Automatic error clearing on field changes
- Field touch tracking
- Dirty state detection
- Bulk field updates

### 4. useApiData

Fetches and manages API data with loading states and error handling.

```typescript
import { useApiData } from "@/lib/hooks";

const { data, loading, error, refetch, reset } = useApiData<User[]>(
  "http://localhost:8000/api/v1/users/",
  {
    immediate: true, // Fetch on mount
    dependencies: [userId], // Re-fetch when dependencies change
    onSuccess: (data) => console.log("Data loaded:", data),
    onError: (error) => console.error("Failed to load:", error),
  }
);

// Usage in component
if (loading) return <LoadingSpinner />;
if (error) return <div>Error: {error}</div>;
return <UserList users={data} />;
```

**Key Features:**

- Automatic data fetching with fetchWithAuth
- Loading and error state management
- Dependency-based re-fetching
- Success/error callbacks
- Manual refetch capability
- State reset functionality

### 5. useConfirmationModal

Manages confirmation modal state and actions with different variants.

```typescript
import { useConfirmationModal } from "@/lib/hooks";

const {
  isOpen,
  title,
  message,
  loading,
  error,
  confirm,
  closeModal,
  showDeleteConfirmation,
  showGenericConfirmation,
} = useConfirmationModal({
  onConfirm: async (data) => {
    await deleteItem(data.id);
  },
});

// Usage
const handleDelete = (item) => {
  showDeleteConfirmation(item.name, item);
};

// In JSX
<ConfirmationModal
  isOpen={isOpen}
  title={title}
  message={message}
  onConfirm={confirm}
  onClose={closeModal}
  isLoading={loading}
  error={error}
/>;
```

**Key Features:**

- Pre-built delete confirmation patterns
- Custom confirmation dialogs
- Loading states during async operations
- Error handling within modal
- Data passing to confirmation handlers
- Multiple variants (danger, warning, info)

### 6. useTableFilters

Comprehensive table filtering, searching, sorting, and pagination.

```typescript
import { useTableFilters } from '@/lib/hooks';

const {
  filteredData,
  paginatedData,
  searchTerm,
  setSearchTerm,
  filters,
  updateFilter,
  sort,
  currentPage,
  totalPages,
  nextPage,
  prevPage
} = useTableFilters({
  data: assessments,
  searchFields: ['title', 'description', 'learning_path.title'],
  initialFilters: { status: 'all' },
  itemsPerPage: 10,
});

// Usage
<SearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search assessments..."
/>

<select onChange={(e) => updateFilter('status', e.target.value)}>
  <option value="all">All</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</select>

<DataTable
  data={paginatedData}
  onSort={sort}
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={goToPage}
/>
```

**Key Features:**

- Multi-field search with nested object support
- Custom filters with multiple types (boolean, array, string)
- Sorting with type-aware comparison
- Pagination with page controls
- Filter state management
- Statistics (total items, filtered items, etc.)

---

## Hook Combinations

These hooks work well together and can be combined for powerful patterns:

### Complete CRUD Page Pattern

```typescript
import {
  useNotifications,
  useFormData,
  useApiData,
  useAsyncOperation,
  useConfirmationModal,
} from "@/lib/hooks";

export default function CrudPage() {
  // Notifications
  const { notifications, addNotification, dismissNotification } =
    useNotifications();

  // Form management
  const { formData, errors, updateField, validate } = useFormData({
    initialData: { name: "", description: "" },
    validator: (data) => {
      const errors = {};
      if (!data.name) errors.name = "Name is required";
      return errors;
    },
  });

  // Data fetching
  const { data: items, loading, refetch } = useApiData("/api/items");

  // Async operations
  const { loading: saving, execute } = useAsyncOperation({
    showNotifications: true,
    addNotification,
    onSuccess: () => refetch(),
  });

  // Delete confirmation
  const deleteModal = useConfirmationModal({
    onConfirm: async (item) => {
      await deleteItem(item.id);
      refetch();
      addNotification("success", "Item deleted successfully");
    },
  });

  // Handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await execute(
      () => createItem(formData),
      "Item created successfully",
      "Failed to create item"
    );
  };

  const handleDelete = (item) => {
    deleteModal.showDeleteConfirmation(item.name, item);
  };

  // Component JSX...
}
```

### Table with Filters Pattern

```typescript
import { useApiData, useTableFilters, useNotifications } from "@/lib/hooks";

export default function TablePage() {
  const { notifications, addNotification, dismissNotification } =
    useNotifications();
  const { data: rawData, loading } = useApiData("/api/items");

  const {
    paginatedData,
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    sort,
    currentPage,
    totalPages,
    goToPage,
  } = useTableFilters({
    data: rawData || [],
    searchFields: ["name", "description", "category.name"],
    initialFilters: { status: "all", category: "all" },
    itemsPerPage: 20,
  });

  // Component JSX with search, filters, and paginated table...
}
```

---

## Benefits of Custom Hooks

### 1. **Code Reusability**

- Eliminate duplicate state management logic
- Share common patterns across components
- Reduce boilerplate code significantly

### 2. **Consistency**

- Standardized notification patterns
- Consistent error handling
- Uniform loading states

### 3. **Maintainability**

- Centralized logic for common operations
- Easier to update patterns across the app
- Better separation of concerns

### 4. **Type Safety**

- Full TypeScript support
- Generic types for flexible usage
- Compile-time error checking

### 5. **Testing**

- Test hooks independently using @testing-library/react-hooks
- Mock external dependencies
- Test error scenarios

### 6. **TypeScript**

- Use generic types for flexibility
- Provide proper type definitions
- Leverage type inference where possible

---

This hook system provides a robust foundation for building consistent, maintainable React components with significantly less boilerplate code.

## Migration Guide

### Before (without hooks)

```typescript
export default function CreatePage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "" });
  const [errors, setErrors] = useState({});
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, title, message) => {
    const id = Date.now().toString();
    const notification = {
      id,
      type,
      title,
      message,
      onDismiss: dismissNotification,
    };
    setNotifications((prev) => [...prev, notification]);
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetchWithAuth("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        addNotification(
          "success",
          "Item Created",
          "Item has been created successfully!"
        );
        setTimeout(() => router.push("/items"), 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrors({ general: errorData.detail || "Failed to create item" });
        addNotification(
          "error",
          "Creation Failed",
          errorData.detail || "Failed to create item"
        );
      }
    } catch (error) {
      setErrors({ general: "Network error occurred" });
      addNotification("error", "Network Error", "A network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

### After (with hooks)

```typescript
export default function CreatePage() {
  const { notifications, addNotification, dismissNotification } =
    useNotifications();

  const { formData, errors, updateField, validate } = useFormData({
    initialData: { title: "" },
    validator: (data) => {
      const errors = {};
      if (!data.title.trim()) errors.title = "Title is required";
      return errors;
    },
  });

  const { loading, execute } = useAsyncOperation({
    showNotifications: true,
    addNotification,
    redirectTo: "/items",
    redirectDelay: 1500,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await execute(
      () =>
        fetchWithAuth("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }),
      "Item Created Successfully!",
      "Failed to create item"
    );
  };

  // ... rest of component (much cleaner!)
}
```

**Lines of Code Reduction:** ~60 lines → ~25 lines (58% reduction)

## Best Practices

### 1. **Hook Composition**

- Combine multiple hooks for complex functionality
- Keep individual hooks focused on single responsibilities
- Use hook return values descriptively

### 2. **Error Handling**

- Always handle errors gracefully in hooks
- Provide meaningful error messages
- Use notifications for user feedback

### 3. **Performance**

- Use useMemo and useCallback where appropriate
- Avoid unnecessary re-renders
- Consider dependencies carefully

### 4. **Testing**

- Test hooks independently using @testing-library/react-hooks
- Mock external dependencies
- Test error scenarios

### 5. **TypeScript**

- Use generic types for flexibility
- Provide proper type definitions
- Leverage type inference where possible

---

This hook system provides a robust foundation for building consistent, maintainable React components with significantly less boilerplate code.
