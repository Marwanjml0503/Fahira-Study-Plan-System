// Common utility functions
class StudyPlanSystem {
    constructor() {
        this.currentUser = null;
    }
    
    // Parse user data from text file
    parseUsersData(text) {
        const users = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (line.trim() === '') continue;
            const [name, studentId, course, password] = line.split(',');
            if (name && studentId) {
                const intake = studentId.substring(0, 2); // First 2 digits
                const year = studentId.substring(2, 4); // Next 2 digits
                const rollNumber = studentId.substring(4); // Last 3 digits
                
                users.push({
                    name: name.trim(),
                    studentId: studentId.trim(),
                    intake: intake.trim(),
                    year: year.trim(),
                    rollNumber: rollNumber.trim(),
                    course: course ? course.trim() : 'DIT',
                    password: password ? password.trim() : 'DIT'
                });
            }
        }
        return users;
    }
    
    // Parse study plan data from text file
    parseStudyPlanData(text) {
        const lines = text.split('\n');
        const plan = {
            name: lines[0]?.trim() || 'Study Plan',
            semesters: []
        };
        
        let currentSemester = null;
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '') continue;
            
            if (line.startsWith('Semester')) {
                if (currentSemester) {
                    plan.semesters.push(currentSemester);
                }
                const [semester, duration] = line.split(',');
                currentSemester = {
                    semester: semester.trim(),
                    duration: duration ? duration.trim() : '',
                    modules: []
                };
            } else if (currentSemester && line.includes(',')) {
                const [code, name, credits] = line.split(',');
                currentSemester.modules.push({
                    code: code.trim(),
                    name: name.trim(),
                    credits: credits ? parseInt(credits.trim()) : 3
                });
            }
        }
        
        if (currentSemester) {
            plan.semesters.push(currentSemester);
        }
        
        return plan;
    }
    
    // Load data from text file
    async loadTextFile(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) throw new Error(`Failed to load ${filename}`);
            return await response.text();
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            return null;
        }
    }
    
    // Get user by ID and password
    async authenticateUser(studentId, password) {
        try {
            const usersText = await this.loadTextFile('users.txt');
            if (!usersText) return null;
            
            const users = this.parseUsersData(usersText);
            return users.find(user => 
                user.studentId === studentId && user.password === password
            );
        } catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    }
    
    // Get study plan based on intake
    async getStudyPlan(intake) {
        const filename = intake === '05' ? 'studyplan_b.txt' : 'studyplan_a.txt';
        const planText = await this.loadTextFile(filename);
        
        if (!planText) {
            // Fallback to default plan
            return this.getDefaultStudyPlan(intake === '05' ? 'B' : 'A');
        }
        
        return this.parseStudyPlanData(planText);
    }
    
    // Default study plan if file not found
    getDefaultStudyPlan(planType) {
        if (planType === 'B') {
            return {
                name: "Study Plan B (Default)",
                semesters: [
                    {
                        semester: "Semester 1",
                        duration: "Months 1-4",
                        modules: [
                            { code: "CS101", name: "Introduction to Programming", credits: 3 },
                            { code: "MATH101", name: "Calculus I", credits: 3 },
                            { code: "DIT101", name: "Digital Fundamentals", credits: 4 },
                            { code: "BUS101", name: "Business Fundamentals", credits: 3 }
                        ]
                    }
                ]
            };
        } else {
            return {
                name: "Study Plan A (Default)",
                semesters: [
                    {
                        semester: "Semester 1",
                        duration: "Months 1-4",
                        modules: [
                            { code: "CS101", name: "Introduction to Programming", credits: 3 },
                            { code: "MATH101", name: "Calculus I", credits: 3 },
                            { code: "ENG101", name: "English Composition", credits: 3 },
                            { code: "DIT101", name: "Digital Fundamentals", credits: 4 }
                        ]
                    }
                ]
            };
        }
    }
    
    // Get intake name
    getIntakeName(intakeCode) {
        const intakeMap = {
            '01': 'January',
            '05': 'May',
            '09': 'September'
        };
        return intakeMap[intakeCode] || 'Unknown';
    }
    
    // Get intake from student ID
    getIntakeFromStudentId(studentId) {
        return studentId.substring(0, 2);
    }
    
    // Get year from student ID
    getYearFromStudentId(studentId) {
        return studentId.substring(2, 4);
    }
    
    // Save current user to session
    setCurrentUser(user) {
        this.currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    // Get current user from session
    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        const saved = sessionStorage.getItem('currentUser');
        if (saved) {
            this.currentUser = JSON.parse(saved);
            return this.currentUser;
        }
        return null;
    }
    
    // Clear current user
    clearCurrentUser() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
    }
    
    // Check if user is logged in
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
    
    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
}

// Create global instance
window.studyPlanSystem = new StudyPlanSystem();