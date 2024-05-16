import { Admin } from './admin';
import { Appointment } from './appointment';
import { Department } from './department';
import { DepartmentDoctor, Doctor } from './doctor';
import { Patient } from './patient';

export type APIResponseType = {
  success?: APISuccessResponseType;
  error?: APIErrorResponseType;
};

export type APISuccessResponseType = {
  code?: number;
  message?: string;
  data?: APIResponseData;
};

export type APIErrorResponseType = {
  code?: number;
  message?: string;
};

export type APIResponseData = {
  token?: string;
  token_type?: 'Bearer';
  admin?: Admin;
  doctor?: Doctor;
  department?: Department;
  departments?: Department[];
  patient?: Patient;
  patients?: Patient[];
  appointment?: Appointment;
  appointments?: Appointment[];
  department_doctor?: DepartmentDoctor;
  department_doctors?: DepartmentDoctor[];
};
