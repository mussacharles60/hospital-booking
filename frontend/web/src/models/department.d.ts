export type Department = {
  id: string;
  name: string;
  type: DepartmentType;
  description: string;
  leader: {
    id: string;
    name: string;
  };
  created_at: number;
  updated_at: number;
  profile_photo: null;
};

export type DepartmentType = 'maternity';
