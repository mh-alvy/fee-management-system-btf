// Invoice Management
class InvoiceManager {
    constructor() {
        this.init();
    }

    init() {
        // Invoice functionality is ready
    }

    generateInvoice(payment) {
        const student = window.storageManager.getStudentById(payment.studentId);
        const institution = student ? window.storageManager.getInstitutionById(student.institutionId) : null;
        const batch = student ? window.storageManager.getBatchById(student.batchId) : null;

        // Get course and month details
        const courseDetails = payment.courses.map(courseId => {
            const course = window.storageManager.getCourseById(courseId);
            return course || { name: 'Unknown Course' };
        });

        const monthDetails = payment.months.map(monthId => {
            const month = window.storageManager.getMonthById(monthId);
            const course = month ? window.storageManager.getCourseById(month.courseId) : null;
            return {
                name: month?.name || 'Unknown Month',
                payment: month?.payment || 0,
                courseName: course?.name || 'Unknown Course'
            };
        });

        const invoiceHtml = this.createInvoiceHTML(payment, student, institution, batch, courseDetails, monthDetails);
        
        window.navigationManager.showModal('invoiceModal', 'Invoice', invoiceHtml);
    }

    createInvoiceHTML(payment, student, institution, batch, courseDetails, monthDetails) {
        return `
            <div class="invoice-container">
                <div class="invoice-header">
                    <div class="company-info">
                        <h1>Break The Fear</h1>
                        <p>Fee Management System</p>
                        <p>Professional Coaching Center</p>
                        <p>Email: info@breakthefear.com</p>
                        <p>Phone: +880 1XXX-XXXXXX</p>
                    </div>
                    <div class="invoice-meta">
                        <h2>INVOICE</h2>
                        <p><strong>Invoice #:</strong> ${payment.invoiceNumber}</p>
                        <p><strong>Date:</strong> ${Utils.formatDate(payment.createdAt)}</p>
                        <p><strong>Time:</strong> ${Utils.formatTime(payment.createdAt)}</p>
                    </div>
                </div>

                <div class="invoice-details">
                    <div class="invoice-to">
                        <h3>Bill To:</h3>
                        <p><strong>${student?.name || 'Unknown Student'}</strong></p>
                        <p>Student ID: ${student?.studentId || 'Unknown'}</p>
                        <p>Phone: ${student?.phone || 'N/A'}</p>
                        <p>Institution: ${institution?.name || 'Unknown'}</p>
                        <p>Batch: ${batch?.name || 'Unknown'}</p>
                    </div>
                    <div class="invoice-info">
                        <h3>Payment Details:</h3>
                        <p><strong>Received By:</strong> ${payment.receivedBy}</p>
                        <p><strong>Reference:</strong> ${payment.reference || 'N/A'}</p>
                        <p><strong>Guardian:</strong> ${student?.guardianName || 'N/A'}</p>
                        <p><strong>Guardian Phone:</strong> ${student?.guardianPhone || 'N/A'}</p>
                    </div>
                </div>

                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Course</th>
                            <th class="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${monthDetails.map(month => `
                            <tr>
                                <td>${month.name}</td>
                                <td>${month.courseName}</td>
                                <td class="text-right">${Utils.formatCurrency(month.payment)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="invoice-total">
                    <div class="total-section">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${Utils.formatCurrency(payment.totalAmount)}</span>
                        </div>
                        <div class="total-row">
                            <span>Paid Amount:</span>
                            <span>${Utils.formatCurrency(payment.paidAmount)}</span>
                        </div>
                        <div class="total-row">
                            <span>Due Amount:</span>
                            <span>${Utils.formatCurrency(payment.dueAmount)}</span>
                        </div>
                        <div class="total-row final">
                            <span>Total Received:</span>
                            <span>${Utils.formatCurrency(payment.paidAmount)}</span>
                        </div>
                    </div>
                </div>

                <div class="invoice-footer">
                    <p>Thank you for your payment!</p>
                    <p>This is a computer-generated invoice and does not require a signature.</p>
                    <div style="margin-top: 20px;">
                        <button class="btn btn-primary" onclick="invoiceManager.printInvoice()">Print Invoice</button>
                        <button class="btn btn-outline" onclick="navigationManager.closeModal(document.getElementById('invoiceModal'))">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    printInvoice() {
        const invoiceContent = document.querySelector('.invoice-container');
        if (invoiceContent) {
            Utils.printElement(invoiceContent);
        }
    }
}

// Global invoice manager instance
window.invoiceManager = new InvoiceManager();