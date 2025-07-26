// Data Storage Manager
class StorageManager {
    constructor() {
        this.data = {
            batches: this.load('batches'),
            courses: this.load('courses'),
            months: this.load('months'),
            institutions: this.load('institutions'),
            students: this.load('students'),
            payments: this.load('payments'),
            activities: this.load('activities')
        };
    }

    load(key) {
        try {
            return JSON.parse(localStorage.getItem(`btf_${key}`) || '[]');
        } catch (e) {
            console.error(`Error loading ${key}:`, e);
            return [];
        }
    }

    save(key, data) {
        try {
            localStorage.setItem(`btf_${key}`, JSON.stringify(data));
            this.data[key] = data;
        } catch (e) {
            console.error(`Error saving ${key}:`, e);
        }
    }

    generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateStudentId() {
        const year = new Date().getFullYear().toString().substr(-2);
        const existing = this.data.students.length;
        return `BTF${year}${(existing + 1).toString().padStart(4, '0')}`;
    }

    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const existing = this.data.payments.length;
        return `INV${year}${month}${(existing + 1).toString().padStart(4, '0')}`;
    }

    addActivity(type, description, data = {}) {
        const activity = {
            id: this.generateId('activity'),
            type,
            description,
            data,
            timestamp: new Date().toISOString(),
            user: window.authManager.getCurrentUser()?.username || 'System'
        };

        this.data.activities.unshift(activity);
        
        // Keep only last 100 activities
        if (this.data.activities.length > 100) {
            this.data.activities = this.data.activities.slice(0, 100);
        }

        this.save('activities', this.data.activities);
        return activity;
    }

    // Batch operations
    addBatch(batchData) {
        const batch = {
            id: this.generateId('batch'),
            ...batchData,
            createdAt: new Date().toISOString(),
            createdBy: window.authManager.getCurrentUser()?.username
        };

        this.data.batches.push(batch);
        this.save('batches', this.data.batches);
        this.addActivity('batch_created', `Batch "${batch.name}" created`, { batchId: batch.id });
        return batch;
    }

    updateBatch(id, updates) {
        const index = this.data.batches.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.batches[index] = { ...this.data.batches[index], ...updates };
            this.save('batches', this.data.batches);
            this.addActivity('batch_updated', `Batch "${this.data.batches[index].name}" updated`, { batchId: id });
            return this.data.batches[index];
        }
        return null;
    }

    deleteBatch(id) {
        const batch = this.data.batches.find(item => item.id === id);
        if (batch) {
            // Check if batch has courses
            const hascourses = this.data.courses.some(course => course.batchId === id);
            if (hascourses) {
                return { success: false, message: 'Cannot delete batch with existing courses' };
            }

            this.data.batches = this.data.batches.filter(item => item.id !== id);
            this.save('batches', this.data.batches);
            this.addActivity('batch_deleted', `Batch "${batch.name}" deleted`, { batchId: id });
            return { success: true };
        }
        return { success: false, message: 'Batch not found' };
    }

    // Course operations
    addCourse(courseData) {
        const course = {
            id: this.generateId('course'),
            ...courseData,
            createdAt: new Date().toISOString(),
            createdBy: window.authManager.getCurrentUser()?.username
        };

        this.data.courses.push(course);
        this.save('courses', this.data.courses);
        this.addActivity('course_created', `Course "${course.name}" created`, { courseId: course.id });
        return course;
    }

    updateCourse(id, updates) {
        const index = this.data.courses.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.courses[index] = { ...this.data.courses[index], ...updates };
            this.save('courses', this.data.courses);
            this.addActivity('course_updated', `Course "${this.data.courses[index].name}" updated`, { courseId: id });
            return this.data.courses[index];
        }
        return null;
    }

    deleteCourse(id) {
        const course = this.data.courses.find(item => item.id === id);
        if (course) {
            // Check if course has months
            const hasMonths = this.data.months.some(month => month.courseId === id);
            if (hasMonths) {
                return { success: false, message: 'Cannot delete course with existing months' };
            }

            this.data.courses = this.data.courses.filter(item => item.id !== id);
            this.save('courses', this.data.courses);
            this.addActivity('course_deleted', `Course "${course.name}" deleted`, { courseId: id });
            return { success: true };
        }
        return { success: false, message: 'Course not found' };
    }

    // Month operations
    addMonth(monthData) {
        const month = {
            id: this.generateId('month'),
            ...monthData,
            monthNumber: monthData.monthNumber || 1,
            monthName: monthData.monthName || monthData.name,
            createdAt: new Date().toISOString(),
            createdBy: window.authManager.getCurrentUser()?.username
        };

        this.data.months.push(month);
        this.save('months', this.data.months);
        this.addActivity('month_created', `Month "${month.name}" created`, { monthId: month.id });
        return month;
    }

    updateMonth(id, updates) {
        const index = this.data.months.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.months[index] = { ...this.data.months[index], ...updates };
            this.save('months', this.data.months);
            this.addActivity('month_updated', `Month "${this.data.months[index].name}" updated`, { monthId: id });
            return this.data.months[index];
        }
        return null;
    }

    deleteMonth(id) {
        const month = this.data.months.find(item => item.id === id);
        if (month) {
            this.data.months = this.data.months.filter(item => item.id !== id);
            this.save('months', this.data.months);
            this.addActivity('month_deleted', `Month "${month.name}" deleted`, { monthId: id });
            return { success: true };
        }
        return { success: false, message: 'Month not found' };
    }

    // Institution operations
    addInstitution(institutionData) {
        const institution = {
            id: this.generateId('institution'),
            ...institutionData,
            createdAt: new Date().toISOString(),
            createdBy: window.authManager.getCurrentUser()?.username
        };

        this.data.institutions.push(institution);
        this.save('institutions', this.data.institutions);
        this.addActivity('institution_created', `Institution "${institution.name}" created`, { institutionId: institution.id });
        return institution;
    }

    updateInstitution(id, updates) {
        const index = this.data.institutions.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.institutions[index] = { ...this.data.institutions[index], ...updates };
            this.save('institutions', this.data.institutions);
            this.addActivity('institution_updated', `Institution "${this.data.institutions[index].name}" updated`, { institutionId: id });
            return this.data.institutions[index];
        }
        return null;
    }

    deleteInstitution(id) {
        const institution = this.data.institutions.find(item => item.id === id);
        if (institution) {
            // Check if institution has students
            const hasStudents = this.data.students.some(student => student.institutionId === id);
            if (hasStudents) {
                return { success: false, message: 'Cannot delete institution with existing students' };
            }

            this.data.institutions = this.data.institutions.filter(item => item.id !== id);
            this.save('institutions', this.data.institutions);
            this.addActivity('institution_deleted', `Institution "${institution.name}" deleted`, { institutionId: id });
            return { success: true };
        }
        return { success: false, message: 'Institution not found' };
    }

    // Student operations
    addStudent(studentData) {
        const student = {
            id: this.generateId('student'),
            studentId: this.generateStudentId(),
            ...studentData,
            enrolledCourses: studentData.enrolledCourses || [],
            createdAt: new Date().toISOString(),
            createdBy: window.authManager.getCurrentUser()?.username
        };

        this.data.students.push(student);
        this.save('students', this.data.students);
        this.addActivity('student_added', `Student "${student.name}" added with ID ${student.studentId}`, { studentId: student.id });
        return student;
    }

    updateStudent(id, updates) {
        const index = this.data.students.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.students[index] = { ...this.data.students[index], ...updates };
            this.save('students', this.data.students);
            this.addActivity('student_updated', `Student "${this.data.students[index].name}" updated`, { studentId: id });
            return this.data.students[index];
        }
        return null;
    }

    deleteStudent(id) {
        const student = this.data.students.find(item => item.id === id);
        if (student) {
            this.data.students = this.data.students.filter(item => item.id !== id);
            this.save('students', this.data.students);
            this.addActivity('student_deleted', `Student "${student.name}" deleted`, { studentId: id });
            return { success: true };
        }
        return { success: false, message: 'Student not found' };
    }

    // Payment operations
    addPayment(paymentData) {
        const payment = {
            id: this.generateId('payment'),
            invoiceNumber: this.generateInvoiceNumber(),
            ...paymentData,
            createdAt: new Date().toISOString(),
            createdBy: window.authManager.getCurrentUser()?.username
        };

        this.data.payments.push(payment);
        this.save('payments', this.data.payments);
        this.addActivity('payment_received', `Payment of ৳${payment.paidAmount} received from ${payment.studentName}`, { paymentId: payment.id });
        return payment;
    }

    // Getter methods
    getBatches() { return this.data.batches; }
    getCourses() { return this.data.courses; }
    getMonths() { return this.data.months; }
    getInstitutions() { return this.data.institutions; }
    getStudents() { return this.data.students; }
    getPayments() { return this.data.payments; }
    getActivities() { return this.data.activities; }

    // Utility methods
    getBatchById(id) { return this.data.batches.find(item => item.id === id); }
    getCourseById(id) { return this.data.courses.find(item => item.id === id); }
    getMonthById(id) { return this.data.months.find(item => item.id === id); }
    getInstitutionById(id) { return this.data.institutions.find(item => item.id === id); }
    getStudentById(id) { return this.data.students.find(item => item.id === id); }
    getStudentByStudentId(studentId) { return this.data.students.find(item => item.studentId === studentId); }

    getCoursesByBatch(batchId) {
        return this.data.courses.filter(course => course.batchId === batchId);
    }

    getMonthsByCourse(courseId) {
        return this.data.months.filter(month => month.courseId === courseId);
    }

    getStudentsByBatch(batchId) {
        return this.data.students.filter(student => student.batchId === batchId);
    }

    getPaymentsByStudent(studentId) {
        return this.data.payments.filter(payment => payment.studentId === studentId);
    }
}

// Global storage manager instance
window.storageManager = new StorageManager();