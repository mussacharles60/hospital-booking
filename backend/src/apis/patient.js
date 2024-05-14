const express = require('express');
const ServerError = require('../helpers');
const PatientHelper = require('../helpers/patient');

const patientRouter = express.Router();

patientRouter
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
    PatientHelper(req, res);
  });

module.exports = patientRouter;
