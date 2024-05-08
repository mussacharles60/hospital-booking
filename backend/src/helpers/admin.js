const ServerError = require('.');
const DB = require('../service/db');
const ServerUtil = require('../utils');
const TokenHelper = require('./token');
const Validation = require('./validation');
const moment = require('moment');

const AdminHelper = async (req, res) => {
  // get user from request with his token on header
  const admin = await TokenHelper.getUser(req, res, 'admin');
  if (!admin) return;

  const action = req.body.action;
  if (!action || typeof action !== 'string' || action.length == 0) {
    return ServerError.sendForbidden(res, 'action is require');
  }
  switch (action) {
    case 'doctors_signup_requests_data':
      return AdminHelperInternal.doctor.getDoctorsSignupRequestsData(
        req,
        res,
        admin
      );
    case 'verify_doctor_signup_request':
      return AdminHelperInternal.doctor.verifyDoctorSignupRequest(
        req,
        res,
        admin
      );
    case 'doctors_data':
      return AdminHelperInternal.doctor.getDoctorsData(req, res, admin);
    // department
    case 'create_department':
      return AdminHelperInternal.department.createDepartment(req, res, admin);
    case 'update_department':
      return AdminHelperInternal.department.updateDepartment(req, res, admin);
    case 'departments_data':
      return AdminHelperInternal.department.getDepartmentsData(req, res, admin);
    case 'remove_department':
      return AdminHelperInternal.department.removeDepartment(req, res, admin);
    default:
      return ServerError.sendNotFound('unknown action');
  }
};

module.exports = AdminHelper;

