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
};

module.exports = Validation;
