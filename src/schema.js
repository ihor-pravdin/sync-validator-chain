'use strict';

const {INVALID} = require('./constants');
const states = require('./states');
const Spec = require('./spec');

/*** SCHEMA VALIDATION RESULT ***/

function SchemaValidationResult(state) {
    // private
    const input = state.input;
    const errors = state.errors;
    const conformed = state.conformed;
    // public
    this.isValid = () => errors.length === 0;
    this.conform = () => this.isValid() ? conformed || input : INVALID;
    this.explain = () => this.isValid() ? null : errors;
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

/*** STATIC ***/

Schema.schema = (name, {req = [], opt = []}) => {
    if (typeof name !== 'string') {
        throw new TypeError(`Schema's 'name' is not a string.`);
    }
    if (!Array.isArray(req) || !Array.isArray(opt)) {
        throw new TypeError(`Schema's 'req' or 'opt' is not an array.`);
    }
    [...opt, ...req].forEach(s => {
        if (!(s instanceof Spec) && !(s instanceof Schema)) {
            throw new TypeError(`Invalid spec or schema passed.`);
        }
    });
    return new Schema(name, {req, opt});
};

Schema.check = (schema, input) => {
    if (!(schema instanceof Schema)) {
        throw new TypeError(`Invalid schema passed. Expected instance of 'Schema'.`);
    }
    const state = states.get(schema);
    state.conformed = undefined;
    state.errors = [];
    state.input = input;
    state.req.map(s => states.get(s).name).forEach(field => {
        if (state.input[field] === undefined) {
            state.errors.push({
                schema: state.name,
                input: state.input,
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
                default:
                    throw new TypeError(`Invalid validator object passed. Expected instance of 'Spec' or 'Schema'.`);
            }
        }
    });
    states.set(schema, state);
    return new SchemaValidationResult(state);
}

/*** EXPORTS ***/

module.exports = Schema;


// let specFirstName = Spec.spec('firstName').trim().isLength({min: 3, max: 32});
// let specSecondName = Spec.spec('lastName').trim().isLength({min: 3, max: 32});
// let specAge = Spec.spec('age').trim().isInt({min: 0}).toInt();
// let specAmount = Spec.spec('amount').trim().isInt({min: 0}).toInt();
// let specRate = Spec.spec('rate').trim().isInt({min: 1}).toInt();
//
// let schemaSalary = Schema.schema('salary', {req: [specAmount], opt: [specRate]});
//
// let request = Schema.schema('request', {req: [specFirstName, specSecondName, specAge, schemaSalary]});
//
// let res = Schema.check(request, {
//     firstName: "  Toad",
//     lastName: "Person",
//     age: "35  ",
//     salary: {
//         amount: " 100",
//         rate: "5"
//     }
// });
//
// console.log(res.conform());
// console.log(res.explain());
