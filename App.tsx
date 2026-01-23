
import React, { useState, useEffect } from 'react';
import { User, StudyPlan, ChangeRequest, Role, Module } from './types';
import { MOCK_STUDENTS, MOCK_LECTURERS, MOCK_ADMINS, INITIAL_MODULES } from './constants';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>(MOCK_STUDENTS);
  const [lecturers, setLecturers] = useState<User[]>(MOCK_LECTURERS);
  const [plans, setPlans] = useState<Record<string, StudyPlan>>({});
  const [requests, setRequests] = useState<ChangeRequest[]>([]);

  // Initialize plans for each student
  useEffect(() => {
    const initialPlans: Record<string, StudyPlan> = {};
    MOCK_STUDENTS.forEach(student => {
      initialPlans[student.id] = {
        id: `plan-${student.id}`,
        studentId: student.id,
        modules: [...INITIAL_MODULES],
        lastUpdated: new Date().toISOString(),
        updatedBy: 'System'
      };
    });
    setPlans(initialPlans);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleCreateRequest = (request: Omit<ChangeRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: ChangeRequest = {
      ...request,
      id: `req-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    setRequests(prev => [...prev, newRequest]);
  };

  const handleApproveRequest = (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    setPlans(prev => ({
      ...prev,
      [req.studentId]: {
        ...prev[req.studentId],
        modules: req.proposedModules,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Admin'
      }
    }));

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Approved' } : r));
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Rejected' } : r));
  };

  const handleUpdatePlanDirectly = (studentId: string, modules: Module[]) => {
    setPlans(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        modules: modules,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Admin'
      }
    }));
  };

  const handleAddUser = (user: User) => {
    if (user.role === 'Student') {
      setStudents(prev => [...prev, user]);
      setPlans(prev => ({
        ...prev,
        [user.id]: {
          id: `plan-${user.id}`,
          studentId: user.id,
          modules: [...INITIAL_MODULES],
          lastUpdated: new Date().toISOString(),
          updatedBy: 'Admin'
        }
      }));
    } else {
      setLecturers(prev => [...prev, user]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!currentUser ? (
        <Login onLogin={handleLogin} />
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
