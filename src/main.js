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
        const state = {
            name,
            input: '',
            errors: [],
            conformed: '',
            fns: new Map()
        };
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
        state.errors = [];
        if (state.fns.size !== 0) {
            state.fns.forEach(([fn, args], method) => {
                const { name, conformed } = state;
                const result = fn.call(chain, '' + conformed, ...args);
                if (result === false) {
                    const message = `spec: '${name}', rule: ${method}(${args.map(arg => JSON.stringify(arg)).join(',')}) - failed with "${conformed}"`;
                    state.errors.push({ message });
                }
                else {
                    state.conformed = typeof result === 'boolean' ? conformed : result;
                }
            });
        }
        return new ValidationResult(state);
    }
}
exports.Chain = Chain;
class Schema {
    constructor(name, { req = [], opt = [] }) {
        const state = {
            name,
            errors: [],
            input: {},
            conformed: {},
            req,
            opt
        };
        states.set(this, state);
    }
    static schema(name, schema) {
        return new Schema(name, schema);
    }
    static check(schema, object) {
        const state = states.get(schema);
        state.input = object;
        state.conformed = {};
        state.errors = [];
        state.req.forEach((validator) => {
            const key = states.get(validator).name;
            if (state.input[key] !== undefined) {
                __classPrivateFieldGet(Schema, _a, "m", _Schema_check).call(Schema, state, validator);
            }
            else {
                const message = `Required field '${key}' is missing for schema '${state.name}'.`;
                state.errors.push({ message });
            }
        });
        state.opt.forEach((validator) => {
            const key = states.get(validator).name;
            if (state.input[key] !== undefined) {
                __classPrivateFieldGet(Schema, _a, "m", _Schema_check).call(Schema, state, validator);
            }
        });
        return new ValidationResult(state);
    }
}
exports.Schema = Schema;
_a = Schema, _Schema_check = function _Schema_check(state, validator) {
    const key = states.get(validator).name;
    let validationResult;
    let errorInfo;
    switch (validator.constructor.name) {
        case 'Chain':
            validationResult = Chain.check(validator, state.input[key]);
            if (validationResult.isValid()) {
                state.conformed = Object.assign(Object.assign({}, state.conformed), { [key]: validationResult.conform() });
            }
            else {
                errorInfo = validationResult.explain();
                state.errors.push(...errorInfo);
            }
            break;
        case 'Schema':
            if (state.input[key].constructor.name === 'Object') {
                validationResult = Schema.check(validator, state.input[key]);
                if (!validationResult.isValid()) {
                    errorInfo = validationResult.explain();
                    state.errors.push(...errorInfo);
                }
            }
            else {
                state.errors.push({
                    message: "Invalid type passed."
                });
            }
            break;
    }
};
class ValidationResult {
    constructor({ errors, conformed }) {
        this.isValid = () => errors.length === 0;
        this.conform = () => this.isValid() ? conformed : exports.INVALID;
        this.explain = () => this.isValid() ? exports.VALID : errors;
    }
}
//# sourceMappingURL=main.js.map