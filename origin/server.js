const express = require('express');
const redis = require('redis');
const { promisify } = require('util');
const _ = require('lodash');

const app = express();
const port = 3000;

const cache = redis.createClient({ host: process.env.CACHE_DOMAIN });
const cacheGet = promisify(cache.get).bind(cache);

cache.on('error', function(error) {
  console.error(error);
});

app.get('/healthcheck', async (req, res) => {
  return res.status(200).send('healthy');
});

app.get('/*', async (req, res) => {
  console.log(req.path)

  // Validate the request.
  const pathParts = _.split(_.trim(req.path, '/'), '/');
  if (_.size(pathParts) < 3) {
    return res.status(400).send('Invalid request');
  }
  if (!_.isEqual(_.first(pathParts), 'live')) {
    return res.status(400).send('Invalid request');
  }

  // Validate stream.
  const streamName = _.nth(pathParts, 1);
  const serverAddress = await cacheGet(streamName);
  console.log(streamName, serverAddress);
  if (_.isNil(serverAddress)) {
    return res.status(404).send(`${streamName} doesn't exist.`);
  }

  const internalRedirect = `/${_.join(_.concat([serverAddress], pathParts), '/')}`;
  console.log(internalRedirect);
  res.set('X-Accel-Redirect', internalRedirect);
  return res.send();
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));