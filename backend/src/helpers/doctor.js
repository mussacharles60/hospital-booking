const ServerError = require('.');
const DB = require('../service/db');
const ServerUtil = require('../utils');
const Permission = require('./permission');
const TokenHelper = require('./token');
const Validation = require('./validation');
const moment = require('moment');

const DoctorHelper = async (req, res) => {
  // get user from request with his token on header
  const doctor = await TokenHelper.getUser(req, res, 'doctor');
  if (!doctor) return;

  const action = req.body.action;
  if (!action || typeof action !== 'string' || action.length == 0) {
    return ServerError.sendForbidden(res, 'action is require');
  }
  switch (action) {
    case 'departments_data':
      return DoctorHelperInternal.getDepartmentsData(req, res, doctor);
    case 'department_appointments_data':
      return DoctorHelperInternal.getAppointmentsData(req, res, doctor);
    case 'assign_appointment':
      return DoctorHelperInternal.assignAppointment(req, res, doctor);
    case 'ongoing_appointment':
      return DoctorHelperInternal.setOngoingAppointment(req, res, doctor);
    case 'complete_appointment':
      return DoctorHelperInternal.setCompleteAppointment(req, res, doctor);
    default:
      return ServerError.sendNotFound(res, 'unknown action');
  }
};

module.exports = DoctorHelper;

