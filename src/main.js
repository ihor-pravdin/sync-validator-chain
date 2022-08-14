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
exports.Schema = exports.Spec = exports.INVALID = exports.VALID = void 0;
const validator_1 = __importDefault(require("validator"));
exports.VALID = Symbol("VALID");
exports.INVALID = Symbol("INVALID");
const states = new WeakMap();
class Spec {
    constructor(name) {
        const state = { name, fns: new Map() };
        states.set(this, state);
        Object.keys(validator_1.default).forEach((method) => {
            Spec.prototype[method] = (...args) => {
                state.fns.set(method, [validator_1.default[method].bind(validator_1.default), args]);
                return this;
            };
        });
    }
    static spec(name) {
        return new Spec(name);
    }
    static check(spec, input) {
        const state = states.get(spec);
        state.input = '' + input;
        state.conformed = undefined;
        state.error = undefined;
        if (state.fns.size === 0) {
            state.conformed = state.input;
        }
        else {
            state.fns.forEach(([fn, args], method) => {
                let { name, input, error, conformed } = state;
                if (error === undefined) {
                    let str = conformed === undefined ? input : conformed;
                    let result = fn.call(spec, str, ...args);
                    if (result === false) {
                        state.error = `spec: '${name}', rule: ${method}(${args.map(arg => JSON.stringify(arg)).join(',')}) - failed with "${str}"`;
                    }
                    else {
                        state.conformed = typeof result === 'boolean' ? conformed : result;
                    }
                }
            });
        }
        return new SpecValidationResult(state);
    }
}
exports.Spec = Spec;
class SpecValidationResult {
    constructor({ name, input, error, conformed, fns }) {
        this.isValid = () => error === undefined;
        this.conform = () => this.isValid() ? conformed || input : exports.INVALID;
        this.explain = () => this.isValid() ? exports.VALID : { spec: name, message: error, rules: [...fns.keys()] };
    }
}
class Schema {
    constructor(name, { req = [], opt = [] }) {
        const state = { name, errors: [], req, opt };
        states.set(this, state);
    }
    static schema(name, input) {
        return new Schema(name, input);
    }
    static check(schema, input) {
        const state = states.get(schema);
        state.input = input || {};
        state.conformed = undefined;
        state.errors = [];
        let field;
        state.req.forEach(validator => {
            field = states.get(validator).name;
            if (state.input[field] !== undefined) {
                __classPrivateFieldGet(Schema, _a, "m", _Schema_check).call(Schema, state, validator);
            }
            else {
                state.errors = [...state.errors, {
                        schema: state.name,
                        message: `Required field '${field}' is missing for schema '${state.name}'.`
                    }];
            }
        });
        state.opt.forEach(validator => {
            field = states.get(validator).name;
            if (state.input[field] !== undefined) {
                __classPrivateFieldGet(Schema, _a, "m", _Schema_check).call(Schema, state, validator);
            }
        });
        return new SchemaValidationResult(state);
    }
}
exports.Schema = Schema;
_a = Schema, _Schema_check = function _Schema_check(state, validator) {
    const field = states.get(validator).name;
    const input = state.input[field];
    let result, explanation;
    switch (validator.constructor.name) {
        case 'Spec':
            result = Spec.check(validator, input);
            if (result.isValid()) {
                state.input[field] = result.conform();
                state.conformed = state.input;
            }
            else {
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
            result = Schema.check(validator, input);
            if (!result.isValid()) {
                state.errors = [...state.errors, ...result.explain()];
            }
            break;
    }
};
class SchemaValidationResult {
    constructor({ input, errors, conformed }) {
        this.isValid = () => errors.length === 0;
        this.conform = () => this.isValid() ? conformed || input : exports.INVALID;
        this.explain = () => this.isValid() ? exports.VALID : errors;
    }
}
//# sourceMappingURL=main.js.map