const redis = require('redis');
const { promisify } = require('util');
const NodeCache = require( "node-cache" );
const _ = require('lodash');

// Configure server cache.
const serverCache = redis.createClient({ host: process.env.CACHE_DOMAIN });
serverCache.on('error', (err) => {
  console.error(err);
});
const serverGet = promisify(serverCache.get).bind(serverCache);

// Configure local cache.
const localCache = new NodeCache();

//
// Read from local cache first.  Then try server cache and update local cache.
//
const get = async (key) => {
  let value = localCache.get(key);
  if (_.isNil(value)) {
    value = await serverGet(key);
    if (!_.isNil(value)) {
      localCache.set(key, value, 1);
    }
  }
  return value;
};

module.exports = {
  get
};