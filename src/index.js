const express = require('express')
const app = express()
const dns = require('dns')
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const port = 3000

app.post('/on-connect', (request, response) => {
  console.log(JSON.stringify(request.body, null, 3));
  response.send();
})

app.post('/on-play', (request, response) => {
  console.log(JSON.stringify(request.body, null, 3));
  response.send();
})

app.post('/on-publish', (request, response) => {
  console.log(JSON.stringify(request.body, null, 3));
  response.redirect(`${request.body.name}-eventId`);
  //response.send();
})

app.post('/on-youtube-publish', (request, response) => {
  console.log('on-youtube-publish');
  console.log(JSON.stringify(request.body, null, 3));
  if (request.body.app === 'youtube' && !request.body.youtubeKey) {
    return response.redirect(`rtmp://no-address/youtube-off/${request.body.name}`);
  }
  dns.lookup('a.rtmp.youtube.com', function(err, result) {
    response.redirect(`rtmp://${result}/live2/${request.body.youtubeKey}`);
  })
})

app.post('/on-twitch-publish', (request, response) => {
  console.log('on-twitch-publish');
  console.log(JSON.stringify(request.body, null, 3));
  if (request.body.app === 'twitch' && !request.body.twitchKey) {
    return response.redirect(`rtmp://no-address/twitch-off/${request.body.name}`);
  }
  dns.lookup('rtmp.twitch.tv', function(err, result) {
    response.redirect(`rtmp://${result}/${request.body.twitchKey}`);
  })
})

app.post('/on-facebook-publish', (request, response) => {
  console.log('on-facebook-publish');
  console.log(JSON.stringify(request.body, null, 3));
  if (request.body.app === 'facebook' && !request.body.facebookKey) {
    return response.redirect(`rtmp://no-address/facebook-off/${request.body.name}`);
  }
  dns.lookup('live-api.facebook.com', function(err, result) {
    response.redirect(`rtmps://${result}:443/rtmp/${request.body.facebookKey}`);
  })
})

app.post('/on-publish-done', (request, response) => {
  console.log(JSON.stringify(request.body, null, 3));
  response.send();
})

app.post('/on-play-done', (request, response) => {
  console.log(JSON.stringify(request.body, null, 3));
  response.send();
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})