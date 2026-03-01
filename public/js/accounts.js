// ==========================================
// ACCOUNTS - User Management
// ==========================================

// Note: Uses API functions directly from api.js instead of db wrapper

// Track the currently selected user for the static buttons
let selectedUserForActions = null;

// Flag to prevent concurrent calls to loadAccounts
let isLoadingAccounts = false;

// --- Load Accounts List ---
async function loadAccounts() {
    // Prevent concurrent calls
    if (isLoadingAccounts) {
        console.log('loadAccounts already in progress, skipping...');
        return;
    }
    
    isLoadingAccounts = true;
    
    const list = document.getElementById('accountsList');
    const accountsSidebar = document.querySelector('.accounts-sidebar');
    const permissionsSection = document.querySelector('#accountsPage > div:last-child');
    
    console.log('loadAccounts called - currentUser:', currentUser);
    
    if (!list) {
        console.error('accountsList element not found!');
        isLoadingAccounts = false;
        return;
    }
    
    list.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading accounts...</div>';
    
    // Get users from API based on role - Super Admin sees all, others only see themselves
    let users;
    try {
        if (currentUser.role === 'Super Admin') {
            console.log('Loading all users for Super Admin...');
            users = await getAllUsers();
            console.log('Users loaded:', users);
            
            // Show the user accounts list for Super Admin
            if (accountsSidebar) accountsSidebar.style.display = 'block';
            // Show permissions section for Super Admin
            if (permissionsSection) permissionsSection.style.display = 'block';
        } else {
            // Non-Super Admin users can only see their own account
            users = [currentUser];
            // Hide the user accounts list for non-Super Admin
            if (accountsSidebar) accountsSidebar.style.display = 'none';
            // Show permissions section for non-Super Admin (but only shows their own permissions)
            if (permissionsSection) permissionsSection.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: red;">Error loading accounts. Please refresh the page.</div>';
        isLoadingAccounts = false;
        return;
    }
    
    // Clear the loading message
    list.innerHTML = '';
    
    if (!users || users.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No accounts found</div>';
        isLoadingAccounts = false;
        return;
    }
    
    users.forEach((user) => {
        const item = document.createElement('div');
        item.className = 'account-item';
        item.innerHTML = `<div class="account-name">${user.name}</div><div class="account-role">${user.role}</div>`;
        item.addEventListener('click', () => displayAccountDetails(user));
        list.appendChild(item);
    });
    
    console.log('Accounts rendered:', users.length, 'accounts');
    
    // Show the currently logged-in user's details by default
    if(users.length > 0) {
        const currentUserInList = users.find(u => u.id === currentUser.id);
        displayAccountDetails(currentUserInList || users[0]);
    }
    
    // Reset the loading flag
    isLoadingAccounts = false;
}

// Flag to prevent concurrent calls to loadPermissions
let isLoadingPermissions = false;

// --- Load Permissions ---
// This shows the permissions of the currently selected user
async function loadPermissions(userId = null) {
    // Prevent concurrent calls
    if (isLoadingPermissions) {
        console.log('loadPermissions already in progress, skipping...');
        return;
    }
    
    isLoadingPermissions = true;
    
    const container = document.getElementById('permissionsContainer');
    if(!container) {
        console.error('permissionsContainer element not found!');
        isLoadingPermissions = false;
        return;
    }
    
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading permissions...</div>';
    
    // If no userId is provided, use the currently selected user
    let user = null;
    
    try {
        if (currentUser.role !== 'Super Admin') {
            // Non-Super Admin users can only see their own permissions
            user = currentUser;
        } else if (userId) {
            // Load specific user's permissions (Super Admin only)
            user = await getUserById(userId);
        } else if (selectedUserForActions) {
            // Use the currently selected user from the account list (Super Admin only)
            user = selectedUserForActions;
        } else {
            // Fallback to current logged in user
            user = currentUser;
        }
        
        if (!user) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No user selected</div>';
            isLoadingPermissions = false;
            return;
        }
        
    } catch (error) {
        console.error('Error loading permissions:', error);
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: red;">Error loading permissions. Please refresh the page.</div>';
        isLoadingPermissions = false;
        return;
    }
    
    // Ensure permissions is an array
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    
    // Clear the loading message and display the user's permissions
    container.innerHTML = `
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid var(--secondary-color);">
            <h4 style="margin: 0 0 10px 0; color: var(--primary-color);">${user.name}</h4>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 13px;"><strong>Role:</strong> ${user.role}</p>
            <div style="background: white; padding: 15px; border-radius: 5px;">
                <strong style="color: var(--primary-color);">Permissions:</strong><br>
                <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px;">
                    ${permissions.length > 0 ? permissions.map(perm => `
                        <span style="background: var(--secondary-color); color: white; padding: 5px 12px; border-radius: 15px; font-size: 12px;">${perm}</span>
                    `).join('') : '<span style="color: #999;">No permissions assigned</span>'}
                </div>
            </div>
        </div>
    `;
    
    console.log('Permissions loaded for user:', user.name);
    
    // Reset the loading flag
    isLoadingPermissions = false;
}

