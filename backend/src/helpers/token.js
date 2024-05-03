require('dotenv').config();
const jsonwebtoken = require('jsonwebtoken');

const TokenHelper = {
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
  generateRefreshToken: async (payload) => {
    // generate access refresh token for the authentication
    return jsonwebtoken.sign(payload, process.env.AUTH_REFRESH_TOKEN_KEY, {
      header: {
        alg: 'HS256',
      },
      expiresIn: '30d', // long period token
    });
  },
};

module.exports = TokenHelper;
