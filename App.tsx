
import React, { useState, useEffect } from 'react';
import { User, StudyPlan, ChangeRequest, Role, Module, IntakePlan } from './types';
import { MOCK_STUDENTS, MOCK_LECTURERS, MOCK_ADMINS, INITIAL_MODULES, PASS_KEY } from './constants';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Record<string, StudyPlan>>({});
  const [intakePlans, setIntakePlans] = useState<Record<string, IntakePlan>>({});
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setDbError(null);
    try {
      // 1. Fetch Profiles
      const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
      
      if (pError || !profiles || profiles.length === 0) {
        if (pError) setDbError(pError.message);
        // Fallback to mocks if DB fails or is empty
        setStudents(MOCK_STUDENTS);
        setLecturers([...MOCK_LECTURERS, ...MOCK_ADMINS]);
      } else {
        setStudents(profiles.filter((u: any) => u.role === 'Student').map(u => ({...u, isSpecialCase: u.is_special_case})));
        setLecturers(profiles.filter((u: any) => u.role === 'Lecturer' || u.role === 'Admin').map(u => ({...u, isSpecialCase: u.is_special_case})));
      }

      // 2. Fetch Master Intake Plans
      const { data: ipData } = await supabase.from('intake_plans').select('*');
      const ipMap: Record<string, IntakePlan> = {};
      if (ipData) {
        ipData.forEach(item => {
          ipMap[item.intake_id] = item;
        });
      }
      setIntakePlans(ipMap);

      // 3. Fetch Personal Study Plans
      const { data: spData } = await supabase.from('study_plans').select('*');
      const planMap: Record<string, StudyPlan> = {};
      if (spData) {
        spData.forEach(item => {
          planMap[item.student_id] = {
            id: item.id,
            studentId: item.student_id,
            modules: item.modules,
            lastUpdated: item.last_updated,
            updatedBy: item.updated_by
          };
        });
      }
      setPlans(planMap);

      // 4. Fetch Requests
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
      setDbError("Critical Sync Error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIntakePlan = async (intakeId: string, modules: Module[]) => {
    await supabase.from('intake_plans').upsert({
      intake_id: intakeId,
      modules: modules,
      last_updated: new Date().toISOString()
    });
    fetchData();
  };

  const handleUpdatePersonalPlan = async (studentId: string, modules: Module[]) => {
    await supabase.from('study_plans').upsert({
      student_id: studentId,
      modules: modules,
      last_updated: new Date().toISOString(),
      updated_by: currentUser?.name || 'Self'
    }, { onConflict: 'student_id' });
    fetchData();
  };

  const handleAddUser = async (user: User) => {
    await supabase.from('profiles').upsert({
      id: user.id,
      name: user.name,
      role: user.role,
      password: user.password || PASS_KEY,
      programme: user.programme,
      intake: user.intake,
      is_special_case: user.isSpecialCase || false
    });
    fetchData();
  };

  const handleBulkAddUsers = async (users: User[]) => {
    const payloads = users.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      password: u.password,
      programme: u.programme,
      intake: u.intake,
      is_special_case: u.isSpecialCase || false
    }));
    await supabase.from('profiles').upsert(payloads);
    fetchData();
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Permanently delete this user?")) {
      await supabase.from('profiles').delete().eq('id', userId);
      fetchData();
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    await handleUpdatePersonalPlan(req.studentId, req.proposedModules);
    await supabase.from('change_requests').update({ status: 'Approved' }).eq('id', requestId);
    fetchData();
  };

  const handleRejectRequest = async (requestId: string) => {
    await supabase.from('change_requests').update({ status: 'Rejected' }).eq('id', requestId);
    fetchData();
  };

  const handleCreateRequest = async (request: Omit<ChangeRequest, 'id' | 'createdAt' | 'status'>) => {
    await supabase.from('change_requests').insert([{
      student_id: request.studentId,
      lecturer_id: request.lecturerId,
      reason: request.reason,
      proposed_modules: request.proposedModules,
      status: 'Pending',
      created_at: new Date().toISOString()
    }]);
    fetchData();
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-teal-500 font-black tracking-widest uppercase text-xs">Syncing Fahira Cloud...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!currentUser ? (
        <Login onLogin={setCurrentUser} students={students} lecturers={lecturers} dbStatus={dbError ? 'Offline' : 'Online'} />
      ) : (
        <Dashboard 
          user={currentUser} 
          onLogout={() => setCurrentUser(null)}
          students={students}
          lecturers={lecturers}
          plans={plans}
          intakePlans={intakePlans}
          requests={requests}
          dbError={dbError}
          onUpdateIntakePlan={handleUpdateIntakePlan}
          onCreateRequest={handleCreateRequest}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          onUpdatePersonalPlan={handleUpdatePersonalPlan}
          onAddUser={handleAddUser}
          onBulkAddUsers={handleBulkAddUsers}
          onDeleteUser={handleDeleteUser}
          onSeedData={async () => {}} // Redundant
        />
      )}
    </div>
  );
};

export default App;
