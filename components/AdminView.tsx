
import React, { useState } from 'react';
import { User, StudyPlan, ChangeRequest, Module } from '../types';
import { STATUS_COLORS, PROGRAMME_SEMESTERS, PASS_KEY } from '../constants';

interface AdminViewProps {
  admin: User;
  students: User[];
  lecturers: User[];
  plans: Record<string, StudyPlan>;
  requests: ChangeRequest[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onUpdatePlanDirectly: (studentId: string, modules: Module[]) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onSeedData: () => Promise<void>;
  dbError?: string | null;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  admin, students, lecturers, plans, requests, onApproveRequest, onRejectRequest, onUpdatePlanDirectly, onAddUser, onDeleteUser, onSeedData, dbError 
}) => {
  const [activeTab, setActiveTab] = useState<'Requests' | 'Management' | 'Users' | 'DB Setup'>('Requests');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Module[] | null>(null);
  
  const [isEditingUser, setIsEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formData, setFormData] = useState<User>({ id: '', name: '', role: 'Student', programme: 'DIT', intake: "May'24", password: PASS_KEY });

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const allSystemUsers = [...students, ...lecturers];

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setEditingPlan([...(plans[id]?.modules || [])]);
    setActiveTab('Management');
  };

  const updateModuleField = (moduleId: string, field: keyof Module, value: any) => {
    setEditingPlan(prev => prev?.map(m => m.id === moduleId ? { ...m, [field]: value } : m) || null);
  };

  const addModuleToSemester = (sem: number) => {
    const newMod: Module = {
      id: `m-${Date.now()}`,
      code: 'NEW0000',
      name: 'New Module',
      semester: sem,
      status: 'Planned',
      credits: 3
    };
    setEditingPlan(prev => prev ? [...prev, newMod] : [newMod]);
  };

  const removeModule = (moduleId: string) => {
    setEditingPlan(prev => prev?.filter(m => m.id !== moduleId) || null);
  };

  const handleUpdateDirectly = () => {
    if (selectedStudentId && editingPlan) {
      onUpdatePlanDirectly(selectedStudentId, editingPlan);
      alert("Changes committed to Supabase Cloud.");
      setSelectedStudentId(null);
      setEditingPlan(null);
    }
  };

  const openAddUser = () => {
    setFormData({ id: `s-${Date.now()}`, name: '', role: 'Student', programme: 'DIT', intake: "May'24", password: PASS_KEY });
    setIsAddingUser(true);
    setShowFormPassword(false);
  };

  const openEditUser = (user: User) => {
    setFormData({ ...user, password: user.password || PASS_KEY });
    setIsEditingUser(user);
    setShowFormPassword(false);
  };

  const submitUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser(formData);
    setIsAddingUser(false);
    setIsEditingUser(null);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic">Admin Console</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full shadow-lg ${dbError ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
            <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">
              {dbError ? 'Local Mode' : 'Live Supabase Connected'}
            </p>
          </div>
        </div>
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-1 shadow-2xl">
          {(['Requests', 'Management', 'Users', 'DB Setup'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'Management') {
                  setSelectedStudentId(null);
                  setEditingPlan(null);
                }
              }}
              className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              {tab === 'Requests' && pendingRequests.length > 0 && (
                <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-ping mr-2"></span>
              )}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Requests' && (
        <div className="space-y-6">
          {pendingRequests.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl p-24 text-center border-2 border-dashed border-slate-800 shadow-xl">
              <h3 className="text-xl font-bold text-slate-300">Queue Empty</h3>
              <p className="text-slate-600 mt-2 text-sm italic">All academic proposals have been processed.</p>
            </div>
          ) : (
            pendingRequests.map(req => {
              const student = students.find(s => s.id === req.studentId);
              return (
                <div key={req.id} className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden group transition-all hover:border-indigo-500/30">
                  <div className="bg-slate-950 px-8 py-5 flex items-center justify-between border-b border-slate-800">
                    <div>
                      <h3 className="text-white font-bold">{student?.name} Proposal</h3>
                      <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1">Origin: {req.lecturerId} • {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => onRejectRequest(req.id)} className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Reject</button>
                      <button onClick={() => onApproveRequest(req.id)} className="bg-teal-500/10 hover:bg-teal-600 text-teal-500 hover:text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg">Approve</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'Management' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-250px)] animate-fadeIn">
          <div className="lg:col-span-1 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 bg-slate-950">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Academic Records</h3>
            </div>
            <div className="flex-1 overflow-auto bg-[#0a101f]">
              {students.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectStudent(s.id)}
                  className={`w-full text-left p-6 border-b border-slate-800/50 hover:bg-slate-800/50 transition-all ${selectedStudentId === s.id ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : ''}`}
                >
                  <div className="font-bold text-slate-100">{s.name}</div>
                  <div className="text-[10px] text-slate-600 uppercase font-black mt-1 tracking-tighter">{s.programme} • {s.intake}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-3 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
            {!selectedStudentId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 bg-[#0a101f]">
                <h3 className="text-xl font-black italic tracking-tighter uppercase text-slate-500">Plan Authority Editor</h3>
                <p className="text-sm mt-2 opacity-50">Select a student record to modify curriculum</p>
              </div>
            ) : (
              <>
                <div className="p-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950 sticky top-0 z-10">
                  <div>
                    <h2 className="text-xl font-black text-white italic tracking-tighter">Plan Authority: {students.find(s => s.id === selectedStudentId)?.name}</h2>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">Full Overwrite Access</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setSelectedStudentId(null)} className="px-5 py-2 text-slate-500 font-black uppercase text-[10px] hover:text-white transition-all">Discard</button>
                    <button onClick={handleUpdateDirectly} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-500 transition-all">Commit to Cloud</button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-8 space-y-10 bg-[#0a101f]">
                  {Array.from({ length: PROGRAMME_SEMESTERS[students.find(s => s.id === selectedStudentId)?.programme || 'DIT'] }, (_, i) => i + 1).map(sem => (
                    <div key={sem}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] border-l-2 border-indigo-500 pl-3">Semester {sem}</h4>
                        <button 
                          onClick={() => addModuleToSemester(sem)}
                          className="text-[9px] font-black text-teal-400 uppercase tracking-widest hover:text-teal-300 flex items-center gap-1 transition-colors"
                        >
                          <span className="text-lg">+</span> Add Module
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {editingPlan?.filter(m => m.semester === sem).map(m => (
                          <div key={m.id} className="flex flex-col gap-3 p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-600 transition-all relative group">
                            <button 
                              onClick={() => removeModule(m.id)}
                              className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              title="Delete Module"
                            >
                              ×
                            </button>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                value={m.code}
                                onChange={(e) => updateModuleField(m.id, 'code', e.target.value)}
                                className="w-1/3 text-[9px] font-black text-indigo-400 bg-slate-950 border border-slate-800 px-2 py-1 rounded uppercase outline-none focus:border-indigo-500"
                              />
                              <input 
                                type="text"
                                value={m.name}
                                onChange={(e) => updateModuleField(m.id, 'name', e.target.value)}
                                className="w-2/3 text-xs font-bold text-slate-100 bg-slate-950 border border-slate-800 px-2 py-1 rounded outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Credits:</span>
                                <input 
                                  type="number" 
                                  value={m.credits} 
                                  onChange={(e) => updateModuleField(m.id, 'credits', parseInt(e.target.value))}
                                  className="w-10 bg-slate-950 border border-slate-800 text-[9px] font-black text-white px-1 py-0.5 rounded"
                                />
                              </div>
                              <select 
                                value={m.status}
                                onChange={(e) => updateModuleField(m.id, 'status', e.target.value)}
                                className="text-[9px] font-black uppercase rounded-lg bg-slate-950 border border-slate-800 py-1 px-2 text-slate-300 focus:ring-1 focus:ring-teal-500 outline-none"
                              >
                                {['Planned', 'In Progress', 'Passed', 'Failed', 'Retake'].map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h3 className="text-2xl font-black italic text-white tracking-tighter text-center sm:text-left">Personnel Database</h3>
            <button 
              onClick={openAddUser}
              className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex items-center justify-center gap-3"
            >
              + Register Identity
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-x-auto shadow-2xl">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identify</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Level</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="bg-[#0a101f]">
                {allSystemUsers.map(u => (
                  <tr key={`${u.id}-${u.role}`} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-all">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-100">{u.name}</div>
                      <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                        UID: {u.id} {u.programme ? `• ${u.programme}` : ''}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border ${
                        u.role === 'Admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        u.role === 'Lecturer' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right flex items-center justify-end gap-6 h-full mt-2">
                      <button 
                        onClick={() => openEditUser(u)}
                        className="text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all underline decoration-2 underline-offset-4"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => onDeleteUser(u.id)}
                        className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all underline decoration-2 underline-offset-4"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(isAddingUser || isEditingUser) && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-6">
              <div className="bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-800 animate-slideUp">
                <div className="bg-indigo-950 p-8 border-b border-indigo-500/20">
                  <h3 className="text-2xl font-black italic text-white tracking-tighter">Identity Config</h3>
                </div>
                <form onSubmit={submitUserForm} className="p-8 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Display Name</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Role Level</label>
                      <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="Student">Student</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  {formData.role === 'Student' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Programme</label>
                        <select value={formData.programme} onChange={e => setFormData({...formData, programme: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500">
                          <option value="DIT">Diploma (DIT)</option>
                          <option value="BIT">Bachelors (BIT)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Intake</label>
                        <input type="text" value={formData.intake} onChange={e => setFormData({...formData, intake: e.target.value})} placeholder="May'24" className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                    </div>
                  )}
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                    <input 
                      type={showFormPassword ? "text" : "password"} 
                      required 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500 font-mono pr-12" 
                    />
                    <button type="button" onClick={() => setShowFormPassword(!showFormPassword)} className="absolute right-4 top-10 text-slate-600">
                      {showFormPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => {setIsAddingUser(false); setIsEditingUser(null);}} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-teal-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Commit</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'DB Setup' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-10 shadow-2xl animate-fadeIn max-w-4xl mx-auto">
          <h3 className="text-2xl font-black italic text-white tracking-tighter mb-4">Cloud Synchronization</h3>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">Ensure your project matches the cloud schema for persistent storage.</p>
          <div className="space-y-6">
            <button 
              onClick={onSeedData}
              className="w-full py-6 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-teal-500 transition-all flex items-center justify-center gap-2"
            >
              🚀 Seed Cloud Database
            </button>
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Database Connection Status</h4>
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${dbError ? 'bg-red-500' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(16,185,129,0.5)]`}></span>
                <span className="text-xs font-bold text-slate-300">{dbError ? 'Connection Issue: Offline Mode' : 'Cloud Sync: Verified'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
