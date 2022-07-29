const {spec: {spec}, schema: {schema, check}} = require('../src/main'); // require('@toadperson/sync-validator-chain')

/* Validation specs */

const specFirstName = spec('firstName').trim().isLength({min: 3, max: 32});
const specSecondName = spec('lastName').trim().isLength({min: 3, max: 32});
const specPatronymic = spec('patronymic').trim().isLength({min: 3, max: 32});
const specAge = spec('age').trim().isInt({min: 0}).toInt();
const specAmount = spec('amount').trim().isFloat({min: 0}).toFloat();
const specRate = spec('rate').trim().isFloat({min: 0.01}).toFloat();
const specEmail = spec('email').trim().isEmail().normalizeEmail();
const specPhone = spec('phone').trim().isMobilePhone('uk-UA');

/* Validation schemas */

const schemaSalary = schema('salary', {
    req: [specAmount],
    opt: [specRate]
});
const schemaContacts = schema('contacts', {
    req: [specEmail, specPhone]
});
const schemaRequest = schema('request', {
    req: [specFirstName, specSecondName, specAge, schemaSalary, schemaContacts],
    opt: [specPatronymic]
});

/* Inputs */

const validInput = {
    firstName: "  Toad",
    lastName: "Person",
    age: "35  ",
    salary: {
        amount: " 100",
        rate: "1.5"
    },
    contacts: {
        email: "toad.person@mail.net",
        phone: "380666666666"
    }
};

const invalidInput = {
    firstName: "  Toad",
    patronymic: "Le Gushka",
    age: "35  ",
    salary: {
        amount: " 100",
        rate: "0"
    },
    contacts: {
        email: "toad.person@mail.net"
    }
};

/* Schema: valid input */

let result;

console.log('\n--- Schema: valid input ----\n');

result = check(schemaRequest, validInput);

console.log('isValid:', result.isValid());
console.log('conform:', result.conform());
console.log('explain:', result.explain());

/* Schema: invalid input */

console.log('\n--- Schema: invalid input ----\n');

result = check(schemaRequest, invalidInput);

console.log('isValid:', result.isValid());
console.log('conform:', result.conform());
console.log('explain:', result.explain());

/* Exports */

if (require.main !== module) {
    module.exports = {schemaRequest, validInput, invalidInput};
}
