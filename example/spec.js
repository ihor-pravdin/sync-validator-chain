const {Chain: {chain, check}} = require('../src/main.js') // require('@toadperson/sync-validator-chain')

//console.log(chain)

/* Validation chain */

const chainValue = chain('value').trim().isInt({min: 1, max: 100}).toInt();

/* Inputs */

const validInput = "10 ";
const invalidInput = "0";

/* Spec: valid input */

let result;

console.log('\n--- Spec: valid input ----\n');

result = check(chainValue, validInput);

console.log('isValid:', result.isValid());
console.log('conform:', result.conform());
console.log('explain:', result.explain());

/* Spec: invalid input */

console.log('\n--- Spec: invalid input ----\n');

result = check(chainValue, invalidInput);

console.log('isValid:', result.isValid());
console.log('conform:', result.conform());
console.log('explain:', result.explain());

/* Exports */

// if (require.main !== module) {
//     module.exports = {chainValue, validInput, invalidInput};
// }
