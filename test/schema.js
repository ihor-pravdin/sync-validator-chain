const {schema: {check}, INVALID, VALID} = require('../src/main');
const assert = require('node:assert').strict;

const {schemaRequest, validInput, invalidInput} = require('../example/schema');

describe('SchemaValidationResult::isValid', function () {
    it(`Valid input passed`, function () {
        assert.strictEqual(check(schemaRequest, validInput).isValid(), true);
    });

    it(`Invalid input passed`, function () {
        assert.strictEqual(check(schemaRequest, invalidInput).isValid(), false);
    });
});

describe('SchemaValidationResult::conform', function () {
    it(`Valid input passed`, function () {
        assert.strictEqual(typeof check(schemaRequest, validInput).conform(), 'object');
    });

    it(`Invalid input passed`, function () {
        assert.strictEqual(check(schemaRequest, invalidInput).conform(), INVALID);
    });
});

describe('SchemaValidationResult::explain', function () {
    it(`Valid input passed`, function () {
        assert.strictEqual(check(schemaRequest, validInput).explain(), VALID);
    });

    it(`Invalid input passed`, function () {
        assert.strictEqual(typeof check(schemaRequest, invalidInput).explain(), 'object');
    });
});
