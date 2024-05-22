export type Doctor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: number;
  updated_at: number;
  registration_status: 'waiting';
  certificate: null;
  identity: null;
};

export type DepartmentDoctor = {
  id: string;
  name: string;
  created_at: number;
  department: {
    id: string;
    name: string;
  };
};
