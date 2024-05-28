const allowedOrigins = require('../config/allowedOrigins');

const credentials = (req, res, next) => {
  const host = req.headers.host;
  if (host) {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
  }
  next();
};

module.exports = credentials;
