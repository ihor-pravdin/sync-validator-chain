import vjs from 'validator';
export declare const VALID: symbol;
export declare const INVALID: symbol;
type Func<T> = (...args: unknown[]) => T;
type VJS = keyof typeof vjs;
type Validator = Chain | Schema;
interface IState {
    name: string;
    errors: IErrorInfo[];
}
interface IChainState extends IState {
    input?: string;
    conformed?: unknown;
    fns: Map<VJS, [Func<unknown>, unknown[]]>;
}
interface ISchemaState extends IState {
    input?: any;
    conformed?: object;
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
    static check(schema: Schema, object: object): ValidationResult;
}
declare class ValidationResult {
    isValid: () => boolean;
    conform: () => unknown;
    explain: () => symbol | IErrorInfo[];
    constructor({ errors, conformed }: IChainState | ISchemaState);
}
export {};
//# sourceMappingURL=main.d.ts.map