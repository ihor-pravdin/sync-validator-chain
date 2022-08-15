import vjs from 'validator';
export declare const VALID: symbol;
export declare const INVALID: symbol;
type Func<T> = (...args: unknown[]) => T;
type VJS = keyof typeof vjs;
type Validator = Chain | Schema;
interface IState {
    name: string;
}
interface IChainState extends IState {
    input?: string;
    conformed?: unknown;
    error?: string;
    fns: Map<VJS, [Func<unknown>, unknown[]]>;
}
interface ISchemaState extends IState {
    input?: any;
    conformed?: any;
    errors: unknown[];
    req: Validator[];
    opt: Validator[];
}
interface IErrorExplanation {
    message: string;
}
export declare class Chain {
    protected constructor(name: string);
    [index: string]: Func<Chain>;
    static chain(name: string): Chain;
    static check(chain: Chain, str: unknown): ChainValidationResult;
}
export declare class Schema {
    #private;
    protected constructor(name: string, { req, opt }: {
        req?: Validator[];
        opt?: Validator[];
    });
    static schema(name: string, schema: {
        req?: Validator[];
        opt?: Validator[];
    }): Schema;
    static check(schema: Schema, object: object): SchemaValidationResult;
}
declare class ChainValidationResult {
    isValid: () => boolean;
    conform: () => unknown;
    explain: () => symbol | IErrorExplanation;
    constructor({ error, conformed }: IChainState);
}
declare class SchemaValidationResult {
    isValid: () => boolean;
    conform: () => any;
    explain: () => any;
    constructor({ input, errors, conformed }: ISchemaState);
}
export {};
//# sourceMappingURL=main.d.ts.map