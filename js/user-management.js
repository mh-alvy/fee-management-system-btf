class UserManagementManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.init();
    }

    init() {
        this.bindEvents();
        this.refresh();
    }

    bindEvents() {
        const createUserForm = document.getElementById('create-user-form');
        if (createUserForm) {
            createUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createUser();
            });
        }
    }

    refresh() {
        this.loadUsers();
    }

    loadUsers() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const usersList = document.getElementById('users-list');
        
        if (!usersList) return;

        if (users.length === 0) {
            usersList.innerHTML = '<p class="no-data">No users found</p>';
            return;
        }

        usersList.innerHTML = users.map(user => {
            const canEdit = this.currentUser && (
                this.currentUser.role === 'Developer' || 
                (this.currentUser.role === 'Admin' && user.role !== 'Developer') ||
                this.currentUser.id === user.id
            );

            return `
                <div class="user-card">
                    <div class="user-info">
                        <h3>${user.username}</h3>
                        <p><strong>Role:</strong> ${user.role}</p>
                        <p><strong>Created:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
                        ${user.lastLogin ? `<p><strong>Last Login:</strong> ${new Date(user.lastLogin).toLocaleDateString()}</p>` : ''}
                    </div>
                    <div class="user-actions">
                        ${canEdit ? `
                            <button onclick="userManagementManager.editUser('${user.id}')" class="btn btn-secondary">Edit</button>
                            ${this.currentUser.role === 'Developer' && user.id !== this.currentUser.id ? 
                                `<button onclick="userManagementManager.deleteUser('${user.id}')" class="btn btn-danger">Delete</button>` : ''
                            }
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    createUser() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const role = document.getElementById('role').value;

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