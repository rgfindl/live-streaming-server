const express = require('express')
const app = express()
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