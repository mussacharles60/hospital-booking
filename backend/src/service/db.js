require('dotenv').config();
const mysql = require('mysql');

class DB {
  static getInstance = () => {
    if (!DB.instance) {
      DB.instance = new DB();
    }
    return DB.instance;
  };

  constructor() {
    this.getConnection = this.getConnection.bind(this);
    this.query = this.query.bind(this);
    this.releaseConnection = this.releaseConnection.bind(this);

    this.conn = mysql.createPool({
      connectionLimit: 50,
      host: process.env.AUTH_DB_HOST,
      user: process.env.AUTH_DB_USER,
      // password: process.env.AUTH_DB_KEY,
      password: '',
      database: process.env.AUTH_DB_NAME,
      charset: 'utf8mb4',
    });
  }

  getConnection = () => {
    return new Promise((resolve, reject) => {
      this.conn.getConnection((error, connection) => {
        if (error) {
          reject(error);
          return;
        }
        console.log('[DB]: getConnection: threadId: ', connection.threadId);
        resolve(connection);
      });
    });
  };

  getConnectionAsync = async () => {
    let conn;
    try {
      conn = await DB.getInstance().getConnection();
    } catch (error) {
      console.error('[DB]: getConnectionAsync: catch:', error);
      return null;
    }
    return conn;
  };

  query = (conn, options, values) => {
    return new Promise((resolve, reject) => {
      const q = conn.query(options, values, (error, result, fields) => {
        if (error) {
          console.error('[DB]: query: error: ', error);
          reject(error);
          return;
        }
        console.log(
          '[DB]: query: ',
          q.sql,
          ' result: ',
          result
        );
        resolve(result);
      });
      console.log('[DB]: query: executing query: ', q.sql);
    });
  };

  releaseConnection = (connection) => {
    if (connection) {
      console.log('[DB]: releaseConnection: threadId: ', connection.threadId);
      connection.release();
    }
  };
}

module.exports = DB;
