class FeePaymentManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStudentData();
    }

    bindEvents() {
        const searchForm = document.getElementById('student-search-form');
        const paymentForm = document.getElementById('payment-form');
        
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.searchStudent();
            });
        }

        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment();
            });
        }

        // Bind course selection change
        const courseSelect = document.getElementById('course-select');
        if (courseSelect) {
            courseSelect.addEventListener('change', () => {
                this.updateMonthOptions();
                this.calculateAmount();
            });
        }

        // Bind month selection change
        const monthSelect = document.getElementById('month-select');
        if (monthSelect) {
            monthSelect.addEventListener('change', () => {
                this.calculateAmount();
            });
        }
    }

    searchStudent() {
        const studentId = document.getElementById('student-id-search').value.trim();
        if (!studentId) {
            this.showMessage('Please enter a student ID', 'error');
            return;
        }

        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const student = students.find(s => s.id === studentId);

        if (!student) {
            this.showMessage('Student not found', 'error');
            this.hideStudentInfo();
            return;
        }

        this.displayStudentInfo(student);
        this.loadCourseOptions(student.batch);
    }

    displayStudentInfo(student) {
        const studentInfoDiv = document.getElementById('student-info');
        if (!studentInfoDiv) return;

        studentInfoDiv.innerHTML = `
            <div class="student-details">
                <h3>Student Information</h3>
                <p><strong>Name:</strong> ${student.name}</p>
                <p><strong>ID:</strong> ${student.id}</p>
                <p><strong>Institution:</strong> ${student.institution}</p>
                <p><strong>Batch:</strong> ${student.batch}</p>
                <p><strong>Phone:</strong> ${student.phone}</p>
                <p><strong>Guardian:</strong> ${student.guardianName} (${student.guardianPhone})</p>
            </div>
        `;
        studentInfoDiv.style.display = 'block';

        const paymentSection = document.getElementById('payment-section');
        if (paymentSection) {
            paymentSection.style.display = 'block';
        }
    }

    hideStudentInfo() {
        const studentInfoDiv = document.getElementById('student-info');
        const paymentSection = document.getElementById('payment-section');
        
        if (studentInfoDiv) studentInfoDiv.style.display = 'none';
        if (paymentSection) paymentSection.style.display = 'none';
    }

    loadCourseOptions(batchName) {
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const batchCourses = courses.filter(course => course.batch === batchName);
        
        const courseSelect = document.getElementById('course-select');
        if (!courseSelect) return;

        courseSelect.innerHTML = '<option value="">Select Course</option>';
        batchCourses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.name;
            option.textContent = course.name;
            courseSelect.appendChild(option);
        });
    }

    updateMonthOptions() {
        const courseSelect = document.getElementById('course-select');
        const monthSelect = document.getElementById('month-select');
        
        if (!courseSelect || !monthSelect) return;

        const selectedCourse = courseSelect.value;
        if (!selectedCourse) {
            monthSelect.innerHTML = '<option value="">Select Month</option>';
            return;
        }

        const months = JSON.parse(localStorage.getItem('months') || '[]');
        const courseMonths = months.filter(month => month.course === selectedCourse);
        
        // Get student ID to check paid months
        const studentId = document.getElementById('student-id-search').value;
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        const paidMonths = payments
            .filter(payment => payment.studentId === studentId && payment.course === selectedCourse)
            .map(payment => payment.month);

        monthSelect.innerHTML = '<option value="">Select Month</option>';
        courseMonths.forEach(month => {
            if (!paidMonths.includes(month.name)) {
                const option = document.createElement('option');
                option.value = month.name;
                option.textContent = month.name;
                option.dataset.amount = month.payment;
                monthSelect.appendChild(option);
            }
        });
    }

    calculateAmount() {
        const monthSelect = document.getElementById('month-select');
        const amountInput = document.getElementById('amount');
        
        if (!monthSelect || !amountInput) return;

        const selectedOptions = Array.from(monthSelect.selectedOptions);
        let totalAmount = 0;

        selectedOptions.forEach(option => {
            totalAmount += parseFloat(option.dataset.amount || 0);
        });

        amountInput.value = totalAmount;
    }

    processPayment() {
        const studentId = document.getElementById('student-id-search').value;
        const course = document.getElementById('course-select').value;
        const monthSelect = document.getElementById('month-select');
        const amount = document.getElementById('amount').value;
        const paid = document.getElementById('paid').value;
        const reference = document.getElementById('reference').value;
        const receivedBy = document.getElementById('received-by').value;

        if (!studentId || !course || !monthSelect.value || !amount || !paid || !receivedBy) {
            this.showMessage('Please fill all required fields', 'error');
            return;
        }

        const selectedMonths = Array.from(monthSelect.selectedOptions).map(option => option.value);
        const due = parseFloat(amount) - parseFloat(paid);

        const payment = {
            id: 'PAY' + Date.now(),
            studentId,
            course,
            months: selectedMonths,
            amount: parseFloat(amount),
            paid: parseFloat(paid),
            due,
            reference,
            receivedBy,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };

        // Save payment for each month
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        selectedMonths.forEach(month => {
            payments.push({
                ...payment,
                month,
                id: 'PAY' + Date.now() + '_' + month
            });
        });

        localStorage.setItem('payments', JSON.stringify(payments));

        this.showMessage('Payment processed successfully!', 'success');
        this.generateInvoice(payment);
        this.resetPaymentForm();
    }

    generateInvoice(payment) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const student = students.find(s => s.id === payment.studentId);
        
        if (!student) return;

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

    resetPaymentForm() {
        const form = document.getElementById('payment-form');
        if (form) {
            form.reset();
        }
        this.hideStudentInfo();
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.feePaymentManager = new FeePaymentManager();
});