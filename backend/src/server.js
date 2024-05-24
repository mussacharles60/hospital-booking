require('dotenv').config();
const moment = require('moment');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rootRouter = require('./apis/root');
const patientRouter = require('./apis/patient');
const doctorRouter = require('./apis/doctor');
const appointmentRouter = require('./apis/appointment');
const adminRouter = require('./apis/admin');
const authRouter = require('./apis/auth');
const userRouter = require('./apis/user');
const errorHandler = require('./middleware/errorHandler');
const corsOptions = require('./config/corsOptions');

const app = express();
const port = process.env.SERVER_PORT;

// for application/json
app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' }));

// logger for all incoming requests
app.all('*', (req, res, next) => {
  const date = moment().format('YYYY-MM-dd HH:mm:ss');
  const method = req.method;
  const path = req.path;
  console.log(`New Request: ${date}\t Method: ${method}\t Path: ${path}`);
  next();
});

// for cross origin requests
// app.use(cors('*'));
app.use(cors(corsOptions));

app.use('/api', rootRouter);
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/patient', patientRouter);
app.use('/api/appointment', appointmentRouter);

// not found page
app.get('*', (req, res) => {
  // set response header for content-type
  res.contentType('application/json');
  // set response status code
  res.status(404);
  // send response
  res.send('{"status":"NOT FOUND"}');
});

// error handler
app.use(errorHandler);

// start webserver on port
app.listen(port, () => {
  console.log('Server Started Running On Port:', port);
});
