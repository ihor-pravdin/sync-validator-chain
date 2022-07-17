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
        if(state.input[field] !== undefined) {
            switch (true) {
                case (s instanceof Spec):
                    let result = Spec.check(s, state.input[field]);
                    if (result.isValid()) {
                        state.input[field] = result.conform();
                        state.conformed = state.input;
                    } else {
                        state.errors.push({schema: state.name, ...result.explain()});
                    }
                    break;
                case (s instanceof Schema):
                    console.log('schema'); //todo
                    break;
            }
        }
    });
    states.set(schema, state);
    return {...state};
}

/*** ***/




let specFirstName = Spec.spec('firstName').trim().isLength({min: 3, max: 32})
let specSecondName = Spec.spec('lastName').trim().isLength({min: 3, max: 32})
let specAge = Spec.spec('age').trim().isInt({min: 0}).toInt()

let schm = Schema.schema('foo', {req: [specFirstName, specSecondName, specAge]})
let res = Schema.check(schm, {
    firstName: "  Toad",
    lastName: "Person",
    age: "35  "
})

console.log(res)
