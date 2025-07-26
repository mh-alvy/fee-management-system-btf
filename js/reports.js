// Reports Management
class ReportsManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCourseDropdown();
    }

    bindEvents() {
        // Generate Report Button
        document.getElementById('generateReport').addEventListener('click', () => {
            this.generateReport();
        });

        // Report Type Change
        document.getElementById('reportType').addEventListener('change', () => {
            this.updateDateFields();
        });

        // Course Change for Month Filter
        document.getElementById('reportCourse').addEventListener('change', () => {
            this.updateMonthFilter();
        });
    }

    updateDateFields() {
        const reportType = document.getElementById('reportType').value;
        const dateField = document.getElementById('reportDate');
        
        switch (reportType) {
            case 'date':
                dateField.type = 'date';
                dateField.style.display = 'block';
                break;
            case 'week':
                dateField.type = 'week';
                dateField.style.display = 'block';
                break;
            case 'month':
                dateField.type = 'month';
                dateField.style.display = 'block';
                break;
            case 'course':
                dateField.style.display = 'none';
                break;
        }
    }

    updateCourseDropdown() {
        const courseSelect = document.getElementById('reportCourse');
        const courses = window.storageManager.getCourses();
        
        courseSelect.innerHTML = '<option value="">All Courses</option>' +
            courses.map(course => {
                const batch = window.storageManager.getBatchById(course.batchId);
                return `<option value="${course.id}">${course.name} (${batch?.name || 'Unknown Batch'})</option>`;
            }).join('');
    }

    updateMonthFilter() {
        const reportType = document.getElementById('reportType').value;
        const selectedCourse = document.getElementById('reportCourse').value;
        
        // Only show month filter when report type is 'month' and a course is selected
        let monthFilterHtml = '';
        if (reportType === 'month' && selectedCourse) {
            const months = window.storageManager.getMonthsByCourse(selectedCourse)
                .sort((a, b) => (a.monthNumber || 0) - (b.monthNumber || 0));
            
            if (months.length > 0) {
                monthFilterHtml = `
                    <div class="form-group">
                        <label for="reportMonth">Select Month</label>
                        <select id="reportMonth">
                            <option value="">All Months</option>
                            ${months.map(month => 
                                `<option value="${month.id}">${month.name} (${Utils.formatCurrency(month.payment)})</option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            }
        }
        
        // Update the filter group to include month filter
        const filterGroup = document.querySelector('.filter-group');
        const existingMonthFilter = document.getElementById('reportMonth');
        if (existingMonthFilter) {
            existingMonthFilter.closest('.form-group').remove();
        }
        
        if (monthFilterHtml) {
            const generateButton = document.getElementById('generateReport');
            generateButton.insertAdjacentHTML('beforebegin', monthFilterHtml);
        }
    }

    generateReport() {
        const reportType = document.getElementById('reportType').value;
        const reportDate = document.getElementById('reportDate').value;
        const reportCourse = document.getElementById('reportCourse').value;
        const reportMonth = document.getElementById('reportMonth')?.value;

        let filteredPayments = window.storageManager.getPayments();

        // Apply filters based on report type
        switch (reportType) {
            case 'date':
                if (reportDate) {
                    filteredPayments = this.filterByDate(filteredPayments, new Date(reportDate));
                }
                break;
            case 'week':
                if (reportDate) {
                    filteredPayments = this.filterByWeek(filteredPayments, new Date(reportDate));
                }
                break;
            case 'month':
                if (reportDate) {
                    filteredPayments = this.filterByMonth(filteredPayments, new Date(reportDate));
                }
                // Additional filter by specific month if selected
                if (reportMonth) {
                    filteredPayments = this.filterBySpecificMonth(filteredPayments, reportMonth);
                }
                break;
            case 'course':
                if (reportCourse) {
                    filteredPayments = this.filterByCourse(filteredPayments, reportCourse);
                }
                break;
        }

        this.displayReport(filteredPayments, reportType, reportDate, reportCourse);
    }

    filterByDate(payments, targetDate) {
        return payments.filter(payment => {
            const paymentDate = new Date(payment.createdAt);
            return paymentDate.toDateString() === targetDate.toDateString();
        });
    }

    filterByWeek(payments, targetDate) {
        const weekRange = Utils.getWeekRange(targetDate);
        return payments.filter(payment => {
            const paymentDate = new Date(payment.createdAt);
            return Utils.isDateInRange(paymentDate, weekRange.start, weekRange.end);
        });
    }

    filterByMonth(payments, targetDate) {
        const monthRange = Utils.getMonthRange(targetDate);
        return payments.filter(payment => {
            const paymentDate = new Date(payment.createdAt);
            return Utils.isDateInRange(paymentDate, monthRange.start, monthRange.end);
        });
    }

    filterByCourse(payments, courseId) {
        return payments.filter(payment => 
            payment.courses.includes(courseId)
        );
    }

    filterBySpecificMonth(payments, monthId) {
        return payments.filter(payment => 
            payment.months.includes(monthId)
        );
    }

    displayReport(payments, reportType, reportDate, reportCourse) {
        const reportResults = document.getElementById('reportResults');
        
        if (payments.length === 0) {
            reportResults.innerHTML = `
                <div class="text-center">
                    <h3>No payments found for the selected criteria</h3>
                    <p>Try adjusting your filters and generate the report again.</p>
                </div>
            `;
            return;
        }

        // Calculate summary
        const totalPayments = payments.length;
        const totalAmount = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
        const totalDue = payments.reduce((sum, payment) => sum + payment.dueAmount, 0);
        const averagePayment = totalAmount / totalPayments;

        // Get report title
        const reportTitle = this.getReportTitle(reportType, reportDate, reportCourse);

        const reportHtml = `
            <div class="report-header">
                <h3>${reportTitle}</h3>
                <div class="report-actions">
                    <button class="btn btn-outline" onclick="reportsManager.exportReport(${JSON.stringify(payments).replace(/"/g, '&quot;')})">
                        Export CSV
                    </button>
                    <button class="btn btn-outline" onclick="reportsManager.printReport()">
                        Print Report
                    </button>
                </div>
            </div>

            <div class="report-summary">
                <div class="summary-item">
                    <div class="summary-label">Total Payments</div>
                    <div class="summary-value">${totalPayments}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Amount</div>
                    <div class="summary-value">${Utils.formatCurrency(totalAmount)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Due</div>
                    <div class="summary-value">${Utils.formatCurrency(totalDue)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Average Payment</div>
                    <div class="summary-value">${Utils.formatCurrency(averagePayment)}</div>
                </div>
            </div>

            <div class="payment-list">
                ${payments.map(payment => this.renderPaymentItem(payment)).join('')}
            </div>
        `;

        reportResults.innerHTML = reportHtml;
    }

    getReportTitle(reportType, reportDate, reportCourse) {
        switch (reportType) {
            case 'date':
                return `Payments Report - ${reportDate ? Utils.formatDate(reportDate) : 'All Dates'}`;
            case 'week':
                if (reportDate) {
                    const weekRange = Utils.getWeekRange(new Date(reportDate));
                    return `Weekly Report - ${Utils.formatDate(weekRange.start)} to ${Utils.formatDate(weekRange.end)}`;
                }
                return 'Weekly Report - All Weeks';
            case 'month':
                if (reportDate) {
                    const monthRange = Utils.getMonthRange(new Date(reportDate));
                    return `Monthly Report - ${monthRange.start.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
                }
                return 'Monthly Report - All Months';
            case 'course':
                if (reportCourse) {
                    const course = window.storageManager.getCourseById(reportCourse);
                    const batch = course ? window.storageManager.getBatchById(course.batchId) : null;
                    return `Course Report - ${course?.name || 'Unknown'} (${batch?.name || 'Unknown Batch'})`;
                }
                return 'Course Report - All Courses';
            default:
                return 'Payments Report';
        }
    }

    renderPaymentItem(payment) {
        const courseNames = payment.courses.map(courseId => {
            const course = window.storageManager.getCourseById(courseId);
            return course?.name || 'Unknown';
        }).join(', ');

        const monthNames = payment.months.map(monthId => {
            const month = window.storageManager.getMonthById(monthId);
            return month?.name || 'Unknown';
        }).join(', ');

        return `
            <div class="payment-item">
                <div class="detail-item">
                    <div class="detail-label">Invoice</div>
                    <div class="detail-value">${payment.invoiceNumber}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Student</div>
                    <div class="detail-value">${payment.studentName} (${payment.studentStudentId})</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Courses</div>
                    <div class="detail-value">${courseNames}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Months</div>
                    <div class="detail-value">${monthNames}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Paid Amount</div>
                    <div class="detail-value">${Utils.formatCurrency(payment.paidAmount)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Due Amount</div>
                    <div class="detail-value">${Utils.formatCurrency(payment.dueAmount)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Received By</div>
                    <div class="detail-value">${payment.receivedBy}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${Utils.formatDateTime(payment.createdAt)}</div>
                </div>
            </div>
        `;
    }

    exportReport(payments) {
        const exportData = payments.map(payment => {
            const courseNames = payment.courses.map(courseId => {
                const course = window.storageManager.getCourseById(courseId);
                return course?.name || 'Unknown';
            }).join(', ');

            const monthNames = payment.months.map(monthId => {
                const month = window.storageManager.getMonthById(monthId);
                return month?.name || 'Unknown';
            }).join(', ');

            return {
                'Invoice Number': payment.invoiceNumber,
                'Student Name': payment.studentName,
                'Student ID': payment.studentStudentId,
                'Courses': courseNames,
                'Months': monthNames,
                'Total Amount': payment.totalAmount,
                'Paid Amount': payment.paidAmount,
                'Due Amount': payment.dueAmount,
                'Reference': payment.reference || '',
                'Received By': payment.receivedBy,
                'Date': Utils.formatDateTime(payment.createdAt)
            };
        });

        const filename = `payments_report_${new Date().toISOString().split('T')[0]}.csv`;
        Utils.exportToCSV(exportData, filename);
    }

    printReport() {
        const reportResults = document.getElementById('reportResults');
        Utils.printElement(reportResults);
    }

    refresh() {
        this.updateCourseDropdown();
        // Clear previous results
        document.getElementById('reportResults').innerHTML = '';
        
        // Reset form
        document.getElementById('reportDate').value = '';
        document.getElementById('reportCourse').value = '';
        document.getElementById('reportType').value = 'date';
        this.updateDateFields();
    }
}

// Global reports manager instance
window.reportsManager = new ReportsManager();