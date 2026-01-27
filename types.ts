
export type Role = 'Admin' | 'Lecturer' | 'Student';

export type ModuleStatus = 'Planned' | 'In Progress' | 'Passed' | 'Failed' | 'Retake' | 'Active';

export interface Module {
  id: string;
  code: string;
  name: string;
  semester: number;
  status: ModuleStatus;
  credits: number;
  lecturer?: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  password?: string;
  programme?: string;
  intake?: string; // Format: 0524 (May 2024), 0124 (Jan 2024), 0924 (Sep 2024)
  isSpecialCase?: boolean;
}

export interface IntakePlan {
  intake_id: string; // e.g., DIT-0524
  modules: Module[];
  last_updated: string;
}

export interface StudyPlan {
  id: string;
  studentId: string;
  modules: Module[]; // Individual semester-by-semester tracking
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
