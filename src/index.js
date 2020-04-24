require('dotenv-flow').config();
const express = require('express');
const logger = require('./lib/logger');
const router = require('./lib/router');
const hls = require('./lib/hls');

const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const events = {};
router(app, events);
hls();

const port = 3000;
app.listen(port, (err) => {
  if (err) {
    return logger.debug('something bad happened', err);
  }

  return logger.debug(`server is listening on ${port}`);
});
