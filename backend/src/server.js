require('dotenv').config();
const moment = require('moment');
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.SERVER_PORT;

// logger for all incoming requests
app.all('*', (req, res, next) => {
  const date = moment().format('YYYY-MM-dd HH:mm:ss');
  const method = req.method;
  const path = req.path;
  console.log(`New Request: ${date}\t Method: ${method}\t Path: ${path}`);
  next();
});

// for cross origin requests
app.use(cors('*'));

// http://localhost:5000
app.get('/', (req, res) => {
  // set response header for content-type
  res.contentType('application/json');
  // set response status code
  res.status(200);
  // send response
  res.send('{"status":"OK"}');
});

// http://localhost:5000/api/user
app.get('/api/user', (req, res) => {
  // set response header for content-type
  res.contentType('application/json');
  // set response status code
  res.status(200);
  // send response
  res.send('{"status":"OK","message":"USER DATA"}');
});

// not found page
app.get('*', (req, res) => {
  // set response header for content-type
  res.contentType('application/json');
  // set response status code
  res.status(404);
  // send response
  res.send('{"status":"NOT FOUND"}');
});

// start webserver on port
app.listen(port, () => {
  console.log('Server Started Running On Port:', port);
});
