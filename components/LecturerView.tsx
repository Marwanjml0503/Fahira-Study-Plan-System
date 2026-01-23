
import React, { useState } from 'react';
import { User, StudyPlan, ChangeRequest, Module } from '../types';
import { STATUS_COLORS, PROGRAMME_SEMESTERS } from '../constants';

interface LecturerViewProps {
  lecturer: User;
  students: User[];
  plans: Record<string, StudyPlan>;
  requests: ChangeRequest[];
  onCreateRequest: (request: Omit<ChangeRequest, 'id' | 'createdAt' | 'status'>) => void;
}

const LecturerView: React.FC<LecturerViewProps> = ({ lecturer, students, plans, requests, onCreateRequest }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Module[] | null>(null);
  const [remarks, setRemarks] = useState('');
  const [search, setSearch] = useState('');

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()));

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setEditingPlan([...plans[id].modules]);
    setRemarks('');
  };

  const handleMoveModule = (moduleId: string, direction: 'up' | 'down') => {
    if (!editingPlan) return;
    const student = students.find(s => s.id === selectedStudentId);
    const maxSem = PROGRAMME_SEMESTERS[student?.programme || 'DIT'];
    
    setEditingPlan(prev => prev?.map(m => {
      if (m.id === moduleId) {
        const nextSem = direction === 'up' ? m.semester - 1 : m.semester + 1;
        if (nextSem >= 1 && nextSem <= maxSem) return { ...m, semester: nextSem };
      }
      return m;
    }) || null);
  };

  const handleChangeStatus = (moduleId: string, status: any) => {
    setEditingPlan(prev => prev?.map(m => m.id === moduleId ? { ...m, status } : m) || null);
  };

  const handleSubmitProposal = () => {
    if (!selectedStudentId || !editingPlan) return;
    onCreateRequest({
      studentId: selectedStudentId,
      lecturerId: lecturer.id,
      reason: remarks,
      proposedModules: editingPlan
    });
    alert("Proposal submitted to admin for approval.");
    setSelectedStudentId(null);
    setEditingPlan(null);
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex gap-8">
      {/* Sidebar: Student List */}
      <div className="w-80 flex flex-col gap-4">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="font-bold text-slate-100 mb-4">Find Student</h3>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm text-white transition-all"
            />
            <span className="absolute left-3 top-3 text-slate-600">🔍</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex-1 shadow-xl">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800">
            <h3 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">Active Enrollments</h3>
          </div>
          <div className="overflow-auto max-h-[calc(100vh-320px)]">
            {filteredStudents.map(s => (
              <button
                key={s.id}
                onClick={() => handleSelectStudent(s.id)}
                className={`w-full text-left px-6 py-5 border-b border-slate-800 last:border-0 hover:bg-slate-800 transition-all ${selectedStudentId === s.id ? 'bg-teal-500/10 border-l-4 border-l-teal-500' : ''}`}
              >
                <div className="font-bold text-slate-100">{s.name}</div>
                <div className="text-[10px] text-slate-500 font-black uppercase mt-1 tracking-tighter">{s.programme} • {s.intake}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Panel: Editor */}
      <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
        {!selectedStudentId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-12 text-center">
            <div className="w-24 h-24 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center mb-6 text-4xl shadow-inner italic font-black">F</div>
            <h3 className="text-xl font-bold text-slate-300">Ready to Propose</h3>
            <p className="max-w-xs mt-3 text-sm font-medium">Select a student to begin crafting their academic trajectory.</p>
          </div>
        ) : (
          <>
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight italic">Editing Proposal: <span className="text-teal-400 not-italic">{students.find(s => s.id === selectedStudentId)?.name}</span></h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Controlled Edit Mode</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedStudentId(null)}
                  className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitProposal}
                  className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-500 shadow-lg shadow-teal-500/20 transition-all transform active:scale-95"
                >
                  Send to Admin
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8 space-y-12 bg-[#0a101f]">
              <div className="bg-indigo-950/30 p-6 rounded-2xl border border-indigo-500/20">
                <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">Rationale for Changes</label>
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Explain your reasoning for the admin..."
                  className="w-full h-24 p-4 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-teal-500 outline-none text-sm transition-all"
                />
              </div>

              {Array.from({ length: PROGRAMME_SEMESTERS[students.find(s => s.id === selectedStudentId)?.programme || 'DIT'] }, (_, i) => i + 1).map(sem => (
                <div key={sem} className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-lg font-black text-slate-400 tracking-tighter uppercase">Semester {sem}</h3>
                    <div className="h-[1px] bg-slate-800 w-full opacity-50"></div>
                  </div>
                  <div className="space-y-3">
                    {editingPlan?.filter(m => m.semester === sem).map(m => (
                      <div key={m.id} className="flex items-center gap-6 p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-teal-500/30 transition-all group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black text-teal-500 uppercase tracking-tighter">{m.code}</span>
                            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">• {m.credits} Credits</span>
                          </div>
                          <p className="font-bold text-slate-200">{m.name}</p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <select 
                            value={m.status}
                            onChange={(e) => handleChangeStatus(m.id, e.target.value)}
                            className="text-[10px] font-black uppercase rounded-lg bg-slate-950 border border-slate-800 py-1.5 px-3 text-slate-300 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                          >
                            <option value="Planned">Planned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Passed">Passed</option>
                            <option value="Failed">Failed</option>
                            <option value="Retake">Retake</option>
                          </select>

                          <div className="flex flex-col gap-1.5">
                            <button 
                              onClick={() => handleMoveModule(m.id, 'up')}
                              className="p-1 hover:bg-teal-500/10 rounded text-slate-600 hover:text-teal-400 transition-all"
                              title="Previous Semester"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 4.86l-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/></svg>
                            </button>
                            <button 
                              onClick={() => handleMoveModule(m.id, 'down')}
                              className="p-1 hover:bg-teal-500/10 rounded text-slate-600 hover:text-teal-400 transition-all"
                              title="Next Semester"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {editingPlan?.filter(m => m.semester === sem).length === 0 && (
                      <div className="py-6 border-2 border-dashed border-slate-800/50 rounded-2xl text-center text-slate-700 text-[10px] font-black uppercase tracking-widest">
                        Available Semester Slot
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LecturerView;
