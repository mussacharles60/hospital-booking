import { Admin } from './admin';
import { Appointment } from './appointment';
import { Department } from './department';
import { DepartmentDoctor, Doctor } from './doctor';
import { Patient } from './patient';

export type APIResponse<T = undefined> = {
  success?: APISuccessResponse<T>;
  error?: APIErrorResponse;
};

export type APISuccessResponse<T> = {
  code?: number;
  message?: string;
  data?: T;
};

export type APIErrorResponse = {
  code?: number;
  message?: string;
  reason?: 'invalid_token' | 'token_expired';
};

export type APIResponseData = {
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

export type AuthResponseData = {
  access_token?: string;
  token_type?: 'Bearer';
  admin?: Admin;
  doctor?: Doctor;
  patient?: Patient;
  password_recover_email_sent?: boolean;
};

export type AuthUser = {
  access_token?: string | null;
  user: Admin | Doctor | Patient | null;
};

export type AuthContextType = {
  auth: AuthUser | null;
  setAuth: (auth: AuthUser | null) => void;
};
