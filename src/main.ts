import validator from 'validator'; //validator.js

/////////////////
//             //
//  CONSTANTS  //
//             //
/////////////////

export const VALID: symbol = Symbol("VALID");
export const INVALID: symbol = Symbol("INVALID");

//////////////
//          //
//  STATES  //
//          //
//////////////

type States = WeakMap<Spec, SpecState>;
const states: States = new WeakMap();

////////////
//        //
//  SPEC  //
//        //
////////////

type Validator = keyof typeof validator;
type Key<Type> = Type;
type Value<Type> = (...args: any[]) => Type;

// Spec State Interface

interface SpecState {
    name: string,
    input?: string,
    error?: string,
    conformed?: string,
    fns: Map<Key<Validator>, [Value<any>, any[]]>
}

// Spec

class Spec {
    /**
     * Spec constructor.
     * @param name 
     */
    protected constructor(name: string) {
        const state: SpecState = { name, fns: new Map() };
        states.set(this, state);
        (Object.keys(validator) as Key<Validator>[]).forEach((method): void => {
            Spec.prototype[method] = (...args: any[]): Spec => {
                state.fns.set(method, [(validator[(method as Key<Validator>)] as Value<any>).bind(validator), args]);
                return this;
            }
        });
    }

    /**
     * Validation methods.
     */
    [index: string]: Value<Spec>

    // STATIC

    /**
     * Creates new Spec instance.
     * @param name 
     * @returns 
     */
    public static spec(name: string): Spec {
        return new Spec(name);
    }

    /**
     * Check validation chain.
     * @param spec 
     * @param input 
     * @returns 
     */
    public static check(spec: Spec, input: any): SpecState {
        const state: SpecState = states.get(spec) as SpecState;
        state.input = '' + input;
        state.conformed = undefined;
        state.error = undefined;
        if (state.fns.size === 0) {
            state.conformed = state.input;
        } else {
            state.fns.forEach((tuple: any[], method: Key<Validator>): void => {
                let fn: Value<any> = tuple[0];
                let args: any[] = tuple[1];
                let { name, input, error, conformed } = state;
                if (error === undefined) {
                    let str = conformed === undefined ? input : conformed;
                    let result = fn.call(spec, str, ...args);
                    if (result === false) {
                        state.error = `spec: '${name}', rule: ${method}(${args.map(arg => JSON.stringify(arg)).join(',')}) - failed with "${str}"`;
                    } else {
                        state.conformed = typeof result === 'boolean' ? conformed : result;
                    }
                }
            });
        }
        return state;
    }
}



let foo = Spec.spec('foo').isInt({ min: 0 }).toInt()
//console.log(foo)
// console.log(foo.isInt)
// console.log(foo.isInt({ min: 0 }).toInt())
console.log(Spec.check(foo, '10'))

