
import { User, Module, ModuleStatus } from './types';

export const PASS_KEY = "Cristiano";

export const PROGRAMME_SEMESTERS: Record<string, number> = {
  'DIT': 6,
  'BIT': 9
};

export const MOCK_STUDENTS: User[] = [
  { id: 's1', name: 'Marwan', role: 'Student', programme: 'DIT', intake: "May'24" },
  { id: 's2', name: 'Rayne', role: 'Student', programme: 'DIT', intake: "May'24" },
  { id: 's3', name: 'Loges', role: 'Student', programme: 'DIT', intake: "Jan'24" },
  { id: 's4', name: 'Ashik', role: 'Student', programme: 'BIT', intake: "Jan'23" },
  { id: 's5', name: 'Sanjay', role: 'Student', programme: 'BIT', intake: "May'24" },
];

export const MOCK_LECTURERS: User[] = [
  { id: 'l1', name: 'Marwan', role: 'Lecturer' }
];

export const MOCK_ADMINS: User[] = [
  { id: 'a1', name: 'Marwan', role: 'Admin' }
];

export const INITIAL_MODULES: Module[] = [
  { id: 'm1', code: 'CSC1101', name: 'Introduction to Programming', semester: 1, status: 'Passed', credits: 3 },
  { id: 'm2', code: 'MAT1102', name: 'Discrete Mathematics', semester: 1, status: 'Passed', credits: 4 },
  { id: 'm3', code: 'ENG1103', name: 'Technical English', semester: 1, status: 'Passed', credits: 2 },
  { id: 'm4', code: 'DBS1201', name: 'Database Systems', semester: 2, status: 'In Progress', credits: 3 },
  { id: 'm5', code: 'NET1202', name: 'Networking Fundamentals', semester: 2, status: 'In Progress', credits: 3 },
  { id: 'm6', code: 'WEB2101', name: 'Web Development', semester: 3, status: 'Planned', credits: 3 },
  { id: 'm7', code: 'OS12102', name: 'Operating Systems', semester: 3, status: 'Planned', credits: 3 },
];

export const STATUS_COLORS: Record<ModuleStatus, string> = {
  'Passed': 'bg-green-100 text-green-700 border-green-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'Planned': 'bg-gray-100 text-gray-700 border-gray-200',
  'Failed': 'bg-red-100 text-red-700 border-red-200',
  'Retake': 'bg-orange-100 text-orange-700 border-orange-200',
};
