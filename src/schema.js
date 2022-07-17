'use strict';

const {INVALID} = require('./constants');
const states = require('./states');
const Spec = require('./spec');

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
    [...req, ...opt].forEach(s => {
        if (!(s instanceof Spec) && !(s instanceof Schema)) {
            throw new TypeError(`Invalid spec or schema passed.`);
        }
    });
    return new Schema(name, {req, opt});
};

Schema.check = (schema, input) => {
    if (!(schema instanceof Schema)) {
        throw new TypeError(`Invalid 'schema' passed. Expected instance of 'Schema'.`);
    }
    const state = states.get(schema);
    const required = state.req.map(spec => states.get(spec).name); //todo
    state.conformed = undefined;
    state.errors = [];
    state.input = {...input};
    states.set(schema, state);
    required.forEach(field => {
        if (input[field] === undefined) {
            state.errors.push({
                schema: state.name,
                input,
                message: `Required field '${field}' is missing.`
            });
        }
    });
    states.set(schema, state);
    return {...state};
}

let specFirstName = Spec.spec('firstName').trim().isLength({min: 3, max: 32})
let specSecondName = Spec.spec('lastName').trim().isLength({min: 3, max: 32})
let specAge = Spec.spec('age').trim().isInt({min: 0}).toInt()

let schm = Schema.schema('foo', {req: [specFirstName, specSecondName, specAge]})
let res = Schema.check(schm, {
    firstName: "Toad",
    lastName: "Person",
    age: 35
})

console.log(res)