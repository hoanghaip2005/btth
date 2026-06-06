require('dotenv').config();
const path = require('path');
const config = require('../lib/config');

const connection = config.db.url || {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database
};

const baseConfig = {
  client: 'pg',
  connection,
  pool: {
    min: 0,
    max: 10
  },
  migrations: {
    directory: path.join(__dirname, 'migrations')
  },
  seeds: {
    directory: path.join(__dirname, 'seeds')
  }
};

module.exports = {
  development: baseConfig,
  production: baseConfig
};
