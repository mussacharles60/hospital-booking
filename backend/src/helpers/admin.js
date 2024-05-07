const ServerError = require('.');
const DB = require('../service/db');
const TokenHelper = require('./token');

const AdminHelper = async (req, res) => {
  // get admin from request with his token on header
  const admin = await TokenHelper.getUser(req, res, 'admin');
  if (!admin) return;

  const action = req.body.action;
  if (!action || typeof action !== 'string' || action.length == 0) {
    return ServerError.sendForbidden(res, 'action is require');
  }
  switch (action) {
    case 'doctors_signup_requests_data':
      return AdminHelperInternal.getDoctorsSignupRequestsData(req, res, admin);
  }
};

module.exports = AdminHelper;

const AdminHelperInternal = {
  getDoctorsSignupRequestsData: async (req, res, admin) => {
    // get connection of the database
    let conn;
    try {
      conn = await DB.getInstance().getConnection();
    } catch (error) {
      console.error(
        '[AdminHelperInternal]: AdminHelperInternal: getDoctorsSignupRequestsData: getConnection: catch:',
        error
      );
      return ServerError.sendInternalServerError(res);
    }

    // get doctors who are not yet completed their sign up
    let r;
    try {
      r = await DB.getInstance()
      .query(
        conn,
        `SELECT id, name, email, phone, certificate_file, identity_file FROM doctors WHERE registration_status=?`,
        ['waiting']
      );
    } catch (error) {
      
    }
  },
};
