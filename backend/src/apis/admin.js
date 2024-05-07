const express = require('express');
const ServerError = require('../helpers');
const AdminHelper = require('../helpers/admin');

const adminRouter = express.Router();

adminRouter
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
    AdminHelper(req, res);
  });

module.exports = adminRouter;
