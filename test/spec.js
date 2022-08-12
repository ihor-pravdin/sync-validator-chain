const {spec: {check}, INVALID, VALID} = require('../src/main');
const assert = require('node:assert').strict;

const {specValue, validInput, invalidInput} = require('../example/spec');

describe('SpecValidationResult::isValid', function () {
    it(`Valid input passed`, function () {
        assert.strictEqual(check(specValue, validInput).isValid(), true);
    });

    it(`Invalid input passed`, function () {
        assert.strictEqual(check(specValue, invalidInput).isValid(), false);
    });
});

describe('SpecValidationResult::conform', function () {
    it(`Valid input passed`, function () {
        assert.strictEqual(typeof check(specValue, validInput).conform(), 'number');
    });

    it(`Invalid input passed`, function () {
        assert.strictEqual(check(specValue, invalidInput).conform(), INVALID);
    });
});

describe('SpecValidationResult::explain', function () {
    it(`Valid input passed`, function () {
        assert.strictEqual(check(specValue, validInput).explain(), VALID);
    });

    it(`Invalid input passed`, function () {
        assert.strictEqual(typeof check(specValue, invalidInput).explain(), 'object');
    });
});
