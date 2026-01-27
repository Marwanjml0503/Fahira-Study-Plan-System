
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
  const [isSyncing, setIsSyncing] = useState(false);

  const updateModuleStatus = (moduleId: string, status: any) => {
    if (!plan) return;
    const newModules = plan.modules.map(m => 
      m.id === moduleId ? { ...m, status } : m
    );
    onUpdateStatus(newModules);
  };

  const handleSyncWithMaster = async () => {
    if (!intakePlan) {
      alert("No master curriculum has been published for your intake yet.");
      return;
    }
    
    setIsSyncing(true);
    // Clone master modules to personal plan
    const initializedModules: Module[] = intakePlan.modules.map(m => ({
      ...m,
      id: `p-${student.id}-${m.code}-${Date.now()}`, // Unique ID for personal instance
      status: 'Planned'
    }));

    setTimeout(() => {
      onUpdateStatus(initializedModules);
      setIsSyncing(false);
      alert("Academic roadmap synced with faculty standards!");
    }, 800);
  };

  const hasPlan = plan && plan.modules && plan.modules.length > 0;

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-black text-white italic tracking-tighter">My Academic Roadmap</h2>
            {student.isSpecialCase && (
              <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                ★ Special Case Student
              </span>
            )}
          </div>
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

      {!hasPlan && activeTab === 'Personal' && (
        <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-[2rem] p-16 text-center animate-pulse">
          <div className="w-20 h-20 bg-teal-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-teal-500/20 text-3xl">📡</div>
          <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">Personal Roadmap Empty</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">Your individual tracking list is currently blank. Sync with the faculty published master plan to get started.</p>
          <button 
            onClick={handleSyncWithMaster}
            disabled={isSyncing || !intakePlan}
            className={`bg-teal-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-teal-500 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto ${(!intakePlan || isSyncing) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSyncing ? 'Syncing with Cloud...' : '🚀 Initialize Plan from Master'}
          </button>
          {!intakePlan && <p className="text-red-400 text-[10px] font-bold uppercase mt-4 tracking-widest">Faculty has not published standards for {student.intake} yet.</p>}
        </div>
      )}

      {activeTab === 'Personal' && hasPlan && (
        <div className="space-y-12">
          <div className="flex justify-between items-center bg-teal-500/5 p-6 rounded-3xl border border-teal-500/10">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xl font-bold">✓</div>
                <div>
                   <p className="text-white font-black text-sm uppercase tracking-tighter italic">Live Tracking Active</p>
                   <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest">Database records synced</p>
                </div>
             </div>
             <button 
               onClick={handleSyncWithMaster}
               className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-teal-400 transition-colors"
             >
               Force Re-Sync
             </button>
          </div>

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
                            className={`text-[9px] font-black uppercase rounded border py-1 px-1.5 outline-none cursor-pointer transition-colors ${
                              m.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                              m.status === 'Active' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' :
                              'bg-slate-900 border-slate-800 text-white'
                            }`}
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
                      <div className="text-center py-10 opacity-20 italic text-xs">No entries scheduled</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'Overall' && (
        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-10 shadow-2xl animate-fadeIn">
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 border-b border-slate-800 pb-8 gap-4">
            <div>
              <h3 className="text-3xl font-black text-white italic tracking-tighter">Master Curriculum standards</h3>
              <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Standard Roadmap for Batch {student.intake}</p>
            </div>
            <div className="px-6 py-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Faculty Verified</span>
            </div>
          </div>
          
          {!intakePlan ? (
            <div className="p-24 text-center border-2 border-dashed border-slate-800 rounded-[2rem]">
              <div className="text-6xl mb-6 grayscale opacity-20">📜</div>
              <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Faculty curriculum standards pending publication.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {intakePlan.modules.sort((a,b) => a.semester - b.semester).map(m => (
                <div key={m.id} className="flex items-center gap-5 p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:bg-slate-800/50 transition-all hover:border-indigo-500/30">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-indigo-500/20 shadow-lg">
                    <span className="text-[8px] font-black text-indigo-400 uppercase">Sem</span>
                    <span className="text-xl font-black text-white leading-none">{m.semester}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 overflow-hidden mb-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase shrink-0">{m.code}</span>
                      <span className="text-[9px] text-slate-600 font-black uppercase truncate">• {m.credits} Credits</span>
                    </div>
                    <p className="text-sm font-black text-white truncate leading-tight">{m.name}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2">Lecturer: {m.lecturer || 'Faculty'}</p>
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
