import {
  APIErrorResponse,
  APIResponse,
  APIResponseData,
  APISuccessResponse,
  AuthResponseData,
} from '../models';
import { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import axiosGeneral, { axiosPrivate } from './axios';

import { Admin } from '../models/admin';
import Console from '../utils/console';
import { Doctor } from '../models/doctor';
import { Patient } from '../models/patient';
import moment from 'moment';

class APIs {
  private static instance: APIs;

  public static getInstance = () => {
    if (!this.instance) {
      this.instance = new APIs();
    }
    return this.instance;
  };

  private constructor() {}

  private rejectResponse = (
    err: AxiosError<APIResponse>,
    reject: (error: APIErrorResponse) => void
  ) => {
    if (err.response && err.response.data && err.response.data.error) {
      // error from server
      reject({
        code: err.response.data.error.code || err.response.status || 500,
        message: err.response.data.error.message || 'something went wrong',
      });
    } else {
      // error from axios client
      reject({
        code: 500,
        message:
          ((err.code && err.code === 'ERR_NETWORK') ||
            (err.message && err.message === 'Network Error')) &&
          !navigator.onLine
            ? 'no internet connection'
            : 'something went wrong',
      });
    }
  };

  userLogin = (
    type: 'admin' | 'doctor' | 'patient',
    email: string,
    password: string
  ): Promise<AuthResponseData> => {
    return new Promise((resolve, reject: (error: APIErrorResponse) => void) => {
      axiosGeneral
        .post(
          '/api/auth?t=' + moment().valueOf(), // prevent cache by changing url using date timestamp
          JSON.stringify({
            action:
              type === 'admin'
                ? 'admin_login'
                : type === 'doctor'
                ? 'doctor_login'
                : 'patient_login',
            email,
            password,
          })
        )
        .then((resp: AxiosResponse<APIResponse<AuthResponseData>>) => {
          if (!resp) {
            reject({
              code: 500,
              message: 'something went wrong',
            });
            return;
          }
          const error = resp.data.error;
          if (error) {
            reject(error);
          } else {
            const data = resp.data.success?.data
              ? resp.data.success?.data
              : undefined;
            if (data) {
              resolve(data);
            } else {
              reject({
                code: 500,
                message: 'something went wrong',
              });
            }
          }
        })
        .catch((err: AxiosError<APIResponse>) => {
          Console.error('[APIs]: userLogin: catch:', err.toJSON());
          this.rejectResponse(err, reject);
        });
    });
  };

  forgotPassword = (
    type: 'admin' | 'doctor' | 'patient',
    email: string
  ): Promise<AuthResponseData> => {
    return new Promise((resolve, reject: (error: APIErrorResponse) => void) => {
      axiosGeneral
        .post(
          '/api/auth?t=' + moment().valueOf(), // prevent cache by changing url using date timestamp
          JSON.stringify({
            action:
              type === 'admin'
                ? 'admin_password_forgot'
                : type === 'doctor'
                ? 'doctor_password_forgot'
                : 'patient_password_forgot',
            email,
          })
        )
        .then((resp: AxiosResponse<APIResponse<AuthResponseData>>) => {
          if (!resp) {
            reject({
              code: 500,
              message: 'something went wrong',
            });
            return;
          }
          const error = resp.data.error;
          if (error) {
            reject(error);
          } else {
            const data = resp.data.success?.data
              ? resp.data.success?.data
              : undefined;
            if (data) {
              resolve(data);
            } else {
              reject({
                code: 500,
                message: 'something went wrong',
              });
            }
          }
        })
        .catch((err: AxiosError<APIResponse>) => {
          Console.error('[APIs]: forgotPassword: catch:', err.toJSON());
          this.rejectResponse(err, reject);
        });
    });
  };

  recoverPassword = (
    type: 'admin' | 'doctor' | 'patient',
    token: string,
    new_password: string
  ): Promise<boolean> => {
    return new Promise((resolve, reject: (error: APIErrorResponse) => void) => {
      axiosGeneral
        .post(
          '/api/auth?t=' + moment().valueOf(),
          JSON.stringify({
            action:
              type === 'admin'
                ? 'admin_password_recover'
                : type === 'doctor'
                ? 'doctor_password_recover'
                : 'patient_password_recover',
            token,
            new_password,
          })
        )
        .then((resp: AxiosResponse<APIResponse<AuthResponseData>>) => {
          if (!resp) {
            reject({
              code: 500,
              message: 'something went wrong',
            });
            return;
          }
          const error = resp.data.error;
          if (error) {
            reject(error);
          } else {
            const success = resp.data.success || undefined;
            if (success) {
              resolve(true);
            } else {
              reject({
                code: 500,
                message: 'something went wrong',
              });
            }
          }
        })
        .catch((err: AxiosError<APIResponse>) => {
          Console.error('[APIs]: recoverPassword: catch:', err.toJSON());
          this.rejectResponse(err, reject);
        });
    });
  };

  changePassword = (
    type: 'admin' | 'doctor' | 'patient',
    old_password: string,
    new_password: string,
    instance: AxiosInstance
  ): Promise<boolean> => {
    return new Promise((resolve, reject: (error: APIErrorResponse) => void) => {
      instance
        .post(
          '/api/auth?t=' + moment().valueOf(),
          JSON.stringify({
            action:
              type === 'admin'
                ? 'admin_password_change'
                : type === 'doctor'
                ? 'doctor_password_change'
                : 'patient_password_change',
            old_password,
            new_password,
          })
        )
        .then((resp: AxiosResponse<APIResponse<AuthResponseData>>) => {
          if (!resp) {
            reject({
              code: 500,
              message: 'something went wrong',
            });
            return;
          }
          const error = resp.data.error;
          if (error) {
            reject(error);
          } else {
            const success = resp.data.success || undefined;
            if (success) {
              resolve(true);
            } else {
              reject({
                code: 500,
                message: 'something went wrong',
              });
            }
          }
        })
        .catch((err: AxiosError<APIResponse>) => {
          Console.error('[APIs]: changePassword: catch:', err.toJSON());
          this.rejectResponse(err, reject);
        });
    });
  };

  adminAccountEdit = (
    name: string,
    phone: string,
    instance: AxiosInstance
  ): Promise<Admin> => {
    return new Promise((resolve, reject: (error: APIErrorResponse) => void) => {
      instance
        .post(
          '/api/user?t=' + moment().valueOf(),
          JSON.stringify({
            action: 'admin_account_edit',
            name,
            phone,
          })
        )
        .then((resp: AxiosResponse<APIResponse<AuthResponseData>>) => {
          if (!resp) {
            reject({
              code: 500,
              message: 'something went wrong',
            });
            return;
          }
          const error = resp.data.error;
          if (error) {
            reject(error);
          } else {
            const success = resp.data.success || undefined;
            if (success && success.data && success.data.admin) {
              resolve(success.data.admin);
            } else {
              reject({
                code: 500,
                message: 'something went wrong',
              });
            }
          }
        })
        .catch((err: AxiosError<APIResponse>) => {
          Console.error('[APIs]: adminAccountEdit: catch:', err.toJSON());
          this.rejectResponse(err, reject);
        });
    });
  };

  doctorAccountEdit = (
    name: string,
    phone: string,
    instance: AxiosInstance
  ): Promise<Doctor> => {
    return new Promise((resolve, reject: (error: APIErrorResponse) => void) => {
      instance
        .post(
          '/api/user?t=' + moment().valueOf(),
          JSON.stringify({
            action: 'doctor_account_edit',
            name,
            phone,
          })
        )
        .then((resp: AxiosResponse<APIResponse<AuthResponseData>>) => {
          if (!resp) {
            reject({
              code: 500,
              message: 'something went wrong',
            });
            return;
          }
          const error = resp.data.error;
          if (error) {
            reject(error);
          } else {
            const success = resp.data.success || undefined;
            if (success && success.data && success.data.doctor) {
              resolve(success.data.doctor);
            } else {
              reject({
                code: 500,
                message: 'something went wrong',
              });
            }
          }
        })
        .catch((err: AxiosError<APIResponse>) => {
          Console.error('[APIs]: doctorAccountEdit: catch:', err.toJSON());
          this.rejectResponse(err, reject);
        });
    });
  };

  patientAccountEdit = (
    name: string,
    phone: string,
    instance: AxiosInstance
  ): Promise<Patient> => {
    return new Promise((resolve, reject: (error: APIErrorResponse) => void) => {
      instance
        .post(
          '/api/user?t=' + moment().valueOf(),
          JSON.stringify({
            action: 'patient_account_edit',
            name,
            phone,
          })
        )
        .then((resp: AxiosResponse<APIResponse<AuthResponseData>>) => {
          if (!resp) {
            reject({
              code: 500,
              message: 'something went wrong',
            });
            return;
          }
          const error = resp.data.error;
          if (error) {
            reject(error);
          } else {
            const success = resp.data.success || undefined;
            if (success && success.data && success.data.patient) {
              resolve(success.data.patient);
            } else {
              reject({
                code: 500,
                message: 'something went wrong',
              });
            }
          }
        })
        .catch((err: AxiosError<APIResponse>) => {
          Console.error('[APIs]: patientAccountEdit: catch:', err.toJSON());
          this.rejectResponse(err, reject);
        });
    });
  };
}

export default APIs;
