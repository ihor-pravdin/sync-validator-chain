"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _Schema_check;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = exports.Chain = exports.INVALID = exports.VALID = void 0;
const validator_1 = __importDefault(require("validator"));
exports.VALID = Symbol("VALID");
exports.INVALID = Symbol("INVALID");
const states = new WeakMap();
class Chain {
    constructor(name) {
        const state = { name, fns: new Map() };
        states.set(this, state);
        Object.keys(validator_1.default).forEach((method) => {
            Chain.prototype[method] = (...args) => {
                state.fns.set(method, [validator_1.default[method].bind(validator_1.default), args]);
                return this;
            };
        });
    }
    static chain(name) {
        return new Chain(name);
    }
    static check(chain, str) {
        const state = states.get(chain);
        state.input = '' + str;
        state.conformed = state.input;
        state.error = undefined;
        if (state.fns.size !== 0) {
            state.fns.forEach(([fn, args], method) => {
                const { name, error, conformed } = state;
                if (!error) {
                    const result = fn.call(chain, '' + conformed, ...args);
                    if (result === false) {
                        state.error = `spec: '${name}', rule: ${method}(${args.map(arg => JSON.stringify(arg)).join(',')}) - failed with "${conformed}"`;
                    }
                    else {
                        state.conformed = typeof result === 'boolean' ? conformed : result;
                    }
                }
            });
        }
        return new ChainValidationResult(state);
    }
}
exports.Chain = Chain;
class Schema {
    constructor(name, { req = [], opt = [] }) {
        const state = { name, errors: [], req, opt };
        states.set(this, state);
    }
    static schema(name, schema) {
        return new Schema(name, schema);
    }
    static check(schema, object) {
        const state = states.get(schema);
        state.input = object;
        state.conformed = undefined;
        state.errors = [];
        state.req.forEach((validator) => {
            let key = states.get(validator).name;
            if (state.input[key] !== undefined) {
                __classPrivateFieldGet(Schema, _a, "m", _Schema_check).call(Schema, state, validator);
            }
            else {
                state.errors = [...state.errors, {
                        schema: state.name,
                        message: `Required field '${key}' is missing for schema '${state.name}'.`
                    }];
            }
        });
        state.opt.forEach((validator) => {
            let key = states.get(validator).name;
            if (state.input[key] !== undefined) {
                __classPrivateFieldGet(Schema, _a, "m", _Schema_check).call(Schema, state, validator);
            }
        });
        return new SchemaValidationResult(state);
    }
}
exports.Schema = Schema;
_a = Schema, _Schema_check = function _Schema_check(state, validator) {
    const key = states.get(validator).name;
    let explanation;
    switch (validator.constructor.name) {
        case 'Chain':
            let str = state.input[key];
            let chainResult = Chain.check(validator, str);
            if (chainResult.isValid()) {
                state.conformed = Object.assign(Object.assign({}, state.conformed), { [key]: chainResult.conform() });
            }
            else {
                let reason = chainResult.explain();
                state.errors = [...state.errors, {
                        schema: state.name,
                        chain: reason.chain,
                        message: `schema: ${state.name}, ${reason.message}`,
                        rules: reason.rules
                    }];
            }
            break;
        case 'Schema':
            let object = state.input[key];
            let result = Schema.check(validator, object);
            if (!result.isValid()) {
                state.errors = [...state.errors, ...result.explain()];
            }
            break;
    }
};
class ChainValidationResult {
    constructor({ error, conformed }) {
        this.isValid = () => error === undefined;
        this.conform = () => this.isValid() ? conformed : exports.INVALID;
        this.explain = () => this.isValid() ? exports.VALID : { message: error };
    }
}
class SchemaValidationResult {
    constructor({ input, errors, conformed }) {
        this.isValid = () => errors.length === 0;
        this.conform = () => this.isValid() ? conformed || input : exports.INVALID;
        this.explain = () => this.isValid() ? exports.VALID : errors;
    }
}
//# sourceMappingURL=main.js.map