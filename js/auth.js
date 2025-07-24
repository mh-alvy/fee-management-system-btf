// Authentication System
class AuthManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = null;
        this.initializeDefaultUsers();
    }

    initializeDefaultUsers() {
        const defaultUsers = [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'manager', password: 'manager123', role: 'manager' },
            { username: 'developer', password: 'dev123', role: 'developer' }
        ];

        defaultUsers.forEach(user => {
            if (!this.users.find(u => u.username === user.username)) {
                this.users.push({ ...user, id: this.generateId() });
            }
        });

        this.saveUsers();
    }

    loadUsers() {
        return JSON.parse(localStorage.getItem('btf_users') || '[]');
    }

    saveUsers() {
        localStorage.setItem('btf_users', JSON.stringify(this.users));
    }

    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    login(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('btf_current_user', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid credentials' };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('btf_current_user');
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const stored = localStorage.getItem('btf_current_user');
            if (stored) {
                this.currentUser = JSON.parse(stored);
            }
        }
        return this.currentUser;
    }

    hasPermission(requiredRoles) {
        if (!this.currentUser) return false;
        if (!requiredRoles || requiredRoles.length === 0) return true;
        return requiredRoles.includes(this.currentUser.role);
    }

    addUser(username, password, role) {
        if (this.users.find(u => u.username === username)) {
            return { success: false, message: 'Username already exists' };
        }

        const newUser = {
            id: this.generateId(),
            username,
            password,
            role
        };

        this.users.push(newUser);
        this.saveUsers();
        return { success: true, user: newUser };
    }

    updateUser(id, updates) {
        const userIndex = this.users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }

        // Check if username already exists (for other users)
        if (updates.username && this.users.find(u => u.username === updates.username && u.id !== id)) {
            return { success: false, message: 'Username already exists' };
        }

        this.users[userIndex] = { ...this.users[userIndex], ...updates };
        this.saveUsers();
        return { success: true, user: this.users[userIndex] };
    }

    deleteUser(id) {
        const userIndex = this.users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }

        // Prevent deleting the last developer
        const user = this.users[userIndex];
        if (user.role === 'developer') {
            const developerCount = this.users.filter(u => u.role === 'developer').length;
            if (developerCount <= 1) {
                return { success: false, message: 'Cannot delete the last developer account' };
            }
        }

        this.users.splice(userIndex, 1);
        this.saveUsers();
        return { success: true };
    }

    getAllUsers() {
        return this.users.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role
        }));
    }
}

// Global auth manager instance
window.authManager = new AuthManager();