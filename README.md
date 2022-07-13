# sync-validator-chain
**sync-validator-chain** is a simple wrap for powerful [validator.js](https://github.com/validatorjs/validator.js) lib that allows you to chain validation rules.
Inspired by another grate lib [express-validator](https://github.com/express-validator/express-validator).
## Usage

```js
const {check, conform, isValid, validationErrors} = require('sync-validator-chain');

// conform
conform(check('10').isInt({min: 1}).toInt()) // 10
conform(check('0').isInt({min: 1}).toInt()) // null

// isValid
isValid(check('10').isInt({min: 1}).toInt()) // true
isValid(check('0').isInt({min: 1}).toInt()) // false

// validationErrors
validationErrors(check('0').isInt({min: 1}).toInt()) // returns errors info
// [
//   {
//     fn: 'isInt',
//     param: '0',
//     message: `isInt({"min":1}) failed with '0'`
//   }
// ]
```
