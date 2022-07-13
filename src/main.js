'use strict';

const validator = require('validator');

/*** CHAINS STATE STORAGE ***/

const states = new WeakMap();

/*** VALIDATOR CHAIN ***/

function ValidatorChain(str) {
    states.set(this, {
        str,
        errors: [],
        sanitized: null
    });
}

Object.keys(validator).forEach(fn => {
    ValidatorChain.prototype[fn] = function (...args) {
        const {str, errors, sanitized} = states.get(this);
        const state = {str};
        const result = validator[fn].call(validator, sanitized || str, ...args);
        if (result === false) {
            errors.push({
                fn,
                param: str,
                message: `${fn}(${args.map(arg => JSON.stringify(arg)).join(', ')}) failed with '${str}'`
            });
        }
        state.sanitized = typeof result === 'boolean' ? sanitized : result;
        state.errors = errors;
        states.set(this, state);
        return this;
    }
});

/*** STATIC ***/

ValidatorChain.check = str => new ValidatorChain('' + str);

ValidatorChain.conform = chain => {
    const {str, errors, sanitized} = states.get(chain);
    return errors.length === 0 ? sanitized || str : null;
};

ValidatorChain.validationErrors = chain => states.get(chain).errors;

ValidatorChain.isValid = chain => ValidatorChain.validationErrors(chain).length === 0;

/*** EXPORTS ***/

module.exports = {validator, ...ValidatorChain};
