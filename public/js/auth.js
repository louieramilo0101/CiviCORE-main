// ==========================================
// AUTHENTICATION - Login, Logout & Access Control
// ==========================================

let currentUser = null;

// ==========================================
// ERROR MODAL FUNCTIONS
// ==========================================
function showErrorModal(message) {
    const modal = document.getElementById('errorModal');
    const messageEl = document.getElementById('errorModalMessage');
    if (messageEl) {
        messageEl.textContent = message || 'Invalid email or password';
    }
    if (modal) {
        modal.classList.add('active');
    }
}

function closeErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('errorModal');
    if (e.target === modal) {
        closeErrorModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeErrorModal();
    }
});

// ==========================================
// DOMContentLoaded Listener
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved user in localStorage and restore session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            if (currentUser && currentUser.id) {
                console.log('Restoring session for:', currentUser.name);
                loginUser();
            }
        } catch (e) {
            console.error('Error restoring session:', e);
            localStorage.removeItem('currentUser');
        }
    }
});

// ==========================================
// LOGIN PAGE
// ==========================================
function toLoginPage() {
    document.getElementById('landingContainer').classList.remove('active');
    document.getElementById('loginContainer').classList.add('active');
    document.getElementById('email').focus();
}

// ==========================================
// LANDING PAGE (BACK TO HOME)
// ==========================================
function toLandingPage() {
    // Clear the current user session
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    // Show landing page, hide login and main containers
    document.getElementById('landingContainer').classList.add('active');
    document.getElementById('loginContainer').classList.remove('active');
    document.getElementById('mainContainer').classList.remove('active');
    
    // Reset login form
    document.getElementById('loginForm').reset();
}

// ==========================================
// LOGIN FORM SUBMISSION HANDLER
// ==========================================
function handleLoginSubmit(e) {
    if (e) {
        e.preventDefault();
    }
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Login attempt for:', email);

    // Use fetch API for login
    fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Login response:', data);
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            loginUser();
        } else {
            showErrorModal(data.message || 'Invalid email or password');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showErrorModal('Could not connect to the server. Make sure node server.js is running!');
    });
}

// Attach login form event listener - runs immediately when script loads
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    // Remove any existing event listeners to avoid duplicates
    loginForm.removeEventListener('submit', handleLoginSubmit);
    // Add the event listener
    loginForm.addEventListener('submit', handleLoginSubmit);
    console.log('Login form event listener attached');
} else {
    console.error('Login form not found!');
    // Fallback: try to attach when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', handleLoginSubmit);
            console.log('Login form event listener attached (fallback)');
        }
    });
}

// ==========================================
// LOGIN USER
// ==========================================
async function loginUser() {
    document.getElementById('landingContainer').classList.remove('active');
    document.getElementById('loginContainer').classList.remove('active');
    document.getElementById('mainContainer').classList.add('active');
    
    updateUserInfo();
    checkAdminAccess();
    
    // Load ALL data directly from API
    initializeDashboard();
    loadDocuments();
    loadAccounts();
    loadPermissions();
    initializeOCR();
}

// ==========================================
// LOGOUT
// ==========================================
document.getElementById('logoutBtn').addEventListener('click', () => {
    currentUser = null;
    document.getElementById('mainContainer').classList.remove('active');
    document.getElementById('loginContainer').classList.remove('active');
    document.getElementById('landingContainer').classList.add('active');
    document.getElementById('loginForm').reset();
});

// ==========================================
// PERMISSION & ACCESS CONTROL
// ==========================================
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
