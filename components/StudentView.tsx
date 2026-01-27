
import React, { useState } from 'react';
import { User, StudyPlan, Module, IntakePlan } from '../types';
import { PROGRAMME_SEMESTERS, STATUS_COLORS } from '../constants';

interface StudentViewProps {
  student: User;
  plan?: StudyPlan;
  intakePlan?: IntakePlan;
  onUpdateStatus: (modules: Module[]) => void;
}

const StudentView: React.FC<StudentViewProps> = ({ student, plan, intakePlan, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'Personal' | 'Overall'>('Personal');

  const updateModuleStatus = (moduleId: string, status: any) => {
    if (!plan) return;
    const newModules = plan.modules.map(m => 
      m.id === moduleId ? { ...m, status } : m
    );
    onUpdateStatus(newModules);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter">My Academic Roadmap</h2>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-slate-500 font-medium">Batch: {student.intake}</p>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <p className="text-slate-500 font-medium">{student.programme}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex gap-1 shadow-2xl">
          <button 
            onClick={() => setActiveTab('Personal')}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'Personal' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            My Semester Plan
          </button>
          <button 
            onClick={() => setActiveTab('Overall')}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'Overall' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Overall Intake Plan
          </button>
        </div>
      </div>

      {activeTab === 'Personal' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: PROGRAMME_SEMESTERS[student.programme || 'DIT'] }, (_, i) => i + 1).map(sem => {
            const modules = plan?.modules.filter(m => m.semester === sem) || [];
            return (
              <div key={sem} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-teal-500/30">
                <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Semester {sem}</h3>
                  <span className="text-[10px] font-bold text-slate-600">{modules.length} Modules</span>
                </div>
                <div className="p-5 space-y-4">
                  {modules.map(m => (
                    <div key={m.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3 group">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-teal-500 uppercase tracking-tighter">{m.code}</span>
                        <select 
                          value={m.status}
                          onChange={(e) => updateModuleStatus(m.id, e.target.value)}
                          className="text-[9px] font-black uppercase rounded bg-slate-900 border border-slate-800 py-1 px-1.5 text-white focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer"
                        >
                          <option value="Planned">Planned</option>
                          <option value="Active">Active</option>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                          <option value="Retake">Retake</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-100 leading-snug">{m.name}</p>
                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-1 tracking-widest">{m.credits} Credits</p>
                      </div>
                    </div>
                  ))}
                  {modules.length === 0 && (
                    <div className="text-center py-10 opacity-20 italic text-xs">No entries</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
            <h3 className="text-2xl font-black text-white italic tracking-tighter">Master Curriculum: {student.intake}</h3>
            <div className="px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Core Programme Standards</span>
            </div>
          </div>
          
          {!intakePlan ? (
            <div className="p-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
              <div className="text-5xl mb-4 grayscale opacity-20">📜</div>
              <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Curriculum details pending publication by faculty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {intakePlan.modules.sort((a,b) => a.semester - b.semester).map(m => (
                <div key={m.id} className="flex items-center gap-5 p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex flex-col items-center justify-center shrink-0 border border-indigo-500/10">
                    <span className="text-[8px] font-black text-indigo-400 uppercase">Sem</span>
                    <span className="text-lg font-black text-white leading-none">{m.semester}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[10px] font-black text-indigo-400 uppercase shrink-0">{m.code}</span>
                      <span className="text-[9px] text-slate-600 font-bold truncate">• {m.credits} Credits</span>
                    </div>
                    <p className="text-sm font-bold text-white truncate">{m.name}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Faculty: {m.lecturer || 'Departmental'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentView;
