const crypto = require('crypto');
const DB = require('../service/db');

const ServerUtil = {
  __generateId: (length) => {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  },
  // Function to generate a random string
  _generateId: (length) => {
    // return crypto.randomBytes(Math.ceil(length / 2))
    //   .toString('hex')
    //   .slice(0, length);
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const index = crypto.randomInt(0, chars.length);
      result += chars.charAt(index);
    }
    return result;
  },
  generate: {
    id: async (conn, type) => {
      let id = '';
      switch (type) {
        case 'admin':
          id = ServerUtil.__generateId(32);
          break;
        case 'patient':
          id = ServerUtil.__generateId(32);
          break;
        case 'doctor':
          id = ServerUtil.__generateId(32);
          break;
        case 'department':
          id = ServerUtil.__generateId(20);
          break;
        case 'appointment':
          id = ServerUtil.__generateId(20);
          break;
        case 'auth_session':
          id = ServerUtil.__generateId(24);
      }
      if (type !== 'auth_session') {
        let count = 1;
        while (await checkId(conn, id, type)) {
          // Check if the id already exists in the database
          id = id + count; // Add a number to the end of the id to make it unique
          count++;
        }
      }
      return id;
    },
  },
  waitFor: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

module.exports = ServerUtil;

// Function to check if the id already exists in the database
const checkId = async (conn, id, type) => {
  return new Promise(async (resolve, reject) => {
    let result;
    try {
      switch (type) {
        case 'admin':
          result = await DB.getInstance().query(
            conn,
            `SELECT COUNT(*) AS count FROM admins WHERE id=?`,
            [id]
          );
          break;
        case 'patient':
          result = await DB.getInstance().query(
            conn,
            `SELECT COUNT(*) AS count FROM patients WHERE id=?`,
            [id]
          );
          break;
        case 'doctor':
          result = await DB.getInstance().query(
            conn,
            `SELECT COUNT(*) AS count FROM doctors WHERE id=?`,
            [id]
          );
          break;
        case 'department':
          result = await DB.getInstance().query(
            conn,
            `SELECT COUNT(*) AS count FROM departments WHERE id=?`,
            [id]
          );
          break;
        case 'appointment':
          result = await DB.getInstance().query(
            conn,
            `SELECT COUNT(*) AS count FROM appointments WHERE id=?`,
            [id]
          );
          break;
      }
    } catch (error) {
      reject(error);
      return;
    }
    resolve(result[0].count > 0);
  });
};
