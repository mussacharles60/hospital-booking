const allowedOrigins = require('./allowedOrigins');
const ResponseCodes = require('../apis');

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(
        new Error(
          JSON.stringify({
            err: {
              code: ResponseCodes.ClientError.UNAUTHORIZED,
              msg: 'unauthorized',
            },
          })
        )
      );
    }
  },
  optionsSuccessStatus: 200,
  exposedHeaders: ['x-auth-token'],
};

module.exports = corsOptions;
