const redis = require('redis');
const { promisify } = require('util');
const logger = require('./logger');

const cache = redis.createClient({ host: process.env.CACHE_DOMAIN });
cache.on('error', (err) => {
  logger.error(err);
});
const set = promisify(cache.set).bind(cache);
const del = promisify(cache.del).bind(cache);

module.exports = {
  set,
  del
};