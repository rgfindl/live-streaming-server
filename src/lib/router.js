const uuid = require('./uuid');
const logger = require('./logger');

module.exports = (app, events) => {
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
};
