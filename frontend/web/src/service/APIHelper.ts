import {
  APIErrorResponse,
  APIResponse,
  APIResponseData,
  APISuccessResponse,
  AuthResponseData,
} from '../models';
import { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { Department, DepartmentType } from '../models/department';
import { DepartmentDoctor, Doctor } from '../models/doctor';
import axiosGeneral, { axiosPrivate } from './axios';

import { Admin } from '../models/admin';
import { Appointment } from '../models/appointment';
import Console from '../utils/console';
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

  auth = () => {
    return {
      userLogin: (
        type: 'admin' | 'doctor' | 'patient',
        email: string,
        password: string
      ): Promise<AuthResponseData> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
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
                Console.debug('[APIs]: auth.userLogin: then: ', resp);
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
                    // save temporary cookie for development purpose
                    const refresh_token = resp.headers[
                      'x-auth-token'
                    ] as string;
                    let cookieString =
                      encodeURIComponent('auth-token') +
                      '=' +
                      encodeURIComponent(refresh_token);

                    // Add path
                    cookieString += '; path=/';

                    // Add domain
                    const domain = 'localhost';
                    cookieString += '; domain=' + domain;

                    // Add expiration date if provided
                    const expireDate = new Date();
                    expireDate.setDate(expireDate.getDate() + 30);
                    cookieString += '; expires=' + expireDate.toUTCString();

                    // Add attributes for cross-origin sharing and secure connection
                    // cookieString += '; SameSite=None;';
                    cookieString += ';';

                    Console.debug(
                      '[APIs]: auth.userLogin: then: cookieStr: ',
                      cookieString
                    );

                    // Save cookie
                    document.cookie = cookieString;

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
                Console.error('[APIs]: auth.userLogin: catch:', err.toJSON());
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      forgotPassword: (
        type: 'admin' | 'doctor' | 'patient',
        email: string
      ): Promise<AuthResponseData> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
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
                Console.error(
                  '[APIs]: auth.forgotPassword: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      recoverPassword: (
        type: 'admin' | 'doctor' | 'patient',
        token: string,
        new_password: string
      ): Promise<boolean> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
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
                Console.error(
                  '[APIs]: auth.recoverPassword: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      changePassword: (
        type: 'admin' | 'doctor' | 'patient',
        old_password: string,
        new_password: string,
        instance: AxiosInstance
      ): Promise<boolean> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
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
                Console.error(
                  '[APIs]: auth.changePassword: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      sighOut: (instance: AxiosInstance): Promise<void> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/auth?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'logout',
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
                    // remove development auth cookie
                    let cookieString =
                      encodeURIComponent('auth-token') + '=' + '';

                    // Add path
                    cookieString += '; path=/';

                    // Add domain
                    const domain = 'localhost';
                    cookieString += '; domain=' + domain;

                    // Add expiration date if provided
                    const expireDate = 'Thu, 01 Jan 1970 00:00:00 UTC';
                    cookieString += '; expires=' + expireDate;

                    // Add attributes for cross-origin sharing and secure connection
                    // cookieString += '; SameSite=None;';
                    cookieString += ';';

                    // Save cookie
                    document.cookie = cookieString;

                    resolve();
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error('[APIs]: auth.sighOut: catch:', err.toJSON());
                this.rejectResponse(err, reject);
              });
          }
        );
      },
    };
  };

  admin = () => {
    return {
      accountEdit: (
        name: string,
        phone: string,
        instance: AxiosInstance
      ): Promise<Admin> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
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
                Console.error(
                  '[APIs]: admin.accountEdit: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      createDepartment: (
        department_name: string,
        department_type: DepartmentType,
        description: string,
        leader_id: string,
        instance: AxiosInstance
      ): Promise<Department> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/admin?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'create_department',
                  department_name,
                  department_type,
                  description,
                  leader_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success && success.data && success.data.department) {
                    resolve(success.data.department);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: admin.createDepartment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      editDepartment: (
        department_id: string,
        department_name: string,
        department_type: DepartmentType,
        description: string,
        leader_id: string,
        instance: AxiosInstance
      ): Promise<Department> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/admin?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'edit_department',
                  department_id,
                  department_name,
                  department_type,
                  description,
                  leader_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success && success.data && success.data.department) {
                    resolve(success.data.department);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: admin.editDepartment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      removeDepartment: (
        department_id: string,
        instance: AxiosInstance
      ): Promise<void> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/admin?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'remove_department',
                  department_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                    resolve();
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: admin.removeDepartment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      getDepartmentsData: (instance: AxiosInstance): Promise<Department[]> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/admin?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'departments_data',
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success?.data?.departments) {
                    resolve(success.data.departments);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: admin.getDepartmentsData: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      getDoctorsSignupRequests: (
        instance: AxiosInstance
      ): Promise<Doctor[]> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/admin?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'doctors_signup_requests_data',
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success?.data?.doctors) {
                    resolve(success.data.doctors);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: admin.getDoctorsSignupRequests: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      getDoctorsData: (instance: AxiosInstance): Promise<Doctor[]> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/admin?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'doctors_data',
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success?.data?.doctors) {
                    resolve(success.data.doctors);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: admin.getDoctorsData: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      getDepartmentDoctorsData: (
        department_id: string,
        instance: AxiosInstance
      ): Promise<DepartmentDoctor[]> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/admin?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'department_doctors_data',
                  department_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success?.data?.department_doctors) {
                    resolve(success.data.department_doctors);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: admin.getDepartmentDoctorsData: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      verifyDoctorSignupRequest: (
        doctor_id: string,
        instance: AxiosInstance
      ): Promise<{
        doctor_signup_request_mail_sent?: APIResponseData['doctor_signup_request_mail_sent'];
      }> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/admin?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'verify_doctor_signup_request',
                  doctor_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success && success.data) {
                    resolve(success.data);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: admin.verifyDoctorSignupRequest: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      addDoctorToDepartment: (
        department_id: string,
        doctor_id: string,
        instance: AxiosInstance
      ): Promise<DepartmentDoctor> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/admin?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'add_doctor_to_department',
                  department_id,
                  doctor_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success && success.data?.department_doctor) {
                    resolve(success.data?.department_doctor);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: admin.addDoctorToDepartment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      removeDoctorFromDepartment: (
        department_id: string,
        doctor_id: string,
        instance: AxiosInstance
      ): Promise<void> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/admin?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'remove_doctor_from_department',
                  department_id,
                  doctor_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                    resolve();
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: admin.removeDoctorFromDepartment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
    };
  };

  doctor = () => {
    return {
      accountEdit: (
        name: string,
        phone: string,
        instance: AxiosInstance
      ): Promise<Doctor> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
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
                Console.error(
                  '[APIs]: doctor.accountEdit: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      getDepartmentsData: (instance: AxiosInstance): Promise<Department[]> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/doctor?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'departments_data',
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success?.data?.departments) {
                    resolve(success.data.departments);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: doctor.getDepartmentsData: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      getAppointmentsOfDepartment: (
        department_id: string,
        instance: AxiosInstance
      ): Promise<Appointment[]> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/doctor?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'department_appointments_data',
                  department_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success?.data?.appointments) {
                    resolve(success.data.appointments);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: doctor.getAppointmentsOfDepartment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      assignAppointment: (
        appointment_id: string,
        department_id: string,
        doctor_id: string,
        instance: AxiosInstance
      ): Promise<Appointment> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/doctor?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'assign_appointment',
                  appointment_id,
                  department_id,
                  doctor_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success?.data?.appointment) {
                    resolve(success.data.appointment);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: doctor.assignAppointment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      setOngoingAppointment: (
        appointment_id: string,
        instance: AxiosInstance
      ): Promise<Appointment> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/doctor?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'ongoing_appointment',
                  appointment_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success?.data?.appointment) {
                    resolve(success.data.appointment);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: doctor.setOngoingAppointment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      completeAppointment: (
        appointment_id: string,
        instance: AxiosInstance
      ): Promise<Appointment> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/doctor?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'complete_appointment',
                  appointment_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success?.data?.appointment) {
                    resolve(success.data.appointment);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: doctor.completeAppointment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
    };
  };

  patient = () => {
    return {
      accountEdit: (
        name: string,
        phone: string,
        instance: AxiosInstance
      ): Promise<Patient> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
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
                Console.error(
                  '[APIs]: patient.accountEdit: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      createAppointment: (
        appointment_name: string,
        department_id: string,
        description: string,
        appointed_at: number,
        instance: AxiosInstance
      ): Promise<Appointment> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/patient?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'create_appointment',
                  appointment_name,
                  department_id,
                  description,
                  appointed_at,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success && success.data && success.data.appointment) {
                    resolve(success.data.appointment);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: admin.createAppointment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      getAppointments: (instance: AxiosInstance): Promise<Appointment[]> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/patient?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'appointments_data',
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success?.data?.appointments) {
                    resolve(success.data.appointments);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: patient.getAppointments: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      rescheduleAppointment: (
        appointment_id: string,
        appointed_at: number,
        instance: AxiosInstance
      ): Promise<Appointment> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/patient?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'reschedule_appointment',
                  appointment_id,
                  appointed_at,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success && success.data && success.data.appointment) {
                    resolve(success.data.appointment);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: patient.rescheduleAppointment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
      cancelAppointment: (
        appointment_id: string,
        instance: AxiosInstance
      ): Promise<Appointment> => {
        return new Promise(
          (resolve, reject: (error: APIErrorResponse) => void) => {
            instance
              .post(
                '/api/patient?t=' + moment().valueOf(),
                JSON.stringify({
                  action: 'cancel_appointment',
                  appointment_id,
                })
              )
              .then((resp: AxiosResponse<APIResponse<APIResponseData>>) => {
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
                  if (success && success.data && success.data.appointment) {
                    resolve(success.data.appointment);
                  } else {
                    reject({
                      code: 500,
                      message: 'something went wrong',
                    });
                  }
                }
              })
              .catch((err: AxiosError<APIResponse>) => {
                Console.error(
                  '[APIs]: patient.cancelAppointment: catch:',
                  err.toJSON()
                );
                this.rejectResponse(err, reject);
              });
          }
        );
      },
    };
  };
}

export default APIs;
