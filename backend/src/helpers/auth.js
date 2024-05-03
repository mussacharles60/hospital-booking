const bcrypt = require('bcrypt');
const moment = require('moment');

const DB = require('../service/db');
const ServerError = require('./');
const ResponseCodes = require('../apis');
const Validation = require('./validation');
const ServerUtil = require('../utils');
const TokenHelper = require('./token');

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
      success: {
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
      // generate new patient id
      const new_id = await ServerUtil.generate.id(conn, 'patient');
      // get current server date
      const date = moment().utc().valueOf();

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
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }

    // close connection
    DB.getInstance().releaseConnection(conn);

    // return success response
    const resp = {
      success: {
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
      success: {
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
  doctorRequestSignup: async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    // const certificate
    // const national_id
    if (!name || typeof name !== 'string' || name.length === 0) {
      return ServerError.sendForbidden(res, 'name is required');
    }
    if (!email || typeof email !== 'string' || email.length === 0) {
      return ServerError.sendForbidden(res, 'email is required');
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
        '[AuthHelper]: AuthHelperInternal: doctorRequestSignup: getConnection: catch:',
        error
      );
      return ServerError.sendInternalServerError(res);
    }

    // check if doctor is already exist in the database
    const is_doctor_exist = await Validation.isDoctorExist(conn, email);
    if (is_doctor_exist === 'error') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (is_doctor_exist === true) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendConflict(res, 'account is already exist');
    }

    // generate new id
    const new_id = await ServerUtil.generate.id(conn, 'doctor');
    // get current server date
    const date = moment().utc().valueOf();

    // generate doctor_request_signup token
    const payload = {
      user_id: new_id,
    };
    const token = TokenHelper.generateDoctorSignupRequestToken(payload);

    try {
      const r = await DB.getInstance().query(
        conn,
        `INSERT INTO doctors (id, name, email, password_hash, signup_request_token, created_at, updated_at) VALUE (?, ?, ?, ?, ?, ?, ?)`,
        [new_id, name, email, null, token, date, 0]
      );
      if (!r) {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
    } catch (error) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }

    // TODO: send doctor_signup_request email to the provided email
    // const url = `https://topdoctz.net/auth?action=doctor-signup-request&token=${token}`;
    console.log(
      '[AuthHelper]: AuthHelperInternal: doctorRequestSignup: token: ',
      token
    );
    // ...

    // close connection
    DB.getInstance().releaseConnection(conn);

    // return success response
    const resp = {
      success: {
        code: ResponseCodes.Success.OK,
        message: 'doctor signup request is in preview',
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
  doctorSignup: async (req, res) => {
    const token = req.body.token;
    const password = req.body.password;

    if (!token || typeof token !== 'string' || token.length === 0) {
      return ServerError.sendForbidden(res, 'token is required');
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      return ServerError.sendForbidden(res, 'password is required');
    }

    // get payload from token
    let payload = undefined;
    try {
      payload = await TokenHelper.verifyDoctorSignupRequestToken(token);
    } catch (error) {
      return ServerError.sendUnauthorized(res, 'invalid token');
    }

    if (!payload || typeof payload !== 'object') {
      return ServerError.sendUnauthorized(res, 'invalid token');
    }

    if (
      !payload.user_id ||
      typeof payload.user_id !== 'string' ||
      payload.user_id.length === 0
    ) {
      return ServerError.sendUnauthorized(res, 'invalid token');
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

    const doctor = await Validation.getDoctorIfExist(conn, payload.user_id);
    if (doctor === 'error') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (doctor === 'not-found') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendNotFound(res, 'account not exist');
    }

    // generate password hash using bcrypt
    let hash;
    try {
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      hash = await bcrypt.hash(password, salt);
    } catch (error) {
      Console.error(
        '[AuthHelper]: AuthHelperInternal: doctorSignup: bcrypt.hash: error',
        error
      );
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (!hash) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }

    // generate access token for the authentication
    const new_payload = {
      user_id: doctor.id,
    };
    const access_token = await TokenHelper.generateAccessToken(new_payload);

    // get current server date
    const date = moment().utc().valueOf();

    // update doctor table
    try {
      const r = await DB.getInstance().query(
        conn,
        `UPDATE doctors SET password_hash=?, created_at=? WHERE id=?`,
        [hash, date, doctor.id]
      );
      if (!r) {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
    } catch (error) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }

    // update doctor object
    doctor.created_at = date;

    // close connection
    DB.getInstance().releaseConnection(conn);

    // return success response
    const resp = {
      success: {
        code: ResponseCodes.Success.OK,
        message: 'doctor account created',
        data: {
          access_token,
          token_type: 'Bearer',
          doctor: {
            id: new_id,
            name: doctor.name,
            email: doctor.email,
            created_at: date,
            updated_at: doctor.updated_at,
          },
        },
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
};
