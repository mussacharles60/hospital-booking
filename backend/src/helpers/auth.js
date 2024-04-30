const ServerError = require("./");

const AuthHelper = (req, res) => {
  const action = req.body.action;
  if (!action || typeof action !== 'string' || action.length == 0) {
    return ServerError.sendForbidden(res, 'action is require');
  }
  switch (action) {
    case 'login':
      return AuthHelperInternal.login(req, res);
  }
};

module.exports = AuthHelper;

const AuthHelperInternal = {
  login: async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
  },
};
