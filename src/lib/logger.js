const _ = require('lodash');
const logger = require('pino')({
  prettyPrint: _.includes(['development', 'test'], process.env.NODE_ENV),
  level: _.includes(['development', 'test'], process.env.NODE_ENV) ? 'debug' : 'info',
});

module.exports = logger;
