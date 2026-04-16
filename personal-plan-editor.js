// ====== PERSONAL PLAN EDITOR ======
class PersonalPlanEditor {
    constructor(studentId, plan) {
        this.studentId = studentId;
        this.personalPlan = plan || {
            modules: [],
            extraSemesters: [],
            notes: "",
            isCustomized: false
        };
        console.log('✅ PersonalPlanEditor initialized for student:', studentId);
    }

    // Get modules by semester
    getModulesBySemester(semesterNumber) {
        if (!this.personalPlan || !this.personalPlan.modules) return [];
        
        return this.personalPlan.modules.filter(module => 
            (module.semesterNumber === semesterNumber || module.plannedSemester === semesterNumber) && 
            !module.isHidden
        );
    }

    // Get all semesters (including extra)
    getAllSemesters() {
        if (!this.personalPlan) return [];
        
        const totalSemesters = 9; // Maximum possible
        const semesters = [];
        
        for (let i = 1; i <= totalSemesters; i++) {
            semesters.push({
                semesterNumber: i,
                semesterName: `Year ${Math.ceil(i/2)} Semester ${i % 2 === 1 ? 1 : 2}`
            });
        }
        
        if (this.personalPlan.extraSemesters) {
            this.personalPlan.extraSemesters.forEach((sem, idx) => {
                semesters.push({
                    semesterNumber: totalSemesters + idx + 1,
                    semesterName: sem.semesterName || `Extra Semester ${idx + 1}`,
                    isExtra: true
                });
            });
        }
        
        return semesters;
    }

    // Get semester credits
    getSemesterCredits(semesterNumber) {
        const modules = this.getModulesBySemester(semesterNumber);
        return modules.reduce((sum, m) => sum + (m.credits || 0), 0);
    }

    // Update module status
    updateModuleStatus(moduleCode, newStatus) {
        if (!this.personalPlan || !this.personalPlan.modules) return false;
        
        const moduleIndex = this.personalPlan.modules.findIndex(m => m.code === moduleCode);
        if (moduleIndex === -1) return false;
        
        this.personalPlan.modules[moduleIndex].status = newStatus;
        this.personalPlan.modules[moduleIndex].isModified = true;
        this.personalPlan.isCustomized = true;
        
        return true;
    }

    // Update module grade
    updateModuleGrade(moduleCode, grade) {
        if (!this.personalPlan || !this.personalPlan.modules) return false;
        
        const moduleIndex = this.personalPlan.modules.findIndex(m => m.code === moduleCode);
        if (moduleIndex === -1) return false;
        
        this.personalPlan.modules[moduleIndex].grade = grade;
        this.personalPlan.modules[moduleIndex].isModified = true;
        this.personalPlan.isCustomized = true;
        
        return true;
    }

    // Toggle module visibility
    toggleModuleVisibility(moduleCode) {
        if (!this.personalPlan || !this.personalPlan.modules) return false;
        
        const moduleIndex = this.personalPlan.modules.findIndex(m => m.code === moduleCode);
        if (moduleIndex === -1) return false;
        
        this.personalPlan.modules[moduleIndex].isHidden = !this.personalPlan.modules[moduleIndex].isHidden;
        this.personalPlan.isCustomized = true;
        
        return true;
    }

    // Add extra semester
    addExtraSemester() {
        if (!this.personalPlan) return null;
        
        if (!this.personalPlan.extraSemesters) {
            this.personalPlan.extraSemesters = [];
        }
        
        const newSemester = {
            semesterNumber: 10 + this.personalPlan.extraSemesters.length,
            semesterName: `Extra Semester ${this.personalPlan.extraSemesters.length + 1}`,
            modules: [],
            isExtra: true
        };
        
        this.personalPlan.extraSemesters.push(newSemester);
        this.personalPlan.isCustomized = true;
        
        return newSemester;
    }

