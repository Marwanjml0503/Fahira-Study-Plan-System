
import React, { useState } from 'react';
import { User, StudyPlan, ChangeRequest, Module, IntakePlan } from '../types';
import { PASS_KEY, PROGRAMME_SEMESTERS } from '../constants';

interface AdminViewProps {
  admin: User;
  students: User[];
  lecturers: User[];
  plans: Record<string, StudyPlan>;
  intakePlans: Record<string, IntakePlan>;
  requests: ChangeRequest[];
  dbError?: string | null;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onUpdatePersonalPlan: (studentId: string, modules: Module[]) => void;
  onUpdateIntakePlan: (intakeId: string, modules: Module[]) => void;
  onAddUser: (user: User) => void;
  onBulkAddUsers: (users: User[]) => void;
  onDeleteUser: (userId: string) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  admin, students, lecturers, plans, intakePlans, requests, dbError, 
  onApproveRequest, onRejectRequest, onUpdatePersonalPlan, onUpdateIntakePlan,
  onAddUser, onBulkAddUsers, onDeleteUser 
}) => {
  const [activeTab, setActiveTab] = useState<'Requests' | 'Users' | 'Bulk Import' | 'Curriculum'>('Requests');
  const [bulkCSV, setBulkCSV] = useState('');
  const [isEditingUser, setIsEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<User>({ id: '', name: '', role: 'Student', programme: 'DIT', intake: "0524", password: PASS_KEY, isSpecialCase: false });
  
  // Curriculum management states
  const [selectedIntake, setSelectedIntake] = useState('');
  const [curriculumCSV, setCurriculumCSV] = useState('');

  const handleBulkImport = () => {
    const lines = bulkCSV.split('\n');
    let importedUsers: User[] = [];
    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const [name, id, intake, prog, pass] = parts.map(s => s.trim());
      
      if (name && id) {
        importedUsers.push({
          id: id,
          name: name,
          intake: intake || '0524',
          programme: prog || 'DIT',
          password: pass || PASS_KEY,
          role: 'Student',
          isSpecialCase: false
        });
      }
    });

    if (importedUsers.length > 0) {
      onBulkAddUsers(importedUsers);
      setBulkCSV('');
      alert(`Cloud Registry Synced: ${importedUsers.length} users added.`);
    }
  };

  const handleCurriculumImport = () => {
    if (!selectedIntake || !curriculumCSV.trim()) return;
    const lines = curriculumCSV.split('\n');
    const newModules: Module[] = lines.filter(l => l.trim()).map((line, i) => {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const [code, name, credits, lec, sem] = parts.map(s => s.trim());
      return {
        id: `ip-${selectedIntake}-${Date.now()}-${i}`,
        code: code || 'TBA',
        name: name || 'Undefined',
        credits: parseInt(credits) || 3,
        semester: parseInt(sem) || 1,
        status: 'Planned',
        lecturer: lec || 'TBA'
      };
    });
    onUpdateIntakePlan(selectedIntake, newModules);
    setCurriculumCSV('');
    alert(`Master Curriculum published for ${selectedIntake}.`);
  };

  const openAddUser = () => {
    setFormData({ id: `s-${Date.now()}`, name: '', role: 'Student', programme: 'DIT', intake: "0524", password: PASS_KEY, isSpecialCase: false });
    setIsEditingUser({} as User);
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const availableIntakes = Array.from(new Set(students.map(s => `${s.programme}-${s.intake}`))).sort();

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter">System Authority</h2>
          <p className="text-[10px] text-teal-500 uppercase font-black tracking-widest mt-2">Governance Console</p>
          {dbError && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">DB SYNC ERROR: {dbError}</p>}
        </div>
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-1 shadow-2xl">
          {(['Requests', 'Users', 'Bulk Import', 'Curriculum'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
            >
              {tab === 'Requests' && pendingRequests.length > 0 && <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-ping mr-2"></span>}
              {tab === 'Curriculum' ? 'Standards' : tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Requests' && (
        <div className="space-y-6">
          {pendingRequests.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl p-24 text-center border border-slate-800 shadow-xl border-dashed">
              <p className="text-slate-600 font-bold uppercase tracking-widest text-xs italic">Clear Queue: No pending curriculum proposals</p>
            </div>
          ) : (
            pendingRequests.map(req => (
              <div key={req.id} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xl transition-all hover:border-indigo-500/30 gap-6">
                <div>
                  <div className="flex items-center gap-3">
                     <h3 className="text-white text-xl font-black">{students.find(s => s.id === req.studentId)?.name}</h3>
                     <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-tighter">Modification Request</span>
                  </div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Lec: {req.lecturerId} • {new Date(req.createdAt).toLocaleDateString()}</p>
                  <p className="text-teal-400 text-sm mt-4 italic font-medium bg-teal-400/5 p-4 rounded-2xl border border-teal-400/10">"{req.reason}"</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <button onClick={() => onRejectRequest(req.id)} className="flex-1 md:flex-none text-red-500 font-black uppercase text-[10px] tracking-widest hover:text-red-400 py-3">Reject</button>
                  <button onClick={() => onApproveRequest(req.id)} className="flex-1 md:flex-none bg-teal-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-teal-500 transition-all">Approve Plan</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Bulk Import' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-10 shadow-2xl animate-slideUp">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">Cloud Registry Importer</h3>
            <p className="text-slate-500 text-xs">Register students directly via text paste (Excel compatible).</p>
          </div>
          <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 mb-6">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Format Pattern</p>
             <p className="text-xs font-mono text-teal-500 leading-relaxed">
                Name, Student ID, Intake (0524), Programme (DIT/BIT), Password
             </p>
          </div>
          <textarea 
            value={bulkCSV}
            onChange={(e) => setBulkCSV(e.target.value)}
            className="w-full h-80 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-indigo-400 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner resize-none transition-all"
            placeholder="Marwan, 2024001, 0524, DIT, 1234&#10;Rayne, 2024002, 0524, DIT, 1234"
          />
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleBulkImport}
              className="bg-indigo-600 text-white px-16 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-indigo-500 transition-all"
            >
              🚀 SYNC TO CLOUD DATABASE
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Curriculum' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-10 shadow-2xl animate-slideUp">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">Master Standards Control</h3>
            <p className="text-slate-500 text-xs">Publish the definitive curriculum list for specific intake batches.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             <div className="md:col-span-1 space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Intake</label>
                <select 
                  value={selectedIntake} 
                  onChange={e => setSelectedIntake(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select Batch...</option>
                  {availableIntakes.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                   <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Data Columns</p>
                   <p className="text-[9px] text-slate-400 font-mono leading-relaxed">
                      Code, Name, Credits, Lecturer, Semester
                   </p>
                </div>
             </div>
             <div className="md:col-span-3">
                <textarea 
                  value={curriculumCSV}
                  onChange={(e) => setCurriculumCSV(e.target.value)}
                  className="w-full h-80 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-teal-400 font-mono text-xs focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                  placeholder="CSC1101, Intro to Programming, 3, Marwan, 1&#10;MAT1102, Discrete Math, 4, Loges, 1"
                />
                <div className="mt-6 flex justify-end">
                   <button 
                    onClick={handleCurriculumImport}
                    disabled={!selectedIntake}
                    className="bg-teal-600 disabled:opacity-30 text-white px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                   >
                     Publish Standards
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-black text-white italic tracking-tighter">Cloud Registry</h3>
            <button onClick={openAddUser} className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:bg-teal-500 transition-all">+ Register Identity</button>
          </div>
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] border-b border-slate-800">
                <tr>
                  <th className="px-8 py-6">Personnel</th>
                  <th className="px-8 py-6">Academic Path</th>
                  <th className="px-8 py-6">Level</th>
                  <th className="px-8 py-6 text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="bg-[#0a101f]">
                {[...lecturers, ...students].map(u => (
                  <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        {u.name}
                        {u.isSpecialCase && <span className="text-yellow-400 text-lg drop-shadow-md" title="Special Case Student">★</span>}
                      </div>
                      <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">UID: {u.id}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs font-bold text-slate-400">{u.programme || 'SYSTEM'}</div>
                      <div className="text-[10px] text-slate-600 uppercase font-black tracking-tighter">{u.intake ? `Intake: ${u.intake}` : '---'}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase border tracking-widest ${
                        u.role === 'Admin' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 
                        u.role === 'Lecturer' ? 'border-teal-500/30 bg-teal-500/10 text-teal-400' : 
                        'border-slate-800 bg-slate-800 text-slate-500'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right flex items-center justify-end gap-6">
                      <button onClick={() => { setFormData(u); setIsEditingUser(u); }} className="text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:text-white underline">Edit</button>
                      <button onClick={() => onDeleteUser(u.id)} className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:text-white underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEditingUser && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 rounded-3xl w-full max-w-xl border border-slate-800 overflow-hidden shadow-2xl animate-slideUp">
            <div className="bg-indigo-950 p-8 border-b border-indigo-500/20">
              <h3 className="text-2xl font-black text-white italic tracking-tighter">Identity Management</h3>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onAddUser(formData); setIsEditingUser(null); }} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500 transition-all" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Access Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="Student">Student</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Programme</label>
                  <input type="text" value={formData.programme} onChange={e => setFormData({...formData, programme: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Intake (0524)</label>
                  <input type="text" value={formData.intake} onChange={e => setFormData({...formData, intake: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none" placeholder="0524" />
                </div>
              </div>
              <div className="flex items-center gap-4 py-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                <input type="checkbox" id="spec_toggle" checked={formData.isSpecialCase} onChange={e => setFormData({...formData, isSpecialCase: e.target.checked})} className="w-6 h-6 accent-yellow-400" />
                <div>
                  <label htmlFor="spec_toggle" className="text-xs font-bold text-slate-300">Mark as Special Case (★)</label>
                  <p className="text-[9px] text-slate-600 uppercase font-black">Requires individual curriculum monitoring</p>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsEditingUser(null)} className="flex-1 text-slate-500 font-black uppercase text-[10px] tracking-widest py-4">Cancel</button>
                <button type="submit" className="flex-1 bg-teal-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Commit Identity</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
