'use strict';

const constants = require('./constants');
const spec = require('./spec');
const schema = require('./schema');

/*** EXPORTS ***/

module.exports = {
    ...constants,
    spec: {...spec},
    schema: {...schema}
};
