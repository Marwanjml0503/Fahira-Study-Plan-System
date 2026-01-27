
import React, { useState } from 'react';
import { User, StudyPlan, ChangeRequest, Module, IntakePlan } from '../types';
import { PROGRAMME_SEMESTERS } from '../constants';

interface LecturerViewProps {
  lecturer: User;
  students: User[];
  plans: Record<string, StudyPlan>;
  intakePlans: Record<string, IntakePlan>;
  requests: ChangeRequest[];
  onCreateRequest: (request: Omit<ChangeRequest, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateIntakePlan: (intakeId: string, modules: Module[]) => void;
}

const LecturerView: React.FC<LecturerViewProps> = ({ 
  lecturer, students, plans, intakePlans, requests, onCreateRequest, onUpdateIntakePlan 
}) => {
  const [selectedIntakeId, setSelectedIntakeId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showCurriculumUpload, setShowCurriculumUpload] = useState(false);
  const [curriculumData, setCurriculumData] = useState('');

  const intakes = Array.from(new Set(students.map(s => `${s.programme}-${s.intake}`))).sort();
  const filteredStudents = students.filter(s => `${s.programme}-${s.intake}` === selectedIntakeId);

  const handleImportCurriculum = () => {
    if (!selectedIntakeId || !curriculumData.trim()) return;
    
    // Format: Module code, module name, credit hours, lecturer, [optional semester]
    const lines = curriculumData.split('\n');
    const newModules: Module[] = lines.filter(l => l.trim()).map((line, i) => {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const [code, name, credits, lec, sem] = parts.map(s => s.trim());
      return {
        id: `ip-${selectedIntakeId}-${Date.now()}-${i}`,
        code: code || 'TBA',
        name: name || 'Untitled Module',
        credits: parseInt(credits) || 3,
        semester: parseInt(sem) || (i < 5 ? 1 : i < 10 ? 2 : 3), // Smart semester guess if not provided
        status: 'Planned',
        lecturer: lec || lecturer.name
      };
    });

    onUpdateIntakePlan(selectedIntakeId, newModules);
    setCurriculumData('');
    setShowCurriculumUpload(false);
    alert(`Master Curriculum for ${selectedIntakeId} updated successfully.`);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fadeIn pb-12">
      <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter leading-none">Academic Hub</h2>
          <p className="text-[10px] text-teal-500 uppercase font-black tracking-widest mt-2">Intake Oversight</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {intakes.map(id => (
            <button 
              key={id}
              onClick={() => {
                setSelectedIntakeId(id);
                setSelectedStudentId(null);
                setShowCurriculumUpload(false);
              }}
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${selectedIntakeId === id ? 'bg-teal-600 border-teal-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}`}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {!selectedIntakeId ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800 p-20 opacity-50">
          <p className="text-4xl italic font-black text-slate-700">SELECT ACADEMIC BATCH</p>
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] mt-4">Review Enrollment & Standards</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col shadow-2xl h-fit lg:max-h-[80vh]">
            <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center sticky top-0 z-10 rounded-t-3xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enrollment: {selectedIntakeId}</h3>
              <button 
                onClick={() => setShowCurriculumUpload(true)}
                className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors"
              >
                Config Master
              </button>
            </div>
            <div className="overflow-y-auto bg-[#0a101f] max-h-[50vh] lg:max-h-full">
              {filteredStudents.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStudentId(s.id); setShowCurriculumUpload(false); }}
                  className={`w-full text-left p-6 border-b border-slate-800/50 hover:bg-slate-800/30 transition-all flex items-center justify-between ${selectedStudentId === s.id ? 'bg-teal-500/10 border-l-4 border-teal-500' : ''}`}
                >
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                      {s.name}
                      {s.isSpecialCase && <span className="text-yellow-400 text-lg drop-shadow-sm">★</span>}
                    </div>
                    <div className="text-[10px] text-slate-600 uppercase font-black mt-1 tracking-tighter">ID: {s.id}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl min-h-[600px] flex flex-col">
            {showCurriculumUpload ? (
              <div className="p-6 md:p-8 animate-fadeIn flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-white font-black italic text-xl">Intake Master Curriculum Import</h3>
                  <p className="text-slate-500 text-xs mt-1">Define the baseline modules for {selectedIntakeId}.</p>
                </div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 mb-6">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Expected Column Order</p>
                   <p className="text-xs font-mono text-indigo-400 leading-relaxed">
                      Module Code, Module Name, Credit Hours, Lecturer, Semester (optional)
                   </p>
                </div>
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <textarea 
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-teal-400 font-mono text-xs focus:ring-2 focus:ring-teal-500 outline-none shadow-inner resize-none transition-all"
                    placeholder="CSC1101, Programming Basics, 3, Mr. Marwan, 1&#10;MPU210, Entrepreneurship, 3, Mr. Sanjay, 6"
                    value={curriculumData}
                    onChange={(e) => setCurriculumData(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-4 mt-8">
                  <button onClick={() => setShowCurriculumUpload(false)} className="text-slate-500 font-black uppercase text-[10px]">Cancel</button>
                  <button onClick={handleImportCurriculum} className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">Publish Master Plan</button>
                </div>
              </div>
            ) : selectedStudentId ? (
              <div className="flex flex-col">
                <div className="p-8 bg-slate-950 border-b border-slate-800 flex justify-between items-center rounded-t-3xl">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-white italic tracking-tighter">{students.find(s => s.id === selectedStudentId)?.name}</h3>
                      {students.find(s => s.id === selectedStudentId)?.isSpecialCase && <span className="text-yellow-400 font-bold text-[9px] uppercase tracking-widest bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20 flex items-center gap-1">★ Special Case</span>}
                    </div>
                    <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest mt-1">Individual Progress Mapping</p>
                  </div>
                  <button onClick={() => setSelectedStudentId(null)} className="text-slate-500 font-black uppercase text-[10px]">Close View</button>
                </div>
                
                <div className="p-8 bg-[#0a101f] space-y-12 rounded-b-3xl">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 border-b border-slate-800 pb-10">
                      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Intake Standards</h4>
                         <div className="space-y-2 max-h-60 overflow-y-auto pr-4">
                            {intakePlans[selectedIntakeId]?.modules.slice(0, 20).map(m => (
                               <div key={m.id} className="text-[10px] text-slate-400 flex justify-between border-b border-slate-800/50 pb-2">
                                  <span>{m.code} {m.name}</span>
                                  <span className="font-bold">Sem {m.semester}</span>
                               </div>
                            ))}
                            {(!intakePlans[selectedIntakeId] || intakePlans[selectedIntakeId]?.modules.length === 0) && (
                               <p className="text-xs text-slate-600 italic">No master standards defined for this intake.</p>
                            )}
                         </div>
                      </div>
                      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Live Module Status</h4>
                         <div className="space-y-3">
                            {plans[selectedStudentId]?.modules.filter(m => m.status === 'Active' || m.status === 'In Progress').map(m => (
                               <div key={m.id} className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl flex justify-between items-center">
                                  <div>
                                     <p className="text-[10px] font-black text-teal-400">{m.code}</p>
                                     <p className="text-xs font-bold text-white">{m.name}</p>
                                  </div>
                                  <span className="text-[9px] font-black text-teal-400 uppercase tracking-tighter">In Training</span>
                               </div>
                            ))}
                            {plans[selectedStudentId]?.modules.filter(m => m.status === 'Active' || m.status === 'In Progress').length === 0 && (
                               <p className="text-xs text-slate-600 italic text-center py-4">Student has no modules marked as active.</p>
                            )}
                         </div>
                      </div>
                   </div>

                  {Array.from({ length: PROGRAMME_SEMESTERS[selectedIntakeId.split('-')[0]] || 6 }, (_, i) => i + 1).map(sem => (
                    <div key={sem}>
                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 border-l-2 border-indigo-500 pl-3">Semester {sem}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plans[selectedStudentId]?.modules.filter(m => m.semester === sem).map(m => (
                          <div key={m.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center transition-all hover:border-slate-600">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-teal-400 uppercase">{m.code}</span>
                                <span className="text-[8px] text-slate-600 font-bold uppercase">• {m.credits} Credits</span>
                              </div>
                              <p className="text-sm font-bold text-white mt-1 leading-snug">{m.name}</p>
                            </div>
                            <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase border ${
                              m.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              m.status === 'Active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              m.status === 'Failed' || m.status === 'Retake' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-slate-500/10 text-slate-500 border-slate-800'
                            }`}>
                              {m.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 bg-[#0a101f] rounded-3xl">
                 <div className="text-6xl mb-6 grayscale opacity-10">🔍</div>
                 <p className="text-xl italic font-black text-slate-500 uppercase tracking-tighter">Academic Inspection</p>
                 <p className="text-[10px] uppercase font-bold tracking-[0.2em] mt-2 opacity-50">Select student from {selectedIntakeId} to view history</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerView;
