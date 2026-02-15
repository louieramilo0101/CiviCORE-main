// ==========================================
// ACCOUNTS - User Management
// ==========================================

// --- Load Accounts List ---
function loadAccounts() {
    const list = document.getElementById('accountsList');
    const accountsSidebar = document.querySelector('.accounts-sidebar');
    const permissionsSection = document.querySelector('#accountsPage > div:last-child');
    
    if (!list) return;
    list.innerHTML = '';
    
    // Get users based on role - Super Admin sees all, others only see themselves
    let users;
    if (currentUser.role === 'Super Admin') {
        users = db.getAllUsers();
        // Show the user accounts list for Super Admin
        if (accountsSidebar) accountsSidebar.style.display = 'block';
        // Show permissions section for Super Admin
        if (permissionsSection) permissionsSection.style.display = 'block';
    } else {
        // Non-Super Admin users can only see their own account
        users = [currentUser];
        // Hide the user accounts list for non-Super Admin
        if (accountsSidebar) accountsSidebar.style.display = 'none';
        // Hide permissions section for non-Super Admin
        if (permissionsSection) permissionsSection.style.display = 'none';
    }
    
    users.forEach((user) => {
        const item = document.createElement('div');
        item.className = 'account-item';
        item.innerHTML = `<div class="account-name">${user.name}</div><div class="account-role">${user.role}</div>`;
        item.addEventListener('click', () => displayAccountDetails(user));
        list.appendChild(item);
    });
    
    // Show the currently logged-in user's details by default
    if(users.length > 0) {
        const currentUserInList = users.find(u => u.id === currentUser.id);
        displayAccountDetails(currentUserInList || users[0]);
    }
}

// --- Display Account Details ---
function displayAccountDetails(user) {
    const container = document.getElementById('accountDetailsContainer');
    if(!container) return;
    
    // Permission Checks
    const isSelf = currentUser.id === user.id;
    const canManage = currentUser.permissions.includes('Manage Users');
    
    let buttons = '';
    if(isSelf || canManage) {
        buttons += `<button class="btn-small" onclick="openChangePasswordModal(${user.id})">Change Password</button>`;
    }
    if(canManage && currentUser.role === 'Super Admin') {
        buttons += `<button class="btn-small" onclick="openChangeRoleModal(${user.id})" style="background: #f39c12; color: white; margin-left: 5px;">Change Role</button>`;
        buttons += `<button class="btn-small" onclick="editUserPermissions(${user.id})" style="background: #e74c3c; color: white; margin-left: 5px;">Edit Permissions</button>`;
    }

    container.innerHTML = `
        <div class="detail-field"><label>Name:</label> ${user.name}</div>
        <div class="detail-field"><label>Email:</label> ${user.email}</div>
        <div class="detail-field"><label>Role:</label> ${user.role}</div>
        <div style="margin-top: 15px;">${buttons}</div>
    `;
}

