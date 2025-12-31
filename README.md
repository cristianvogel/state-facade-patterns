# State Facade Pattern Guide

A lightweight, intuitive state management pattern for Svelte 5 (Runes Mode) that provides reactive state with a natural API.

## Installation

Copy `state-facade.svelte.ts` to your project's utility folder (e.g., `src/lib/utils/` or `src/lib/`).

## Core Concept

The State Facade creates reactive state objects that:
- Act like plain JavaScript objects (direct property access)
- Maintain Svelte 5 reactivity automatically
- Provide utility methods for batch updates and resets
- [Work seamlessly](https://svelte.dev/docs/svelte/$state#Passing-state-across-modules) across components and `.svelte.ts` modules

## Basic Usage

### 1. Create Your State File

Create a dedicated file for your application state (e.g., `src/lib/state.svelte.ts`):
```typescript
import { reactiveState } from '$lib/utils/state-facade.svelte';

// Define your state shape
interface AppState {
    count: number;
    user: {
        name: string;
        email: string;
    };
    isLoading: boolean;
}

// Create the reactive state with initial values
export const AppState = reactiveState<AppState>({
    count: 0,
    user: {
        name: '',
        email: ''
    },
    isLoading: false
});
```

### 2. Use in Svelte Components
```svelte
<script lang="ts">
    import { AppState } from '$lib/state.svelte';
    
    // Direct reactive access - automatically reactive!
    const count = $derived(AppState.count);
    const userName = $derived(AppState.user.name);
    
    function increment() {
        // Direct assignment - simple and intuitive
        AppState.count++;
    }
    
    function updateUser() {
        // Batch update multiple properties
        AppState.update({
            user: { name: 'Alice', email: 'alice@example.com' },
            isLoading: false
        });
    }
</script>

<div>
    <p>Count: {count}</p>
    <p>User: {userName}</p>
    <button onclick={increment}>Increment</button>
    <button onclick={updateUser}>Update User</button>
</div>
```

### 3. Use in *.svelte.ts TypeScript Files

First, read [the official documentation](https://svelte.dev/docs/svelte/$state#Passing-state-across-modules) about passing state across modules in Svelte 5.


```typescript
import { AppState } from '$lib/state.svelte';

export function initializeApp() {
    // Direct property access
    AppState.isLoading = true;
    
    // Read values
    console.log(AppState.count); // 0
    
    // Batch updates
    AppState.update({
        count: 10,
        isLoading: false
    });
}

export function getUserInfo() {
    // Get full state snapshot
    const snapshot = AppState.current;
    return snapshot.user;
}
```

## API Reference

### `reactiveState<T>(initial: T)`

Creates a reactive state facade.

**Returns:** A proxy object with state properties and utility methods

#### Properties

Access any property from your initial state directly:
```typescript
// Read
const value = MyState.propertyName;

// Write
MyState.propertyName = newValue;
```

#### Methods

##### `.current` (getter)

Returns a snapshot of the entire state object.
```typescript
const snapshot = AppState.current;
console.log(snapshot); // { count: 0, user: {...}, isLoading: false }
```

**Use case:** When you need the complete state at a point in time, for logging, serialization, or passing to functions.

##### `.update(partial)`

Updates multiple properties at once.
```typescript
AppState.update({
    count: 5,
    isLoading: true
});
```

**Use case:** Batch updates, reducing reactivity triggers, updating related properties together.

##### `.reset()`

Resets state back to initial values.
```typescript
AppState.reset();
```

**Use case:** Logout flows, clearing forms, resetting game state, testing.

##### `.subscribe(callback)`

Runs a callback whenever state changes (using `$effect` internally).
```typescript
AppState.subscribe((state) => {
    console.log('State changed:', state);
    localStorage.setItem('app-state', JSON.stringify(state));
});
```

**Use case:** Persistence, analytics, logging, side effects.

**Returns:** The current state (for immediate use in setup).

## Common Patterns

### Multiple State Objects

Organize state by domain/feature:
```typescript
// src/lib/state.svelte.ts
import { reactiveState } from '$lib/utils/state-facade.svelte';

// UI State
export const UIState = reactiveState({
    theme: 'dark' as 'light' | 'dark',
    sidebarOpen: false,
    modalOpen: false
});

// User State
export const UserState = reactiveState({
    id: null as string | null,
    name: '',
    role: 'guest' as 'guest' | 'user' | 'admin'
});

// App State
export const AppState = reactiveState({
    isLoading: false,
    error: null as string | null,
    version: '1.0.0'
});
```

### With Local Storage Persistence
```typescript
import { reactiveState } from '$lib/utils/state-facade.svelte';
import { browser } from '$app/environment';

// Load from localStorage if available
const initialState = browser 
    ? JSON.parse(localStorage.getItem('settings') ?? '{}')
    : {};

export const Settings = reactiveState({
    volume: 0.8,
    notifications: true,
    ...initialState
});

// Persist changes
if (browser) {
    Settings.subscribe((state) => {
        localStorage.setItem('settings', JSON.stringify(state));
    });
}
```

### Backend/API Integration
```typescript
// State for Tauri backend communication
export const BackendState = reactiveState({
    connected: false,
    lastSync: null as Date | null,
    pendingRequests: 0
});

// Tauri event listener
async function setupBackendListeners() {
    await listen('backend-connected', () => {
        BackendState.update({
            connected: true,
            lastSync: new Date()
        });
    });
    
    await listen('sync-progress', (event) => {
        BackendState.pendingRequests = event.payload.count;
    });
}
```

### Computed/Derived State
```typescript
export const CartState = reactiveState({
    items: [] as CartItem[],
    tax: 0.08
});

// Derived values in components
const subtotal = $derived(
    CartState.items.reduce((sum, item) => sum + item.price, 0)
);

const total = $derived(subtotal * (1 + CartState.tax));
```

### Form State Management
```svelte
<script lang="ts">
    import { reactiveState } from '$lib/utils/state-facade.svelte';
    
    const FormState = reactiveState({
        name: '',
        email: '',
        message: '',
        errors: {} as Record<string, string>
    });
    
    function handleSubmit() {
        if (!FormState.name) {
            FormState.errors = { ...FormState.errors, name: 'Required' };
            return;
        }
        
        // Submit form...
        FormState.reset(); // Clear after success
    }
</script>

<form onsubmit={handleSubmit}>
    <input bind:value={FormState.name} />
    {#if FormState.errors.name}
        <span class="error">{FormState.errors.name}</span>
    {/if}
    
    <input bind:value={FormState.email} />
    <textarea bind:value={FormState.message} />
    
    <button type="submit">Submit</button>
</form>
```

## Best Practices

### ✅ DO

- **Keep state flat when possible** - Easier to update and reason about
- **Group related state** - Create multiple state objects by domain
- **Use `.update()` for batch changes** - More efficient than multiple assignments
- **Type your state** - Define interfaces for better IntelliSense and type safety
- **Use `.current` for snapshots** - When passing state to non-reactive functions
- **Reset on cleanup** - Use `.reset()` in logout, navigation, or cleanup flows

### ❌ DON'T

- **Don't mutate nested objects directly** - Use `.update()` or replace the entire object
- **Don't create reactive state inside components** - Define at module level for sharing
- **Don't over-subscribe** - Use `.subscribe()` sparingly, prefer `$derived` in components
- **Don't store derived/computed values** - Calculate them on-the-fly with `$derived`

## TypeScript Tips

### Export Types for Reuse
```typescript
export interface AppStateShape {
    count: number;
    user: User;
}

export const AppState = reactiveState<AppStateShape>({
    count: 0,
    user: { name: '', email: '' }
});

// Use the type elsewhere
export type AppStateType = typeof AppState;
```

### Type-Safe Updates
```typescript
// TypeScript will enforce correct property names and types
AppState.update({
    count: 10,        // ✅ Valid
    // countt: 10,    // ❌ TypeScript error
    // count: 'ten'   // ❌ TypeScript error
});
```

## Migration from Other Patterns

### From Svelte Stores

**Before:**
```typescript
import { writable } from 'svelte/store';

export const count = writable(0);

// Usage
$count = 5;
count.update(n => n + 1);
```

**After:**
```typescript
import { reactiveState } from '$lib/utils/state-facade.svelte';

export const AppState = reactiveState({ count: 0 });

// Usage
AppState.count = 5;
AppState.count++;
```

### From Context API

```typescript
// Define once
export const AppState = reactiveState({ count: 0 });

// Import anywhere
import { AppState } from '$lib/state.svelte';
```

## Testing
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AppState } from '$lib/state.svelte';

describe('AppState', () => {
    beforeEach(() => {
        AppState.reset();
    });
    
    it('should initialize with default values', () => {
        expect(AppState.count).toBe(0);
    });
    
    it('should update properties', () => {
        AppState.count = 5;
        expect(AppState.count).toBe(5);
    });
    
    it('should batch update', () => {
        AppState.update({ count: 10, isLoading: true });
        expect(AppState.current).toEqual({
            count: 10,
            isLoading: true,
            // ... other properties
        });
    });
    
    it('should reset to initial state', () => {
        AppState.count = 100;
        AppState.reset();
        expect(AppState.count).toBe(0);
    });
});
```

## Debugging Tips

### Log State Changes
```typescript
AppState.subscribe((state) => {
    console.log('[AppState]', state);
});
```

### Inspect Current State
```typescript
// In browser console or debug statements
console.log(AppState.current);
```

### Track Specific Property Changes
use the awesome `$inspect()` Rune ( see [docs](https://svelte.dev/docs/svelte/$inspect) )

## When NOT to Use

- **For truly local component state** - Use `$state()` directly
- **For props/parameters** - Pass them normally
- **For one-off values** - Don't over-engineer simple cases
- **For large datasets** - Consider specialized data management solutions

## Summary

The State Facade pattern provides:
- 🎯 **Intuitive API** - Feels like plain objects
- ⚡ **Full Reactivity** - Powered by Svelte 5 runes
- 🔧 **Zero Boilerplate** - One line to create state
- 📦 **Framework Agnostic** - Easy to understand and port
- 🎨 **Flexible** - Works in components, modules, and utilities
- 🧪 **Testable** - Simple to mock and verify

Start with simple state, refactor as complexity grows. The facade grows with your needs! 🚀
