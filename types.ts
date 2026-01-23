
export type Role = 'Admin' | 'Lecturer' | 'Student';

export type ModuleStatus = 'Planned' | 'In Progress' | 'Passed' | 'Failed' | 'Retake';

export interface Module {
  id: string;
  code: string;
  name: string;
  semester: number;
  status: ModuleStatus;
  credits: number;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  programme?: string; // e.g., 'DIT', 'BIT'
  intake?: string;    // e.g., 'May 2024'
}

export interface StudyPlan {
  id: string;
  studentId: string;
  modules: Module[];
  lastUpdated: string;
  updatedBy: string;
}

export interface ChangeRequest {
  id: string;
  studentId: string;
  lecturerId: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  proposedModules: Module[];
  createdAt: string;
}
