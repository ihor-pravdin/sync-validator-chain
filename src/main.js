"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVALID = exports.VALID = void 0;
const validator_1 = __importDefault(require("validator"));
/////////////////
//             //
//  CONSTANTS  //
//             //
/////////////////
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
            state.fns.forEach((tuple, method) => {
                let fn = tuple[0];
                let args = tuple[1];
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
        return state;
    }
}
let foo = Spec.spec('foo').isInt({ min: 0 }).toInt();
//console.log(foo)
// console.log(foo.isInt)
// console.log(foo.isInt({ min: 0 }).toInt())
console.log(Spec.check(foo, '10'));
