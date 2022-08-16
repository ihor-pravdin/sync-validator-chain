import vjs from 'validator';
export declare const VALID: symbol;
export declare const INVALID: symbol;
type Func<T> = (...args: unknown[]) => T;
type Obj = {
    [index: string]: unknown;
};
type VJS = keyof typeof vjs;
type Validator = Chain | Schema;
type ValidatorState = IChainState | ISchemaState;
interface IChainState {
    name: string;
    errors: IErrorInfo[];
    input: string;
    conformed: unknown;
    fns: Map<VJS, [Func<unknown>, unknown[]]>;
}
interface ISchemaState {
    name: string;
    errors: IErrorInfo[];
    input: Obj;
    conformed: Obj;
    req: Validator[];
    opt: Validator[];
}
interface IErrorInfo {
    message: string;
}
export declare class Chain {
    protected constructor(name: string);
    [index: string]: Func<Chain>;
    static chain(name: string): Chain;
    static check(chain: Chain, str: unknown): ValidationResult;
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
    static check(schema: Schema, object: Obj): ValidationResult;
}
declare class ValidationResult {
    isValid: () => boolean;
    conform: () => unknown;
    explain: () => symbol | IErrorInfo[];
    constructor({ errors, conformed }: ValidatorState);
}
export {};
//# sourceMappingURL=main.d.ts.map