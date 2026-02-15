// ==========================================
// AUTHENTICATION - Login & Logout
// ==========================================

// Global current user variable
let currentUser = null;

// --- Login Functions ---

function toLoginPage() {
    document.getElementById('landingContainer').classList.remove('active');
    document.getElementById('loginContainer').classList.add('active');
    document.getElementById('email').focus();
}

// Login form submission handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            loginUser();
        } else {
            alert(data.message || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Could not connect to the server. Make sure node server.js is running!');
    }
});

function loginUser() {
    document.getElementById('landingContainer').classList.remove('active');
    document.getElementById('loginContainer').classList.remove('active');
    document.getElementById('mainContainer').classList.add('active');
    
    updateUserInfo();
    checkAdminAccess();
    
    // Load all data
    initializeDashboard();
    loadDocuments();
    loadAccounts();
    loadPermissions();
    initializeOCR();
}

function updateUserInfo() {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = currentUser.role;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);
}

// --- Logout Function ---

document.getElementById('logoutBtn').addEventListener('click', () => {
    currentUser = null;
    document.getElementById('mainContainer').classList.remove('active');
    document.getElementById('loginContainer').classList.remove('active');
    document.getElementById('landingContainer').classList.add('active');
    document.getElementById('loginForm').reset();
});

// --- Permission & Access Control ---

function checkAdminAccess() {
    const accountsLink = document.getElementById('accountsMenuLink');
    const uploadLink = document.querySelector('[data-page="upload"]');
    const mappingLink = document.querySelector('[data-page="mapping"]');
    const addUserBtn = document.getElementById('addUserBtn');
    const editAccountBtn = document.getElementById('editAccountBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    // 1. Account Management (Super Admin/Admin)
    if (currentUser.role === 'Super Admin' || currentUser.role === 'Admin') {
        if (accountsLink) accountsLink.style.display = 'block';
    } else {
        if (accountsLink) accountsLink.style.display = 'none';
    }
    
    // 2. Upload (Admin/Super Admin)
    if (currentUser.role !== 'Admin' && currentUser.role !== 'Super Admin') {
        if (uploadLink) uploadLink.closest('li').style.display = 'none';
    } else {
        if (uploadLink) uploadLink.closest('li').style.display = 'block';
    }
    
    // 3. Mapping (Permissions Check)
    if (!currentUser.permissions.includes('Mapping Analytics')) {
        if (mappingLink) mappingLink.closest('li').style.display = 'none';
    } else {
        if (mappingLink) mappingLink.closest('li').style.display = 'block';
    }
    
    // 4. Add User Button - ONLY Super Admin can see this
    if (currentUser.role === 'Super Admin' && currentUser.permissions.includes('Manage Users')) {
        if (addUserBtn) addUserBtn.style.display = 'block';
    } else {
        if (addUserBtn) addUserBtn.style.display = 'none';
    }
    
    // 5. Edit Account Button - Only show if user has permission to manage users
    if (currentUser.permissions.includes('Manage Users')) {
        if (editAccountBtn) editAccountBtn.style.display = 'block';
    } else {
        if (editAccountBtn) editAccountBtn.style.display = 'none';
    }
    
    // 6. Delete Account Button - Only Super Admin can delete accounts
    if (currentUser.role === 'Super Admin' && currentUser.permissions.includes('Manage Users')) {
        if (deleteAccountBtn) deleteAccountBtn.style.display = 'block';
    } else {
        if (deleteAccountBtn) deleteAccountBtn.style.display = 'none';
    }
}
