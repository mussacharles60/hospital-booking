const ServerError = require('.');
const TokenHelper = require('./token');

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
    default:
      return ServerError.sendNotFound('unknown action');
  }
};

module.exports = PatientHelper;

const PatientHelperInternal = {
  createAppointment: async (req, res, patient) => {},
  rescheduleAppointment: async (req, res, patient) => {},
  cancelAppointment: async (req, res, patient) => {},
  getAppointments: async (req, res, patient) => {},
};
