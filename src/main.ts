import vjs from 'validator'; // Validator JS

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
type Func<T> = (...args: unknown[]) => T;
type Validators = Chain | Schema;
type ValidatorStates = IChainState | ISchemaState;

interface IState {
    name: string
    input?: any
    conformed?: any
}

interface IChainState extends IState {
    error?: string
    fns: Map<Key<VJS>, [Func<unknown>, unknown[]]>
}

interface ISchemaState extends IState {
    errors: any[]
    req: Validators[]
    opt: Validators[]
}

//////////////
//          //
//  STATES  //
//          //
//////////////

const states: States = new WeakMap();

/////////////
//         //
//  Chain  //
//         //
/////////////

export class Chain {
    protected constructor(name: string) {
        const state: IChainState = { name, fns: new Map() };
        states.set(this, state);
        (<Key<VJS>[]>Object.keys(vjs)).forEach((method): void => {
            Chain.prototype[method] = (...args: unknown[]): Chain => {
                state.fns.set(method, [(vjs[(method)] as Func<any>).bind(vjs), args]);
                return this;
            }
        });
    }

    //

    [index: string]: Func<Chain>

    //

    public static spec(name: string): Chain {
        return new Chain(name);
    }

    //

    public static check(spec: Chain, input: any): SpecValidationResult {
        const state: IChainState = states.get(spec) as IChainState;
        state.input = '' + input;
        state.conformed = undefined;
        state.error = undefined;
        if (state.fns.size === 0) {
            state.conformed = state.input;
        } else {
            state.fns.forEach(([fn, args]: [fn: Func<any>, args: any[]], method: Key<VJS>): void => {
                let { name, input, error, conformed }: IChainState = state;
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
    constructor({ name, input, error, conformed, fns }: IChainState) {
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
    protected constructor(name: string, { req = [], opt = [] }: { req?: Validators[], opt?: Validators[] }) {
        const state: ISchemaState = { name, errors: [], req, opt };
        states.set(this, state);
    }

    //

    public static schema(name: string, input: any): Schema {
        return new Schema(name, input);
    }

    //

    public static check(schema: Schema, input: any): SchemaValidationResult {
        const state: ISchemaState = states.get(schema) as ISchemaState;
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

    //

    static #check(state: ISchemaState, validator: Validators) {
        const field = (states.get(validator) as IState).name;
        const input = state.input[field];
        let result, explanation;
        switch (validator.constructor.name) {
            case 'Chain':
                result = Chain.check(validator as Chain, input);
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
    constructor({ input, errors, conformed }: ISchemaState) {
        this.isValid = () => errors.length === 0;
        this.conform = () => this.isValid() ? conformed || input : INVALID;
        this.explain = () => this.isValid() ? VALID : errors;
    }
}


