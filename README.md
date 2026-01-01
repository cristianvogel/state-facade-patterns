[state-facade-guide.md](https://github.com/user-attachments/files/24400993/state-facade-guide.md)
# Reactive State Facade User Guide

A lightweight facade for Svelte 5 that makes reactive state feel like working with plain objects while maintaining full reactivity.

## Installation

```typescript
import { reactiveState } from './state-facade.svelte';
```

## Basic Usage

### Creating Reactive State

```typescript
export const AppState = reactiveState({
  count: 0,
  user: { name: 'Alice', age: 30 },
  settings: { theme: 'dark' }
});
```

### Direct Property Access

The facade allows natural object-style access while maintaining reactivity:

```typescript
// Read values
console.log(AppState.count); // 0

// Update values
AppState.count = 5;
AppState.user.name = 'Bob';

// Works in Svelte components automatically
<button onclick={() => AppState.count++}>
  Clicked {AppState.count} times
</button>
```

## Utility Methods

### `update()` - Batch Updates

Update multiple properties at once:

```typescript
AppState.update({
  count: 10,
  user: { name: 'Charlie', age: 25 }
});
```

### `reset()` - Restore Initial State

Reset all properties to their initial values:

```typescript
AppState.reset();
// All values return to what they were when created
```

### `current` - Access Full State

Get the full reactive state object:

```typescript
const fullState = AppState.current;
// Returns: { count: 0, user: {...}, settings: {...} }
```

### `snapshot` - Non-Reactive Copy

Get a non-reactive snapshot of the current state:

```typescript
const snapshot = AppState.snapshot;
// Returns a plain object, not reactive
// Useful for serialization or comparisons
```

## Debugging with `$inspect`

One of the most powerful features of this facade is **seamless compatibility with Svelte 5's `$inspect` rune**. The Proxy-based design ensures that `$inspect` works exactly as it would with raw `$state`.

### Basic Inspection

```typescript
// Inside a .svelte.ts file or component
export const AppState = reactiveState({
  count: 0,
  user: { name: 'Alice' }
});

$inspect(AppState.count); // ✅ Logs whenever count changes
$inspect(AppState.user);  // ✅ Logs whenever user changes
```

### Deep Inspection

```typescript
$inspect(AppState); // ✅ Logs whenever ANY property changes
```

When you modify the state:

```typescript
AppState.count = 5;
// Console output: count: 5

AppState.user.name = 'Bob';
// Console output: user: { name: 'Bob' }

AppState.update({ count: 10, user: { name: 'Charlie' } });
// Console output: count: 10, user: { name: 'Charlie' }
```

### Custom Inspection Labels

```typescript
$inspect('AppState count:', AppState.count);
$inspect('Full state:', AppState);
```

### Conditional Inspection

```typescript
$inspect(AppState.count).with((value) => {
  if (value > 10) {
    console.log('Count exceeded threshold!');
  }
});
```

## Advanced Patterns

### Component-Level State

```svelte
<script lang="ts">
  import { reactiveState } from './state-facade.svelte';
  
  const localState = reactiveState({
    isOpen: false,
    selected: null as string | null
  });
  
  $inspect('Modal state:', localState.isOpen);
</script>

<button onclick={() => localState.isOpen = true}>
  Open Modal
</button>

{#if localState.isOpen}
  <dialog>...</dialog>
{/if}
```

### Global Application State

```typescript
// stores/app-state.svelte.ts
export const AppState = reactiveState({
  user: null as User | null,
  theme: 'light' as 'light' | 'dark',
  notifications: [] as Notification[]
});

// Enable debugging in development
if (import.meta.env.DEV) {
  $inspect('App State:', AppState);
}
```

### Form State Management

```typescript
export const FormState = reactiveState({
  email: '',
  password: '',
  errors: {} as Record<string, string>
});

$inspect('Form errors:', FormState.errors);

function submitForm() {
  // Validate
  FormState.errors = validateForm(FormState);
  
  if (Object.keys(FormState.errors).length === 0) {
    // Submit
    api.login(FormState.current);
    FormState.reset(); // Clear form
  }
}
```

### Derived State Integration

The facade works perfectly with Svelte 5 derived state:

```typescript
export const CartState = reactiveState({
  items: [] as CartItem[],
  taxRate: 0.1
});

export const cartTotal = $derived(
  CartState.items.reduce((sum, item) => sum + item.price, 0)
);

export const totalWithTax = $derived(
  cartTotal * (1 + CartState.taxRate)
);

$inspect('Cart total:', cartTotal);
$inspect('Total with tax:', totalWithTax);
```

## Why $inspect Works Seamlessly

The facade uses a Proxy that delegates property access directly to the underlying `$state`:

- **Property reads** pass through to the reactive state, maintaining reactivity tracking
- **Property writes** update the reactive state, triggering reactivity
- **`$inspect`** sees the reactive values, not wrapper objects

This means you get the ergonomics of plain objects with the full debugging power of Svelte's reactive system.

## TypeScript Support

The facade is fully typed, providing excellent autocomplete and type checking:

```typescript
export const AppState = reactiveState({
  count: 0,
  user: { name: 'Alice', age: 30 }
});

// ✅ TypeScript knows these properties
AppState.count = 5;
AppState.user.name = 'Bob';

// ❌ TypeScript error
AppState.nonexistent = 'value';

// ✅ Utility methods are typed
AppState.update({ count: 10 }); // OK
AppState.update({ invalid: 10 }); // Error
```

## Protected Method Names

The following method names are protected and cannot be overwritten:

- `current`
- `snapshot`
- `update`
- `reset`

Attempting to assign to these will log a warning and fail:

```typescript
AppState.update = () => {}; // ⚠️ Warning, no effect
```

## Best Practices

1. **Use `update()` for multiple changes** to keep related updates together
2. **Use `snapshot` for serialization** (e.g., saving to localStorage)
3. **Use `$inspect` liberally in development** to understand state changes
4. **Use `reset()` for form clearing** or returning to initial states
5. **Create focused state objects** rather than one giant state blob

## Performance Notes

- The Proxy overhead is negligible for typical use cases
- Deep reactive updates work as expected (nested objects remain reactive)
- `structuredClone` is used for `reset()`, which works with most data types

## Troubleshooting

### $inspect not showing changes

Make sure you're accessing the property directly, not through an intermediate variable:

```typescript
// ✅ Works
$inspect(AppState.count);

// ❌ Won't track changes
const count = AppState.count;
$inspect(count);
```

### Reactivity not working

Ensure you're modifying the state object itself, not a detached reference:

```typescript
// ✅ Works
AppState.user.name = 'Bob';

// ❌ Won't be reactive
const user = AppState.user;
user.name = 'Bob'; // This will work, but...
const newUser = { name: 'Bob' };
user = newUser; // This won't update AppState
```

## Example: Complete Todo App

```typescript
// stores/todo-state.svelte.ts
export const TodoState = reactiveState({
  todos: [] as Array<{ id: number; text: string; done: boolean }>,
  filter: 'all' as 'all' | 'active' | 'completed'
});

export const filteredTodos = $derived(
  TodoState.filter === 'all'
    ? TodoState.todos
    : TodoState.todos.filter(t => 
        TodoState.filter === 'completed' ? t.done : !t.done
      )
);

// Debug in development
if (import.meta.env.DEV) {
  $inspect('Todos:', TodoState.todos);
  $inspect('Filter:', TodoState.filter);
  $inspect('Filtered result:', filteredTodos);
}

export function addTodo(text: string) {
  TodoState.todos = [
    ...TodoState.todos,
    { id: Date.now(), text, done: false }
  ];
}

export function toggleTodo(id: number) {
  const todo = TodoState.todos.find(t => t.id === id);
  if (todo) todo.done = !todo.done;
}

export function clearCompleted() {
  TodoState.todos = TodoState.todos.filter(t => !t.done);
}
```

## Summary

The reactive state facade provides a clean, intuitive API for managing Svelte 5 state while maintaining full compatibility with Svelte's reactive system. The **seamless integration with `$inspect`** makes it an excellent choice for both development and production, giving you powerful debugging capabilities without any special configuration.
