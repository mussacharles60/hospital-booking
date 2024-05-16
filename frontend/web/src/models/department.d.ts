export type Department = {
  id: string;
  name: string;
  type: 'maternity';
  description: string;
  leader: {
    id: string;
    name: string;
  };
  created_at: number;
  updated_at: number;
  profile_photo: null;
};
