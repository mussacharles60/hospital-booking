const corsOptions = {
  origin: 'http://localhost',
  optionsSuccessStatus: 200,
  exposedHeaders: ['x-auth-token'],
};

module.exports = corsOptions;
