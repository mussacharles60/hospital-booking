export type Appointment = {
  id: string;
  description: string;
  department: {
    id: string;
    name: string;
  };
  patient: {
    id: string;
    name: string;
  };
  doctor: {
    id: string;
    name: string;
  } | null;
  created_at: number;
  updated_at: number;
  appointed_at: number;
  status:
    | 'pending'
    | 'assigned-email_sent'
    | 'assigned-email_not_sent'
    | 'ongoing'
    | 'completed'
    | 'cancelled';
};
