const {check, conform, isValid, validationErrors} = require('../src/main');
const assert = require('node:assert').strict;

describe('isValid', function () {
    it('Valid string passed', function () {
        assert.strictEqual(isValid(check('10').isInt({min: 1}).toInt()), true);
    });

    it('Invalid string passed', function () {
        assert.strictEqual(isValid(check('0').isInt({min: 1}).toInt()), false);
    });
});

describe('conform', function () {
    it('Valid string passed', function () {
        assert.strictEqual(conform(check('10').isInt({min: 1}).toInt()), 10);
    });

    it('Invalid string passed', function () {
        assert.strictEqual(conform(check('0').isInt({min: 1}).toInt()), null);
    });
});

describe('validationErrors', function () {
    it('Valid string passed', function () {
        assert.strictEqual(validationErrors(check('10').isInt({min: 1}).toInt()).length, 0);
    });

    it('Invalid string passed', function () {
        assert.strictEqual(validationErrors(check('0').isInt({min: 1}).toInt()).length, 1);
    });
});
