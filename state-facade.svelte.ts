/**
 * Creates a reactive state object with Svelte 5 runes that acts like a plain object
 * while maintaining reactivity through getters/setters and providing utility methods.
 *
 * @example
 * ```ts
 * export const AppState = reactiveState({
 *   count: 0,
 *   user: { name: 'NEL' }
 * });
 *
 * // Direct access (reactive)
 * AppState.count = 5;
 * console.log(AppState.count);
 *
 * // Batch updates
 * AppState.update({ count: 10 });
 *
 * // Full snapshot
 * const snapshot = AppState.current;
 * ```
 */
export function reactiveState<T extends Record<string, any>>(initial: T) {
    let state = $state(initial);

    const api = {
        /**
         * Get a snapshot of the entire state object
         */
        get current(): T {
            return state;
        },

        /**
         * Update multiple properties at once
         */
        update(partial: Partial<T>): void {
            state = { ...state, ...partial };
        },

        /**
         * Reset state to initial values
         */
        reset(): void {
            state = { ...initial };
        },

        /**
         * Subscribe to state changes (if needed for effects)
         * Returns the current state for immediate use
         */
        subscribe(callback: (state: T) => void): T {
            $effect(() => {
                callback(state);
            });
            return state;
        }
    };

    return new Proxy(api, {
        get(target, prop) {
            // Return API methods first
            if (prop in target) {
                return target[prop as keyof typeof target];
            }
            // Then proxy to state properties
            return state[prop as keyof T];
        },

        set(target, prop, value) {
            // Prevent overriding API methods
            if (prop in target) {
                return false;
            }
            // Update state property
            state = { ...state, [prop]: value };
            return true;
        },

        has(target, prop) {
            return prop in target || prop in state;
        },

        ownKeys(target) {
            return [...Object.keys(target), ...Object.keys(state)];
        },

        getOwnPropertyDescriptor(target, prop) {
            if (prop in target) {
                return Object.getOwnPropertyDescriptor(target, prop);
            }
            return {
                enumerable: true,
                configurable: true,
                value: state[prop as keyof T]
            };
        }
    }) as T & typeof api;
}

/**
 * Type helper for reactive state objects
 */
export type ReactiveState<T> = T & {
    readonly current: T;
    update(partial: Partial<T>): void;
    reset(): void;
    subscribe(callback: (state: T) => void): T;
};