// --- Display Account Details ---
function displayAccountDetails(user) {
    const container = document.getElementById('accountDetailsContainer');
    if(!container) return;
    
    // Store selected user for static button actions
    selectedUserForActions = user;

    container.innerHTML = `
        <div class="detail-field"><label>Name:</label> ${user.name}</div>
        <div class="detail-field"><label>Email:</label> ${user.email}</div>
        <div class="detail-field"><label>Role:</label> ${user.role}</div>
    `;
    
    // Update the permissions section to show the selected user's permissions
    loadPermissions();
}

// --- Open Change Password Modal ---
async function openChangePasswordModal(userId) {
    // First try to get user from currentUser (if changing own password)
    let user = null;
    
    if (currentUser && currentUser.id === userId) {
        user = currentUser;
    } else {
        // For Super Admin changing other users' passwords, get from API
        user = await getUserById(userId);
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
                    
                    <p style="margin-top: 10px; color: #666; font-size: 12px;">* Passwords must be at least 6 characters</p>
                    
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

// --- Open Edit Account Modal ---
async function openEditAccountModal(userId) {
    // First try to get user from currentUser (if editing own profile)
    let user = null;
    
    if (currentUser && currentUser.id === userId) {
        user = currentUser;
    } else {
        // For Super Admin editing other users' profiles, get from API
        user = await getUserById(userId);
    }
    
    if (!user) {
        alert('User not found. Please refresh the page and try again.');
        return;
    }

    // Check permissions for Super Admin features
    const isSuperAdmin = currentUser.role === 'Super Admin' && currentUser.permissions.includes('Manage Users');
    const isSelf = currentUser.id === user.id;
    const canManage = currentUser.permissions.includes('Manage Users');

    // Build action buttons HTML - restructured layout
    let editPermissionsBtn = '';
    
    // NOTE: Change Password button has been moved outside the Edit Account Modal
    // The static "Change Password" button in the Account Details section (index.html) is now the primary way to change password
    // This avoids duplication and provides better UX (fewer clicks)
    
    // Edit Permissions button (only for Super Admin)
    if (isSuperAdmin) {
        editPermissionsBtn = `<button type="button" class="btn-small" onclick="closeEditAccountModal(); setTimeout(() => editUserPermissions(${user.id}), 100);" style="background: #e74c3c; color: white;">Edit Permissions</button>`;
    }

    // Create modal HTML
    const modalHTML = `
        <div id="editAccountModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 10px; max-width: 450px; width: 100%; padding: 30px; position: relative; max-height: 90vh; overflow-y: auto;">
                <button onclick="closeEditAccountModal()" style="position: absolute; top: 15px; right: 15px; border: none; background: none; font-size: 20px; cursor: pointer;">✕</button>
                
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; color: var(--primary-color);">Edit Account</h2>
                
                <p style="margin-bottom: 20px; color: #666;">Editing profile for: <strong>${user.name}</strong></p>
                
                ${editPermissionsBtn ? `
                <!-- Action Buttons Section -->
                <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                    <p style="margin: 0 0 10px 0; font-size: 13px; color: #666; font-weight: 600;">Account Actions:</p>
                    <div style="display: flex; flex-wrap: wrap; align-items: center;">
                        ${editPermissionsBtn}
                    </div>
                </div>
                ` : ''}
                
                <!-- Edit Profile Form -->
                <form id="editAccountForm" onsubmit="handleEditAccount(event, ${user.id})">
                    <div class="form-field">
                        <label>Full Name *</label>
                        <input type="text" id="editUserName" placeholder="Enter full name" value="${user.name}" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                    </div>
                    
                    <div class="form-field" style="margin-top: 15px;">
                        <label>Email *</label>
                        <input type="email" id="editUserEmail" placeholder="Enter email address" value="${user.email}" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                    </div>
                    
                    ${isSuperAdmin ? `
                    <div class="form-field" style="margin-top: 15px;">
                        <label>Role *</label>
                        <select id="editUserRole" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                            <option value="Super Admin" ${user.role === 'Super Admin' ? 'selected' : ''}>Super Admin</option>
                            <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                            <option value="User" ${user.role === 'User' ? 'selected' : ''}>User</option>
                        </select>
                    </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button type="submit" class="btn-primary" style="flex: 1; background: var(--success-color);">Save Changes</button>
                        <button type="button" onclick="closeEditAccountModal()" class="btn-primary" style="flex: 1; background: #95a5a6;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existing = document.getElementById('editAccountModal');
    if (existing) existing.remove();
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// --- Close Edit Account Modal ---
function closeEditAccountModal() {
    const modal = document.getElementById('editAccountModal');
    if (modal) modal.remove();
}

// --- Handle Edit Account Form Submission ---
async function handleEditAccount(event, userId) {
    event.preventDefault();
    
    const name = document.getElementById('editUserName').value;
    const email = document.getElementById('editUserEmail').value;
    const roleSelect = document.getElementById('editUserRole');
    const newRole = roleSelect ? roleSelect.value : null;
    
    if (!name || !email) {
        alert('Please fill in all fields');
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    try {
        // Update profile (name and email)
        const result = await updateUserProfile(userId, name, email);
        
        // If role was changed, update it separately
        if (newRole && currentUser.role === 'Super Admin' && currentUser.permissions.includes('Manage Users')) {
            const user = await getUserById(userId);
            if (user && user.role !== newRole) {
                await updateUser({ id: userId, role: newRole });
            }
        }
        
        if (result.success) {
            alert('Account updated successfully!');
            closeEditAccountModal();
            
            // Refresh the user data
            const updatedUser = await getUserById(userId);
            displayAccountDetails(updatedUser);
            
            // If it's the current user, update the currentUser object
            if (currentUser.id === userId) {
                currentUser.name = name;
                currentUser.email = email;
                if (newRole) {
                    currentUser.role = newRole;
                }
            }
            
            // Refresh the accounts list
            loadAccounts();
        } else {
            alert(result.message || 'Failed to update account. Please try again.');
        }
    } catch (error) {
        console.error('Error updating account:', error);
        alert('Failed to connect to server. Make sure the server is running.');
    }
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
        
        // Check if account was created successfully
        // Success is determined by: response status is OK AND (data.success is true OR message contains "success")
        const isCreateSuccess = response.ok && (data.success === true || (data.message && data.message.toLowerCase().includes('success')));
        
        if (isCreateSuccess) {
            closeAddUserModal();
            loadAccounts(); // Refresh the accounts list
            loadPermissions(); // Refresh permissions display
            openCreateAccountSuccessModal();
        } else {
            alert('Error: ' + (data.error || 'Failed to create user'));
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Failed to connect to server. Make sure the server is running.');
    }
}

// --- Open Change Role Modal ---
async function openChangeRoleModal(userId) {
    const user = await getUserById(userId);
    const newRole = prompt(`Current Role: ${user.role}\nEnter New Role (Super Admin, Admin, User):`);
    if(newRole) {
        user.role = newRole;
        await updateUser(user);
        alert(`Role updated to ${newRole}`);
        loadAccounts();
    }
}

// --- Edit User Permissions Modal ---
async function editUserPermissions(userId) {
    const user = await getUserById(userId);
    if (!user) {
        alert('User not found. Please refresh the page and try again.');
        return;
    }

    const allPerms = ['View Dashboard', 'Upload Documents', 'Manage Users', 'Mapping Analytics', 'View Issuance'];
    
    // Create checkboxes HTML
    const checkboxesHTML = allPerms.map(perm => {
        const isChecked = user.permissions.includes(perm) ? 'checked' : '';
        return `
            <label style="display: flex; align-items: center; padding: 10px; border: 1px solid #eee; border-radius: 5px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s;">
                <input type="checkbox" name="userPermission" value="${perm}" ${isChecked} style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
                <span style="font-size: 14px;">${perm}</span>
            </label>
        `;
    }).join('');

    // Create modal HTML
    const modalHTML = `
        <div id="editPermissionsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 10px; max-width: 450px; width: 100%; padding: 30px; position: relative; max-height: 90vh; overflow-y: auto;">
                <button onclick="closeEditPermissionsModal()" style="position: absolute; top: 15px; right: 15px; border: none; background: none; font-size: 20px; cursor: pointer;">✕</button>
                
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; color: var(--primary-color);">Edit Permissions</h2>
                
                <p style="margin-bottom: 15px; color: #666;">User: <strong>${user.name}</strong> (${user.role})</p>
                <p style="margin-bottom: 20px; color: #888; font-size: 13px;">Select the permissions for this user:</p>
                
                <form id="editPermissionsForm" onsubmit="handleEditPermissions(event, ${user.id})">
                    <div id="permissionsCheckboxes" style="margin-bottom: 20px;">
                        ${checkboxesHTML}
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button type="submit" class="btn-primary" style="flex: 1; background: var(--success-color);">Save Permissions</button>
                        <button type="button" onclick="closeEditPermissionsModal()" class="btn-primary" style="flex: 1; background: #95a5a6;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existing = document.getElementById('editPermissionsModal');
    if (existing) existing.remove();
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// --- Close Edit Permissions Modal ---
function closeEditPermissionsModal() {
    const modal = document.getElementById('editPermissionsModal');
    if (modal) modal.remove();
}

// --- Handle Edit Permissions Form Submission ---
async function handleEditPermissions(event, userId) {
    event.preventDefault();
    
    // Get all selected permissions
    const checkboxes = document.querySelectorAll('input[name="userPermission"]:checked');
    const selectedPermissions = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedPermissions.length === 0) {
        alert('Please select at least one permission for the user.');
        return;
    }
    
    try {
        const user = {
            id: userId,
            permissions: selectedPermissions
        };
        
        const result = await updateUser(user);
        
        if (result) {
            alert('Permissions updated successfully!');
            closeEditPermissionsModal();
            loadPermissions(); // Refresh permissions display
            
            // If viewing the same user, refresh their details
            const currentUserInList = document.querySelector('.account-item.active');
            if (currentUserInList) {
                const updatedUser = await getUserById(userId);
                displayAccountDetails(updatedUser);
            }
        } else {
            alert('Failed to update permissions. Please try again.');
        }
    } catch (error) {
        console.error('Error updating permissions:', error);
        alert('Failed to connect to server. Make sure the server is running.');
    }
}

// --- Template Editor (Super Admin Only) ---
async function openTemplateEditor() {
    if(currentUser.role !== 'Super Admin') return;
    const templates = await getTemplates();
    const type = prompt(`Enter template type to edit: ${Object.keys(templates).join(', ')}`);
    if(templates[type]) {
        const content = prompt("Edit Template Content:", templates[type]);
        if(content) {
            await updateTemplate(type, content);
            alert("Template Updated!");
        }
    }
}

// --- Static Button Handlers for Account Actions ---

// Handle Change Password button click (from static buttons)
function handleChangePasswordBtn() {
    if (!selectedUserForActions) {
        alert('Please select a user first');
        return;
    }
    
    // Check permissions - user can change their own password or if they can manage users
    const isSelf = currentUser.id === selectedUserForActions.id;
    const canManage = currentUser.permissions.includes('Manage Users');
    
    if (!isSelf && !canManage) {
        alert('You do not have permission to change this user\'s password');
        return;
    }
    
    openChangePasswordModal(selectedUserForActions.id);
}

// Handle Edit Account button click (from static buttons)
function handleEditAccountBtn() {
    if (!selectedUserForActions) {
        alert('Please select a user first');
        return;
    }
    
    // Check permissions
    const isSelf = currentUser.id === selectedUserForActions.id;
    const canManage = currentUser.permissions.includes('Manage Users');
    
    if (!isSelf && !canManage) {
        alert('You do not have permission to edit this account');
        return;
    }
    
    openEditAccountModal(selectedUserForActions.id);
}

// Handle Delete Account button click (from static buttons)
async function handleDeleteAccountBtn() {
    if (!selectedUserForActions) {
        alert('Please select a user first');
        return;
    }
    
    // Check permissions - only Super Admin can delete users
    if (currentUser.role !== 'Super Admin' || !currentUser.permissions.includes('Manage Users')) {
        alert('You do not have permission to delete users');
        return;
    }
    
    // Prevent self-deletion
    if (selectedUserForActions.id === currentUser.id) {
        alert('You cannot delete your own account');
        return;
    }

    openDeleteAccountModal(selectedUserForActions);
}

// --- Delete Account Modal ---
function openDeleteAccountModal(user) {
    if (!user) return;

    // Remove existing modal if any
    const existing = document.getElementById('deleteAccountModal');
    if (existing) existing.remove();

    const modalHTML = `
        <div id="deleteAccountModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 10px; max-width: 420px; width: 100%; padding: 30px; position: relative;">
                <button onclick="closeDeleteAccountModal()" style="position: absolute; top: 15px; right: 15px; border: none; background: none; font-size: 20px; cursor: pointer;">✕</button>
                
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; color: #e74c3c;">Delete Account</h2>
                
                <p style="margin: 0 0 10px 0; color: #333;">
                    You are about to delete:
                    <strong>${user.name}</strong> (${user.email})
                </p>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 13px;">
                    This action cannot be undone. Enter your Super Admin password to confirm.
                </p>

                <form id="deleteAccountForm" onsubmit="handleConfirmDeleteAccount(event, ${user.id})">
                    <div class="form-field">
                        <label>Super Admin Password *</label>
                        <input type="password" id="deleteAccountPassword" placeholder="Enter your password" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                    </div>

                    <p id="deleteAccountError" style="display: none; margin-top: 10px; color: #c0392b; font-size: 13px;"></p>

                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button id="confirmDeleteAccountBtn" type="submit" class="btn-primary" style="flex: 1; background: #e74c3c;">Confirm Delete</button>
                        <button type="button" onclick="closeDeleteAccountModal()" class="btn-primary" style="flex: 1; background: #95a5a6;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModal');
    if (modal) modal.remove();
}

function openDeleteSuccessModal() {
    const existing = document.getElementById('deleteSuccessModal');
    if (existing) existing.remove();

    const modalHTML = `
        <div id="deleteSuccessModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 10px; max-width: 380px; width: 100%; padding: 30px; position: relative;">
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; color: var(--success-color);">Delete Successful</h2>
                <p style="margin: 0 0 20px 0; color: #333;">The account has been deleted.</p>
                <button type="button" onclick="closeDeleteSuccessModal()" class="btn-primary" style="width: 100%; background: #95a5a6;">Close</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeDeleteSuccessModal() {
    const modal = document.getElementById('deleteSuccessModal');
    if (modal) modal.remove();
}

function openCreateAccountSuccessModal() {
    const existing = document.getElementById('createAccountSuccessModal');
    if (existing) existing.remove();

    const modalHTML = `
        <div id="createAccountSuccessModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 10px; max-width: 380px; width: 100%; padding: 30px; position: relative;">
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; color: var(--success-color);">Account Created</h2>
                <p style="margin: 0 0 20px 0; color: #333;">The account has been created successfully.</p>
                <button type="button" onclick="closeCreateAccountSuccessModal()" class="btn-primary" style="width: 100%; background: #95a5a6;">Confirm</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeCreateAccountSuccessModal() {
    const modal = document.getElementById('createAccountSuccessModal');
    if (modal) modal.remove();
}

async function handleConfirmDeleteAccount(event, userId) {
    event.preventDefault();

    const passwordInput = document.getElementById('deleteAccountPassword');
    const errorText = document.getElementById('deleteAccountError');
    const confirmBtn = document.getElementById('confirmDeleteAccountBtn');

    if (!passwordInput || !errorText || !confirmBtn) return;

    const password = passwordInput.value.trim();
    if (!password) {
        errorText.textContent = 'Password is required.';
        errorText.style.display = 'block';
        return;
    }

    errorText.style.display = 'none';
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';

    try {
        const data = await deleteUser(userId, password);

        if (data.success) {
            closeDeleteAccountModal();
            loadAccounts();
            loadPermissions();
            openDeleteSuccessModal();
            return;
        }

        errorText.textContent = data.message || 'Failed to delete user. Please try again.';
        errorText.style.display = 'block';
    } catch (error) {
        console.error('Error deleting user:', error);
        errorText.textContent = 'Failed to connect to server. Make sure the server is running.';
        errorText.style.display = 'block';
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Delete';
    }
}