const AdminHelperInternal = {
  doctor: {
    getDoctorsSignupRequestsData: async (req, res, admin) => {
      // get connection of the database
      let conn;
      try {
        conn = await DB.getInstance().getConnection();
      } catch (error) {
        console.error(
          '[AdminHelper]: AdminHelperInternal: doctor.getDoctorsSignupRequestsData: getConnection: catch:',
          error
        );
        return ServerError.sendInternalServerError(res);
      }

      // get doctors who are not yet completed their sign up
      let r;
      try {
        r = await DB.getInstance().query(
          conn,
          `SELECT id, name, email, phone, certificate_file, identity_file, registration_status, created_at FROM doctors WHERE registration_status != ?`,
          ['completed']
        );
      } catch (error) {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
      if (!r) {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }

      // close connection
      DB.getInstance().releaseConnection(conn);

      const getCertificateFile = (certificate_file) => {
        let certificate = null;
        try {
          certificate = JSON.parse(certificate_file);
        } catch (error) {
          console.error(
            '[AdminHelper]: AdminHelperInternal: doctor.getDoctorsSignupRequestsData: getCertificateFile: catch:',
            error
          );
        }
        return certificate;
      };

      const getIdentityFile = (identity_file) => {
        let identity = null;
        try {
          identity = JSON.parse(identity_file);
        } catch (error) {
          console.error(
            '[AdminHelper]: AdminHelperInternal: doctor.getDoctorsSignupRequestsData: getIdentityFile: catch:',
            error
          );
        }
        return identity;
      };

      const doctors = [];
      r.forEach((d) => {
        doctors.push({
          id: d.id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          certificate: getCertificateFile(d.certificate_file),
          identity: getIdentityFile(d.identity_file),
          registration_status: d.registration_status,
          created_at: d.created_at,
        });
      });

      // return success response
      const resp = {
        success: {
          code: ResponseCodes.Success.OK,
          message: `returned doctors data with ${doctors.length} item${
            doctors.length === 1 ? '' : 's'
          }`,
          data: {
            doctors,
          },
        },
      };

      // send response to client
      return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
    },
    verifyDoctorSignupRequest: async (req, res, admin) => {
      const doctor_id = req.body.doctor_id;

      if (
        !doctor_id ||
        typeof doctor_id !== 'string' ||
        doctor_id.length === 0
      ) {
        return ServerError.sendForbidden(res, 'doctor id is required');
      }

      // get connection of the database
      let conn;
      try {
        conn = await DB.getInstance().getConnection();
      } catch (error) {
        console.error(
          '[AdminHelper]: AdminHelperInternal: doctor.verifyDoctorSignupRequest: getConnection: catch:',
          error
        );
        return ServerError.sendInternalServerError(res);
      }

      const doctor = await Validation.getDoctorIfExist(conn, doctor_id);
      if (doctor === 'error') {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
      if (doctor === 'not-found') {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendNotFound(res, 'account not exist');
      }

      // generate doctor_request_signup token
      const payload = {
        user_id: doctor.id,
      };
      // add this token to the database
      const token = TokenHelper.generateDoctorSignupRequestToken(payload);
      console.error(
        '[AdminHelper]: AdminHelperInternal: doctor.verifyDoctorSignupRequest: doctor_request_signup token:',
        token
      );

      // update registration status of doctor
      // get current date of the server
      const date = moment().utc().valueOf();

      // send doctor request signup email
      // ...
      let mail_sent = true;

      let r;
      try {
        r = await DB.getInstance().query(
          conn,
          `UPDATE doctors SET signup_request_token=?, registration_status=?, created_at=? WHERE id=?`,
          [token, mail_sent ? 'email_sent' : 'email_not_sent', date, doctor.id]
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
          message: mail_sent
            ? 'doctor signup request mail sent'
            : 'doctor signup request mail not sent',
          data: {
            doctor_signup_request_mail_sent: mail_sent,
          },
        },
      };

      // send response to client
      return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
    },
    getDoctorsData: async (req, res, admin) => {
      // get connection of the database
      let conn;
      try {
        conn = await DB.getInstance().getConnection();
      } catch (error) {
        console.error(
          '[AdminHelper]: AdminHelperInternal: doctor.getDoctorsData: getConnection: catch:',
          error
        );
        return ServerError.sendInternalServerError(res);
      }

      // get doctors who are not yet completed their sign up
      let r;
      try {
        r = await DB.getInstance().query(
          conn,
          `SELECT id, name, email, phone, certificate_file, identity_file, registration_status, created_at FROM doctors WHERE registration_status=?`,
          ['completed']
        );
      } catch (error) {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
      if (!r) {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }

      // close connection
      DB.getInstance().releaseConnection(conn);

      const getCertificateFile = (certificate_file) => {
        let certificate = null;
        try {
          certificate = JSON.parse(certificate_file);
        } catch (error) {
          console.error(
            '[AdminHelper]: AdminHelperInternal: doctor.getDoctorsData: getCertificateFile: catch:',
            error
          );
        }
        return certificate;
      };

      const getIdentityFile = (identity_file) => {
        let identity = null;
        try {
          identity = JSON.parse(identity_file);
        } catch (error) {
          console.error(
            '[AdminHelper]: AdminHelperInternal: doctor.getDoctorsData: getIdentityFile: catch:',
            error
          );
        }
        return identity;
      };

      const doctors = [];
      r.forEach((d) => {
        doctors.push({
          id: d.id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          certificate: getCertificateFile(d.certificate_file),
          identity: getIdentityFile(d.identity_file),
          registration_status: d.registration_status,
          created_at: d.created_at,
        });
      });

      // return success response
      const resp = {
        success: {
          code: ResponseCodes.Success.OK,
          message: `returned doctors data with ${doctors.length} item${
            doctors.length === 1 ? '' : 's'
          }`,
          data: {
            doctors,
          },
        },
      };

      // send response to client
      return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
    },
  },
  department: {
    createDepartment: async (req, res, admin) => {
      const department_name = req.body.department_name;
      const department_type = req.body.department_type;
      const description = req.body.description;
      const leader_id = req.body.leader_id;

      if (
        !department_name ||
        typeof department_name !== 'string' ||
        department_name.length === 0
      ) {
        return ServerError.sendForbidden(res, 'department name is required');
      }

      if (
        !department_type ||
        typeof department_type !== 'string' ||
        department_type.length === 0
      ) {
        return ServerError.sendForbidden(res, 'department type is required');
      }

      // get connection of the database
      let conn;
      try {
        conn = await DB.getInstance().getConnection();
      } catch (error) {
        console.error(
          '[AdminHelper]: AdminHelperInternal: department.createDepartment: getConnection: catch:',
          error
        );
        return ServerError.sendInternalServerError(res);
      }

      // check if doctor / department leader exist
      const doctor = await Validation.getDoctorIfExist(conn, leader_id);
      if (doctor === 'error') {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
      if (doctor === 'not-found') {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendNotFound(res, 'doctor not exist');
      }

      const _description = typeof description === 'string' ? description : '';

      // generate new id
      const new_id = await ServerUtil.generate.id(conn, 'department');
      // get current server date
      const date = moment().utc().valueOf();

      try {
        let r = await DB.getInstance().query(
          conn,
          `INSERT INTO departments (id, name, type, description, leader_id, created_at, updated_at, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            new_id,
            department_name,
            department_type,
            _description,
            doctor.id,
            date,
            0,
            null,
          ]
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
          message: 'department created',
          data: {
            department: {
              id: new_id,
              name: department_name,
              type: department_type,
              description: _description,
              leader: {
                id: doctor.id,
                name: doctor.name,
              },
              created_at: date,
              updated_at: 0,
              profile_photo: null,
            },
          },
        },
      };

      // send response to client
      return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
    },
    updateDepartment: async (req, res, admin) => {
      const department_id = req.body.department_id;
      const department_name = req.body.department_name;
      const department_type = req.body.department_type;
      const description = req.body.description;
      const leader_id = req.body.leader_id;

      if (
        !department_id ||
        typeof department_id !== 'string' ||
        department_id.length === 0
      ) {
        return ServerError.sendForbidden(res, 'department id is required');
      }

      if (
        !department_name ||
        typeof department_name !== 'string' ||
        department_name.length === 0
      ) {
        return ServerError.sendForbidden(res, 'department name is required');
      }

      if (
        !department_type ||
        typeof department_type !== 'string' ||
        department_type.length === 0
      ) {
        return ServerError.sendForbidden(res, 'department type is required');
      }

      // get connection of the database
      let conn;
      try {
        conn = await DB.getInstance().getConnection();
      } catch (error) {
        console.error(
          '[AdminHelper]: AdminHelperInternal: department.updateDepartment: getConnection: catch:',
          error
        );
        return ServerError.sendInternalServerError(res);
      }

      // check if department exist
      const department = await Validation.getDepartmentIfExist(
        conn,
        department_id
      );
      if (department === 'error') {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
      if (department === 'not-found') {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendNotFound(res, 'department not exist');
      }

      // check if doctor / department leader exist
      const doctor = await Validation.getDoctorIfExist(conn, leader_id);
      if (doctor === 'error') {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
      if (doctor === 'not-found') {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendNotFound(res, 'doctor not exist');
      }

      const _description = typeof description === 'string' ? description : '';

      // get current server date
      const date = moment().utc().valueOf();

      try {
        let r = await DB.getInstance().query(
          conn,
          `UPDATE departments SET name=?, type=?, description=?, leader_id=?, updated_at=? WHERE id=?`,
          [
            department_name,
            department_type,
            _description,
            doctor.id,
            date,
            department.id,
          ]
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
          message: 'department updated',
          data: {
            department: {
              id: department.id,
              name: department_name,
              type: department_type,
              description: _description,
              leader: {
                id: doctor.id,
                name: doctor.name,
              },
              created_at: department.created_at,
              updated_at: date,
              profile_photo: null,
            },
          },
        },
      };

      // send response to client
      return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
    },
    getDepartmentsData: async (req, res, admin) => {
      // get connection of the database
      let conn;
      try {
        conn = await DB.getInstance().getConnection();
      } catch (error) {
        console.error(
          '[AdminHelper]: AdminHelperInternal: department.getDepartmentsData: getConnection: catch:',
          error
        );
        return ServerError.sendInternalServerError(res);
      }

      // get departments
      let r;
      try {
        r = await DB.getInstance().query(
          conn,
          [
            `SELECT DP.id, DP.name, DP.type, DP.description, `,
            `DP.leader_id, D.name as doctor_name, DP.created_at, DP.updated_at, DP.profile_photo `,
            `FROM departments DP `,
            `LEFT JOIN doctors D `,
            `ON DP.leader_id = D.id`,
          ].join('')['completed']
        );
      } catch (error) {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
      if (!r) {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }

      // close connection
      DB.getInstance().releaseConnection(conn);

      const departments = [];
      r.forEach((department) => {
        departments.push({
          id: department.id,
          name: department_name,
          type: department_type,
          description: department.description,
          leader: {
            id: department.leader_id,
            name: department.doctor_name,
          },
          created_at: department.created_at,
          updated_at: department.updated_at,
          profile_photo: null,
        });
      });

      // return success response
      const resp = {
        success: {
          code: ResponseCodes.Success.OK,
          message: `returned departments data with ${departments.length} item${
            departments.length === 1 ? '' : 's'
          }`,
          data: {
            departments,
          },
        },
      };

      // send response to client
      return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
    },
    removeDepartment: async (req, res, admin) => {
      const department_id = req.body.department_id;

      if (
        !department_id ||
        typeof department_id !== 'string' ||
        department_id.length === 0
      ) {
        return ServerError.sendForbidden(res, 'department id is required');
      }

      // get connection of the database
      let conn;
      try {
        conn = await DB.getInstance().getConnection();
      } catch (error) {
        console.error(
          '[AdminHelper]: AdminHelperInternal: department.removeDepartment: getConnection: catch:',
          error
        );
        return ServerError.sendInternalServerError(res);
      }

      // check if department exist
      const department = await Validation.getDepartmentIfExist(
        conn,
        department_id
      );
      if (department === 'error') {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
      if (department === 'not-found') {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendNotFound(res, 'department not exist');
      }

      try {
        let r = await DB.getInstance().query(
          conn,
          `DELETE FROM departments WHERE id=?`,
          [department.id]
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
          message: 'department deleted',
        },
      };

      // send response to client
      return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
    },
  },
  appointment: {},
};
