const express = require('express');
const AuthUserHelper = require('../helpers/authUser');
const ServerError = require('../helpers');

const userRouter = express.Router();

userRouter
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
    AuthUserHelper(req, res);
  });

module.exports = userRouter;
