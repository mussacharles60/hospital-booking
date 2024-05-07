const express = require('express');
const AuthHelper = require('../helpers/auth');
const ServerError = require('../helpers');

const authRouter = express.Router();

authRouter
  .route('/')
  .get((req, res) => {
    // set response header for content-type
    res.contentType('application/json');
    // set response status code
    res.status(200);
    // send response
    ServerError.sendForbidden(res, 'Use POST method');
  })
  .post((req, res) => {
    res.contentType('application/json');
    AuthHelper(req, res);
  });

module.exports = authRouter;
