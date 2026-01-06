# Code Conventions and Best Practices

This document outlines the coding conventions and best practices used throughout the codebase.

## Import Order

Imports should be organized in the following order, with blank lines between groups:

1. **React and Next.js core imports**
   ```typescript
   import { useEffect, useState } from 'react';
   import Link from 'next/link';
   import { useRouter, useParams } from 'next/navigation';
   ```

2. **Third-party libraries**
   ```typescript
   import { toast } from 'sonner';
   ```

3. **Internal components** (alphabetically)
   ```typescript
   import ConfirmModal from '@/components/ConfirmModal';
   import Spinner from '@/components/Spinner';
   import BasicInfoSection from '@/components/forms/BasicInfoSection';
   ```

4. **Internal hooks** (alphabetically)
   ```typescript
   import { useFoodForm } from '@/hooks/useFoodForm';
   import { useSaveFood } from '@/hooks/useSaveFood';
   ```

5. **Internal utilities and libs** (alphabetically)
   ```typescript
   import { getDictionary } from '@/lib/get-dictionary';
   import { supabase } from '@/lib/supabase';
   import { deleteFoodRecord } from '@/utils/api';
   import { cleanFoodData, extractImageUrls } from '@/utils/form-helpers';
   ```

6. **Type imports** (using `import type`)
   ```typescript
   import type { Food } from '@/types/food';
   ```

## Component Structure

Components should follow this structure:

```typescript
'use client'; // If needed

// 1. Imports (as above)

// 2. Type definitions (if any)
type ViewMode = 'grid' | 'table';

// 3. Constants (outside component if shared, inside if component-specific)
const CONSTANT_VALUE = 'value';

export default function ComponentName() {
  // 4. Hooks (React hooks, Next.js hooks, custom hooks)
  const router = useRouter();
  const { id, lang } = useParams();
  const { formData, updateField } = useCustomHook();

  // 5. State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // 6. Derived values (computed from state/props)
  const t = dict?.section || {};
  const processedData = useMemo(() => { ... }, [dependencies]);

  // 7. Constants (component-specific)
  const LOCAL_CONFIG = { ... };

  // 8. Effects
  useEffect(() => { ... }, [dependencies]);

  // 9. Data fetching functions
  async function fetchData() { ... }

  // 10. Event handlers
  const handleClick = () => { ... };
  const handleSubmit = async (e: React.FormEvent) => { ... };

  // 11. Early returns (loading states, error states)
  if (loading) return <Loading />;

  // 12. Render
  return ( ... );
}
```

## Function Organization

Within components, organize functions in this order:

1. **Data fetching functions** - Functions that fetch data from APIs/database
2. **Event handlers** - Functions that handle user interactions
3. **Helper functions** - Pure utility functions used within the component
4. **Render helpers** - Functions that return JSX fragments

## Naming Conventions

- **Components**: PascalCase (`FoodCard`, `ImageGallery`)
- **Hooks**: camelCase starting with `use` (`useFoodForm`, `useSaveFood`)
- **Functions**: camelCase (`handleClick`, `fetchData`)
- **Constants**: UPPER_SNAKE_CASE (`TAB_CONFIG`, `NUMERIC_FIELDS`)
- **Types/Interfaces**: PascalCase (`FoodFormData`, `ViewMode`)
- **Files**: Match the export (PascalCase for components, camelCase for utilities)

## Comments

Use comments to organize sections:
- `// Hooks` - React and custom hooks
- `// State` - useState declarations
- `// Derived values` - Computed values, useMemo results
- `// Constants` - Component-specific constants
- `// Effects` - useEffect hooks
- `// Data fetching` - API/database calls
- `// Event handlers` - User interaction handlers
- `// Computed values` - useMemo, derived state

## Best Practices

1. **Always use `import type` for type-only imports**
2. **Group related imports together** (components, hooks, utils)
3. **Order hooks before state** when hooks don't depend on state
4. **Place custom hooks after state** if they depend on state values
5. **Use descriptive section comments** to organize code
6. **Keep constants at the top** (outside component if shared)
7. **Early returns** should come after hooks/state but before main render
8. **Consistent spacing** - blank line between import groups and code sections

## Examples

See the following files for reference:
- `src/app/[lang]/edit/[id]/page.tsx` - Complex page component
- `src/app/[lang]/manage/page.tsx` - Page with data fetching
- `src/components/forms/ImageGallery.tsx` - Reusable component
- `src/hooks/useFoodForm.ts` - Custom hook





