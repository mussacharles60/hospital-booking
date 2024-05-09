const DB = require('../service/db');

const Validation = {
  isPatientExist: async (conn, email) => {
    try {
      let r = await DB.getInstance().query(
        conn,
        `SELECT COUNT(*) AS count FROM patients WHERE email=?`,
        [email]
      );
      if (!r) {
        return 'error';
      }
      return r[0].count > 0;
    } catch (error) {
      return 'error';
    }
  },
  isDoctorExist: async (conn, email) => {
    try {
      let r = await DB.getInstance().query(
        conn,
        `SELECT COUNT(*) AS count FROM doctors WHERE email=?`,
        [email]
      );
      if (!r) {
        return 'error';
      }
      return r[0].count > 0;
    } catch (error) {
      return 'error';
    }
  },
  getAdminIfExist: async (conn, admin_id) => {
    try {
      let r = await DB.getInstance().query(
        conn,
        `SELECT * FROM admins WHERE id=?`,
        [admin_id]
      );
      if (!r) {
        return 'error';
      }
      if (r.length === 0) {
        return 'not-found';
      }
      return r[0];
    } catch (error) {
      return 'error';
    }
  },
  getDepartmentIfExist: async (conn, department_id) => {
    try {
      let r = await DB.getInstance().query(
        conn,
        `SELECT * FROM departments WHERE id=?`,
        [department_id]
      );
      if (!r) {
        return 'error';
      }
      if (r.length === 0) {
        return 'not-found';
      }
      return r[0];
    } catch (error) {
      return 'error';
    }
  },
  getDoctorIfExist: async (conn, doctor_id) => {
    try {
      let r = await DB.getInstance().query(
        conn,
        `SELECT * FROM doctors WHERE id=?`,
        [doctor_id]
      );
      if (!r) {
        return 'error';
      }
      if (r.length === 0) {
        return 'not-found';
      }
      return r[0];
    } catch (error) {
      return 'error';
    }
  },
  getPatientIfExist: async (conn, patient_id) => {
    try {
      let r = await DB.getInstance().query(
        conn,
        `SELECT * FROM patients WHERE id=?`,
        [patient_id]
      );
      if (!r) {
        return 'error';
      }
      if (r.length === 0) {
        return 'not-found';
      }
      return r[0];
    } catch (error) {
      return 'error';
    }
  },
  getAppointmentIfExist: async (conn, appointment_id) => {
    try {
      let r = await DB.getInstance().query(
        conn,
        `SELECT * FROM appointments WHERE id=?`,
        [appointment_id]
      );
      if (!r) {
        return 'error';
      }
      if (r.length === 0) {
        return 'not-found';
      }
      return r[0];
    } catch (error) {
      return 'error';
    }
  },
  isDoctorExistInDepartment: async (conn, department_id, doctor_id) => {
    try {
      let r = await DB.getInstance().query(
        conn,
        `SELECT COUNT(*) AS count FROM department_doctors WHERE department_id=? AND doctor_id=?`,
        [department_id, doctor_id]
      );
      if (!r) {
        return 'error';
      }
      if (r.length === 0) {
        return true;
      }
      return r[0].count > 0;
    } catch (error) {
      return 'error';
    }
  },
};

module.exports = Validation;
