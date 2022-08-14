/// <reference types="validator" />
declare module "main" {
    import vjs from 'validator';
    export const VALID: symbol;
    export const INVALID: symbol;
    type VJS = keyof typeof vjs;
    type Key<T> = T;
    type Value<T> = (...args: any[]) => T;
    type Validators = Spec | Schema;
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
    export class Spec {
        protected constructor(name: string);
        [index: string]: Value<Spec>;
        static spec(name: string): Spec;
        static check(spec: Spec, input: any): SpecValidationResult;
    }
    class SpecValidationResult {
        isValid: () => boolean;
        conform: () => any;
        explain: () => any;
        constructor({ name, input, error, conformed, fns }: SpecState);
    }
    export class Schema {
        #private;
        protected constructor(name: string, { req, opt }: {
            req?: Validators[];
            opt?: Validators[];
        });
        static schema(name: string, input: any): Schema;
        static check(schema: Schema, input: any): SchemaValidationResult;
    }
    class SchemaValidationResult {
        isValid: () => boolean;
        conform: () => any;
        explain: () => any;
        constructor({ input, errors, conformed }: SchemaState);
    }
}
//# sourceMappingURL=main.d.ts.map