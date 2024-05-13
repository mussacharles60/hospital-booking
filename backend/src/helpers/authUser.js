const ServerError = require('./');
const DB = require('../service/db');
const TokenHelper = require('./token');
const moment = require('moment');
const ResponseCodes = require('../apis');

const AuthUserHelper = async (req, res) => {
  const action = req.body.action;
  if (!action || typeof action !== 'string' || action.length == 0) {
    return ServerError.sendForbidden(res, 'action is require');
  }

  switch (action) {
    // admin
    case 'admin_account_edit': {
      // get user from request with his token on header
      const user = await TokenHelper.getUser(req, res, 'admin');
      if (!user) return;
      return AuthUserHelperInternal.admin.accountEdit(req, res, user);
    }
    case 'admin_change_profile_photo': {
      const user = await TokenHelper.getUser(req, res, 'admin');
      if (!user) return;
      return AuthUserHelperInternal.admin.changeProfilePhoto(req, res, user);
    }
    // doctor
    case 'doctor_account_edit': {
      const user = await TokenHelper.getUser(req, res, 'doctor');
      if (!user) return;
      return AuthUserHelperInternal.doctor.accountEdit(req, res, user);
    }
    case 'doctor_change_profile_photo': {
      const user = await TokenHelper.getUser(req, res, 'doctor');
      if (!user) return;
      return AuthUserHelperInternal.doctor.changeProfilePhoto(req, res, user);
    }
    // patient
    case 'patient_account_edit': {
      const user = await TokenHelper.getUser(req, res, 'patient');
      if (!user) return;
      return AuthUserHelperInternal.patient.accountEdit(req, res, user);
    }
    case 'patient_change_profile_photo': {
      const user = await TokenHelper.getUser(req, res, 'patient');
      if (!user) return;
      return AuthUserHelperInternal.patient.changeProfilePhoto(req, res, user);
    }
    default:
      return ServerError.sendNotFound(res, 'unknown action');
  }
};

module.exports = AuthUserHelper;

const AuthUserHelperInternal = {
  admin: {
    accountEdit: async (req, res, admin) => {
      const name = req.body.name;
      const phone = req.body.phone;

      if (!name || typeof name !== 'string' || name.length === 0) {
        return ServerError.sendForbidden(res, 'name is required');
      }
      if (!phone || typeof phone !== 'string' || phone.length === 0) {
        return ServerError.sendForbidden(res, 'phone is required');
      }

      // get connection of the database
      let conn;
      try {
        conn = await DB.getInstance().getConnection();
      } catch (error) {
        console.error(
          '[AuthUserHelper]: AuthUserHelperInternal: admin.accountEdit: getConnection: catch:',
          error
        );
        return ServerError.sendInternalServerError(res);
      }

      // get current date of the server
      const date = moment().utc().valueOf();

      let r;
      try {
        r = await DB.getInstance().query(
          conn,
          `UPDATE admins SET name=?, phone=?, updated_at=? WHERE id=?`,
          [name, phone, date, admin.id]
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
        success: {
          code: ResponseCodes.Success.OK,
          message: 'account updated',
          data: {
            admin: {
              id: admin.id,
              name: name,
              email: admin.email,
              phone: phone,
              created_at: admin.created_at,
              updated_at: date,
            },
          },
        },
      };

      // send response to client
      return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
    },
    changeProfilePhoto: async (req, res, admin) => {},
  },
  doctor: {
    accountEdit: async (req, res, doctor) => {
      const name = req.body.name;
      const phone = req.body.phone;

      if (!name || typeof name !== 'string' || name.length === 0) {
        return ServerError.sendForbidden(res, 'name is required');
      }
      if (!phone || typeof phone !== 'string' || phone.length === 0) {
        return ServerError.sendForbidden(res, 'phone is required');
      }

      // get connection of the database
      let conn;
      try {
        conn = await DB.getInstance().getConnection();
      } catch (error) {
        console.error(
          '[AuthUserHelper]: AuthUserHelperInternal: doctor.accountEdit: getConnection: catch:',
          error
        );
        return ServerError.sendInternalServerError(res);
      }

      // get current date of the server
      const date = moment().utc().valueOf();

      let r;
      try {
        r = await DB.getInstance().query(
          conn,
          `UPDATE doctors SET name=?, phone=?, updated_at=? WHERE id=?`,
          [name, phone, date, doctor.id]
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
        success: {
          code: ResponseCodes.Success.OK,
          message: 'account updated',
          data: {
            doctor: {
              id: doctor.id,
              name: name,
              email: doctor.email,
              phone: phone,
              created_at: doctor.created_at,
              updated_at: date,
            },
          },
        },
      };

      // send response to client
      return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
    },
    changeProfilePhoto: async (req, res, doctor) => {},
  },
  patient: {
    accountEdit: async (req, res, patient) => {
      const name = req.body.name;
      const phone = req.body.phone;

      if (!name || typeof name !== 'string' || name.length === 0) {
        return ServerError.sendForbidden(res, 'name is required');
      }
      if (!phone || typeof phone !== 'string' || phone.length === 0) {
        return ServerError.sendForbidden(res, 'phone is required');
      }

      // get connection of the database
      let conn;
      try {
        conn = await DB.getInstance().getConnection();
      } catch (error) {
        console.error(
          '[AuthUserHelper]: AuthUserHelperInternal: patient.accountEdit: getConnection: catch:',
          error
        );
        return ServerError.sendInternalServerError(res);
      }

      // get current date of the server
      const date = moment().utc().valueOf();

      let r;
      try {
        r = await DB.getInstance().query(
          conn,
          `UPDATE patients SET name=?, phone=?, updated_at=? WHERE id=?`,
          [name, phone, date, patient.id]
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
        success: {
          code: ResponseCodes.Success.OK,
          message: 'account updated',
          data: {
            patient: {
              id: patient.id,
              name: name,
              email: patient.email,
              phone: phone,
              created_at: patient.created_at,
              updated_at: date,
            },
          },
        },
      };

      // send response to client
      return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
    },
    changeProfilePhoto: async (req, res, patient) => {},
  },
};
