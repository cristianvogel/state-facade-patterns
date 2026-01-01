FrontEndStateService – Svelte Front‑End State Manager
A tiny utility that wraps a Svelte $state store, auto‑creates getters/setters for every field in AppFrontEndState, and provides a few helpers (incrementCounter, current, snapshot).

Files
src/
 └─ lib/
     ├─ defaultFrontEndState.ts   // default values for the state
     ├─ AppFrontEndState.ts       // type definition (see below)
     └─ FrontEndStateService.ts   // implementation
AppFrontEndState
export type AppFrontEndState = {
    counter: number;
    ramenMode: boolean;
    preferredFileStem: string;
};
FrontEndStateService.ts (core)
import { defaultFrontEndState } from './defaultFrontEndState';
import type { AppFrontEndState } from './AppFrontEndState';

export class FrontEndStateService {
    private readonly _state: AppFrontEndState = $state(defaultFrontEndState);

    constructor() {
        this.createAccessors();
    }

    /** Dynamically generate a getter/setter for each key */
    private createAccessors() {
        const keys = Object.keys(this._state) as (keyof AppFrontEndState)[];
        for (const key of keys) {
            Object.defineProperty(this, key, {
                get: () => this._state[key],
                set: (v: any) => { this._state[key] = v; },
                enumerable: true,
                configurable: true,
            });
        }
    }

    /** Example helper – increments the numeric counter */
    incrementCounter() {
        this._state.counter++;
    }

    /** Live reference to the underlying store */
    get current(): AppFrontEndState {
        return this._state;
    }

    /** Immutable snapshot (good for persisting or debugging) */
    get snapshot(): AppFrontEndState {
        return $state.snapshot(this._state) as AppFrontEndState;
    }
}

/* Export a ready‑to‑use singleton */
export const frontEndState =
    new FrontEndStateService() as FrontEndStateService & AppFrontEndState;
Quick Usage
import { frontEndState } from '$lib/FrontEndStateService';

// Read / write like ordinary properties
frontEndState.counter = 5;
console.log(frontEndState.ramenMode);

// Use the helper method
frontEndState.incrementCounter();

// Get a read‑only copy
const saved = frontEndState.snapshot;
The generated getters/setters trigger Svelte’s reactivity automatically, so any component that accesses frontEndState.xxx will re‑render when that value changes.

Extending
Add a new field: update AppFrontEndState and defaultFrontEndState; the accessor loop picks it up automatically.
Add custom helpers: simply define additional methods on FrontEndStateService that manipulate _state.

License
MIT © 2025 Proton (Lumo). Feel free to adapt as needed.
