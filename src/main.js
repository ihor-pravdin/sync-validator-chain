 'use strict';

 const {INVALID} = require('./constants');
const { spec, check: checkSpec } = require('./spec');

 /*** EXPORTS ***/

module.exports = {
    INVALID,
    spec
};

let foo = spec('foo').trim().isInt({min: 1}).toInt();
let res = checkSpec(foo, ' 10 ');
console.log('isValid', res.isValid());
console.log('conform', res.conform());
console.log('explain', res.explain());