    // Remove extra semester
    removeExtraSemester(semesterNumber) {
        if (!this.personalPlan || !this.personalPlan.extraSemesters) return false;
        
        const index = this.personalPlan.extraSemesters.findIndex(s => s.semesterNumber === semesterNumber);
        if (index === -1) return false;
        
        // Check if semester has modules
        const modulesInSemester = this.getModulesBySemester(semesterNumber);
        if (modulesInSemester.length > 0) {
            alert('Cannot remove semester with modules. Move modules first.');
            return false;
        }
        
        this.personalPlan.extraSemesters.splice(index, 1);
        this.personalPlan.isCustomized = true;
        
        return true;
    }

    // Get statistics
    getStatistics() {
        if (!this.personalPlan || !this.personalPlan.modules) {
            return {
                totalModules: 0,
                completed: 0,
                failed: 0,
                inProgress: 0,
                upcoming: 0,
                totalCredits: 0,
                earnedCredits: 0,
                completionPercentage: 0
            };
        }
        
        const modules = this.personalPlan.modules.filter(m => !m.isHidden);
        const totalModules = modules.length;
        const completed = modules.filter(m => m.status === 'completed').length;
        const failed = modules.filter(m => m.status === 'failed').length;
        const inProgress = modules.filter(m => m.status === 'in_progress').length;
        const upcoming = modules.filter(m => m.status === 'upcoming').length;
        
        const totalCredits = modules.reduce((sum, m) => sum + (m.credits || 0), 0);
        const earnedCredits = modules
            .filter(m => m.status === 'completed')
            .reduce((sum, m) => sum + (m.credits || 0), 0);
        
        return {
            totalModules,
            completed,
            failed,
            inProgress,
            upcoming,
            totalCredits,
            earnedCredits,
            completionPercentage: totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0
        };
    }

    // Add note
    addNote(note) {
        if (!this.personalPlan) return false;
        
        this.personalPlan.notes = note;
        this.personalPlan.isCustomized = true;
        return true;
    }

    // Save plan
    async savePlan() {
        if (!this.personalPlan) return false;
        
        this.personalPlan.lastModified = new Date().toISOString();
        const result = await window.dataManager.savePersonalPlan(this.studentId, this.personalPlan);
        return result.success;
    }

    // Export plan
    exportPlan() {
        if (!this.personalPlan) return null;
        
        const dataStr = JSON.stringify(this.personalPlan, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.studentId}_personal_plan.json`;
        link.click();
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        return url;
    }

    // Reset to default
    async resetToDefault() {
        if (!confirm('Reset to default plan? All customizations will be lost.')) return null;
        
        const user = window.dataManager.getCurrentUser();
        const enrollment = user.enrollment;
        
        const newPlan = await window.dataManager.createPersonalPlan(
            this.studentId,
            enrollment.course_id,
            enrollment.intake_year,
            enrollment.intake_month
        );
        
        if (newPlan) {
            this.personalPlan = newPlan;
        }
        
        return this.personalPlan;
    }

    // Get all classifications
    getAllClassifications() {
        if (!this.personalPlan || !this.personalPlan.modules) return [];
        
        const classifications = {};
        
        this.personalPlan.modules.forEach(module => {
            const cls = module.classification || 'other';
            if (!classifications[cls]) {
                classifications[cls] = {
                    name: cls,
                    modules: [],
                    totalCredits: 0,
                    completedCredits: 0,
                    requiredCredits: 0
                };
            }
            
            classifications[cls].modules.push(module);
            classifications[cls].totalCredits += module.credits || 0;
            
            if (module.status === 'completed') {
                classifications[cls].completedCredits += module.credits || 0;
            }
        });
        
        // Add required credits based on course
        Object.keys(classifications).forEach(key => {
            if (key === 'core') classifications[key].requiredCredits = 39;
            else if (key === 'disciplineCore') classifications[key].requiredCredits = 26;
            else if (key === 'compulsory') classifications[key].requiredCredits = 6;
            else if (key === 'industrial') classifications[key].requiredCredits = 6;
            else if (key === 'elective') classifications[key].requiredCredits = 8;
            else if (key === 'project') classifications[key].requiredCredits = 5;
            else classifications[key].requiredCredits = classifications[key].totalCredits;
        });
        
        return Object.values(classifications);
    }
}