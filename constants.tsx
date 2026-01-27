
import { User, Module, ModuleStatus } from './types';

export const PASS_KEY = "1234";

export const PROGRAMME_SEMESTERS: Record<string, number> = {
  'DIT': 6,
  'BIT': 9
};

export const MOCK_STUDENTS: User[] = [
  { id: '2024001', name: 'Marwan', role: 'Student', programme: 'DIT', intake: "0524", isSpecialCase: true, password: "1234" },
  { id: '2024002', name: 'Rayne', role: 'Student', programme: 'DIT', intake: "0524", isSpecialCase: false, password: "1234" },
  { id: '2024003', name: 'Loges', role: 'Student', programme: 'DIT', intake: "0124", isSpecialCase: false, password: "1234" },
  { id: '2023001', name: 'Ashik', role: 'Student', programme: 'BIT', intake: "0923", isSpecialCase: true, password: "1234" },
  { id: '2024004', name: 'Sanjay', role: 'Student', programme: 'BIT', intake: "0524", isSpecialCase: false, password: "1234" },
];

export const MOCK_LECTURERS: User[] = [
  { id: 'L001', name: 'Marwan', role: 'Lecturer', password: "1234" }
];

export const MOCK_ADMINS: User[] = [
  { id: 'A001', name: 'Marwan', role: 'Admin', password: "1234" }
];

export const INITIAL_MODULES: Module[] = [
  { id: 'm1', code: 'CSC1101', name: 'Programming Fundamentals', semester: 1, status: 'Passed', credits: 3, lecturer: 'Mr. Marwan' },
  { id: 'm2', code: 'MAT1102', name: 'Discrete Math', semester: 1, status: 'Passed', credits: 4, lecturer: 'Dr. Loges' },
  { id: 'm3', code: 'ENG1103', name: 'English for IT', semester: 1, status: 'Passed', credits: 2, lecturer: 'Ms. Rayne' },
  { id: 'm4', code: 'DBS1201', name: 'Database Systems', semester: 2, status: 'Active', credits: 3, lecturer: 'Mr. Ashik' },
  { id: 'm5', code: 'NET1202', name: 'Networking', semester: 2, status: 'Active', credits: 3, lecturer: 'Mr. Marwan' },
  { id: 'm6', code: 'WEB2101', name: 'Full Stack Web', semester: 3, status: 'Planned', credits: 3, lecturer: 'TBA' },
  { id: 'm7', code: 'MPU210', name: 'Entrepreneurship', semester: 6, status: 'Planned', credits: 3, lecturer: 'Mr. Sanjay' },
  { id: 'm8', code: 'MPU211', name: 'Generative AI', semester: 6, status: 'Planned', credits: 3, lecturer: 'Dr. Rayne' },
];

export const STATUS_COLORS: Record<ModuleStatus, string> = {
  'Passed': 'bg-green-100 text-green-700 border-green-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'Planned': 'bg-gray-100 text-gray-700 border-gray-200',
  'Failed': 'bg-red-100 text-red-700 border-red-200',
  'Retake': 'bg-orange-100 text-orange-700 border-orange-200',
  'Active': 'bg-teal-100 text-teal-700 border-teal-200',
};
