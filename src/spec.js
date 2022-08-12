'use strict';

const validator = require('validator');
const states = require('./states');
const {INVALID, VALID} = require('./constants');

/*** SPEC VALIDATION RESULT CONSTRUCTOR ***/

function SpecValidationResult(state) {
    const {name: spec, input, error, conformed} = state;
    const rules = [...state.fns.keys()];
    // public
    this.isValid = () => error === null;
    this.conform = () => this.isValid() ? conformed || input : INVALID;
    this.explain = () => this.isValid() ? VALID : {spec, message: error, rules};
}

/*** SPEC CONSTRUCTOR ***/

function Spec(name) {
    states.set(this, {
        name,
        input: undefined,
        error: null,
        conformed: undefined,
        fns: new Map()
    });
    Object.defineProperty(this, 'toJSON', {
        value: () => {
            // const rules = [states.get(this).fns].map(([[fn, args], fnName]) => {
            //     return `${fnName}(${args.map(arg => JSON.stringify(arg)).join(', ')})`;
            // });
            // return `Spec['${name}']:[${rules}]`
            return `Spec('${name}')`;
        },
        enumerable: false
    });
}

/*** PUBLIC VALIDATION RULES METHODS ***/

Object.keys(validator).forEach(fnName => {
    Spec.prototype[fnName] = function (...args) {
        const state = states.get(this);
        state.fns.set(fnName, [validator[fnName].bind(validator), args]);
        return this;
    }
});

createRule('or', function (input, ...specs) {
    for (let spec of specs) {
        let result = Spec.check(spec, input);
        if (result.isValid()) {
            return result.conform();
        }
    }
    return false;
});

/*** PRIVATE STATIC METHODS ***/

function createRule (name, fn) {
    Spec.prototype[name] = function (...args) {
        const state = states.get(this);
        state.fns.set(name, [fn, args]);
        return this;
    }
}

/*** PUBLIC STATIC METHODS ***/

Spec.spec = name => new Spec('' + name);

Spec.rules = () => Object.keys(Spec.prototype); // console.dir(Spec.rules(), {maxArrayLength: null})

Spec.createRule = (fnName, fn) => {
    const name = '' + fnName;
    if (Spec.rules().includes(name)) {
        throw new Error(`Validation rule '${name}' already exists.`);
    }
    createRule(name, fn);
}

Spec.check = (spec, input) => {
    if (!(spec instanceof Spec)) {
        throw new TypeError(`Invalid validator passed. Expected instance of 'Spec'.`);
    }
    const state = states.get(spec);
    state.input = '' + input;
    state.conformed = undefined;
    state.error = null;
    if (state.fns.size === 0) {
        state.conformed = state.input;
    } else {
        state.fns.forEach(([fn, args], fnName) => {
            let {name, input, error, conformed} = state;
            if (error === null) {
                let str = conformed === undefined ? input : conformed;
                let result = fn.call(spec, str, ...args);
                if (result === false) {
                    state.error = `spec: '${name}', rule: ${fnName}(${args.map(arg => JSON.stringify(arg)).join(',')}) - failed with "${str}"`;
                } else {
                    state.conformed = typeof result === 'boolean' ? conformed : result;
                }
            }
        });
    }
    return new SpecValidationResult(state);
}

/*** EXPORTS ***/

module.exports = Spec;
