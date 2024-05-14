const DB = require('../service/db');
const Constants = require('../utils/constants');

const Permission = {
  canPatientCreateAppointment: async (conn, patient_id) => {
    try {
      let r = await DB.getInstance().query(
        conn,
        `SELECT COUNT(*) AS count FROM appointments WHERE status !=? AND patient_id=?`,
        ['completed', patient_id]
      );
      if (!r) {
        return 'error';
      }
      if (r.length === 0) {
        return true;
      }
      return r[0].count < Constants.MAXIMUM_APPOINTMENTS_PER_PATIENT;
    } catch (error) {
      return 'error';
    }
  },
  isDoctorAlsoADepartmentHeader: async (conn, department_id, doctor_id) => {
    try {
      let r = await DB.getInstance().query(
        conn,
        `SELECT leader_id FROM departments WHERE id=?`,
        [department_id]
      );
      if (!r) {
        return 'error';
      }
      if (r.length === 0) {
        return false;
      }
      return r[0].leader_id === doctor_id;
    } catch (error) {
      return 'error';
    }
  },
};

module.exports = Permission;
