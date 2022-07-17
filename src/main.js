'use strict';

const validator = require('validator');

/*** SPEC STATES STORAGE ***/

const states = new WeakMap();

/*** VALIDATOR CHAIN ***/

function Spec(name) {
    states.set(this, {
        name,
        input: null,
        error: null,
        conformed: null,
        fns: new Map()
    });
}

Object.keys(validator).forEach(fn => {
    Spec.prototype[fn] = function (...args) {
        const state = states.get(this);
        state.fns.set(fn, [validator[fn].bind(validator), args]);
        states.set(this, state);
        return this;
    }
});

Spec.spec = name => {
    if (typeof name !== 'string') {
        throw new Error("Spec name is undefined.");
    }
    return new Spec(name);
}

Spec.check = (spec, input) => {
    const state = states.get(spec);
    if (state.fns.size === 0) {
        throw new Error("Spec should contains at list one validation rule.");
    }
    state.conformed = null;
    state.error = null;
    state.input = '' + input;
    states.set(spec, state);
    state.fns.forEach(([fn, args], fnName) => {
        let {input, error, conformed} = states.get(spec);
        if (error === null) {
            let str = conformed || input;
            let result = fn.call(spec, str, ...args);
            if (result === false) {
                state.error = `${fnName}(${args.map(arg => JSON.stringify(arg)).join(', ')}) failed with '${str}'`
            } else {
                state.conformed = typeof result === 'boolean' ? conformed : result;
            }
            states.set(spec, state);
        }
    });
    return {...state};
}

Spec.isValid = state => state.error === null;

Spec.conform = ({input, error, conformed}) => error === null ? conformed || input : null;

Spec.explain = ({name, input, error, fns}) => {
    return error === null ? null : {
        name,
        input,
        message: error,
        rules: [...fns.keys()]
    };
};


let ch1 = Spec.spec('ch1').trim().isInt({min: 1}).toInt();
// let ch2 = Spec.spec('ch1').isInt().toInt();
let res1 = Spec.check(ch1, ' 10 ');
// let res2 = Spec.check(ch2, '100');
console.log('res1', res1);
// console.log('res2', res2);
console.log('isValid', Spec.isValid(res1));
console.log('conform', Spec.conform(res1));
console.log('explain', Spec.explain(res1));


// /*** EXPORTS ***/
//
// module.exports = {validator, ...Spec};
