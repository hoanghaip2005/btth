const knex = require('knex');
const knexfile = require('./knexfile');
const config = require('../lib/config');

module.exports = knex(knexfile[config.env] || knexfile.development);
