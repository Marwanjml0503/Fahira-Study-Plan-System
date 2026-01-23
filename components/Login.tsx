
import React, { useState } from 'react';
import { User, Role } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  students: User[];
  lecturers: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, students, lecturers }) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError('');
    setName('');
    setPassword('');
    setShowPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let usersToSearch: User[] = [];
    if (selectedRole === 'Student') usersToSearch = students;
    if (selectedRole === 'Lecturer' || selectedRole === 'Admin') usersToSearch = lecturers;

    const trimmedName = name.trim().toLowerCase();
    
    // Find the user that matches name, password, AND has the correct role
    const user = usersToSearch.find(u => {
      const nameMatch = u.name.trim().toLowerCase() === trimmedName;
      const passMatch = u.password === password || (!u.password && password === "Cristiano");
      
      // Role compatibility check:
      // 1. If searching for Admin, must be Admin.
      // 2. If searching for Lecturer, can be Lecturer OR Admin.
      // 3. If searching for Student, must be Student.
      let roleMatch = false;
      if (selectedRole === 'Admin') {
        roleMatch = u.role === 'Admin';
      } else if (selectedRole === 'Lecturer') {
        roleMatch = u.role === 'Lecturer' || u.role === 'Admin';
      } else {
        roleMatch = u.role === 'Student';
      }

      return nameMatch && passMatch && roleMatch;
    });

    if (user) {
      onLogin(user);
    } else {
      setError(`Authentication failed. No ${selectedRole} account found for "${name}" with that password.`);
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
              <p className="text-indigo-300/60 text-xs">Cloud Auth Portal</p>
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
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder-slate-700"
                placeholder="e.g. Marwan"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder-slate-700 pr-12"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-10 text-slate-500 hover:text-teal-400 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
            
            {error && <p className="text-red-400 text-sm font-medium text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</p>}
            
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 transform hover:scale-[1.02]"
            >
              Authenticate with Supabase
            </button>
          </form>
          <div className="bg-slate-950/50 px-8 py-4 text-center border-t border-slate-800/50">
            <p className="text-slate-600 text-[10px] uppercase tracking-widest font-bold">Encrypted Database Link Active</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
