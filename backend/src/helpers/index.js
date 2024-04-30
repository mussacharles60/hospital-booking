const ResponseCodes = require('../apis');

const ServerError = {
  sendInternalServerError: (res) => {
    return res.status(ResponseCodes.ServerError.INTERNAL_SERVER_ERROR).send(
      JSON.stringify({
        error: {
          code: ResponseCodes.ServerError.INTERNAL_SERVER_ERROR,
          message: 'internal server error',
        },
      })
    );
  },
  sendUnauthorized: (res, message) => {
    return res.status(ResponseCodes.ClientError.UNAUTHORIZED).send(
      JSON.stringify({
        error: {
          code: ResponseCodes.ServerError.UNAUTHORIZED,
          message,
        },
      })
    ); // unauthorized
  },
  sendConflict: (res, message) => {
    return res.status(ResponseCodes.ClientError.CONFLICT).send(
      JSON.stringify({
        error: {
          code: ResponseCodes.ServerError.CONFLICT,
          message,
        },
      })
    ); // conflict
  },
  sendForbidden: (res, message) => {
    return res.status(ResponseCodes.ClientError.FORBIDDEN).send(
      JSON.stringify({
        error: {
          code: ResponseCodes.ServerError.FORBIDDEN,
          message,
        },
      })
    ); // forbidden
  },
  sendNotFound: (res, message) => {
    return res.status(ResponseCodes.ClientError.NOT_FOUND).send(
      JSON.stringify({
        error: {
          code: ResponseCodes.ServerError.NOT_FOUND,
          message,
        },
      })
    ); // not found
  },
};

module.exports = ServerError;
