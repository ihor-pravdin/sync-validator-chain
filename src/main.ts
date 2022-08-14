import vjs from 'validator'; // validator.js

/////////////////
//             //
//  CONSTANTS  //
//             //
/////////////////

export const VALID: symbol = Symbol("VALID");
export const INVALID: symbol = Symbol("INVALID");

//////////////////////////
//                      //
//  TYPES & INTERFACES  //
//                      //
//////////////////////////

type States = WeakMap<Validators, ValidatorStates>;
type VJS = keyof typeof vjs;
type Key<T> = T;
type Value<T> = (...args: any[]) => T;
type Validators = Spec | Schema;
type ValidatorStates = SpecState | SchemaState;

interface StateInterface {
    name: string
    input?: any
    conformed?: any
}

interface SpecState extends StateInterface {
    error?: string
    fns: Map<Key<VJS>, [Value<any>, any[]]>
}

interface SchemaState extends StateInterface {
    errors: any[]
    req: Validators[]
    opt: Validators[]
}

//////////////
//          //
//  STATES  //
//          //
//////////////

const states: States = new WeakMap(); // states of validator chains

////////////
//        //
//  SPEC  //
//        //
////////////

export class Spec {
    /**
     * Spec Constructor
     * @param name 
     */
    protected constructor(name: string) {
        const state: SpecState = { name, fns: new Map() };
        states.set(this, state);
        (Object.keys(vjs) as Key<VJS>[]).forEach((method): void => {
            Spec.prototype[method] = (...args: any[]): Spec => {
                state.fns.set(method, [(vjs[(method as Key<VJS>)] as Value<any>).bind(vjs), args]);
                return this;
            }
        });
    }

    /**
     * Coppied validation rules from validator.js
     */
    [index: string]: Value<Spec>

    /**
     * Factory method. Creates new Spec validation chain.
     * @param name 
     * @returns 
     */
    public static spec(name: string): Spec {
        return new Spec(name);
    }

    /**
     * Checks input value according to validation chain rules.
     * @param spec 
     * @param input 
     * @returns 
     */
    public static check(spec: Spec, input: any): SpecValidationResult {
        const state: SpecState = states.get(spec) as SpecState;
        state.input = '' + input;
        state.conformed = undefined;
        state.error = undefined;
        if (state.fns.size === 0) {
            state.conformed = state.input;
        } else {
            state.fns.forEach(([fn, args]: [fn: Value<any>, args: any[]], method: Key<VJS>): void => {
                let { name, input, error, conformed }: SpecState = state;
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
        return new SpecValidationResult(state);
    }
}

//////////////////////////////
//                          //
//  SPEC VALIDATION RESULT  //
//                          //
//////////////////////////////

class SpecValidationResult {
    isValid: () => boolean
    conform: () => any
    explain: () => any

    constructor({ name, input, error, conformed, fns }: SpecState) {
        this.isValid = () => error === undefined;
        this.conform = () => this.isValid() ? conformed || input : INVALID;
        this.explain = () => this.isValid() ? VALID : { spec: name, message: error, rules: [...fns.keys()] };
    }
}

//////////////
//          //
//  SCHEMA  //
//          //
//////////////

export class Schema {
    /**
     * Schema Constructor
     * @param name 
     * @param fields 
     */
    protected constructor(name: string, { req = [], opt = [] }: { req?: Validators[], opt?: Validators[] }) {
        const state: SchemaState = { name, errors: [], req, opt };
        states.set(this, state);
    }

    /**
     * Factory method. Creates new Schema validator.
     * @param name 
     * @param input 
     * @returns 
     */
    public static schema(name: string, input: any): Schema {
        return new Schema(name, input);
    }

    /**
     * Checks input value according to validation schema.
     * @param schema 
     * @param input 
     */
    public static check(schema: Schema, input: any): SchemaValidationResult {
        const state: SchemaState = states.get(schema) as SchemaState;
        state.input = input || {};
        state.conformed = undefined;
        state.errors = [];
        let field;
        state.req.forEach(validator => {
            field = (states.get(validator) as ValidatorStates).name;
            if (state.input[field] !== undefined) {
                Schema.#check(state, validator);
            } else {
                state.errors = [...state.errors, {
                    schema: state.name,
                    message: `Required field '${field}' is missing for schema '${state.name}'.`
                }];
            }
        });
        state.opt.forEach(validator => {
            field = (states.get(validator) as ValidatorStates).name;
            if (state.input[field] !== undefined) {
                Schema.#check(state, validator);
            }
        });
        return new SchemaValidationResult(state);
    }

    static #check(state: SchemaState, validator: Validators) {
        const field = (states.get(validator) as StateInterface).name;
        const input = state.input[field];
        let result, explanation;
        switch (validator.constructor.name) {
            case 'Spec':
                result = Spec.check(validator as Spec, input);
                if (result.isValid()) {
                    state.input[field] = result.conform();
                    state.conformed = state.input;
                } else {
                    explanation = result.explain();
                    state.errors = [...state.errors, {
                        schema: state.name,
                        spec: explanation.spec,
                        message: `schema: ${state.name}, ${explanation.message}`,
                        rules: explanation.rules
                    }];
                }
                break;
            case 'Schema':
                result = Schema.check(validator as Schema, input);
                if (!result.isValid()) {
                    state.errors = [...state.errors, ...result.explain()];
                }
                break;
        }
    }
}

////////////////////////////////
//                            //
//  SCHEMA VALIDATION RESULT  //
//                            //
////////////////////////////////

class SchemaValidationResult {
    isValid: () => boolean
    conform: () => any
    explain: () => any

    constructor({input, errors, conformed}: SchemaState) {
        this.isValid = () => errors.length === 0;
        this.conform = () => this.isValid() ? conformed || input : INVALID;
        this.explain = () => this.isValid() ? VALID : errors;
    }
}

///

let foo = Spec.spec('foo').trim().isInt({ min: 5 }).toInt()
let bar = Spec.spec('bar').trim().isInt({ min: 5 }).toInt()
console.log('typeof', typeof foo)
console.log('constructor', foo.constructor.name)
console.log('isValid', Spec.check(foo, ' 10').isValid())
console.log('conform', Spec.check(foo, ' 10').conform())
console.log('explain', Spec.check(foo, ' 10').explain())
console.log('isValid', Spec.check(bar, ' 1').isValid())
console.log('conform', Spec.check(bar, ' 1').conform())
console.log('explain', Spec.check(bar, ' 1').explain())
