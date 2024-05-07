const express = require('express');
const ServerError = require('../helpers');

const patientRouter = express.Router();

patientRouter.route('/').get((req, res) => {
  // set response header for content-type
  res.contentType('application/json');
  // set response status code
  res.status(200);
  // send response
  ServerError.sendForbidden(res, 'Use POST method');
});

module.exports = patientRouter;
