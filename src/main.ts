import vjs from 'validator'; // Validator JS

/////////////////
//             //
//  Constants  //
//             //
/////////////////

export const VALID: symbol = Symbol("VALID");
export const INVALID: symbol = Symbol("INVALID");

//////////////////////////
//                      //
//  Types & Interfaces  //
//                      //
//////////////////////////

type Func<T> = (...args: unknown[]) => T;
type Obj = { [index: string]: unknown };
type VJS = keyof typeof vjs;
type Validator = Chain | Schema;
type ValidatorState = IChainState | ISchemaState;
type States = WeakMap<Validator, ValidatorState>;

interface IChainState {
    name: string
    errors: IErrorInfo[]
    input: string
    conformed: unknown
    fns: Map<VJS, [Func<unknown>, unknown[]]>
}

interface ISchemaState {
    name: string
    errors: IErrorInfo[]
    input: Obj
    conformed: Obj
    req: Validator[]
    opt: Validator[]
}

interface IErrorInfo {
    message: string
}

//////////////
//          //
//  States  //
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
        const state: IChainState = {
            name,
            input: '',
            errors: [],
            conformed: '',
            fns: new Map()
        };
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

    // static

    public static check(chain: Chain, str: unknown): ValidationResult {
        const state: IChainState = <IChainState>states.get(chain);
        state.input = '' + str;
        state.conformed = state.input;
        state.errors = [];
        if (state.fns.size !== 0) {
            state.fns.forEach(([fn, args]: [fn: Func<unknown>, args: unknown[]], method: VJS): void => {
                const { name, conformed }: IChainState = state;
                const result: unknown = fn.call(chain, '' + conformed, ...args);
                if (result === false) {
                    const message: string = `spec: '${name}', rule: ${method}(${args.map(arg => JSON.stringify(arg)).join(',')}) - failed with "${conformed}"`;
                    state.errors.push({ message });
                } else {
                    state.conformed = typeof result === 'boolean' ? conformed : result;
                }
            });
        }
        return new ValidationResult(state);
    }
}

//////////////
//          //
//  Schema  //
//          //
//////////////

export class Schema {
    protected constructor(name: string, { req = [], opt = [] }: { req?: Validator[], opt?: Validator[] }) {
        const state: ISchemaState = {
            name,
            errors: [],
            input: {},
            conformed: {},
            req,
            opt
        };
        states.set(this, state);
    }

    // static

    public static schema(name: string, schema: { req?: Validator[], opt?: Validator[] }): Schema {
        return new Schema(name, schema);
    }

    public static check(schema: Schema, object: Obj): ValidationResult {
        const state: ISchemaState = <ISchemaState>states.get(schema);
        state.input = object;
        state.conformed = {};
        state.errors = [];
        state.req.forEach((validator: Validator): void => {
            const key: string = (<ValidatorState>states.get(validator)).name;
            if (state.input[key] !== undefined) {
                Schema.#check(state, validator);
            } else {
                const message: string = `Required field '${key}' is missing for schema '${state.name}'.`
                state.errors.push({ message });
            }
        });
        state.opt.forEach((validator: Validator): void => {
            const key: string = (<ValidatorState>states.get(validator)).name;
            if (state.input[key] !== undefined) {
                Schema.#check(state, validator);
            }
        });
        return new ValidationResult(state);
    }

    // private static

    static #check(state: ISchemaState, validator: Validator): void {
        const key: string = (<ValidatorState>states.get(validator)).name;
        let validationResult: ValidationResult;
        let errorInfo: IErrorInfo[];
        switch (validator.constructor.name) {
            case 'Chain':
                validationResult = Chain.check(<Chain>validator, state.input[key]);
                if (validationResult.isValid()) {
                    state.conformed = { ...state.conformed, [key]: validationResult.conform() };
                } else {
                    errorInfo = <IErrorInfo[]>validationResult.explain();
                    state.errors.push(...errorInfo);
                }
                break;
            case 'Schema':
                if ((<object>state.input[key]).constructor.name === 'Object') {
                    validationResult = Schema.check(<Schema>validator, <Obj>state.input[key]);
                    if (!validationResult.isValid()) {
                        errorInfo = <IErrorInfo[]>validationResult.explain();
                        state.errors.push(...errorInfo);
                    }
                } else {
                    state.errors.push({
                        message: "Invalid type passed."
                    });
                }
                break;
        }
    }
}

/////////////////////////
//                     //
//  Validation Result  //
//                     //
/////////////////////////

class ValidationResult {
    isValid: () => boolean
    conform: () => unknown
    explain: () => symbol | IErrorInfo[]
    constructor({ errors, conformed }: ValidatorState) {
        this.isValid = () => errors.length === 0;
        this.conform = () => this.isValid() ? conformed : INVALID;
        this.explain = () => this.isValid() ? VALID : errors;
    }
}
