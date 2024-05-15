require('dotenv').config();
const jsonwebtoken = require('jsonwebtoken');
const DB = require('../service/db');
const ServerError = require('.');

const TokenHelper = {
  getUser: async (req, res, user_type) => {
    let payload;
    try {
      payload = await TokenHelper.verifyAccessToken(req);
    } catch (error) {
      console.error('[TokenHelper]: getUser: catch: ', error);
      ServerError.sendUnauthorized(res, 'unauthorized', 'invalid_token');
      return null;
    }

    if (!payload || !payload.user_id) {
      ServerError.sendUnauthorized(res, 'unauthorized', 'invalid_token');
      return null;
    }

    let conn;
    try {
      conn = await DB.getInstance().getConnection();
    } catch (error) {
      console.error('[TokenHelper]: getUser: getConnection: error', error);
      ServerError.sendInternalServerError(res);
      return null;
    }

    let result;
    try {
      switch (user_type) {
        case 'admin':
          result = await DB.getInstance().query(
            conn,
            `SELECT * FROM admins WHERE id=?`,
            [payload.user_id]
          );
          break;
        case 'doctor':
          result = await DB.getInstance().query(
            conn,
            `SELECT * FROM doctors WHERE id=?`,
            [payload.user_id]
          );
          break;
        case 'patient':
          result = await DB.getInstance().query(
            conn,
            `SELECT * FROM patients WHERE id=?`,
            [payload.user_id]
          );
          break;
      }
    } catch (error) {
      DB.getInstance().releaseConnection(conn);
      ServerError.sendInternalServerError(res);
      return null;
    }
    if (!result || result.length === 0) {
      DB.getInstance().releaseConnection(conn);
      ServerError.sendUnauthorized(res, 'unauthorized', 'invalid_token');
      return null;
    }

    DB.getInstance().releaseConnection(conn);

    const user = result[0];

    if (!payload || !payload.user_id || payload.user_id !== user.id) {
      ServerError.sendUnauthorized(res, 'unauthorized', 'invalid_token');
      return null;
    }

    return user;
  },
  generateDoctorSignupRequestToken: (payload) => {
    // generate doctor_signup_request token
    return jsonwebtoken.sign(
      payload,
      process.env.AUTH_DOCTOR_REQUEST_TOKEN_KEY,
      {
        header: {
          alg: 'HS256',
        },
        expiresIn: '1d', // one day token period
      }
    );
  },
  verifyDoctorSignupRequestToken: (token) => {
    // get payload from generated token
    return new Promise((resolve, reject) => {
      if (token) {
        jsonwebtoken.verify(
          token,
          process.env.AUTH_DOCTOR_REQUEST_TOKEN_KEY,
          (err, decoded) => {
            if (err) {
              reject(err);
            } else {
              resolve(decoded);
            }
          }
        );
      } else {
        reject(new Error('invalid_token'));
      }
    });
  },
  generateAccessToken: async (payload) => {
    // generate access token for the authentication
    return jsonwebtoken.sign(payload, process.env.AUTH_ACCESS_TOKEN_KEY, {
      header: {
        alg: 'HS256',
      },
      expiresIn: '1d', // short period token
    });
  },
  verifyAccessToken: (req) => {
    return new Promise((resolve, reject) => {
      const bearerHeader = req.headers.authorization;
      if (
        typeof bearerHeader !== undefined &&
        bearerHeader.startsWith('Bearer ')
      ) {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        // req.token = bearerToken;

        jsonwebtoken.verify(
          bearerToken,
          process.env.AUTH_ACCESS_TOKEN_KEY,
          (err, decoded) => {
            if (err) {
              reject(err);
            } else {
              resolve(decoded);
            }
          }
        );
      } else {
        reject();
      }
    });
  },
  generateRefreshToken: async (payload) => {
    // generate access refresh token for the authentication
    return jsonwebtoken.sign(payload, process.env.AUTH_REFRESH_TOKEN_KEY, {
      header: {
        alg: 'HS256',
      },
      expiresIn: '30d', // long period token
    });
  },
  verifyRefreshToken: (token) => {
    // get payload from generated token
    return new Promise((resolve, reject) => {
      if (token) {
        jsonwebtoken.verify(
          token,
          process.env.AUTH_REFRESH_TOKEN_KEY,
          (err, decoded) => {
            if (err) {
              reject(err);
            } else {
              resolve(decoded);
            }
          }
        );
      } else {
        reject(new Error('invalid_token'));
      }
    });
  },
  generatePasswordRecoverToken: (payload) => {
    // generate doctor_signup_request token
    return jsonwebtoken.sign(
      payload,
      process.env.AUTH_PASSWORD_RECOVER_TOKEN_KEY,
      {
        header: {
          alg: 'HS256',
        },
        expiresIn: 5 * 60, // 5 minutes token period
      }
    );
  },
  verifyPasswordRecoverToken: (token) => {
    console.log('[TokenHelper]: verifyPasswordRecoverToken: token: ', token);
    // get payload from generated token
    return new Promise((resolve, reject) => {
      if (token) {
        jsonwebtoken.verify(
          token,
          process.env.AUTH_PASSWORD_RECOVER_TOKEN_KEY,
          (err, decoded) => {
            if (err) {
              console.error(
                '[TokenHelper]: verifyPasswordRecoverToken: error: ',
                err
              );
              reject(err);
            } else {
              resolve(decoded);
            }
          }
        );
      } else {
        reject(new Error('invalid_token'));
      }
    });
  },
};

module.exports = TokenHelper;
