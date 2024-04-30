const express = require('express');

const patientRouter = express.Router();

patientRouter.route('/').get((req, res) => {
  // set response header for content-type
  res.contentType('application/json');
  // set response status code
  res.status(200);
  // send response
  res.send(
    JSON.stringify({
      status: 'OK',
    })
  );
});

module.exports = patientRouter;
