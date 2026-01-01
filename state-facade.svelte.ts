// Best solution! 
// This example is for managing the Front End State of an App

export type AppFrontEndState = {
    counter: number,
    ramenMode: boolean,
    preferredFileStem: string;
    incrementCounter: ()=>{};
}



export class FrontEndStateService {
    private readonly _state: AppFrontEndState;
    
    constructor() {
        this._state = $state(defaultFrontEndState);
        
        // Auto-generate getters/setters for all properties
        this.createAccessors();
    }

    private createAccessors() {
        const keys = Object.keys(this._state) as (keyof AppFrontEndState)[];
        
        for (const key of keys) {
            Object.defineProperty(this, key, {
                get() {
                    return this._state[key];
                },
                set(value: any) {
                    this._state[key] = value;
                },
                enumerable: true,
                configurable: true
            });
        }
    }

    incrementCounter() {
        this._state.counter++;
    }

    get current(): AppFrontEndState {
        return this._state;
    }

    get snapshot(): AppFrontEndState {
        return $state.snapshot(this._state) as AppFrontEndState;
    }
}

// Add type assertion to make TypeScript happy
export const frontEndState = new FrontEndStateService() as FrontEndStateService & AppFrontEndState;
