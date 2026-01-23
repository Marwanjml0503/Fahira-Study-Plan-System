
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
  onSeedData: () => Promise<void>;
  dbError?: string | null;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  admin, students, lecturers, plans, requests, onApproveRequest, onRejectRequest, onUpdatePlanDirectly, onAddUser, onSeedData, dbError 
}) => {
  const [activeTab, setActiveTab] = useState<'Requests' | 'Management' | 'Users' | 'DB Setup'>('Requests');
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

  const updateModuleField = (moduleId: string, field: keyof Module, value: any) => {
    setEditingPlan(prev => prev?.map(m => m.id === moduleId ? { ...m, [field]: value } : m) || null);
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
    alert(`Identity "${formData.name}" synced to database.`);
  };

  const sqlSetup = `-- RUN THIS IN SUPABASE SQL EDITOR
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password TEXT DEFAULT 'Cristiano',
  programme TEXT,
  intake TEXT
);

CREATE TABLE IF NOT EXISTS study_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  modules JSONB NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  lecturer_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  proposed_modules JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);`;

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic">Admin Console</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full shadow-lg ${dbError ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
            <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">
              {dbError ? 'Local Mock Mode' : 'Supabase Cloud Sync Connected'}
            </p>
          </div>
        </div>
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex gap-1 shadow-2xl">
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

      {activeTab === 'DB Setup' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-10 shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 text-2xl">⚡</div>
            <div>
              <h3 className="text-2xl font-black italic text-white tracking-tighter">Supabase Initialization</h3>
              <p className="text-slate-500 text-sm mt-1">Run SQL first, then Seed Data.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest">Step 1: Create Tables</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Copy the SQL below and run it in the <strong>SQL Editor</strong> on your Supabase dashboard.
              </p>
              
              <div className="relative">
                <pre className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-teal-500 font-mono text-[10px] overflow-x-auto leading-loose shadow-inner max-h-[400px]">
                  {sqlSetup}
                </pre>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(sqlSetup);
                    alert("SQL copied to clipboard!");
                  }}
                  className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  Copy SQL
                </button>
              </div>
            </div>

            <div className="space-y-6 bg-slate-950/50 p-8 rounded-3xl border border-slate-800">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest">Step 2: Populate Cloud DB</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Once tables are created, click the button below to push 5 students, 1 lecturer, 1 admin, and their default study plans to your Supabase project.
              </p>
              
              <button 
                onClick={onSeedData}
                className="w-full py-6 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-teal-500/10 transition-all transform active:scale-95 flex flex-col items-center justify-center gap-2"
              >
                <span>🚀 Seed Cloud Database</span>
                <span className="text-[10px] opacity-60 font-medium">Initializes Marwan, Rayne, Loges, etc.</span>
              </button>

              <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl flex items-start gap-4 mt-10">
                <div className="text-xl">💡</div>
                <p className="text-indigo-300 text-[11px] font-medium leading-relaxed">
                  After seeding, you will be able to log in with "Marwan" and "Cristiano" as any role. All changes you make will be saved permanently in your Supabase project.
                </p>
              </div>
            </div>
          </div>
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
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">Direct Edit Mode</p>
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
                          <div key={m.id} className="flex flex-col gap-3 p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-600 transition-all">
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
                              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{m.credits} Credits</span>
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
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black italic text-white tracking-tighter">Personnel Database</h3>
            <button 
              onClick={openAddUser}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center gap-3"
            >
              <span className="text-lg">+</span> Register Identity
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
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
                        UID: {u.id} {u.programme ? `• ${u.programme}` : ''} {u.intake ? `• ${u.intake}` : ''}
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
              <div className="bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-800 animate-slideUp">
                <div className="bg-indigo-950 p-8 border-b border-indigo-500/20">
                  <h3 className="text-2xl font-black italic text-white tracking-tighter">{isEditingUser ? 'Modify Identity' : 'Register Identity'}</h3>
                  <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest mt-2">Data Management Layer</p>
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
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Intake Batch</label>
                        <input type="text" value={formData.intake} onChange={e => setFormData({...formData, intake: e.target.value})} placeholder="May'24" className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Authentication Password</label>
                    <input 
                      type={showFormPassword ? "text" : "password"} 
                      required 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500 font-mono pr-12" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-4 top-10 text-slate-600 hover:text-teal-500 transition-colors"
                    >
                      {showFormPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => {setIsAddingUser(false); setIsEditingUser(null);}} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-teal-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-500/20 hover:bg-teal-500 transition-all transform active:scale-95">Commit Identity</button>
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
