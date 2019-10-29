require('dotenv-flow').config();
const express = require('express');
const _ = require('lodash');
const chokidar = require('chokidar');
const uuid = require('./lib/uuid');
const logger = require('./lib/logger');

const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const events = {};

app.post('/on-connect', (request, response) => {
  logger.debug(JSON.stringify(request.body, null, 3));
  response.send();
});

app.post('/on-play', (request, response) => {
  logger.debug(JSON.stringify(request.body, null, 3));
  response.send();
});

app.post('/on-publish', (request, response) => {
  logger.debug(JSON.stringify(request.body, null, 3));
  const event = {
    uuid: uuid()
  };
  if (request.body.facebook) {
    logger.info('Push to facebook');
    event.facebook = request.body.facebook;
  }
  if (request.body.youtube) {
    logger.info('Push to youtube');
    event.youtube = request.body.youtube;
  }
  if (request.body.twitch) {
    logger.info('Push to twitch');
    event.twitch = request.body.twitch;
  }
  events[event.uuid] = event;
  response.redirect(`${event.uuid}`);
  // response.send();
});

app.post('/on-publish-done', (request, response) => {
  logger.debug(JSON.stringify(request.body, null, 3));
  response.send();
});

app.post('/on-play-done', (request, response) => {
  logger.debug(JSON.stringify(request.body, null, 3));
  try {
    delete events[request.name];
  } catch (err) {}
  response.send();
});

logger.debug(`Start watcher - ${process.env.HLS_PATH}`);
chokidar.watch(process.env.HLS_PATH, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
}).on('add', path => logger.debug(`File ${path} has been added`));

const port = 3000;
app.listen(port, (err) => {
  if (err) {
    return logger.debug('something bad happened', err);
  }

  return logger.debug(`server is listening on ${port}`);
});
