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

type Func<T> = (...args: unknown[]) => T;
type VJS = keyof typeof vjs;
type States = WeakMap<Validator, ValidatorState>;
type Validator = Chain | Schema;
type ValidatorState = IChainState | ISchemaState;

interface IState {
    name: string
}

interface IChainState extends IState {
    input?: string
    conformed?: unknown
    error?: IErrorInfo
    fns: Map<VJS, [Func<unknown>, unknown[]]>
}

interface ISchemaState extends IState {
    input?: any
    conformed?: object
    errors: IErrorInfo[]
    req: Validator[]
    opt: Validator[]
}

interface IErrorInfo {
    message: string
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
        (<VJS[]>Object.keys(vjs)).forEach((method): void => {
            Chain.prototype[method] = (...args: unknown[]): Chain => {
                state.fns.set(method, [(<Func<unknown>>vjs[method]).bind(vjs), args]);
                return this;
            }
        });
    }

    [index: string]: Func<Chain>

    public static chain(name: string): Chain {
        return new Chain(name);
    }

    // STATIC

    public static check(chain: Chain, str: unknown): ChainValidationResult {
        const state: IChainState = <IChainState>states.get(chain);
        state.input = '' + str;
        state.conformed = state.input;
        state.error = undefined;
        if (state.fns.size !== 0) {
            state.fns.forEach(([fn, args]: [fn: Func<unknown>, args: unknown[]], method: VJS): void => {
                const { name, error, conformed }: IChainState = state;
                if (!error) {
                    const result: unknown = fn.call(chain, '' + conformed, ...args);
                    if (result === false) {
                        const message = `spec: '${name}', rule: ${method}(${args.map(arg => JSON.stringify(arg)).join(',')}) - failed with "${conformed}"`;
                        state.error = { message }
                    } else {
                        state.conformed = typeof result === 'boolean' ? conformed : result;
                    }
                }
            });
        }
        return new ChainValidationResult(state);
    }
}

//////////////
//          //
//  SCHEMA  //
//          //
//////////////

export class Schema {
    protected constructor(name: string, { req = [], opt = [] }: { req?: Validator[], opt?: Validator[] }) {
        const state: ISchemaState = { name, errors: [], req, opt };
        states.set(this, state);
    }

    // STATIC

    public static schema(name: string, schema: { req?: Validator[], opt?: Validator[] }): Schema {
        return new Schema(name, schema);
    }

    public static check(schema: Schema, object: object): SchemaValidationResult {
        const state: ISchemaState = <ISchemaState>states.get(schema);
        state.input = object;
        state.conformed = undefined;
        state.errors = [];
        state.req.forEach((validator: Validator): void => {
            const key: string = (<ValidatorState>states.get(validator)).name;
            if (state.input[key] !== undefined) {
                Schema.#check(state, validator);
            } else {
                state.errors = [...state.errors, { 
                    message: `Required field '${key}' is missing for schema '${state.name}'.`
                }];
            }
        });
        state.opt.forEach((validator: Validator): void => {
            const key: string = (<ValidatorState>states.get(validator)).name;
            if (state.input[key] !== undefined) {
                Schema.#check(state, validator);
            }
        });
        return new SchemaValidationResult(state);
    }

    // PRIVATE STATIC

    static #check(state: ISchemaState, validator: Validator): void {
        const key: string = (<IState>states.get(validator)).name;
        switch (validator.constructor.name) {
            case 'Chain':
                const str: string = state.input[key];
                const chainValidationResult: ChainValidationResult = Chain.check(<Chain>validator, str);
                const chainErrorInfo: IErrorInfo = <IErrorInfo>chainValidationResult.explain();
                if (chainValidationResult.isValid()) {
                    state.conformed = { ...state.conformed, [key]: chainValidationResult.conform() };
                } else {
                    state.errors.push(chainErrorInfo);
                }
                break;
            case 'Schema':
                const object: object = state.input[key];
                const schemaValidationResult: SchemaValidationResult = Schema.check(<Schema>validator, object);
                const schemaErrorInfo: IErrorInfo[] = <IErrorInfo[]>schemaValidationResult.explain();
                if (!schemaValidationResult.isValid()) {
                    state.errors.push(...schemaErrorInfo);
                }
                break;
        }
    }
}

///////////////////////////////
//                           //
//  CHAIN VALIDATION RESULT  //
//                           //
///////////////////////////////

class ChainValidationResult {
    isValid: () => boolean
    conform: () => unknown
    explain: () => symbol | IErrorInfo
    constructor({ error, conformed }: IChainState) {
        this.isValid = () => error === undefined;
        this.conform = () => this.isValid() ? conformed : INVALID;
        this.explain = () => this.isValid() ? VALID : <IErrorInfo>error;
    }
}

////////////////////////////////
//                            //
//  SCHEMA VALIDATION RESULT  //
//                            //
////////////////////////////////

class SchemaValidationResult {
    isValid: () => boolean
    conform: () => symbol | object
    explain: () => symbol | IErrorInfo[]
    constructor({ input, errors, conformed }: ISchemaState) {
        this.isValid = () => errors.length === 0;
        this.conform = () => this.isValid() ? conformed || input : INVALID;
        this.explain = () => this.isValid() ? VALID : errors;
    }
}
