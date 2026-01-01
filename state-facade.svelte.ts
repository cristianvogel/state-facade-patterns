import type {Snapshot} from "@sveltejs/kit";

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
export function reactiveState<T extends Record<string, any>>(initial: T): ReactiveState<T> {
    // Capture a deep clone of the initial state for resets
    const startValue = structuredClone(initial);
    let state = $state(initial);

    const api = {
        /**
         * Get a reactive state object
         */
        get current(): T {
            return state ;
        },

        get snapshot(): Snapshot<T> {
            return $state.snapshot(state)  as Snapshot<T>;
        },

        /**
         * Update multiple properties at once
         */
        update(partial: Partial<T>): void {
            Object.assign(state, partial);
        },

        /**
         * Reset state to initial values
         */
        reset(): void {
            Object.assign(state, structuredClone(startValue));
        }
    };

    // forwards unknown keys to the reactive store
    const apiKeys = new Set(Object.keys(api));

    return new Proxy(api, {
        get(t, p) {
            return apiKeys.has(String(p)) ? (t as any)[p] : (state as any)[p];
        },
        set(t, p, v) {
            if (apiKeys.has(String(p))) {
                console.warn(`Cannot overwrite protected method "${String(p)}".`);
                return false;
            }
            (state as any)[p] = v;
            return true;
        },
        has(t, p) {
            return apiKeys.has(String(p)) || p in state;
        },
        ownKeys(t) {
            return [...Reflect.ownKeys(t), ...Reflect.ownKeys(state)];
        },
        getOwnPropertyDescriptor(t, p) {
            if (apiKeys.has(String(p))) {
                return Reflect.getOwnPropertyDescriptor(t, p);
            }
            return {
                enumerable: true,
                configurable: true,
                writable: true,
                value: (state as any)[p]
            };
        }
    }) as ReactiveState<T>;
}

/**
 * Type helper for reactive state objects
 */
export type ReactiveState<T> = T & {
    readonly current: T;
    readonly snapshot: Snapshot<T>;
    update(partial: Partial<T>): void;
    reset(): void;
};
