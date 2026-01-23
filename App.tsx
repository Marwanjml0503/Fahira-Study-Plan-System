
import React, { useState, useEffect } from 'react';
import { User, StudyPlan, ChangeRequest, Role, Module } from './types';
import { MOCK_STUDENTS, MOCK_LECTURERS, MOCK_ADMINS, INITIAL_MODULES, PASS_KEY } from './constants';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Record<string, StudyPlan>>({});
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);

  // Sync with Supabase
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles
      const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
      
      if (pError) {
        console.error("Supabase Profile Fetch Error:", pError.message);
        setDbConnected(false);
      } else {
        setDbConnected(true);
      }

      if (profiles && profiles.length > 0) {
        setStudents(profiles.filter((u: User) => u.role === 'Student'));
        setLecturers(profiles.filter((u: User) => u.role === 'Lecturer' || u.role === 'Admin'));
      } else {
        // Seed if empty (first run or connection issues)
        console.warn("Using local mock data for session.");
        setStudents(MOCK_STUDENTS);
        setLecturers([...MOCK_LECTURERS, ...MOCK_ADMINS]);
      }

      // 2. Fetch Study Plans
      const { data: spData } = await supabase.from('study_plans').select('*');
      const planMap: Record<string, StudyPlan> = {};
      
      // Merge Mock Plans with SP Data
      MOCK_STUDENTS.forEach(s => {
        planMap[s.id] = {
          id: `plan-${s.id}`,
          studentId: s.id,
          modules: [...INITIAL_MODULES],
          lastUpdated: new Date().toISOString(),
          updatedBy: 'System'
        };
      });

      spData?.forEach(item => {
        planMap[item.student_id] = {
          id: item.id,
          studentId: item.student_id,
          modules: item.modules,
          lastUpdated: item.last_updated,
          updatedBy: item.updated_by
        };
      });
      setPlans(planMap);

      // 3. Fetch Requests
      const { data: reqData } = await supabase.from('change_requests').select('*');
      if (reqData) {
        setRequests(reqData.map(r => ({
          id: r.id,
          studentId: r.student_id,
          lecturerId: r.lecturer_id,
          reason: r.reason,
          status: r.status,
          proposedModules: r.proposed_modules,
          createdAt: r.created_at
        })));
      }
    } catch (err) {
      console.error("Critical Fetch Error:", err);
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleCreateRequest = async (request: Omit<ChangeRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest = {
      student_id: request.studentId,
      lecturer_id: request.lecturerId,
      reason: request.reason,
      proposed_modules: request.proposedModules,
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('change_requests').insert([newRequest]);
    if (error) console.error("Request Creation Error:", error);
    fetchData();
  };

  const handleApproveRequest = async (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    await supabase
      .from('study_plans')
      .upsert({
        student_id: req.studentId,
        modules: req.proposedModules,
        last_updated: new Date().toISOString(),
        updated_by: currentUser?.name || 'Admin'
      }, { onConflict: 'student_id' });

    await supabase.from('change_requests').update({ status: 'Approved' }).eq('id', requestId);
    fetchData();
  };

  const handleRejectRequest = async (requestId: string) => {
    await supabase.from('change_requests').update({ status: 'Rejected' }).eq('id', requestId);
    fetchData();
  };

  const handleUpdatePlanDirectly = async (studentId: string, modules: Module[]) => {
    await supabase
      .from('study_plans')
      .upsert({
        student_id: studentId,
        modules: modules,
        last_updated: new Date().toISOString(),
        updated_by: currentUser?.name || 'Admin'
      }, { onConflict: 'student_id' });
    
    fetchData();
  };

  const handleAddUser = async (user: User) => {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name: user.name,
      role: user.role,
      password: user.password || PASS_KEY,
      programme: user.programme,
      intake: user.intake
    });

    if (error) console.error("Add User Error:", error);

    if (user.role === 'Student') {
      await handleUpdatePlanDirectly(user.id, INITIAL_MODULES);
    }
    
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-teal-500 font-black tracking-widest uppercase text-xs">Initializing Fahira Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!currentUser ? (
        <Login onLogin={handleLogin} students={students} lecturers={lecturers} />
      ) : (
        <Dashboard 
          user={currentUser} 
          onLogout={handleLogout}
          students={students}
          lecturers={lecturers}
          plans={plans}
          requests={requests}
          onCreateRequest={handleCreateRequest}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          onUpdatePlanDirectly={handleUpdatePlanDirectly}
          onAddUser={handleAddUser}
        />
      )}
    </div>
  );
};

export default App;
