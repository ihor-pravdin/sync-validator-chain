'use strict';

const validator = require('validator');
const states = require('./states');
const {INVALID, VALID} = require('./constants');

/*** SPEC VALIDATION RESULT ***/

function SpecValidationResult(state) {
    const {name: spec, input, error, conformed} = state;
    const rules = [...state.fns.keys()];
    // public
    this.isValid = () => error === null;
    this.conform = () => this.isValid() ? conformed || input : INVALID;
    this.explain = () => this.isValid() ? VALID : {spec, message: error, rules};
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

/*** PUBLIC VALIDATION RULES METHODS ***/

Object.keys(validator).forEach(fn => {
    Spec.prototype[fn] = function (...args) {
        const state = states.get(this);
        state.fns.set(fn, [validator[fn].bind(validator), args]);
        return this;
    }
});

/*** PUBLIC STATIC METHODS ***/

// creates an instance of Spec
Spec.spec = name => {
    if (!!name && typeof name !== 'string') {
        throw new TypeError(`Spec 'name' is not a 'String'.`);
    }
    return new Spec(name);
}

// checks input sting according to spec
Spec.check = (spec, input = '') => {
    if (!(spec instanceof Spec)) {
        throw new TypeError(`Invalid validator object passed. Expected instance of 'Spec'.`);
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
                    state.error = `spec: '${name}', rule: ${fnName}(${args.map(arg => JSON.stringify(arg)).join(', ')}) - failed with "${str}"`;
                } else {
                    state.conformed = typeof result === 'boolean' ? conformed : result;
                }
            }
        });
    }
    return new SpecValidationResult(state);
};

/*** EXPORTS ***/

module.exports = Spec;
