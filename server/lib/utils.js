const _ = require('lodash');

// Timeout with promise
const timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const getParams = (args, prefix) => {
  return _.reduce(args, (result, value, key) => {
    if (_.startsWith(key, prefix)) {
      result[_.replace(key, prefix, '')] = value;
    }
    return result;
  }, {});
}

module.exports = {
  timeout,
  getParams
};