// --- Open Change Password Modal ---
function openChangePasswordModal(userId) {
    // First try to get user from currentUser (if changing own password)
    let user = null;
    
    if (currentUser && currentUser.id === userId) {
        user = currentUser;
    } else {
        // For Super Admin changing other users' passwords, try to find in localStorage
        user = db.getUserById(userId);
    }
    
    if (!user) {
        alert('User not found. Please refresh the page and try again.');
        return;
    }

    // Create modal HTML
    const modalHTML = `
        <div id="changePasswordModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 10px; max-width: 400px; width: 100%; padding: 30px; position: relative;">
                <button onclick="closeChangePasswordModal()" style="position: absolute; top: 15px; right: 15px; border: none; background: none; font-size: 20px; cursor: pointer;">✕</button>
                
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; color: var(--primary-color);">Change Password</h2>
                
                <p style="margin-bottom: 20px; color: #666;">Changing password for: <strong>${user.name}</strong></p>
                
                <form id="changePasswordForm" onsubmit="handleChangePassword(event, ${user.id})">
                    <div class="form-field">
                        <label>Current Password *</label>
                        <input type="password" id="currentPassword" placeholder="Enter current password" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                    </div>
                    
                    <div class="form-field" style="margin-top: 15px;">
                        <label>New Password *</label>
                        <input type="password" id="newPassword" placeholder="Enter new password" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                    </div>
                    
                    <div class="form-field" style="margin-top: 15px;">
                        <label>Confirm New Password *</label>
                        <input type="password" id="confirmPassword" placeholder="Confirm new password" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button type="submit" class="btn-primary" style="flex: 1; background: var(--success-color);">Change Password</button>
                        <button type="button" onclick="closeChangePasswordModal()" class="btn-primary" style="flex: 1; background: #95a5a6;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existing = document.getElementById('changePasswordModal');
    if (existing) existing.remove();
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// --- Close Change Password Modal ---
function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) modal.remove();
}

// --- Handle Change Password Form Submission ---
async function handleChangePassword(event, userId) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New password and confirm password do not match');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: userId, 
                currentPassword: currentPassword, 
                newPassword: newPassword 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Password changed successfully!');
            closeChangePasswordModal();
        } else {
            alert(data.message || 'Failed to change password. Please try again.');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Failed to connect to server. Make sure the server is running.');
    }
}

// --- Open Add User Modal ---
function openAddUserModal() {
    // Check if user has permission to manage users
    if (!currentUser.permissions.includes('Manage Users')) {
        alert('You do not have permission to create new users.');
        return;
    }

    // Create modal HTML
    const modalHTML = `
        <div id="addUserModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 10px; max-width: 500px; width: 100%; padding: 30px; position: relative; max-height: 90vh; overflow-y: auto;">
                <button onclick="closeAddUserModal()" style="position: absolute; top: 15px; right: 15px; border: none; background: none; font-size: 20px; cursor: pointer;">✕</button>
                
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; color: var(--primary-color);">Add New User</h2>
                
                <form id="addUserForm" onsubmit="handleAddUser(event)">
                    <div class="form-field">
                        <label>Full Name *</label>
                        <input type="text" id="newUserName" placeholder="Enter full name" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                    </div>
                    
                    <div class="form-field" style="margin-top: 15px;">
                        <label>Email *</label>
                        <input type="email" id="newUserEmail" placeholder="Enter email address" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                    </div>
                    
                    <div class="form-field" style="margin-top: 15px;">
                        <label>Password *</label>
                        <input type="password" id="newUserPassword" placeholder="Enter password" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                    </div>
                    
                    <div class="form-field" style="margin-top: 15px;">
                        <label>Role *</label>
                        <select id="newUserRole" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                            <option value="">Select Role</option>
                            <option value="Super Admin">Super Admin</option>
                            <option value="Admin">Admin</option>
                            <option value="User">User</option>
                        </select>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button type="submit" class="btn-primary" style="flex: 1; background: var(--success-color);">Create User</button>
                        <button type="button" onclick="closeAddUserModal()" class="btn-primary" style="flex: 1; background: #95a5a6;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existing = document.getElementById('addUserModal');
    if (existing) existing.remove();
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// --- Close Add User Modal ---
function closeAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) modal.remove();
}

// --- Handle Add User Form Submission ---
async function handleAddUser(event) {
    event.preventDefault();
    
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    
    if (!name || !email || !password || !role) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/create-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('User created successfully!');
            closeAddUserModal();
            loadAccounts(); // Refresh the accounts list
            loadPermissions(); // Refresh permissions display
        } else {
            alert('Error: ' + (data.error || 'Failed to create user'));
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Failed to connect to server. Make sure the server is running.');
    }
}

// --- Open Change Role Modal ---
function openChangeRoleModal(userId) {
    const user = db.getUserById(userId);
    const newRole = prompt(`Current Role: ${user.role}\nEnter New Role (Super Admin, Admin, User):`);
    if(newRole) {
        user.role = newRole;
        db.updateUser(user);
        alert(`Role updated to ${newRole}`);
        loadAccounts();
    }
}

// --- Edit User Permissions ---
function editUserPermissions(userId) {
    const user = db.getUserById(userId);
    const allPerms = ['View Dashboard', 'Upload Documents', 'Manage Users', 'Mapping Analytics', 'View Issuance'];
    const newPerms = prompt(`Current Permissions: ${user.permissions.join(', ')}\nEnter new permissions (comma separated) from: ${allPerms.join(', ')}`);
    
    if(newPerms) {
        user.permissions = newPerms.split(',').map(s => s.trim());
        db.updateUser(user);
        alert('Permissions Updated');
        loadPermissions(); // Refresh UI
    }
}

// --- Load Permissions ---
function loadPermissions() {
    const container = document.getElementById('permissionsContainer');
    if(!container) return;
    container.innerHTML = '';
    
    // Super Admin sees all users' permissions, others only see their own
    let users;
    if (currentUser.role === 'Super Admin') {
        users = db.getAllUsers();
    } else {
        users = [currentUser];
    }
    
    users.forEach(user => {
        container.innerHTML += `
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
                <strong>${user.name}</strong> (${user.role})<br>
                <small>${user.permissions.join(', ')}</small>
            </div>
        `;
    });
}

// --- Template Editor (Super Admin Only) ---
function openTemplateEditor() {
    if(currentUser.role !== 'Super Admin') return;
    const templates = db.getTemplates();
    const type = prompt(`Enter template type to edit: ${Object.keys(templates).join(', ')}`);
    if(templates[type]) {
        const content = prompt("Edit Template Content:", templates[type]);
        if(content) {
            db.updateTemplate(type, content);
            alert("Template Updated!");
        }
    }
}
