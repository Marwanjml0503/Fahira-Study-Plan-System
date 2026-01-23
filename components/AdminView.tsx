
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
}

const AdminView: React.FC<AdminViewProps> = ({ 
  admin, students, lecturers, plans, requests, onApproveRequest, onRejectRequest, onUpdatePlanDirectly, onAddUser 
}) => {
  const [activeTab, setActiveTab] = useState<'Requests' | 'Management' | 'Users'>('Requests');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Module[] | null>(null);
  
  // User Editing State
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

  const handleUpdateDirectly = () => {
    if (selectedStudentId && editingPlan) {
      onUpdatePlanDirectly(selectedStudentId, editingPlan);
      alert("Study plan updated directly.");
      setSelectedStudentId(null);
      setEditingPlan(null);
    }
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
    alert("User data updated in Supabase.");
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic">Admin Console</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
            <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Supabase Cloud Sync Connected</p>
          </div>
        </div>
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex gap-1 shadow-2xl">
          {(['Requests', 'Management', 'Users'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'Management') {
                  setSelectedStudentId(null);
                  setEditingPlan(null);
                }
              }}
              className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'}`}
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
        <div className="space-y-6 animate-fadeIn">
          {pendingRequests.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl p-24 text-center border-2 border-dashed border-slate-800 shadow-xl">
              <div className="text-6xl mb-6 grayscale opacity-20">🛡️</div>
              <h3 className="text-xl font-bold text-slate-300 tracking-tight">Real-time Sync Active</h3>
              <p className="text-slate-600 mt-2 text-sm">No pending proposals at this time.</p>
            </div>
          ) : (
            pendingRequests.map(req => {
              const student = students.find(s => s.id === req.studentId);
              return (
                <div key={req.id} className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden group transition-all hover:border-indigo-500/30">
                  <div className="bg-slate-950 px-8 py-5 flex items-center justify-between border-b border-slate-800">
                    <div>
                      <h3 className="text-white font-bold flex items-center gap-3">
                        Review Change: {student?.name} 
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-black px-2 py-0.5 rounded uppercase tracking-tighter border border-indigo-500/30">{student?.programme}</span>
                      </h3>
                      <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1">Origin: {req.lecturerId} • {new Date(req.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => onRejectRequest(req.id)} className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Reject</button>
                      <button onClick={() => onApproveRequest(req.id)} className="bg-teal-500/10 hover:bg-teal-600 text-teal-500 hover:text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-500/10">Approve</button>
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
              <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Student Profiles</h3>
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
                <p className="text-6xl mb-6 grayscale opacity-20">📂</p>
                <h3 className="text-xl font-black italic tracking-tighter uppercase text-slate-500">Academic Blueprint Editor</h3>
              </div>
            ) : (
              <>
                <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950 sticky top-0 z-10">
                  <div>
                    <h2 className="text-xl font-black text-white italic tracking-tighter">Plan Editor: {students.find(s => s.id === selectedStudentId)?.name}</h2>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">Direct Supabase Write Mode</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setSelectedStudentId(null)} className="px-5 py-2 text-slate-500 font-black uppercase text-[10px] hover:text-white transition-all">Cancel</button>
                    <button onClick={handleUpdateDirectly} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all">Execute Save</button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-8 space-y-10 bg-[#0a101f]">
                  {Array.from({ length: PROGRAMME_SEMESTERS[students.find(s => s.id === selectedStudentId)?.programme || 'DIT'] }, (_, i) => i + 1).map(sem => (
                    <div key={sem}>
                      <h4 className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] mb-4 border-l-2 border-indigo-500 pl-3">Semester {sem}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {editingPlan?.filter(m => m.semester === sem).map(m => (
                          <div key={m.id} className="flex items-center gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-600 transition-all">
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">{m.code}</span>
                              <p className="font-bold text-slate-100 text-xs truncate">{m.name}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <select 
                                value={m.status}
                                onChange={(e) => handleChangeStatus(m.id, e.target.value as any)}
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
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black italic text-white tracking-tighter">Supabase Personnel Database</h3>
            <button 
              onClick={openAddUser}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center gap-3"
            >
              <span className="text-lg">+</span> Register New Identity
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identify</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Level</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Programme</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="bg-[#0a101f]">
                {allSystemUsers.map(u => (
                  <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-all">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-100">{u.name}</div>
                      <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">UID: {u.id}</div>
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
                    <td className="px-8 py-5 text-slate-400 text-xs font-bold uppercase tracking-tighter">{u.programme || 'Global Access'}</td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => openEditUser(u)}
                        className="text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all underline decoration-2 underline-offset-4"
                      >
                        Edit Credentials
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(isAddingUser || isEditingUser) && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-6">
              <div className="bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-800 animate-slideUp">
                <div className="bg-indigo-950 p-8 border-b border-indigo-500/20">
                  <h3 className="text-2xl font-black italic text-white tracking-tighter">{isEditingUser ? 'Modify User Profile' : 'Register New Entity'}</h3>
                  <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest mt-2">Database Management Layer</p>
                </div>
                <form onSubmit={submitUserForm} className="p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Display Name</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">System ID</label>
                      <input type="text" required value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="relative">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                      <input 
                        type={showFormPassword ? "text" : "password"} 
                        required 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500 font-mono" 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-3 top-9 text-slate-600 hover:text-teal-500 transition-colors"
                      >
                        {showFormPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Privilege Role</label>
                      <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none font-bold text-xs uppercase">
                        <option value="Student">Student</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    {formData.role === 'Student' && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Programme</label>
                        <select value={formData.programme} onChange={e => setFormData({...formData, programme: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none font-bold text-xs uppercase">
                          <option value="DIT">DIT (Diploma)</option>
                          <option value="BIT">BIT (Degree)</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {formData.role === 'Student' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Intake Cycle</label>
                      <input type="text" value={formData.intake} onChange={e => setFormData({...formData, intake: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none" placeholder="May'24" />
                    </div>
                  )}

                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => {setIsAddingUser(false); setIsEditingUser(null);}} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-teal-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-500/20 hover:bg-teal-500 transition-all">Commit Changes</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminView;
