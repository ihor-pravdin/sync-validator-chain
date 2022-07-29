'use strict';

const states = require('./states');
const {INVALID, VALID} = require('./constants');
const Spec = require('./spec');

/*** SCHEMA VALIDATION RESULT ***/

function SchemaValidationResult(state) {
    // private
    const {input, errors, conformed} = state;
    // public
    this.isValid = () => errors.length === 0;
    this.conform = () => this.isValid() ? conformed || input : INVALID;
    this.explain = () => this.isValid() ? VALID : errors;
}

/*** SCHEMA ***/

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

/*** PUBLIC STATIC METHODS ***/

Schema.schema = (name, {req = [], opt = []}) => { // creates an instance of Schema
    if (typeof name !== 'string') {
        throw new TypeError(`Schema 'name' is not a string.`);
    }
    if (!Array.isArray(req) || !Array.isArray(opt)) {
        throw new TypeError(`Schema 'req' or 'opt' is not an array.`);
    }
    [...opt, ...req].forEach(s => {
        if (!(s instanceof Spec) && !(s instanceof Schema)) {
            throw new TypeError(`Invalid validator object passed. Expected instance of 'Spec' or 'Schema'.`);
        }
    });
    return new Schema(name, {req, opt});
};

Schema.check = (schema, input = {}) => { // checks input object according to schema
    if (!(schema instanceof Schema)) {
        throw new TypeError(`Invalid validator object passed. Expected instance of 'Schema'.`);
    }
    const state = {...states.get(schema)};
    state.input = input;
    state.conformed = undefined;
    state.errors = [];
    state.req.map(s => states.get(s).name).forEach(field => {
        if (state.input[field] === undefined) {
            state.errors.push({
                schema: state.name,
                message: `Required field '${field}' is missing for schema '${state.name}'.`
            });
        }
    });
    [...state.req, ...state.opt].forEach(s => {
        let field = states.get(s).name;
        let input = state.input[field];
        if (input !== undefined) {
            switch (true) {
                case (s instanceof Spec):
                    let specResult = Spec.check(s, input);
                    if (specResult.isValid()) {
                        state.input[field] = specResult.conform();
                        state.conformed = state.input;
                    } else {
                        state.errors.push({schema: state.name, ...specResult.explain()});
                    }
                    break;
                case (s instanceof Schema):
                    let schemaResult = Schema.check(s, input);
                    if (!schemaResult.isValid()) {
                        state.errors.push(...schemaResult.explain());
                    }
                    break;
            }
        }
    });
    return new SchemaValidationResult(state);
}

/*** EXPORTS ***/

module.exports = Schema;
