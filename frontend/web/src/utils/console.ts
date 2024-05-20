import moment from 'moment';

// allow app debug only in development mode
const ALLOW_DEBUG = process.env.NODE_ENV !== 'production';

const Console = {
  debug: (message: any, options?: any, ...optionalParams: any[]) => {
    if (ALLOW_DEBUG) {
      const date = moment().format('HH:mm:ss:SSSS');
      if (options) {
        console.log(`${date}: ${message}`, options, ...optionalParams);
      } else {
        console.log(date + ': ' + message);
      }
    }
  },
  error: (message: any, options?: any, ...optionalParams: any[]) => {
    if (ALLOW_DEBUG) {
      const date = moment().format('HH:mm:ss:SSSS');
      if (options) {
        console.error(`${date}: ${message}`, options, ...optionalParams);
      } else {
        console.error(`${date}: ${message}`);
      }
    }
  },
};

export default Console;
