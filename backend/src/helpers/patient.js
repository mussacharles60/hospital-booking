const ServerError = require('.');
const ServerUtil = require('../utils');
const Permission = require('./permission');
const TokenHelper = require('./token');
const Validation = require('./validation');

const PatientHelper = async (req, res) => {
  // get user from request with his token on header
  const patient = await TokenHelper.getUser(req, res, 'patient');
  if (!patient) return;

  const action = req.body.action;
  if (!action || typeof action !== 'string' || action.length == 0) {
    return ServerError.sendForbidden(res, 'action is require');
  }

  switch (action) {
    case 'create_appointment':
      return PatientHelperInternal.createAppointment(req, res, patient);
    case 'reschedule_appointment':
      return PatientHelperInternal.rescheduleAppointment(req, res, patient);
    case 'cancel_appointment':
      return PatientHelperInternal.cancelAppointment(req, res, patient);
    case 'appointments_data':
      return PatientHelperInternal.getAppointmentsData(req, res, patient);
    default:
      return ServerError.sendNotFound('unknown action');
  }
};

module.exports = PatientHelper;

const PatientHelperInternal = {
  createAppointment: async (req, res, patient) => {
    const appointment_name = req.body.appointment_name;
    const department_id = req.body.department_id;
    const description = req.body.description;
    const appointed_at = req.body.appointed_at;

    if (
      !appointment_name ||
      typeof appointment_name !== 'string' ||
      appointment_name.length === 0
    ) {
      return ServerError.sendForbidden(res, 'appointment name is required');
    }

    if (
      !department_id ||
      typeof department_id !== 'string' ||
      department_id.length === 0
    ) {
      return ServerError.sendForbidden(res, 'department name is required');
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
      DB.getInstance().releaseConnection();
      return ServerError.sendInternalServerError(res);
    }
    if (department === 'not-found') {
      DB.getInstance().releaseConnection();
      return ServerError.sendNotFound(res, 'department not exist');
    }

    // check if patient can new appointment
    const can_create_new_appointment =
      await Permission.canPatientCreateAppointment(conn, patient.id);
    if (can_create_new_appointment === 'error') {
      DB.getInstance().releaseConnection();
      return ServerError.sendInternalServerError(res);
    }
    if (!can_create_new_appointment) {
      DB.getInstance().releaseConnection();
      return ServerError.sendUnauthorized(res, 'cannot create new appointment');
    }

    const _description = typeof description === 'string' ? description : '';

    // generate new appointment id
    const new_id = await ServerUtil.generate.id(conn, 'appointment');
    // get current server date
    const date = moment().utc().valueOf();

    try {
      let r = await DB.getInstance().query(
        conn,
        `INSERT INTO appointments (id, description, department_id, doctor_id, patient_id, created_at, updated_at, appointed_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          new_id,
          _description,
          department.id,
          null,
          patient.id,
          date,
          0,
          appointed_at,
          'pending',
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
        message: 'appointment created',
        data: {
          appointment: {
            id: new_id,
            description: _description,
            department: {
              id: department.id,
              name: department.name,
            },
            patient: {
              id: patient.id,
              name: patient.name,
            },
            doctor: null,
            created_at: date,
            updated_at: 0,
            appointed_at,
            status: 'pending',
          },
        },
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
  rescheduleAppointment: async (req, res, patient) => {
    const appointment_id = req.body.appointment_id;
    const appointed_at = req.body.appointed_at;

    if (
      !appointment_id ||
      typeof appointment_id !== 'string' ||
      appointment_id.length === 0
    ) {
      return ServerError.sendForbidden(res, 'appointment id is required');
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

    // check if appointment exist
    const appointment = await Validation.getAppointmentIfExist(
      conn,
      appointment_id
    );
    if (appointment === 'error') {
      DB.getInstance().releaseConnection();
      return ServerError.sendInternalServerError(res);
    }
    if (appointment === 'not-found') {
      DB.getInstance().releaseConnection();
      return ServerError.sendNotFound(res, 'appointment not exist');
    }

    if (appointment.status !== 'pending') {
      DB.getInstance().releaseConnection();
      return ServerError.sendUnauthorized(
        res,
        'cannot reschedule the assigned appointment'
      );
    }

    // get current server date
    const date = moment().utc().valueOf();

    try {
      let r = await DB.getInstance().query(
        conn,
        `UPDATE appointments SET appointed_at=?, updated_at=? WHERE id=?`,
        [appointed_at, date, appointment.id]
      );
      if (!r) {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
    } catch (error) {
      DB.getInstance().releaseConnection(conn);
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

    // close connection
    DB.getInstance().releaseConnection(conn);

    // return success response
    const resp = {
      success: {
        code: ResponseCodes.Success.OK,
        message: 'appointment rescheduled',
        data: {
          appointment: {
            id: appointment.id,
            description: appointment.description,
            department: {
              id: appointment.department_id,
              name: department !== 'not-found' ? department.name : undefined,
            },
            patient: {
              id: patient.id,
              name: patient.name,
            },
            doctor: null,
            created_at: appointment.created_at,
            updated_at: date,
            appointed_at,
            status: appointment.status,
          },
        },
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
  cancelAppointment: async (req, res, patient) => {
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
      DB.getInstance().releaseConnection();
      return ServerError.sendInternalServerError(res);
    }
    if (appointment === 'not-found') {
      DB.getInstance().releaseConnection();
      return ServerError.sendNotFound(res, 'appointment not exist');
    }

    if (appointment.status === 'cancelled') {
      DB.getInstance().releaseConnection();
      return ServerError.sendUnauthorized(
        res,
        'appointment is already cancelled'
      );
    }

    // get current server date
    const date = moment().utc().valueOf();

    try {
      let r = await DB.getInstance().query(
        conn,
        `UPDATE appointments SET status=?, updated_at=? WHERE id=?`,
        ['cancelled', date, appointment.id]
      );
      if (!r) {
        DB.getInstance().releaseConnection(conn);
        return ServerError.sendInternalServerError(res);
      }
    } catch (error) {
      DB.getInstance().releaseConnection(conn);
      return ServerError.sendInternalServerError(res);
    }

    const department = await Validation.getDepartmentIfExist(
      conn,
      department_id
    );
    if (department === 'error') {
      DB.getInstance().releaseConnection();
      return ServerError.sendInternalServerError(res);
    }
    let doctor = null;
    if (appointment.doctor_id !== null) {
      doctor = await Validation.getDoctorIfExist(conn, appointment.doctor_id);
      if (doctor === 'error') {
        DB.getInstance().releaseConnection();
        return ServerError.sendInternalServerError(res);
      }
    }

    // close connection
    DB.getInstance().releaseConnection(conn);

    // return success response
    const resp = {
      success: {
        code: ResponseCodes.Success.OK,
        message: 'appointment cancelled',
        data: {
          appointment: {
            id: appointment.id,
            description: appointment.description,
            department: {
              id: appointment.department_id,
              name: department !== 'not-found' ? department.name : undefined,
            },
            patient: {
              id: patient.id,
              name: patient.name,
            },
            doctor: {
              id: appointment.doctor_id,
              name: doctor !== 'not-found' ? doctor.name : undefined,
            },
            created_at: appointment.created_at,
            updated_at: date,
            appointed_at: appointment.appointed_at,
            status: 'cancelled',
          },
        },
      },
    };

    // send response to client
    return res.status(ResponseCodes.Success.OK).send(JSON.stringify(resp));
  },
  getAppointmentsData: async (req, res, patient) => {
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
          `SELECT AP.*, `,
          `DP.name as department_name, D.name as doctor_name `,
          `FROM appointments AP `,
          `LEFT JOIN departments DP `,
          `ON AP.department_id = DP.id`,
          `LEFT JOIN doctors D `,
          `ON AP.doctor_id = D.id`,
          `WHERE AP.patient_id=?`,
        ].join(''),
        [patient.id]
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
};
