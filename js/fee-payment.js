class FeePaymentManager {
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
        const searchForm = document.getElementById('findStudentForm');
        const paymentForm = document.getElementById('feePaymentForm');
        
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.findStudent();
            });
        }

        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment();
            });
        }

        // Bind paid amount change
        const paidAmountInput = document.getElementById('paidAmount');
        if (paidAmountInput) {
            paidAmountInput.addEventListener('input', () => {
                this.calculateDueAmount();
            });
        }
    }

    findStudent() {
        const searchValue = document.getElementById('searchStudentId').value.trim();
        if (!searchValue) {
            Utils.showToast('Please enter a student ID or name', 'error');
            return;
        }

        // Search by student ID first, then by name
        let student = window.storageManager.getStudentByStudentId(searchValue);
        
        if (!student) {
            // Search by name
            const students = window.storageManager.getStudents();
            student = students.find(s => 
                s.name.toLowerCase().includes(searchValue.toLowerCase())
            );
        }

        if (!student) {
            Utils.showToast('Student not found', 'error');
            this.hideStudentInfo();
            return;
        }

        this.displayStudentInfo(student);
        this.loadPaymentOptions(student);
    }

    displayStudentInfo(student) {
        const studentInfoDisplay = document.getElementById('studentInfoDisplay');
        const studentPaymentInfo = document.getElementById('studentPaymentInfo');
        
        if (!studentInfoDisplay || !studentPaymentInfo) return;

        const institution = window.storageManager.getInstitutionById(student.institutionId);
        const batch = window.storageManager.getBatchById(student.batchId);

        studentInfoDisplay.innerHTML = `
            <div class="detail-item">
                <div class="detail-label">Name</div>
                <div class="detail-value">${student.name}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Student ID</div>
                <div class="detail-value">${student.studentId}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Institution</div>
                <div class="detail-value">${institution?.name || 'Unknown'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Batch</div>
                <div class="detail-value">${batch?.name || 'Unknown'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Phone</div>
                <div class="detail-value">${student.phone}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Guardian</div>
                <div class="detail-value">${student.guardianName} (${student.guardianPhone})</div>
            </div>
        `;

        studentPaymentInfo.style.display = 'block';
        
        // Store current student for payment processing
        this.currentStudent = student;
    }

    hideStudentInfo() {
        const studentPaymentInfo = document.getElementById('studentPaymentInfo');
        
        if (studentPaymentInfo) {
            studentPaymentInfo.style.display = 'none';
        }
        
        this.currentStudent = null;
    }

    loadPaymentOptions(student) {
        const courseSelection = document.getElementById('courseSelection');
        const monthSelection = document.getElementById('monthSelection');
        
        if (!courseSelection || !monthSelection) return;

        // Get enrolled courses for this student
        const enrolledCourses = student.enrolledCourses || [];
        
        if (enrolledCourses.length === 0) {
            courseSelection.innerHTML = '<p>No courses enrolled for this student</p>';
            monthSelection.innerHTML = '<p>No courses available</p>';
            return;
        }
        
        // Display courses
        courseSelection.innerHTML = enrolledCourses.map(enrollment => {
            const course = window.storageManager.getCourseById(enrollment.courseId);
            return `
                <div class="checkbox-item">
                    <input type="checkbox" id="course_${course.id}" value="${course.id}" onchange="feePaymentManager.updateMonthSelection()">
                    <label for="course_${course.id}">${course.name}</label>
                </div>
            `;
        }).join('');

        // Clear month selection initially
        monthSelection.innerHTML = '<p>Please select courses first</p>';
        
        // Reset amounts
        document.getElementById('totalAmount').value = '0';
        document.getElementById('paidAmount').value = '';
        document.getElementById('dueAmount').value = '0';
    }

    updateMonthSelection() {
        const courseSelection = document.querySelector('#studentPaymentInfo #courseSelection');
        const monthSelection = document.querySelector('#studentPaymentInfo #monthSelection');
        
        if (!courseSelection || !monthSelection) return;

        const selectedCourses = Array.from(courseSelection.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        if (selectedCourses.length === 0) {
            monthSelection.innerHTML = '<p>Please select courses first</p>';
            this.calculateTotalAmount();
            return;
        }

        // Get months for selected courses, only from the enrolled starting month onwards
        let allMonths = [];
        selectedCourses.forEach(courseId => {
            // Find the enrollment info for this course
            const enrollment = this.currentStudent.enrolledCourses.find(e => e.courseId === courseId);
            const startingMonthId = enrollment?.startingMonthId;
            
            const allCourseMonths = window.storageManager.getMonthsByCourse(courseId)
                .sort((a, b) => (a.monthNumber || 0) - (b.monthNumber || 0));
            const course = window.storageManager.getCourseById(courseId);
            
            // Find starting month index by monthNumber
            let startIndex = 0;
            if (startingMonthId) {
                const startingMonth = window.storageManager.getMonthById(startingMonthId);
                if (startingMonth) {
                    startIndex = allCourseMonths.findIndex(m => (m.monthNumber || 0) >= (startingMonth.monthNumber || 0));
                }
                if (startIndex === -1) startIndex = 0;
            }
            
            // Only include months from starting month onwards
            const availableMonths = allCourseMonths.slice(startIndex);
            
            availableMonths.forEach(month => {
                allMonths.push({
                    ...month,
                    courseName: course?.name || 'Unknown'
                });
            });
        });
        
        // Display months with checkboxes
        monthSelection.innerHTML = allMonths.map(month => `
            <div class="checkbox-item">
                <input type="checkbox" id="month_${month.id}" value="${month.id}" data-amount="${month.payment}" onchange="feePaymentManager.calculateTotalAmount()">
                <label for="month_${month.id}">
                    <span>${month.name} (${month.courseName})</span>
                    <span class="course-fee">${Utils.formatCurrency(month.payment)}</span>
                </label>
            </div>
        `).join('');
        
        this.calculateTotalAmount();
    }

    calculateTotalAmount() {
        const monthSelection = document.querySelector('#studentPaymentInfo #monthSelection');
        const totalAmountInput = document.getElementById('totalAmount');
        
        if (!monthSelection || !totalAmountInput) return;

        const selectedMonths = Array.from(monthSelection.querySelectorAll('input[type="checkbox"]:checked'));
        let totalAmount = 0;

        selectedMonths.forEach(checkbox => {
            totalAmount += parseFloat(checkbox.dataset.amount || 0);
        });

        totalAmountInput.value = totalAmount;
        this.calculateDueAmount();
    }

    calculateDueAmount() {
        const totalAmount = parseFloat(document.getElementById('totalAmount').value || 0);
        const paidAmount = parseFloat(document.getElementById('paidAmount').value || 0);
        const dueAmountInput = document.getElementById('dueAmount');
        
        if (dueAmountInput) {
            dueAmountInput.value = Math.max(0, totalAmount - paidAmount);
        }
    }

    processPayment() {
        if (!this.currentStudent) {
            Utils.showToast('Please find a student first', 'error');
            return;
        }

        const courseSelection = document.querySelector('#studentPaymentInfo #courseSelection');
        const monthSelection = document.querySelector('#studentPaymentInfo #monthSelection');
        const totalAmount = parseFloat(document.getElementById('totalAmount').value || 0);
        const paidAmount = parseFloat(document.getElementById('paidAmount').value || 0);
        const reference = document.getElementById('reference').value.trim();
        const receivedBy = document.getElementById('receivedBy').value.trim();

        if (!courseSelection || !monthSelection) return;

        const selectedCourses = Array.from(courseSelection.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        const selectedMonths = Array.from(monthSelection.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        if (selectedCourses.length === 0 || selectedMonths.length === 0) {
            Utils.showToast('Please select courses and months', 'error');
            return;
        }

        if (totalAmount <= 0) {
            Utils.showToast('Total amount must be greater than 0', 'error');
            return;
        }

        if (paidAmount <= 0) {
            Utils.showToast('Paid amount must be greater than 0', 'error');
            return;
        }

        if (!receivedBy) {
            Utils.showToast('Please enter who received the payment', 'error');
            return;
        }

        const dueAmount = Math.max(0, totalAmount - paidAmount);

        const payment = {
            studentId: this.currentStudent.id,
            studentName: this.currentStudent.name,
            studentStudentId: this.currentStudent.studentId,
            courses: selectedCourses,
            months: selectedMonths,
            totalAmount,
            paidAmount,
            dueAmount,
            reference,
            receivedBy
        };

        const savedPayment = window.storageManager.addPayment(payment);
        
        if (savedPayment) {
            Utils.showToast('Payment processed successfully!', 'success');
            
            // Generate and show invoice
            window.invoiceManager.generateInvoice(savedPayment);
            
            // Reset form
            this.resetPaymentForm();
        }
    }

    resetPaymentForm() {
        document.getElementById('findStudentForm').reset();
        document.getElementById('feePaymentForm').reset();
        this.hideStudentInfo();
    }

    refresh() {
        // Reset form and hide student info
        this.resetPaymentForm();
    }

    generateInvoice(payment) {
        const student = window.storageManager.getStudentById(payment.studentId);
        
        const invoiceData = {
            invoiceId: payment.id,
            student,
            payment,
            date: new Date().toLocaleDateString(),
            companyName: 'Break The Fear'
        };

        // Generate and download invoice
        this.downloadInvoice(invoiceData);
    }

    downloadInvoice(data) {
        const invoiceContent = `
            INVOICE - ${data.companyName}
            ================================
            
            Invoice ID: ${data.invoiceId}
            Date: ${data.date}
            
            Student Details:
            Name: ${data.student.name}
            ID: ${data.student.id}
            Institution: ${data.student.institution}
            Batch: ${data.student.batch}
            
            Payment Details:
            Course: ${data.payment.course}
            Months: ${data.payment.months.join(', ')}
            Total Amount: $${data.payment.amount}
            Paid: $${data.payment.paid}
            Due: $${data.payment.due}
            Reference: ${data.payment.reference}
            Received By: ${data.payment.receivedBy}
            
            Thank you for your payment!
        `;

        const blob = new Blob([invoiceContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${data.invoiceId}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    loadStudentData() {
        // Initialize any required data loading
    }

    showMessage(message, type) {
        // Create or update message display
        let messageDiv = document.getElementById('message-display');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'message-display';
            messageDiv.className = 'message';
            document.querySelector('.container').prepend(messageDiv);
        }

        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}

// Global fee payment manager instance
window.feePaymentManager = new FeePaymentManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.feePaymentManager = new FeePaymentManager();
});