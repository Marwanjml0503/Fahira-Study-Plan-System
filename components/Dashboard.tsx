
import React from 'react';
import { User, StudyPlan, ChangeRequest, Module, IntakePlan } from '../types';
import StudentView from './StudentView';
import LecturerView from './LecturerView';
import AdminView from './AdminView';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  students: User[];
  lecturers: User[];
  plans: Record<string, StudyPlan>;
  intakePlans: Record<string, IntakePlan>;
  requests: ChangeRequest[];
  dbError?: string | null;
  onUpdateIntakePlan: (intakeId: string, modules: Module[]) => void;
  onCreateRequest: (request: Omit<ChangeRequest, 'id' | 'createdAt' | 'status'>) => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onUpdatePersonalPlan: (studentId: string, modules: Module[]) => void;
  onAddUser: (user: User) => void;
  onBulkAddUsers: (users: User[]) => void;
  onDeleteUser: (userId: string) => void;
  onSeedData: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { user, onLogout } = props;
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex items-center justify-between shadow-2xl z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-teal-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-xl">F</div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">Fahira</h1>
            <p className="text-[10px] text-teal-500 uppercase font-bold tracking-widest">Academic Governance</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-100">{user.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              user.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
              user.role === 'Lecturer' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {user.role}
            </span>
          </div>
          <button onClick={onLogout} className="text-slate-500 hover:text-red-400 transition-all p-2 rounded-full hover:bg-red-400/10 border border-transparent hover:border-red-400/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-slate-950 p-8">
        {user.role === 'Student' && (
          <StudentView 
            student={user} 
            plan={props.plans[user.id]} 
            intakePlan={props.intakePlans[`${user.programme}-${user.intake}`]}
            onUpdateStatus={(mods) => props.onUpdatePersonalPlan(user.id, mods)}
          />
        )}
        {user.role === 'Lecturer' && (
          <LecturerView 
            lecturer={user} 
            students={props.students} 
            plans={props.plans} 
            intakePlans={props.intakePlans}
            requests={props.requests}
            onCreateRequest={props.onCreateRequest}
            onUpdateIntakePlan={props.onUpdateIntakePlan}
          />
        )}
        {user.role === 'Admin' && (
          <AdminView 
            admin={user} 
            students={props.students} 
            lecturers={props.lecturers}
            plans={props.plans} 
            intakePlans={props.intakePlans}
            requests={props.requests}
            dbError={props.dbError}
            onApproveRequest={props.onApproveRequest}
            onRejectRequest={props.onRejectRequest}
            onUpdatePersonalPlan={props.onUpdatePersonalPlan}
            onUpdateIntakePlan={props.onUpdateIntakePlan}
            onAddUser={props.onAddUser}
            onBulkAddUsers={props.onBulkAddUsers}
            onDeleteUser={props.onDeleteUser}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
