const express = require('express');

const rootRouter = express.Router();

rootRouter.route('/').get((req, res) => {
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

module.exports = rootRouter;
