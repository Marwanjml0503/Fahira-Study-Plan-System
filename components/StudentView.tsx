
import React from 'react';
import { User, StudyPlan, ModuleStatus } from '../types';
import { STATUS_COLORS, PROGRAMME_SEMESTERS } from '../constants';

interface StudentViewProps {
  student: User;
  plan?: StudyPlan;
}

const StudentView: React.FC<StudentViewProps> = ({ student, plan }) => {
  if (!plan) return <div className="p-8 text-center text-slate-500">No study plan found.</div>;

  const totalSemesters = PROGRAMME_SEMESTERS[student.programme || 'DIT'] || 6;
  const semesters = Array.from({ length: totalSemesters }, (_, i) => i + 1);

  const getModulesForSem = (sem: number) => plan.modules.filter(m => m.semester === sem);

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic">My Study Plan</h2>
          <p className="text-slate-500 mt-2 font-medium">
            <span className="text-teal-500">{student.programme}</span> • Intake {student.intake} • Last updated: {new Date(plan.lastUpdated).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-8 shadow-2xl">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Credits</p>
            <p className="text-2xl font-black text-white">{plan.modules.reduce((acc, m) => acc + m.credits, 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Passed</p>
            <p className="text-2xl font-black text-emerald-400">{plan.modules.filter(m => m.status === 'Passed').length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Semesters</p>
            <p className="text-2xl font-black text-indigo-400">{totalSemesters}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {semesters.map(sem => {
          const modules = getModulesForSem(sem);
          return (
            <div key={sem} className="bg-slate-900/50 rounded-2xl shadow-lg border border-slate-800 overflow-hidden hover:border-slate-700 transition-all">
              <div className="bg-indigo-950 px-5 py-3.5 flex justify-between items-center border-b border-indigo-900/40">
                <h3 className="text-white font-bold tracking-tight">Semester {sem}</h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/20">{modules.length} Modules</span>
              </div>
              <div className="p-4 space-y-3 min-h-[160px]">
                {modules.length > 0 ? modules.map(m => (
                  <div key={m.id} className="group p-4 rounded-xl border border-slate-800/50 bg-slate-900/30 hover:bg-slate-800/50 hover:border-teal-500/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-teal-400 tracking-wider uppercase">{m.code}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border ${
                        m.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        m.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-100 leading-tight">{m.name}</p>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">{m.credits} Credits</p>
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center text-slate-700 italic text-sm">No modules planned</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentView;
