# sync-validator-chain
**sync-validator-chain** is a simple wrap for powerful [validator.js](https://github.com/validatorjs/validator.js) lib that allows you to chain validation rules.
Inspired by another grate lib [express-validator](https://github.com/express-validator/express-validator).

## Usage
```js
const {check, conform, isValid, validationErrors} = require('@toadperson/sync-validator-chain')

const chain1 = check('10').isInt({min: 1}).toInt() 
const chain2 = check('0').isInt({min: 1}).toInt()

// conform
conform(chain1) // 10
conform(chain2) // null

// isValid
isValid(chain1) // true
isValid(chain2) // false

// validationErrors
validationErrors(chain1) // []
validationErrors(chain2) // returns errors info
// [
//   {
//     fn: 'isInt',
//     param: '0',
//     message: `isInt({"min":1}) failed with '0'`
//   }
// ]
```
