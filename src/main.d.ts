import vjs from 'validator';
export declare const VALID: symbol;
export declare const INVALID: symbol;
type VJS = keyof typeof vjs;
type Key<T> = T;
type Func<T> = (...args: unknown[]) => T;
type Validators = Chain | Schema;
interface IState {
    name: string;
    input?: any;
    conformed?: any;
}
interface IChainState extends IState {
    error?: string;
    fns: Map<Key<VJS>, [Func<unknown>, unknown[]]>;
}
interface ISchemaState extends IState {
    errors: any[];
    req: Validators[];
    opt: Validators[];
}
export declare class Chain {
    protected constructor(name: string);
    [index: string]: Func<Chain>;
    static spec(name: string): Chain;
    static check(spec: Chain, input: any): SpecValidationResult;
}
declare class SpecValidationResult {
    isValid: () => boolean;
    conform: () => any;
    explain: () => any;
    constructor({ name, input, error, conformed, fns }: IChainState);
}
export declare class Schema {
    #private;
    protected constructor(name: string, { req, opt }: {
        req?: Validators[];
        opt?: Validators[];
    });
    static schema(name: string, input: any): Schema;
    static check(schema: Schema, input: any): SchemaValidationResult;
}
declare class SchemaValidationResult {
    isValid: () => boolean;
    conform: () => any;
    explain: () => any;
    constructor({ input, errors, conformed }: ISchemaState);
}
export {};
//# sourceMappingURL=main.d.ts.map