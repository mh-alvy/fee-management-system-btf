class UserManagementManager {
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
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addUser();
            });
        }
    }

    refresh() {
        this.displayUsers();
    }

    displayUsers() {
        const users = window.authManager.getAllUsers();
        const usersList = document.getElementById('usersList');
        
        if (!usersList) return;

        if (users.length === 0) {
            usersList.innerHTML = '<p class="text-center">No users found</p>';
            return;
        }

        const currentUser = window.authManager.getCurrentUser();
        
        usersList.innerHTML = users.map(user => `
            <div class="user-item">
                <div class="user-info">
                    <h4>${user.username}</h4>
                    <span class="user-role ${user.role.toLowerCase()}">${user.role}</span>
                </div>
                <div class="user-actions">
                    ${this.canManageUser(currentUser, user) ? `
                        <button class="btn btn-small btn-outline" onclick="userManagementManager.editUser('${user.id}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="userManagementManager.deleteUser('${user.id}')">Delete</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    canManageUser(currentUser, targetUser) {
        if (!currentUser || currentUser.role !== 'developer') return false;
        if (currentUser.id === targetUser.id) return false; // Can't manage self
        return true;
    }

    addUser() {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        const role = document.getElementById('newUserRole').value;

        if (!username || !password || !role) {
            Utils.showToast('Please fill all fields', 'error');
            return;
        }

        const result = window.authManager.addUser(username, password, role);
        
        if (result.success) {
            Utils.showToast('User created successfully!', 'success');
            document.getElementById('addUserForm').reset();
            this.refresh();
        } else {
            Utils.showToast(result.message, 'error');
        }
    }

    editUser(userId) {
        const users = window.authManager.getAllUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            Utils.showToast('User not found', 'error');
            return;
        }

        const editForm = `
            <form id="editUserForm">
                <div class="form-group">
                    <label for="editUsername">Username</label>
                    <input type="text" id="editUsername" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label for="editPassword">New Password (leave blank to keep current)</label>
                    <input type="password" id="editPassword">
                </div>
                <div class="form-group">
                    <label for="editRole">Role</label>
                    <select id="editRole" required>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                        <option value="developer" ${user.role === 'developer' ? 'selected' : ''}>Developer</option>
                    </select>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Update User</button>
                    <button type="button" class="btn btn-outline" onclick="navigationManager.closeModal(document.getElementById('editModal'))">Cancel</button>
                </div>
            </form>
        `;

        window.navigationManager.showModal('editModal', 'Edit User', editForm);

        document.getElementById('editUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateUser(userId);
        });
    }

    updateUser(userId) {
        const username = document.getElementById('editUsername').value.trim();
        const password = document.getElementById('editPassword').value.trim();
        const role = document.getElementById('editRole').value;

        if (!username || !role) {
            Utils.showToast('Please fill all required fields', 'error');
            return;
        }

        const updates = { username, role };
        if (password) {
            updates.password = password;
        }

        const result = window.authManager.updateUser(userId, updates);
        
        if (result.success) {
            Utils.showToast('User updated successfully!', 'success');
            window.navigationManager.closeModal(document.getElementById('editModal'));
            this.refresh();
        } else {
            Utils.showToast(result.message, 'error');
        }
    }

    deleteUser(userId) {
        const users = window.authManager.getAllUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            Utils.showToast('User not found', 'error');
            return;
        }

        Utils.confirm(`Are you sure you want to delete user "${user.username}"?`, () => {
            const result = window.authManager.deleteUser(userId);
            
            if (result.success) {
                Utils.showToast('User deleted successfully!', 'success');
                this.refresh();
            } else {
                Utils.showToast(result.message, 'error');
            }
        }).join('');
    }
}

// Global user management manager instance
window.userManagementManager = new UserManagementManager();


        if (!username || !password || !role) {
            this.showMessage('Please fill all fields', 'error');
            return;
        }

        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some(user => user.username === username)) {
            this.showMessage('Username already exists', 'error');
            return;
        }

        // Check permissions
        if (!this.canCreateRole(role)) {
            this.showMessage('You do not have permission to create this role', 'error');
            return;
        }

        const newUser = {
            id: 'USER' + Date.now(),
            username,
            password, // In production, this should be hashed
            role,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser ? this.currentUser.id : 'system'
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        this.showMessage('User created successfully!', 'success');
        document.getElementById('create-user-form').reset();
        this.refresh();
    }

    canCreateRole(role) {
        if (!this.currentUser) return false;
        
        switch (this.currentUser.role) {
            case 'Developer':
                return true; // Can create any role
            case 'Admin':
                return role !== 'Developer'; // Cannot create Developer
            default:
                return false; // Manager cannot create users
        }
    }

    editUser(userId) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            this.showMessage('User not found', 'error');
            return;
        }

        // Create edit form
        const editForm = document.createElement('div');
        editForm.className = 'modal';
        editForm.innerHTML = `
            <div class="modal-content">
                <h3>Edit User</h3>
                <form id="edit-user-form">
                    <div class="form-group">
                        <label for="edit-username">Username:</label>
                        <input type="text" id="edit-username" value="${user.username}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-password">New Password (leave blank to keep current):</label>
                        <input type="password" id="edit-password">
                    </div>
                    <div class="form-group">
                        <label for="edit-role">Role:</label>
                        <select id="edit-role" required>
                            <option value="Manager" ${user.role === 'Manager' ? 'selected' : ''}>Manager</option>
                            <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                            ${this.currentUser.role === 'Developer' ? 
                                `<option value="Developer" ${user.role === 'Developer' ? 'selected' : ''}>Developer</option>` : ''
                            }
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Update User</button>
                        <button type="button" onclick="this.closest('.modal').remove()" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(editForm);

        editForm.querySelector('#edit-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateUser(userId, editForm);
        });
    }

    updateUser(userId, editForm) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            this.showMessage('User not found', 'error');
            return;
        }

        const username = editForm.querySelector('#edit-username').value.trim();
        const password = editForm.querySelector('#edit-password').value.trim();
        const role = editForm.querySelector('#edit-role').value;

        if (!username || !role) {
            this.showMessage('Please fill all required fields', 'error');
            return;
        }

        // Check if username is taken by another user
        if (users.some(user => user.username === username && user.id !== userId)) {
            this.showMessage('Username already exists', 'error');
            return;
        }

        // Update user
        users[userIndex].username = username;
        users[userIndex].role = role;
        if (password) {
            users[userIndex].password = password;
        }
        users[userIndex].updatedAt = new Date().toISOString();

        localStorage.setItem('users', JSON.stringify(users));

        this.showMessage('User updated successfully!', 'success');
        editForm.remove();
        this.refresh();
    }

    deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const filteredUsers = users.filter(user => user.id !== userId);
        
        localStorage.setItem('users', JSON.stringify(filteredUsers));
        
        this.showMessage('User deleted successfully!', 'success');
        this.refresh();
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
    window.userManagementManager = new UserManagementManager();
});