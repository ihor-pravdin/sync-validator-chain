'use strict';

const validator = require('validator');
const states = require('./states');
const {INVALID, VALID} = require('./constants');

/*** SPEC VALIDATION RESULT ***/

function SpecValidationResult(state) {
    // private
    const spec = state.name;
    const input = state.input;
    const error = state.error;
    const conformed = state.conformed;
    const rules = [...state.fns.keys()];
    // public
    this.isValid = () => error === null;
    this.conform = () => this.isValid() ? conformed || input : INVALID;
    this.explain = () => this.isValid() ? VALID : {spec, input, message: error, rules};
}

/*** SPEC ***/

function Spec(name) {
    states.set(this, {
        name,
        input: undefined,
        error: null,
        conformed: undefined,
        fns: new Map()
    });
}

/*** VALIDATION RULES ***/

Object.keys(validator).forEach(fn => {
    Spec.prototype[fn] = function (...args) {
        const state = states.get(this);
        state.fns.set(fn, [validator[fn].bind(validator), args]);
        states.set(this, state);
        return this;
    }
});

/*** STATIC ***/

Spec.spec = name => {
    if (typeof name !== 'string') {
        throw new TypeError(`Spec's 'name' is not a 'string'.`);
    }
    return new Spec(name);
}

Spec.check = (spec, input) => {
    if (!(spec instanceof Spec)) {
        throw new TypeError(`Invalid validator object passed. Expected instance of 'Spec'.`);
    }
    const state = states.get(spec);
    if (!state) {
        throw new Error(`Spec's state is missing.`);
    }
    if (state.fns.size === 0) {
        throw new Error(`Spec should contains at list one validation rule.`);
    }
    state.conformed = undefined;
    state.error = null;
    state.input = '' + input;
    states.set(spec, state);
    state.fns.forEach(([fn, args], fnName) => {
        let {input, error, conformed} = states.get(spec);
        if (error === null) {
            let str = conformed === undefined ? input : conformed;
            let result = fn.call(spec, str, ...args);
            if (result === false) {
                state.error = `${fnName}(${args.map(arg => JSON.stringify(arg)).join(', ')}) failed with '${str}'`;
            } else {
                state.conformed = typeof result === 'boolean' ? conformed : result;
            }
            states.set(spec, state);
        }
    });
    return new SpecValidationResult(state);
};

/*** EXPORTS ***/

module.exports = Spec;
