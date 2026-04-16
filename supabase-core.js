// ====== SUPABASE CORE - EMAIL AS PRIMARY KEY VERSION (FULLY FIXED) ======
(function(global) {
    'use strict';
    
    console.log('🚀 Loading Supabase Core (Email Auth Version)...');
    
    // ============================================
    // CONFIGURATION
    // ============================================
    const SUPABASE_URL = 'https://qacyxebxnvpsxxulbuws.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_7Ie0VFo_0uCr9UzNw92eag_0vDpm6eY';
    
    // ============================================
    // INITIALIZE SUPABASE
    // ============================================
    let supabaseClient;
    try {
        if (typeof global.supabase === 'undefined') {
            throw new Error('Supabase library not loaded. Please add the CDN script first.');
        }
        supabaseClient = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
    }

    // ============================================
    // DATABASE MANAGER
    // ============================================
    class DatabaseManager {
        constructor(supabase) {
            this.supabase = supabase;
            console.log('✅ DatabaseManager initialized');
        }

        async checkConnection() {
            try {
                const { error } = await this.supabase
                    .from('users')
                    .select('count', { count: 'exact', head: true });
                if (error) throw error;
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        async getAllUsers() {
            try {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .order('name');
                if (error) throw error;
                return { success: true, data: data || [] };
            } catch (error) {
                return { success: false, error: error.message, data: [] };
            }
        }

        // ====== USER AUTHENTICATION - USES EMAIL ======
        async authenticateUser(email, password) {
            try {
                console.log(`🔐 Authenticating user with email: "${email}"`);
                
                const { data, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .maybeSingle();
                
                if (error) {
                    console.error('Database error:', error);
                    return { success: false, error: error.message };
                }
                
                if (!data) {
                    console.log('❌ No user found with email:', email);
                    return { success: false, error: 'Invalid email or password' };
                }
                
                if (data.password !== password) {
                    return { success: false, error: 'Invalid email or password' };
                }
                
                console.log('✅ User found:', data.email);
                
                // Get enrollment info if student
                let enrollment = null;
                if (data.role === 'student') {
                    console.log(`Fetching enrollment for student: ${data.email}`);
                    const { data: enrollData, error: enrollError } = await this.supabase
                        .from('student_enrollment')
                        .select('*, courses(*)')
                        .eq('student_id', data.email)
                        .maybeSingle();
                    
                    if (enrollError) {
                        console.error('Error fetching enrollment:', enrollError);
                    } else if (enrollData) {
                        console.log('Enrollment found');
                        enrollment = enrollData;
                    } else {
                        console.log('No enrollment found for student');
                    }
                }
                
                const userData = {
                    ...data,
                    enrollment: enrollment
                };
                
                console.log('✅ Authentication successful for:', userData.email);
                return { success: true, user: userData };
                
            } catch (error) {
                console.error('❌ Authentication error:', error);
                return { success: false, error: error.message };
            }
        }

        // ====== COURSE MANAGEMENT ======
        async getAllCourses() {
            try {
                console.log('Fetching all courses...');
                const { data, error } = await this.supabase
                    .from('courses')
                    .select('*')
                    .order('name');
                
                if (error) throw error;
                console.log(`Found ${data?.length || 0} courses`);
                return { success: true, data: data || [] };
            } catch (error) {
                console.error('Error fetching courses:', error);
                return { success: false, error: error.message, data: [] };
            }
        }

        async getCourseById(courseId) {
            try {
                const { data, error } = await this.supabase
                    .from('courses')
                    .select('*')
                    .eq('id', courseId)
                    .maybeSingle();
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching course:', error);
                return { success: false, error: error.message };
            }
        }

        // ====== STUDENT MANAGEMENT - FIXED VERSION ======
        async getAllStudents() {
            try {
                console.log('Fetching all students...');
                
                // First, get all users with role student
                const { data: students, error: studentsError } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('role', 'student')
                    .order('name');
                
                if (studentsError) {
                    console.error('Error fetching students:', studentsError);
                    return { success: false, error: studentsError.message, data: [] };
                }
                
                if (!students || students.length === 0) {
                    console.log('No students found');
                    return { success: true, data: [] };
                }
                
                console.log(`Found ${students.length} students, fetching enrollments...`);
                
                // Now fetch enrollment for each student individually
                const studentsWithEnrollment = [];
                for (const student of students) {
                    const { data: enrollment, error: enrollError } = await this.supabase
                        .from('student_enrollment')
                        .select(`
                            course_id,
                            intake_year,
                            intake_month,
                            study_plan,
                            current_semester,
                            status
                        `)
                        .eq('student_id', student.email)
                        .maybeSingle();
                    
                    if (enrollError) {
                        console.error(`Error fetching enrollment for ${student.email}:`, enrollError);
                    }
                    
                    studentsWithEnrollment.push({
                        id: student.email,  // Use email as ID for consistency
                        email: student.email,
                        name: student.name,
                        role: student.role,
                        course: student.course || (enrollment?.course_id),
                        enrollmentData: enrollment || null
                    });
                }
                
                console.log(`Successfully loaded ${studentsWithEnrollment.length} students with enrollment data`);
                return { success: true, data: studentsWithEnrollment };
                
            } catch (error) {
                console.error('Error in getAllStudents:', error);
                return { success: false, error: error.message, data: [] };
            }
        }

        async getStudentByEmail(email) {
            try {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .eq('role', 'student')
                    .maybeSingle();
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching student:', error);
                return { success: false, error: error.message };
            }
        }

        async getStudentEnrollment(studentEmail) {
            try {
                const { data, error } = await this.supabase
                    .from('student_enrollment')
                    .select(`
                        course_id,
                        intake_year,
                        intake_month,
                        study_plan,
                        current_semester,
                        status,
                        courses(*)
                    `)
                    .eq('student_id', studentEmail)
                    .maybeSingle();
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching student enrollment:', error);
                return { success: false, error: error.message, data: null };
            }
        }

        // ====== STUDY PLAN MANAGEMENT ======
        async getStudyPlan(courseId, intakeYear, intakeMonth, studyPlan) {
            try {
                console.log(`🔍 Getting study plan for ${courseId}, Year: ${intakeYear}, Month: ${intakeMonth}, Plan: ${studyPlan}`);
                
                const { data, error } = await this.supabase
                    .from('study_plans')
                    .select('*')
                    .eq('course_id', courseId)
                    .eq('plan_type', studyPlan)
                    .eq('year', intakeYear)
                    .eq('intake', intakeMonth)
                    .maybeSingle();
                
                if (error) throw error;
                
                if (data) {
                    console.log(`✅ Found exact match: Plan ${studyPlan}`);
                    return { success: true, data };
                }
                
                // Fallback: try to find any plan of this type
                console.log(`⚠️ No exact match, looking for any Plan ${studyPlan}`);
                const { data: anyPlan } = await this.supabase
                    .from('study_plans')
                    .select('*')
                    .eq('course_id', courseId)
                    .eq('plan_type', studyPlan)
                    .limit(1)
                    .maybeSingle();
                
                if (anyPlan) {
                    console.log(`✅ Found fallback Plan ${studyPlan}`);
                    return { success: true, data: anyPlan };
                }
                
                // Last resort: get any plan
                console.log(`⚠️ Getting any plan for ${courseId}`);
                const { data: lastResort } = await this.supabase
                    .from('study_plans')
                    .select('*')
                    .eq('course_id', courseId)
                    .limit(1)
                    .maybeSingle();
                
                return { success: true, data: lastResort };
            } catch (error) {
                console.error('❌ Error fetching study plan:', error);
                return { success: false, error: error.message };
            }
        }

        // ====== LECTURER MANAGEMENT ======
        async getAllLecturers() {
            try {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('role', 'lecturer')
                    .order('name');
                
                if (error) throw error;
                return { success: true, data: data || [] };
            } catch (error) {
                console.error('Error fetching lecturers:', error);
                return { success: false, error: error.message, data: [] };
            }
        }

        async getModuleLecturers() {
            try {
                const { data, error } = await this.supabase
                    .from('module_lecturers')
                    .select('*, lecturer:lecturer_id(name), moderator:moderator_id(name)')
                    .order('module_code');
                
                if (error) throw error;
                return { success: true, data: data || [] };
            } catch (error) {
                console.error('Error fetching module lecturers:', error);
                return { success: false, error: error.message, data: [] };
            }
        }

        // ====== MODULE STATUS MANAGEMENT ======
        async getModuleStatus(studentId) {
            try {
                const { data, error } = await this.supabase
                    .from('module_status')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('planned_semester');
                
                if (error) throw error;
                return { success: true, data: data || [] };
            } catch (error) {
                console.error('Error fetching module status:', error);
                return { success: false, error: error.message, data: [] };
            }
        }

        async getAllModuleStatus() {
            try {
                const { data, error } = await this.supabase
                    .from('module_status')
                    .select('*');
                
                if (error) throw error;
                return { success: true, data: data || [] };
            } catch (error) {
                console.error('Error fetching all module status:', error);
                return { success: false, error: error.message, data: [] };
            }
        }

        async updateModuleStatus(studentId, moduleCode, updates) {
            try {
                const { error } = await this.supabase
                    .from('module_status')
                    .update({
                        ...updates,
                        last_updated: new Date().toISOString()
                    })
                    .eq('student_id', studentId)
                    .eq('module_code', moduleCode);
                
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('Error updating module status:', error);
                return { success: false, error: error.message };
            }
        }

        // ====== PERSONAL PLAN MANAGEMENT ======
        async getPersonalPlan(studentId) {
            try {
                const { data, error } = await this.supabase
                    .from('personal_plans')
                    .select('*')
                    .eq('student_id', studentId)
                    .maybeSingle();
                
                if (error) throw error;
                
                if (data) {
                    return { success: true, data: data.plan_data };
                }
                
                return { success: true, data: null };
            } catch (error) {
                console.error('Error fetching personal plan:', error);
                return { success: false, error: error.message, data: null };
            }
        }

        async createPersonalPlan(studentId, basePlan) {
            try {
                const personalPlan = {
                    ...basePlan,
                    studentId,
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    isCustomized: false,
                    modules: this.initializeModuleStatus(basePlan),
                    extraSemesters: [],
                    notes: "",
                    customizations: []
                };
                
                const { error } = await this.supabase
                    .from('personal_plans')
                    .insert({
                        student_id: studentId,
                        plan_data: personalPlan,
                        is_customized: false,
                        last_modified: new Date().toISOString()
                    });
                
                if (error) throw error;
                
                // Initialize module statuses
                for (const module of personalPlan.modules) {
                    await this.supabase
                        .from('module_status')
                        .insert({
                            student_id: studentId,
                            module_code: module.code,
                            module_name: module.name,
                            credits: module.credits,
                            classification: module.classification,
                            planned_semester: module.semesterNumber,
                            status: 'upcoming',
                            attempt_count: 1
                        });
                }
                
                return { success: true, data: personalPlan };
            } catch (error) {
                console.error('Error creating personal plan:', error);
                return { success: false, error: error.message, data: null };
            }
        }

        async updatePersonalPlan(studentId, plan) {
            try {
                const { error } = await this.supabase
                    .from('personal_plans')
                    .upsert({
                        student_id: studentId,
                        plan_data: plan,
                        is_customized: plan.isCustomized || false,
                        last_modified: new Date().toISOString()
                    }, { onConflict: 'student_id' });
                
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('Error updating personal plan:', error);
                return { success: false, error: error.message };
            }
        }

        initializeModuleStatus(basePlan) {
            const modules = [];
            if (!basePlan) return modules;
            
            const totalSemesters = basePlan.course_id === 'DIT' ? 6 : 9;
            
            for (let i = 1; i <= totalSemesters; i++) {
                const semesterModules = basePlan[`semester_${i}_modules`];
                if (semesterModules && Array.isArray(semesterModules)) {
                    semesterModules.forEach(module => {
                        modules.push({
                            ...module,
                            semesterNumber: i,
                            plannedSemester: i,
                            actualSemester: null,
                            status: 'upcoming',
                            grade: null,
                            score: null,
                            attemptCount: 1,
                            completedDate: null,
                            notes: null
                        });
                    });
                }
            }
            
            return modules;
        }

        async getAllPersonalPlans() {
            try {
                const { data, error } = await this.supabase
                    .from('personal_plans')
                    .select(`
                        *,
                        users:student_id (
                            name,
                            email,
                            role
                        )
                    `)
                    .order('last_modified', { ascending: false });
                
                if (error) throw error;
                return { success: true, data: data || [] };
            } catch (error) {
                console.error('Error fetching all personal plans:', error);
                return { success: false, error: error.message, data: [] };
            }
        }

        async getStudentProgress(studentId) {
            try {
                const [modulesResult, semestersResult, personalPlanResult] = await Promise.all([
                    this.getModuleStatus(studentId),
                    this.supabase.from('semester_progress').select('*').eq('student_id', studentId).order('semester_number'),
                    this.getPersonalPlan(studentId)
                ]);
                
                const modules = modulesResult.success ? modulesResult.data : [];
                const totalCredits = modules.reduce((sum, m) => sum + (m.credits || 0), 0);
                const earnedCredits = modules
                    .filter(m => m.status === 'completed')
                    .reduce((sum, m) => sum + (m.credits || 0), 0);
                
                const completedModules = modules.filter(m => m.status === 'completed').length;
                const totalModules = modules.length;
                
                // Calculate GPA
                let gpa = null;
                const completedWithGrades = modules.filter(m => m.status === 'completed' && m.grade);
                
                if (completedWithGrades.length > 0) {
                    const gradePoints = {
                        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
                        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                        'D+': 1.3, 'D': 1.0, 'F': 0.0
                    };
                    
                    let totalPoints = 0;
                    let totalGPACredits = 0;
                    
                    completedWithGrades.forEach(m => {
                        const points = gradePoints[m.grade] || 0;
                        totalPoints += points * (m.credits || 0);
                        totalGPACredits += (m.credits || 0);
                    });
                    
                    gpa = totalGPACredits > 0 ? totalPoints / totalGPACredits : null;
                }
                
                return {
                    success: true,
                    data: {
                        totalCredits,
                        earnedCredits,
                        completionPercentage: totalCredits > 0 ? Math.round((earnedCredits / totalCredits) * 100) : 0,
                        totalModules,
                        completedModules,
                        gpa: gpa ? Math.round(gpa * 100) / 100 : null,
                        semesters: semestersResult.data || []
                    }
                };
            } catch (error) {
                console.error('Error getting student progress:', error);
                return { success: false, error: error.message };
            }
        }
    }

    // ============================================
    // DATA MANAGER
    // ============================================
    class SupabaseDataManager {
        constructor(dbManager) {
            this.db = dbManager;
            this.supabase = dbManager.supabase;
            console.log('✅ DataManager initialized (Email Auth Version)');
        }

        async authenticateUser(email, password) {
            return await this.db.authenticateUser(email, password);
        }

        async getAllStudents() {
            const result = await this.db.getAllStudents();
            return result.success ? result.data : [];
        }

        async getAllUsers() {
            const result = await this.db.getAllUsers();
            return result.success ? result.data : [];
        }

        async getAllCourses() {
            const result = await this.db.getAllCourses();
            return result.success ? result.data : [];
        }

        async getCourseById(courseId) {
            const result = await this.db.getCourseById(courseId);
            return result.success ? result.data : null;
        }

        async getAllLecturers() {
            const result = await this.db.getAllLecturers();
            return result.success ? result.data : [];
        }

        async getModuleLecturers() {
            const result = await this.db.getModuleLecturers();
            return result.success ? result.data : [];
        }

        async loadStudyPlan(courseId, intakeYear, intakeMonth, studyPlan) {
            const result = await this.db.getStudyPlan(courseId, intakeYear, intakeMonth, studyPlan);
            return result.success ? result.data : null;
        }

        async loadPersonalPlan(studentId) {
            const result = await this.db.getPersonalPlan(studentId);
            return result.success ? result.data : null;
        }

        async createPersonalPlan(studentId, courseId, intakeYear, intakeMonth, studyPlan) {
            const studyPlanResult = await this.db.getStudyPlan(courseId, intakeYear, intakeMonth, studyPlan);
            
            if (!studyPlanResult.success || !studyPlanResult.data) {
                console.error('Failed to load study plan for creation:', studyPlanResult.error);
                return null;
            }
            
            const result = await this.db.createPersonalPlan(studentId, studyPlanResult.data);
            return result.success ? result.data : null;
        }

        async savePersonalPlan(studentId, plan) {
            return await this.db.updatePersonalPlan(studentId, plan);
        }

        async updateModuleStatus(studentId, moduleCode, updates) {
            return await this.db.updateModuleStatus(studentId, moduleCode, updates);
        }

        async getModuleStatus(studentId) {
            const result = await this.db.getModuleStatus(studentId);
            return result.success ? result.data : [];
        }

        async getAllModuleStatus() {
            const result = await this.db.getAllModuleStatus();
            return result.success ? result.data : [];
        }

        async getStudentProgress(studentId) {
            const result = await this.db.getStudentProgress(studentId);
            return result.success ? result.data : null;
        }

        async getAllPersonalPlans() {
            const result = await this.db.getAllPersonalPlans();
            return result.success ? result.data : [];
        }

        async getStudentEnrollment(studentEmail) {
            const result = await this.db.getStudentEnrollment(studentEmail);
            return result.success ? result.data : null;
        }

        async checkUserExists(email) {
            try {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('email, name, role')
                    .eq('email', email);
                
                if (error) throw error;
                return { exists: data && data.length > 0, users: data || [] };
            } catch (error) {
                console.error('Error checking user existence:', error);
                return { exists: false, users: [], error: error.message };
            }
        }

        async registerStudent(studentData) {
            try {
                const { studentId, fullName, email, course, intakeYear, intakeMonth, password } = studentData;
                
                // Determine study plan based on intake
                let studyPlan = 'A';
                if (intakeYear === 2024 && intakeMonth === '05') studyPlan = 'B';
                else if (intakeYear === 2024 && intakeMonth === '09') studyPlan = 'A';
                else if (intakeYear === 2025 && intakeMonth === '01') studyPlan = 'B';
                else if (intakeYear === 2025 && intakeMonth === '05') studyPlan = 'A';
                else if (intakeYear === 2025 && intakeMonth === '09') studyPlan = 'B';
                else if (intakeYear === 2026 && intakeMonth === '01') studyPlan = 'A';
                else if (intakeYear === 2026 && intakeMonth === '05') studyPlan = 'B';
                else if (intakeYear === 2026 && intakeMonth === '09') studyPlan = 'A';
                else if (intakeYear === 2027 && intakeMonth === '01') studyPlan = 'B';
                
                // Create user with email as primary identifier
                const { error: userError } = await this.supabase
                    .from('users')
                    .insert([{
                        id: studentId,
                        name: fullName,
                        email: email,
                        password: password,
                        role: 'student',
                        course: course
                    }]);
                
                if (userError) {
                    console.error('User creation error:', userError);
                    throw new Error(userError.message);
                }
                
                // Create enrollment
                const { error: enrollError } = await this.supabase
                    .from('student_enrollment')
                    .insert([{
                        student_id: email,  // Use email as student_id
                        course_id: course,
                        intake_year: intakeYear,
                        intake_month: intakeMonth,
                        study_plan: studyPlan,
                        current_semester: 1,
                        status: 'active'
                    }]);
                
                if (enrollError) {
                    console.error('Enrollment creation error:', enrollError);
                    throw new Error(enrollError.message);
                }
                
                return { success: true, studentId, email };
            } catch (error) {
                console.error('Registration error:', error);
                return { success: false, error: error.message };
            }
        }

        getCurrentUser() {
            const userStr = localStorage.getItem('currentUser');
            try {
                const user = userStr ? JSON.parse(userStr) : null;
                console.log('Retrieved user from localStorage:', user);
                return user;
            } catch {
                return null;
            }
        }

        saveCurrentUser(user) {
            if (!user) return;
            
            const userToSave = {
                id: user.id || user.email,
                email: user.email,
                name: user.name,
                role: user.role,
                course: user.course,
                enrollment: user.enrollment || null
            };
            
            console.log('Saving user to localStorage:', userToSave);
            localStorage.setItem('currentUser', JSON.stringify(userToSave));
        }

        clearCurrentUser() {
            localStorage.removeItem('currentUser');
            console.log('User cleared from localStorage');
        }

        getIntakeName(intakeMonth) {
            const map = { 
                '01': 'January', 
                '05': 'May', 
                '09': 'September' 
            };
            return map[intakeMonth] || 'Unknown';
        }

        getCourseColor(courseId) {
            const colors = {
                'DIT': '#d2691e',
                'BIT': '#8b4513',
                'BAI': '#9c27b0',
                'BDS': '#2c5f6e'
            };
            return colors[courseId] || '#d2691e';
        }

        getClassificationProgress(modules) {
            if (!modules || modules.length === 0) return null;
            
            const classifications = {
                core: { name: 'Core Subjects', earned: 0, total: 0, percentage: 0 },
                disciplineCore: { name: 'Discipline Core', earned: 0, total: 0, percentage: 0 },
                compulsory: { name: 'Compulsory', earned: 0, total: 0, percentage: 0 },
                industrial: { name: 'Industrial Training', earned: 0, total: 0, percentage: 0 },
                elective: { name: 'Elective', earned: 0, total: 0, percentage: 0 },
                project: { name: 'Project', earned: 0, total: 0, percentage: 0 }
            };
            
            modules.forEach(module => {
                const cls = module.classification;
                if (classifications[cls]) {
                    classifications[cls].total += module.credits || 0;
                    if (module.status === 'completed') {
                        classifications[cls].earned += module.credits || 0;
                    }
                }
            });
            
            Object.keys(classifications).forEach(key => {
                const c = classifications[key];
                c.percentage = c.total > 0 ? Math.round((c.earned / c.total) * 100) : 0;
            });
            
            return classifications;
        }

        async getUserByEmail(email) {
            const result = await this.db.getStudentByEmail(email);
            return result.success ? result.data : null;
        }
    }

    // ============================================
    // CREATE AND EXPORT INSTANCES
    // ============================================
    try {
        const dbManager = new DatabaseManager(supabaseClient);
        const dataManager = new SupabaseDataManager(dbManager);
        
        global.dbManager = dbManager;
        global.dataManager = dataManager;
        global.supabaseClient = supabaseClient;
        
        console.log('✅ Supabase Core initialized - EMAIL as Primary Key');
        console.log('   - authenticateUser uses email now');
        console.log('   - All courses supported: DIT, BIT, BAI, BDS');
        console.log('   - getAllStudents() fixed to load all student data');
        
        const event = new CustomEvent('supabaseCoreReady');
        global.dispatchEvent(event);
        
    } catch (error) {
        console.error('❌ Supabase Core initialization failed:', error);
    }

})(window);