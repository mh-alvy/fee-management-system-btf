// Navigation Manager
class NavigationManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.bindEvents();
        this.setupRoleBasedNavigation();
    }

    bindEvents() {
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                if (page) {
                    this.navigateTo(page);
                }
            });
        });

        // Modal close events
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    navigateTo(page) {
        // Check permissions
        const navItem = document.querySelector(`[data-page="${page}"]`);
        const requiredRoles = navItem?.dataset.roles?.split(',') || [];
        
        if (!window.authManager.hasPermission(requiredRoles)) {
            Utils.showToast('You do not have permission to access this page', 'error');
            return;
        }

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(page);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;

            // Update navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            navItem?.classList.add('active');

            // Refresh page content if needed
            this.refreshPageContent(page);
        }
    }

    refreshPageContent(page) {
        switch (page) {
            case 'dashboard':
                window.dashboardManager?.refresh();
                break;
            case 'manage-batch':
                window.batchManager?.refresh();
                break;
            case 'manage-students':
                window.studentManager?.refresh();
                break;
            case 'pay-fee':
                window.feePaymentManager?.refresh();
                break;
            case 'reports':
                window.reportsManager?.refresh();
                break;
            case 'user-management':
                window.userManagementManager?.refresh();
                break;
        }
    }

    setupRoleBasedNavigation() {
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        document.querySelectorAll('[data-roles]').forEach(element => {
            const requiredRoles = element.dataset.roles.split(',');
            if (!window.authManager.hasPermission(requiredRoles)) {
                element.style.display = 'none';
            } else {
                element.style.display = '';
            }
        });

        // Update user info
        document.getElementById('currentUser').textContent = `${currentUser.username} (${currentUser.role})`;
    }

    showModal(modalId, title = '', content = '') {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (title) {
                const titleElement = modal.querySelector('.modal-header h3, .modal-header h2');
                if (titleElement) titleElement.textContent = title;
            }

            if (content) {
                const bodyElement = modal.querySelector('.modal-content > div:not(.modal-header)');
                if (bodyElement) bodyElement.innerHTML = content;
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('btf_theme', newTheme);

        // Update theme toggle button
        const toggleBtn = document.getElementById('themeToggle');
        toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌓';
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('btf_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const toggleBtn = document.getElementById('themeToggle');
        toggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌓';
    }

    logout() {
        Utils.confirm('Are you sure you want to logout?', () => {
            window.authManager.logout();
            this.showLoginModal();
        });
    }

    showLoginModal() {
        document.getElementById('app').style.display = 'none';
        document.getElementById('loginModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideLoginModal() {
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('app').style.display = 'flex';
        document.body.style.overflow = '';
        this.setupRoleBasedNavigation();
        this.navigateTo('dashboard');
    }
}

// Global navigation manager instance
window.navigationManager = new NavigationManager();