'use strict';

const states = require('./states');
const {INVALID, VALID} = require('./constants');
const Spec = require('./spec');

/*** SCHEMA VALIDATION RESULT CONSTRUCTOR ***/

function SchemaValidationResult(state) {
    const {input, errors, conformed} = state;
    // public
    this.isValid = () => errors.length === 0;
    this.conform = () => this.isValid() ? conformed || input : INVALID;
    this.explain = () => this.isValid() ? VALID : errors;
}

/*** SCHEMA CONSTRUCTOR ***/

function Schema(name, {req, opt}) {
    states.set(this, {
        name,
        input: undefined,
        errors: [],
        conformed: undefined,
        req,
        opt
    });
}

/*** PRIVATE STATIC METHODS ***/

// checks input object's field according to validator
const check = (state, validator) => {
    const field = states.get(validator).name;
    const input = state.input[field];
    let result, explanation;
    switch (true) {
        case (validator instanceof Spec):
            result = Spec.check(validator, input);
            if (result.isValid()) {
                state.input[field] = result.conform();
                state.conformed = state.input;
            } else {
                explanation = result.explain();
                state.errors.push({
                    schema: state.name,
                    spec: explanation.spec,
                    message: `schema: ${state.name}, ` + explanation.message,
                    rules: explanation.rules
                });
            }
            break;
        case (validator instanceof Schema):
            result = Schema.check(validator, input);
            if (!result.isValid()) {
                state.errors.push(...result.explain());
            }
            break;
    }
};

/*** PUBLIC STATIC METHODS ***/

// creates an instance of Schema
Schema.schema = (name, {req = [], opt = []}) => {
    if (!!name && typeof name !== 'string') {
        throw new TypeError(`Schema 'name' is not a 'String'.`);
    }
    if (!Array.isArray(req) || !Array.isArray(opt)) {
        throw new TypeError(`Schema 'req' or 'opt' is not an 'Array'.`);
    }
    [...opt, ...req].forEach(v => {
        if (!(v instanceof Spec) && !(v instanceof Schema)) {
            throw new TypeError(`Invalid validator passed. Expected instance of 'Spec' or 'Schema'.`);
        }
    });
    return new Schema(name, {req, opt});
};

// checks input object according to schema
Schema.check = (schema, input = {}) => {
    if (!!schema && !(schema instanceof Schema)) {
        throw new TypeError(`Invalid validator passed. Expected instance of 'Schema'.`);
    }
    if (!!input && input.constructor.name !== 'Object') {
        throw new TypeError(`Schema 'input' is not an 'Object'.`);
    }
    const state = states.get(schema);
    state.input = input;
    state.conformed = undefined;
    state.errors = [];
    let field;
    state.req.forEach(validator => {
        field = states.get(validator).name;
        if (state.input[field] !== undefined) {
            check(state, validator);
        } else {
            state.errors.push({
                schema: state.name,
                message: `Required field '${field}' is missing for schema '${state.name}'.`
            });
        }
    });
    state.opt.forEach(validator => {
        field = states.get(validator).name;
        if (state.input[field] !== undefined) {
            check(state, validator);
         }
    });
    return new SchemaValidationResult(state);
};

/*** EXPORTS ***/

module.exports = Schema;
