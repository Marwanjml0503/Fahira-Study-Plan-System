
import React, { useState } from 'react';
import { User, Role } from '../types';
import { MOCK_STUDENTS, MOCK_LECTURERS, MOCK_ADMINS, PASS_KEY } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError('');
    setName('');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== PASS_KEY) {
      setError('Invalid password. Access Denied.');
      return;
    }

    let usersToSearch: User[] = [];
    if (selectedRole === 'Student') usersToSearch = MOCK_STUDENTS;
    if (selectedRole === 'Lecturer') usersToSearch = MOCK_LECTURERS;
    if (selectedRole === 'Admin') usersToSearch = MOCK_ADMINS;

    const user = usersToSearch.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (user) {
      onLogin(user);
    } else {
      setError(`No ${selectedRole} found with that name.`);
    }
  };

  const RoleCard = ({ role, icon, color }: { role: Role, icon: string, color: string }) => (
    <div 
      onClick={() => handleRoleSelect(role)}
      className={`group cursor-pointer bg-slate-900 p-8 rounded-2xl shadow-xl hover:shadow-indigo-500/10 transition-all transform hover:-translate-y-2 border-2 ${selectedRole === role ? 'border-teal-500 bg-slate-800' : 'border-slate-800'}`}
    >
      <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${color} text-white group-hover:scale-110 transition-transform shadow-lg`}>
        <span className="text-3xl font-bold">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-slate-100">{role}</h3>
      <p className="text-slate-400 text-sm mt-2">Access your portal as {role.toLowerCase()}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-extrabold text-white tracking-tighter mb-2 drop-shadow-2xl">Fahira</h1>
        <p className="text-teal-400 font-medium tracking-widest uppercase text-xs opacity-90">next gen study plan system</p>
      </div>

      {!selectedRole ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl animate-fadeIn">
          <RoleCard role="Admin" icon="🛡️" color="bg-indigo-600" />
          <RoleCard role="Lecturer" icon="🎓" color="bg-teal-600" />
          <RoleCard role="Student" icon="📖" color="bg-emerald-600" />
        </div>
      ) : (
        <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-slideUp">
          <div className="bg-indigo-950 p-6 flex items-center justify-between border-b border-indigo-900/50">
            <div>
              <h2 className="text-white text-xl font-bold">{selectedRole} Login</h2>
              <p className="text-indigo-300/60 text-xs">Authentication Portal</p>
            </div>
            <button 
              onClick={() => setSelectedRole(null)}
              className="text-slate-400 hover:text-white transition-colors text-sm font-bold"
            >
              Back
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Account Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                placeholder="e.g. Marwan"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                placeholder="••••••••"
              />
            </div>
            
            {error && <p className="text-red-400 text-sm font-medium text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}
            
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 transform hover:scale-[1.02]"
            >
              Secure Sign In
            </button>
          </form>
          <div className="bg-slate-950/50 px-8 py-4 text-center border-t border-slate-800/50">
            <p className="text-slate-600 text-[10px] uppercase tracking-widest font-bold">Secure Infrastructure Enabled</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
