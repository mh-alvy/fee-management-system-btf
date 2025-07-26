// Student Management
class StudentManagementManager {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.bindEvents();
        this.refresh();
    }

    bindEvents() {
        // Create Institution Form
        const institutionForm = document.getElementById('createInstitutionForm');
        if (institutionForm) {
            institutionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createInstitution();
            });
        }

        // Add Student Form
        const studentForm = document.getElementById('addStudentForm');
        if (studentForm) {
            studentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addStudent();
            });
        }

        // Search and filter events
        const studentSearch = document.getElementById('studentSearch');
        if (studentSearch) {
            studentSearch.addEventListener('input', Utils.debounce(() => {
                this.filterStudents();
            }, 300));
        }

        const paymentFilter = document.getElementById('paymentFilter');
        if (paymentFilter) {
            paymentFilter.addEventListener('change', () => {
                this.filterStudents();
            });
        }
    }

    createInstitution() {
        const name = document.getElementById('institutionName').value.trim();
        const address = document.getElementById('institutionAddress').value.trim();

        if (!name || !address) {
            Utils.showToast('Please fill in all fields', 'error');
            return;
        }

        // Check if institution already exists
        const existingInstitution = window.storageManager.getInstitutions().find(inst => 
            inst.name.toLowerCase() === name.toLowerCase()
        );

        if (existingInstitution) {
            Utils.showToast('Institution with this name already exists', 'error');
            return;
        }

        const institutionData = {
            name: Utils.sanitizeInput(name),
            address: Utils.sanitizeInput(address)
        };

        const institution = window.storageManager.addInstitution(institutionData);
        if (institution) {
            Utils.showToast('Institution created successfully', 'success');
            document.getElementById('createInstitutionForm').reset();
            this.loadInstitutions();
            this.updateInstitutionDropdown();
        }
    }

    addStudent() {
        const name = document.getElementById('studentName').value.trim();
        const institutionId = document.getElementById('studentInstitution').value;
        const gender = document.getElementById('studentGender').value;
        const phone = document.getElementById('studentPhone').value.trim();
        const guardianName = document.getElementById('guardianName').value.trim();
        const guardianPhone = document.getElementById('guardianPhone').value.trim();
        const batchId = document.getElementById('studentBatch').value;

        if (!name || !institutionId || !gender || !phone || !guardianName || !guardianPhone || !batchId) {
            Utils.showToast('Please fill in all fields', 'error');
            return;
        }

        if (!Utils.validatePhone(phone) || !Utils.validatePhone(guardianPhone)) {
            Utils.showToast('Please enter valid phone numbers', 'error');
            return;
        }

        // Get enrolled courses with starting months
        const enrolledCourses = this.getEnrolledCourses();
        
        if (enrolledCourses.length === 0) {
            Utils.showToast('Please select at least one course', 'error');
            return;
        }
        const studentData = {
            name: Utils.sanitizeInput(name),
            institutionId,
            gender,
            phone: Utils.sanitizeInput(phone),
            guardianName: Utils.sanitizeInput(guardianName),
            guardianPhone: Utils.sanitizeInput(guardianPhone),
            batchId,
            enrolledCourses
        };

        const student = window.storageManager.addStudent(studentData);
        if (student) {
            Utils.showToast(`Student added successfully with ID: ${student.studentId}`, 'success');
            document.getElementById('addStudentForm').reset();
            this.clearCourseSelection();
            this.loadStudents();
        }
    }

    refresh() {
        this.loadInstitutions();
        this.updateInstitutionDropdown();
        this.updateBatchDropdown();
        this.loadStudents();
    }

    loadInstitutions() {
        const institutionList = document.getElementById('institutionList');
        if (!institutionList) return;

        const institutions = window.storageManager.getInstitutions();
        
        if (institutions.length === 0) {
            institutionList.innerHTML = '<p class="text-center">No institutions created yet</p>';
            return;
        }

        institutionList.innerHTML = institutions.map(institution => `
            <div class="entity-item">
                <div class="entity-info">
                    <div class="entity-name">${institution.name}</div>
                    <div class="entity-details">${institution.address}</div>
                </div>
                <div class="entity-actions">
                    <button class="btn btn-small btn-outline" onclick="studentManager.editInstitution('${institution.id}')">
                        Edit
                    </button>
                    <button class="btn btn-small btn-danger" onclick="studentManager.deleteInstitution('${institution.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateInstitutionDropdown() {
        const institutionSelect = document.getElementById('studentInstitution');
        if (!institutionSelect) return;

        const institutions = window.storageManager.getInstitutions();
        institutionSelect.innerHTML = '<option value="">Select Institution</option>' +
            institutions.map(institution => 
                `<option value="${institution.id}">${institution.name}</option>`
            ).join('');
    }

    updateBatchDropdown() {
        const batchSelect = document.getElementById('studentBatch');
        if (!batchSelect) return;

        const batches = window.storageManager.getBatches();
        batchSelect.innerHTML = '<option value="">Select Batch</option>' +
            batches.map(batch => 
                `<option value="${batch.id}">${batch.name}</option>`
            ).join('');
        
        // Add event listener for batch change
        batchSelect.addEventListener('change', () => {
            this.updateCourseSelection();
        });
    }

    updateCourseSelection() {
        const batchId = document.getElementById('studentBatch').value;
        const courseSelectionDiv = document.getElementById('courseSelection');
        
        if (!courseSelectionDiv) return;
        
        if (!batchId) {
            courseSelectionDiv.innerHTML = '<p>Please select a batch first</p>';
            return;
        }
        
        const courses = window.storageManager.getCoursesByBatch(batchId);
        
        if (courses.length === 0) {
            courseSelectionDiv.innerHTML = '<p>No courses available for this batch</p>';
            return;
        }
        
        courseSelectionDiv.innerHTML = courses.map(course => {
            const months = window.storageManager.getMonthsByCourse(course.id);
            const monthOptions = months.map(month => 
                `<option value="${month.id}">${month.name}</option>`
            ).join('');
            
            return `
                <div class="course-enrollment-item">
                    <div class="course-checkbox">
                        <input type="checkbox" id="course_${course.id}" value="${course.id}" onchange="studentManager.toggleCourseSelection('${course.id}')">
                        <label for="course_${course.id}">${course.name}</label>
                    </div>
                    <div class="starting-month-select" id="startingMonth_${course.id}" style="display: none;">
                        <label for="startMonth_${course.id}">Starting Month:</label>
                        <select id="startMonth_${course.id}">
                            <option value="">Select Starting Month</option>
                            ${monthOptions}
                        </select>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleCourseSelection(courseId) {
        const checkbox = document.getElementById(`course_${courseId}`);
        const startingMonthDiv = document.getElementById(`startingMonth_${courseId}`);
        
        if (checkbox.checked) {
            startingMonthDiv.style.display = 'block';
        } else {
            startingMonthDiv.style.display = 'none';
            document.getElementById(`startMonth_${courseId}`).value = '';
        }
    }

    getEnrolledCourses() {
        const enrolledCourses = [];
        const courseCheckboxes = document.querySelectorAll('#courseSelection input[type="checkbox"]:checked');
        
        courseCheckboxes.forEach(checkbox => {
            const courseId = checkbox.value;
            const startingMonthId = document.getElementById(`startMonth_${courseId}`).value;
            
            if (startingMonthId) {
                enrolledCourses.push({
                    courseId,
                    startingMonthId
                });
            }
        });
        
        return enrolledCourses;
    }

    clearCourseSelection() {
        const courseSelectionDiv = document.getElementById('courseSelection');
        if (courseSelectionDiv) {
            courseSelectionDiv.innerHTML = '<p>Please select a batch first</p>';
        }
    }

    loadStudents() {
        const studentsList = document.getElementById('studentsList');
        if (!studentsList) return;

        const students = window.storageManager.getStudents();
        
        if (students.length === 0) {
            studentsList.innerHTML = '<p class="text-center">No students added yet</p>';
            return;
        }

        this.renderStudents(students);
    }

    renderStudents(students) {
        const studentsList = document.getElementById('studentsList');
        if (!studentsList) return;

        studentsList.innerHTML = students.map(student => {
            const institution = window.storageManager.getInstitutionById(student.institutionId);
            const batch = window.storageManager.getBatchById(student.batchId);
            const payments = window.storageManager.getPaymentsByStudent(student.id);
            const totalPaid = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
            
            // Calculate total due for this student based on enrolled courses and starting months
            let totalDue = 0;
            
            if (student.enrolledCourses && student.enrolledCourses.length > 0) {
                student.enrolledCourses.forEach(enrollment => {
                    const allCourseMonths = window.storageManager.getMonthsByCourse(enrollment.courseId)
                        .sort((a, b) => (a.monthNumber || 0) - (b.monthNumber || 0));
                    
                    if (enrollment.startingMonthId) {
                        const startingMonth = window.storageManager.getMonthById(enrollment.startingMonthId);
                        if (startingMonth) {
                            // Only include months from starting month onwards
                            const applicableMonths = allCourseMonths.filter(month => 
                                (month.monthNumber || 0) >= (startingMonth.monthNumber || 0)
                            );
                            totalDue += applicableMonths.reduce((sum, month) => sum + month.payment, 0);
                        }
                    }
                });
            }

            const paymentStatus = totalPaid >= totalDue ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
            const statusText = totalPaid >= totalDue ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';

            return `
                <div class="student-card">
                    <div class="student-header">
                        <div class="student-basic-info">
                            <h4>${student.name}</h4>
                            <div class="student-id">ID: ${student.studentId}</div>
                        </div>
                        <div class="student-actions">
                            <span class="payment-status ${paymentStatus}">${statusText}</span>
                            <button class="btn btn-small btn-outline" onclick="studentManager.editStudent('${student.id}')">
                                Edit
                            </button>
                            <button class="btn btn-small btn-danger" onclick="studentManager.deleteStudent('${student.id}')">
                                Delete
                            </button>
                        </div>
                    </div>
                    <div class="student-details">
                        <div class="detail-item">
                            <div class="detail-label">Institution</div>
                            <div class="detail-value">${institution?.name || 'Unknown'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Batch</div>
                            <div class="detail-value">${batch?.name || 'Unknown'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Gender</div>
                            <div class="detail-value">${student.gender}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Phone</div>
                            <div class="detail-value">${student.phone}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Guardian</div>
                            <div class="detail-value">${student.guardianName}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Guardian Phone</div>
                            <div class="detail-value">${student.guardianPhone}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Paid</div>
                            <div class="detail-value">${Utils.formatCurrency(totalPaid)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Due</div>
                            <div class="detail-value">${Utils.formatCurrency(totalDue)}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterStudents() {
        const searchTerm = document.getElementById('studentSearch')?.value.toLowerCase() || '';
        const paymentFilter = document.getElementById('paymentFilter')?.value || 'all';
        
        let students = window.storageManager.getStudents();

        // Apply search filter
        if (searchTerm) {
            students = students.filter(student => 
                student.name.toLowerCase().includes(searchTerm) ||
                student.studentId.toLowerCase().includes(searchTerm) ||
                student.phone.includes(searchTerm)
            );
        }

        // Apply payment filter
        if (paymentFilter !== 'all') {
            students = students.filter(student => {
                const payments = window.storageManager.getPaymentsByStudent(student.id);
                const totalPaid = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
                
                const batchCourses = window.storageManager.getCoursesByBatch(student.batchId);
                let totalDue = 0;
                batchCourses.forEach(course => {
                    const months = window.storageManager.getMonthsByCourse(course.id);
                    totalDue += months.reduce((sum, month) => sum + month.payment, 0);
                });

                if (paymentFilter === 'paid') {
                    return totalPaid >= totalDue;
                } else if (paymentFilter === 'unpaid') {
                    return totalPaid < totalDue;
                }
                return true;
            });
        }

        this.renderStudents(students);
    }

    editInstitution(id) {
        const institution = window.storageManager.getInstitutionById(id);
        if (!institution) return;

        const editForm = `
            <form id="editInstitutionForm">
                <div class="form-group">
                    <label for="editInstitutionName">Institution Name</label>
                    <input type="text" id="editInstitutionName" value="${institution.name}" required>
                </div>
                <div class="form-group">
                    <label for="editInstitutionAddress">Institution Address</label>
                    <textarea id="editInstitutionAddress" required>${institution.address}</textarea>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Update Institution</button>
                    <button type="button" class="btn btn-outline" onclick="navigationManager.closeModal(document.getElementById('editModal'))">Cancel</button>
                </div>
            </form>
        `;

        window.navigationManager.showModal('editModal', 'Edit Institution', editForm);

        document.getElementById('editInstitutionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('editInstitutionName').value.trim();
            const address = document.getElementById('editInstitutionAddress').value.trim();

            if (!name || !address) {
                Utils.showToast('Please fill in all fields', 'error');
                return;
            }

            const result = window.storageManager.updateInstitution(id, {
                name: Utils.sanitizeInput(name),
                address: Utils.sanitizeInput(address)
            });

            if (result) {
                Utils.showToast('Institution updated successfully', 'success');
                window.navigationManager.closeModal(document.getElementById('editModal'));
                this.loadInstitutions();
                this.updateInstitutionDropdown();
            }
        });
    }

    deleteInstitution(id) {
        const institution = window.storageManager.getInstitutionById(id);
        if (!institution) return;

        Utils.confirm(`Are you sure you want to delete "${institution.name}"?`, () => {
            const result = window.storageManager.deleteInstitution(id);
            if (result.success) {
                Utils.showToast('Institution deleted successfully', 'success');
                this.loadInstitutions();
                this.updateInstitutionDropdown();
            } else {
                Utils.showToast(result.message, 'error');
            }
        });
    }

    editStudent(id) {
        const student = window.storageManager.getStudentById(id);
        if (!student) return;

        const institutions = window.storageManager.getInstitutions();
        const batches = window.storageManager.getBatches();

        const editForm = `
            <form id="editStudentForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editStudentName">Student Name</label>
                        <input type="text" id="editStudentName" value="${student.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="editStudentInstitution">Institution</label>
                        <select id="editStudentInstitution" required>
                            <option value="">Select Institution</option>
                            ${institutions.map(inst => 
                                `<option value="${inst.id}" ${inst.id === student.institutionId ? 'selected' : ''}>${inst.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editStudentGender">Gender</label>
                        <select id="editStudentGender" required>
                            <option value="">Select Gender</option>
                            <option value="Male" ${student.gender === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${student.gender === 'Female' ? 'selected' : ''}>Female</option>
                            <option value="Custom" ${student.gender === 'Custom' ? 'selected' : ''}>Custom</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editStudentPhone">Student Phone</label>
                        <input type="tel" id="editStudentPhone" value="${student.phone}" required>
                    </div>
                    <div class="form-group">
                        <label for="editGuardianName">Guardian Name</label>
                        <input type="text" id="editGuardianName" value="${student.guardianName}" required>
                    </div>
                    <div class="form-group">
                        <label for="editGuardianPhone">Guardian Phone</label>
                        <input type="tel" id="editGuardianPhone" value="${student.guardianPhone}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editStudentBatch">Batch</label>
                        <select id="editStudentBatch" required>
                            <option value="">Select Batch</option>
                            ${batches.map(batch => 
                                `<option value="${batch.id}" ${batch.id === student.batchId ? 'selected' : ''}>${batch.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Update Student</button>
                    <button type="button" class="btn btn-outline" onclick="navigationManager.closeModal(document.getElementById('editModal'))">Cancel</button>
                </div>
            </form>
        `;

        window.navigationManager.showModal('editModal', 'Edit Student', editForm);

        document.getElementById('editStudentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('editStudentName').value.trim();
            const institutionId = document.getElementById('editStudentInstitution').value;
            const gender = document.getElementById('editStudentGender').value;
            const phone = document.getElementById('editStudentPhone').value.trim();
            const guardianName = document.getElementById('editGuardianName').value.trim();
            const guardianPhone = document.getElementById('editGuardianPhone').value.trim();
            const batchId = document.getElementById('editStudentBatch').value;

            if (!name || !institutionId || !gender || !phone || !guardianName || !guardianPhone || !batchId) {
                Utils.showToast('Please fill in all fields', 'error');
                return;
            }

            if (!Utils.validatePhone(phone) || !Utils.validatePhone(guardianPhone)) {
                Utils.showToast('Please enter valid phone numbers', 'error');
                return;
            }

            const result = window.storageManager.updateStudent(id, {
                name: Utils.sanitizeInput(name),
                institutionId,
                gender,
                phone: Utils.sanitizeInput(phone),
                guardianName: Utils.sanitizeInput(guardianName),
                guardianPhone: Utils.sanitizeInput(guardianPhone),
                batchId
            });

            if (result) {
                Utils.showToast('Student updated successfully', 'success');
                window.navigationManager.closeModal(document.getElementById('editModal'));
                this.loadStudents();
            }
        });
    }

    deleteStudent(id) {
        const student = window.storageManager.getStudentById(id);
        if (!student) return;

        Utils.confirm(`Are you sure you want to delete "${student.name}"?`, () => {
            const result = window.storageManager.deleteStudent(id);
            if (result.success) {
                Utils.showToast('Student deleted successfully', 'success');
                this.loadStudents();
            } else {
                Utils.showToast(result.message, 'error');
            }
        });
    }
}

// Global student management manager instance
window.studentManager = new StudentManagementManager();