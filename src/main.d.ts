import vjs from 'validator';
export declare const VALID: symbol;
export declare const INVALID: symbol;
declare type VJS = keyof typeof vjs;
declare type Key<T> = T;
declare type Value<T> = (...args: any[]) => T;
declare type Validators = Spec | Schema;
interface StateInterface {
    name: string;
    input?: any;
    conformed?: any;
}
interface SpecState extends StateInterface {
    error?: string;
    fns: Map<Key<VJS>, [Value<any>, any[]]>;
}
interface SchemaState extends StateInterface {
    errors: any[];
    req: Validators[];
    opt: Validators[];
}
export declare class Spec {
    protected constructor(name: string);
    [index: string]: Value<Spec>;
    static spec(name: string): Spec;
    static check(spec: Spec, input: any): SpecValidationResult;
}
declare class SpecValidationResult {
    isValid: () => boolean;
    conform: () => any;
    explain: () => any;
    constructor({ name, input, error, conformed, fns }: SpecState);
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
    constructor({ input, errors, conformed }: SchemaState);
}
export {};
//# sourceMappingURL=main.d.ts.map