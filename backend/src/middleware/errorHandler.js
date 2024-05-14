const ServerError = require('../helpers');

const errorHandler = (err, req, res, next) => {
  console.error('[errorHandler]: ', err.message);
  res.status(500);
  if (err.message && err.message.length > 0 && err.message.startsWith('{')) {
    res.type('application/json');
    let code = 500;
    try {
      const obj = JSON.parse(error.message);
      if (obj && obj.error && typeof obj.error.code === 'number') {
        code = obj.error.code;
      }
      res.status(code);
    } catch (error) {
      console.error('[errorHandler]: parse: catch:', error);
    }
    res.send(error.message);
  } else {
    res.type('application/json');
    ServerError.sendInternalServerError(res);
  }
  next();
};

module.exports = errorHandler;
