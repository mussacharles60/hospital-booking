const bcrypt = require('bcrypt');
const moment = require('moment');

const DB = require('../service/db');
const ServerError = require('./');
const ResponseCodes = require('../apis');
const Validation = require('./validation');
const ServerUtil = require('../utils');

// {
//   'action': 'admin_login', 'doctor_login', 'patient_login'
//   'email': 'user@example.com',
//   'password': '<PASSWORD>'
// }
const AuthHelper = (req, res) => {
  const action = req.body.action;
  if (!action || typeof action !== 'string' || action.length == 0) {
    return ServerError.sendForbidden(res, 'action is require');
  }
  switch (action) {
    case 'admin_login':
      return AuthHelperInternal.adminLogin(req, res);
    case 'patient_signup':
      return AuthHelperInternal.patientSignup(req, res);
    case 'patient_login':
      return AuthHelperInternal.patientLogin(req, res);
    case 'doctor_request_signup':
      return AuthHelperInternal.doctorRequestSignup(req, res);
    case 'doctor_signup':
      return AuthHelperInternal.doctorSignup(req, res);
    case 'doctor_login':
      return AuthHelperInternal.doctorLogin(req, res);
  }
};

module.exports = AuthHelper;

const AuthHelperInternal = {
  adminLogin: async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || typeof email !== 'string' || email.length === 0) {
      return ServerError.sendForbidden(res, 'email is required');
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      return ServerError.sendForbidden(res, 'password is required');
    }

    // get connection of the database
    let conn;
    try {
      conn = await DB.getInstance().getConnection();
    } catch (error) {
      console.error(
        '[AuthHelper]: AuthHelperInternal: adminLogin: getConnection: catch:',
        error
      );
      return ServerError.sendInternalServerError(res);
    }

    // get admin from database with similar email
    let result;
    try {
      result = DB.getInstance().query(
        conn,
        `SELECT * FROM admins WHERE email=?`,
        [email]
      );
    } catch (error) {
      console.error(
        '[AuthHelper]: AuthHelperInternal: adminLogin: query: catch:',
        error
      );
      DB.getInstance().releaseConnection(conn); // close connection before exiting the program
      return ServerError.sendInternalServerError(res);
    }

    if (!result || result.length === 0) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendNotFound(res, 'account not found');
    }

    const admin = result[0];

    let matched = false;

    // use bcrypt to verify user password this the stored hash
    try {
      matched = await bcrypt.compare(password, admin.password_hash);
    } catch (error) {
      Console.error(
        '[AuthHelper]: AuthHelperInternal: adminLogin: bcrypt.compare: error',
        error
      );
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (!matched) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendUnauthorized(res, 'invalid password');
    }

    // close connection
    DB.getInstance().releaseConnection(conn);

    // return success response
    const resp = {
      error: {
        code: ResponseCodes.Success.OK,
        message: 'admin logged in',
        data: {
          admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            created_at: admin.created_at,
            updated_at: admin.updated_at,
          },
        },
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
  patientSignup: async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const phone = req.body.phone;

    if (!name || typeof name !== 'string' || name.length === 0) {
      return ServerError.sendForbidden(res, 'name is required');
    }
    if (!email || typeof email !== 'string' || email.length === 0) {
      return ServerError.sendForbidden(res, 'email is required');
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      return ServerError.sendForbidden(res, 'password is required');
    }
    if (!phone || typeof phone !== 'string' || phone.length === 0) {
      return ServerError.sendForbidden(res, 'phone number is required');
    }

    // get connection of the database
    let conn;
    try {
      conn = await DB.getInstance().getConnection();
    } catch (error) {
      console.error(
        '[AuthHelper]: AuthHelperInternal: patientSignup: getConnection: catch:',
        error
      );
      return ServerError.sendInternalServerError(res);
    }

    // check if patient is already exist in the database
    const is_patient_exist = await Validation.isPatientExist(conn, email);
    if (is_patient_exist === 'error') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (is_patient_exist === true) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendConflict(res, 'account is already exist');
    }

    // generate password hash using bcrypt
    let hash;
    try {
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      hash = await bcrypt.hash(password, salt);
    } catch (error) {
      Console.error(
        '[AuthHelper]: AuthHelperInternal: patientSignup: bcrypt.hash: error',
        error
      );
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (!hash) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }

    // generate new patient id
    const new_id = await ServerUtil.generate.id(conn, 'patient');
    // get current server date
    const date = moment(date).utc().valueOf();

    try {
      const r = await DB.getInstance().query(
        conn,
        `INSERT INTO patients (id, name, email, phone, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [new_id, name, email, phone, password_hash, date, 0]
      );
      if (!r) {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
    } catch (error) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }

    // close connection
    DB.getInstance().releaseConnection(conn);

    // return success response
    const resp = {
      error: {
        code: ResponseCodes.Success.OK,
        message: 'patient account created',
        data: {
          patient: {
            id: new_id,
            name: name,
            email: email,
            created_at: date,
            updated_at: 0,
          },
        },
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
  patientLogin: async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || typeof email !== 'string' || email.length === 0) {
      return ServerError.sendForbidden(res, 'email is required');
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      return ServerError.sendForbidden(res, 'password is required');
    }

    // get connection of the database
    let conn;
    try {
      conn = await DB.getInstance().getConnection();
    } catch (error) {
      console.error(
        '[AuthHelper]: AuthHelperInternal: patientLogin: getConnection: catch:',
        error
      );
      return ServerError.sendInternalServerError(res);
    }

    // get admin from database with similar email
    let result;
    try {
      result = DB.getInstance().query(
        conn,
        `SELECT * FROM patients WHERE email=?`,
        [email]
      );
    } catch (error) {
      console.error(
        '[AuthHelper]: AuthHelperInternal: patientLogin: query: catch:',
        error
      );
      DB.getInstance().releaseConnection(conn); // close connection before exiting the program
      return ServerError.sendInternalServerError(res);
    }

    if (!result || result.length === 0) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendNotFound(res, 'account not found');
    }

    const patient = result[0];

    let matched = false;

    // use bcrypt to verify user password this the stored hash
    try {
      matched = await bcrypt.compare(password, patient.password_hash);
    } catch (error) {
      Console.error(
        '[AuthHelper]: AuthHelperInternal: patientLogin: bcrypt.compare: error',
        error
      );
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (!matched) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendUnauthorized(res, 'invalid password');
    }

    // close connection
    DB.getInstance().releaseConnection(conn);

    // return success response
    const resp = {
      error: {
        code: ResponseCodes.Success.OK,
        message: 'patient logged in',
        data: {
          admin: {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            created_at: patient.created_at,
            updated_at: patient.updated_at,
          },
        },
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
  doctorRequestSignup: async (req, res) => {},
  doctorSignup: async (req, res) => {
    const token = req.body.token;
    const password = req.body.password;

    if (!token || typeof token !== 'string' || token.length === 0) {
      return ServerError.sendForbidden(res, 'token is required');
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      return ServerError.sendForbidden(res, 'password is required');
    }

    // get connection of the database
    let conn;
    try {
      conn = await DB.getInstance().getConnection();
    } catch (error) {
      console.error(
        '[AuthHelper]: AuthHelperInternal: doctorSignup: getConnection: catch:',
        error
      );
      return ServerError.sendInternalServerError(res);
    }
  },
};
