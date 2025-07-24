// Main application initialization
class App {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Initialize theme
        this.initializeTheme();
        
        // Check for existing user session
        this.checkUserSession();
        
        // Initialize login form
        this.initializeLoginForm();
        
        // Initialize theme toggle
        this.initializeThemeToggle();
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';
        }
    }

    initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
            });
        }
    }

    checkUserSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showLoginModal();
        }
    }

    initializeLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    handleLogin() {
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;

        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        // Get users from storage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showMainApp();
        } else {
            this.showError('Invalid username or password');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    }

    showLoginModal() {
        const loginModal = document.getElementById('login-modal');
        const mainApp = document.getElementById('main-app');
        
        if (loginModal) loginModal.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
    }

    showMainApp() {
        const loginModal = document.getElementById('login-modal');
        const mainApp = document.getElementById('main-app');
        
        if (loginModal) loginModal.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';

        // Initialize navigation and other components
        if (window.NavigationManager) {
            new NavigationManager(this.currentUser);
        }

        // Initialize dashboard
        if (window.DashboardManager) {
            new DashboardManager();
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLoginModal();
        
        // Clear any active managers
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<div class="welcome-message"><h2>Welcome to Break The Fear</h2><p>Please select an option from the menu.</p></div>';
        }
    }
}

// Initialize default users if none exist
function initializeDefaultUsers() {
    const existingUsers = localStorage.getItem('users');
    if (!existingUsers) {
        const defaultUsers = [
            {
                id: 'admin-001',
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                name: 'System Administrator',
                createdAt: new Date().toISOString()
            },
            {
                id: 'dev-001',
                username: 'developer',
                password: 'dev123',
                role: 'developer',
                name: 'System Developer',
                createdAt: new Date().toISOString()
            },
            {
                id: 'mgr-001',
                username: 'manager',
                password: 'mgr123',
                role: 'manager',
                name: 'System Manager',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
}

// Global logout function
window.logout = function() {
    if (window.app) {
        window.app.logout();
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultUsers();
    window.app = new App();
});