const DoctorHelperInternal = {
  getDepartmentsData: async (req, res, doctor) => {
    // get connection of the database
    let conn = await DB.getInstance().getConnectionAsync();
    if (!conn) {
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
          `ON DP.leader_id = D.id `,
          `WHERE 1`,
        ].join(''),
        []
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
        name: department.name,
        type: department.type,
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
  getAppointmentsData: async (req, res, doctor) => {
    const department_id = req.body.department_id;

    if (
      !department_id ||
      typeof department_id !== 'string' ||
      department_id.length === 0
    ) {
      return ServerError.sendForbidden(res, 'department id is required');
    }

    // get connection of the database
    let conn = await DB.getInstance().getConnectionAsync();
    if (!conn) {
      return ServerError.sendInternalServerError(res);
    }

    // check if department exist
    const department = await Validation.getDepartmentIfExist(
      conn,
      department_id
    );
    if (department === 'error') {
      DB.getInstance().releaseConnection();
      return ServerError.sendInternalServerError(res);
    }
    if (department === 'not-found') {
      DB.getInstance().releaseConnection();
      return ServerError.sendNotFound(res, 'department not exist');
    }

    // check if doctor exist in this department
    const exist_on_department = await Validation.isDoctorExistInDepartment(
      conn,
      department.id,
      doctor.id
    );
    if (exist_on_department === 'error') {
      DB.getInstance().releaseConnection();
      return ServerError.sendInternalServerError(res);
    }
    if (!exist_on_department) {
      DB.getInstance().releaseConnection();
      return ServerError.sendUnauthorized(
        res,
        'no permission to view appointment in this department'
      );
    }

    // get departments
    let r;
    try {
      r = await DB.getInstance().query(
        conn,
        [
          `SELECT AP.*, `,
          `DP.name as department_name, D.name as doctor_name `,
          `FROM appointments AP `,
          `LEFT JOIN departments DP `,
          `ON AP.department_id = DP.id`,
          `LEFT JOIN doctors D `,
          `ON AP.doctor_id = D.id`,
          department.leader_id === doctor.id
            ? `WHERE AP.department_id=?`
            : `WHERE AP.department_id=? AND AP.doctor_id=?`,
        ].join(''),
        department.leader_id === doctor.id
          ? [department.id]
          : [department.id, doctor.id]
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

    const appointments = [];
    r.forEach((ap) => {
      appointments.push({
        id: ap.id,
        description: ap.description,
        department: {
          id: ap.department_id,
          name: ap.department_name || undefined,
        },
        patient: {
          id: patient.id,
          name: patient.name,
        },
        doctor: {
          id: ap.doctor_id,
          name: ap.doctor_name || undefined,
        },
        created_at: ap.created_at,
        updated_at: ap.updated_at,
        appointed_at: ap.appointed_at,
        status: ap.status,
      });
    });

    // return success response
    const resp = {
      success: {
        code: ResponseCodes.Success.OK,
        message: `returned appointments data with ${appointments.length} item${
          appointments.length === 1 ? '' : 's'
        }`,
        data: {
          appointments,
        },
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
  assignAppointment: async (req, res, department_header) => {
    const department_id = req.body.department_id;
    const appointment_id = req.body.appointment_id;
    const doctor_id = req.body.doctor_id;
    const appointed_at = req.body.appointed_at;

    if (
      !department_id ||
      typeof department_id !== 'string' ||
      department_id.length === 0
    ) {
      return ServerError.sendForbidden(res, 'department id is required');
    }

    if (
      !appointment_id ||
      typeof appointment_id !== 'string' ||
      appointment_id.length === 0
    ) {
      return ServerError.sendForbidden(res, 'appointment id is required');
    }

    if (!doctor_id || typeof doctor_id !== 'string' || doctor_id.length === 0) {
      return ServerError.sendForbidden(res, 'doctor id is required');
    }

    if (typeof appointed_at !== 'number' || appointed_at <= 0) {
      return ServerError.sendForbidden(
        res,
        'a valid appointment date is required'
      );
    }

    // get connection of the database
    let conn = await DB.getInstance().getConnectionAsync();
    if (!conn) {
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

    if (department.leader_id !== department_header.id) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendUnauthorized(
        res,
        'no permission to assign appointment'
      );
    }

    // check if doctor exist
    const doctor = await Validation.getDoctorIfExist(conn, doctor_id);
    if (doctor === 'error') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (doctor === 'not-found') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendNotFound(res, 'doctor not exist');
    }

    // check if appointment exist
    const appointment = await Validation.getAppointmentIfExist(
      conn,
      appointment_id
    );
    if (appointment === 'error') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (appointment === 'not-found') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendNotFound(res, 'appointment not exist');
    }

    // get current server date
    const date = moment().utc().valueOf();

    // send assigned status to patient
    // ...
    let email_sent = true;

    try {
      let r = await DB.getInstance().query(
        conn,
        `UPDATE appointments SET doctor_id=?, appointed_at=?, status=?, updated_at=? WHERE id=?`,
        [
          department_header.id,
          appointed_at,
          email_sent ? 'assigned-email_sent' : 'assigned-email_not_sent',
          //  appointment.status === 'assigned-email_sent' ? appointment.updated_at : date,
          date,
          appointment.id,
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
        message:
          'appointment assigned and ' +
          (email_sent
            ? 'email was sent to patient'
            : 'email was not sent to patient'),
        data: {
          appointment: {
            id: appointment.id,
            description: appointment.description,
            department: {
              id: appointment.department_id,
              name: department.name,
            },
            patient: {
              id: patient.id,
              name: patient.name,
            },
            doctor: {
              id: doctor.id,
              name: doctor.name,
            },
            created_at: appointment.created_at,
            updated_at: date,
            appointed_at,
            status: email_sent
              ? 'assigned-email_sent'
              : 'assigned-email_not_sent',
          },
        },
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
  setOngoingAppointment: async (req, res, doctor) => {
    const appointment_id = req.body.appointment_id;

    if (
      !appointment_id ||
      typeof appointment_id !== 'string' ||
      appointment_id.length === 0
    ) {
      return ServerError.sendForbidden(res, 'appointment id is required');
    }

    // get connection of the database
    let conn = await DB.getInstance().getConnectionAsync();
    if (!conn) {
      return ServerError.sendInternalServerError(res);
    }

    // check if appointment exist
    const appointment = await Validation.getAppointmentIfExist(
      conn,
      appointment_id
    );
    if (appointment === 'error') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (appointment === 'not-found') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendNotFound(res, 'appointment not exist');
    }

    // check if department exist
    const department = await Validation.getDepartmentIfExist(
      conn,
      appointment.department_id
    );
    if (department === 'error') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (department === 'not-found') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendNotFound(res, 'department not exist');
    }

    // get current server date
    const date = moment().utc().valueOf();

    try {
      let r = await DB.getInstance().query(
        conn,
        `UPDATE appointments SET status=?, updated_at=? WHERE id=?`,
        ['ongoing', date, appointment.id]
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
        message: 'appointment updated',
        data: {
          appointment: {
            id: appointment.id,
            description: appointment.description,
            department: {
              id: appointment.department_id,
              name: department.name,
            },
            patient: {
              id: patient.id,
              name: patient.name,
            },
            doctor: {
              id: doctor.id,
              name: doctor.name,
            },
            created_at: appointment.created_at,
            updated_at: date,
            appointed_at: appointment.appointed_at,
            status: 'ongoing',
          },
        },
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
  setCompleteAppointment: async (req, res, doctor) => {
    const appointment_id = req.body.appointment_id;

    if (
      !appointment_id ||
      typeof appointment_id !== 'string' ||
      appointment_id.length === 0
    ) {
      return ServerError.sendForbidden(res, 'appointment id is required');
    }

    // get connection of the database
    let conn = await DB.getInstance().getConnectionAsync();
    if (!conn) {
      return ServerError.sendInternalServerError(res);
    }

    // check if appointment exist
    const appointment = await Validation.getAppointmentIfExist(
      conn,
      appointment_id
    );
    if (appointment === 'error') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (appointment === 'not-found') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendNotFound(res, 'appointment not exist');
    }

    // check if department exist
    const department = await Validation.getDepartmentIfExist(
      conn,
      appointment.department_id
    );
    if (department === 'error') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }
    if (department === 'not-found') {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendNotFound(res, 'department not exist');
    }

    // get current server date
    const date = moment().utc().valueOf();

    try {
      let r = await DB.getInstance().query(
        conn,
        `UPDATE appointments SET status=?, updated_at=? WHERE id=?`,
        ['completed', date, appointment.id]
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
        message: 'appointment completed',
        data: {
          appointment: {
            id: appointment.id,
            description: appointment.description,
            department: {
              id: appointment.department_id,
              name: department.name,
            },
            patient: {
              id: patient.id,
              name: patient.name,
            },
            doctor: {
              id: doctor.id,
              name: doctor.name,
            },
            created_at: appointment.created_at,
            updated_at: date,
            appointed_at: appointment.appointed_at,
            status: 'completed',
          },
        },
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
};
