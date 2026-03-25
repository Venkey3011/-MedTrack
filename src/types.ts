export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "patient";
  profileComplete?: boolean;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  phone?: string;
  address?: string;
  doctorName?: string;
}

export interface Report {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
  };
  title: string;
  description: string;
  fileUrl: string;
  date: string;
}

export interface Medication {
  _id: string;
  patientId: string;
  name: string;
  dosage: string;
  time: string;
  days: string[];
  active: boolean;
}

export interface Notification {
  _id: string;
  patientId?: {
    _id: string;
    name: string;
    email: string;
  };
  title: string;
  message: string;
  type: "info" | "warning" | "urgent";
  date: string;
}
