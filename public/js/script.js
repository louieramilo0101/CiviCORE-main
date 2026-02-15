// ==========================================
// DATABASE LAYER - Now using MySQL via API
// Functions are defined in api.js
// ==========================================

// Note: All database functions are now async and defined in api.js
// Import: <script src="js/api.js"></script> must be in index.html

// Data Cache - Load data from API on initialization, provide sync access
const dataCache = {
    documents: [],
    issuances: [],
    users: [],
    templates: {}
};

// Initialize data cache from API
async function initializeDataCache() {
    try {
        dataCache.documents = await getAllDocuments();
        dataCache.issuances = await getAllIssuances();
        dataCache.users = await getAllUsers();
        dataCache.templates = await getTemplates();
        console.log('✅ Data loaded from MySQL database');
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

// DB Wrapper - Uses cache for synchronous access, updates cache and API for writes
const db = {
    // Document methods
    getAllDocuments: () => dataCache.documents,
    saveDocument: async (doc) => {
        const result = await saveDocument(doc);
        dataCache.documents = await getAllDocuments(); // Refresh cache
        return result;
    },
    deleteDocument: async (id) => {
        const result = await deleteDocument(id);
        dataCache.documents = await getAllDocuments(); // Refresh cache
        return result;
    },
    
    // Issuance methods
    getAllIssuances: () => dataCache.issuances,
    getIssuanceById: (id) => dataCache.issuances.find(r => r.id == id),
    saveIssuance: async (record) => {
        const result = await saveIssuance(record);
        dataCache.issuances = await getAllIssuances(); // Refresh cache
        return result;
    },
    
    // User methods
    getAllUsers: () => dataCache.users,
    getUserById: (id) => dataCache.users.find(u => u.id == id),
    updateUser: async (user) => {
        const result = await updateUser(user);
        dataCache.users = await getAllUsers(); // Refresh cache
        return result;
    },
    
    // Template methods
    getTemplates: () => dataCache.templates,
    updateTemplate: async (type, content) => {
        const result = await updateTemplate(type, content);
        dataCache.templates = await getTemplates(); // Refresh cache
        return result;
    }
};

// Initialize cache when page loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', initializeDataCache);
}

// ==========================================
// 2. STATE & VARIABLES
// ==========================================
let currentUser = null;
let selectedDocType = null;
let uploadedFile = null;
let charts = {};
let printRecords = [];

const today = new Date();
const currentYear = today.getFullYear();
const currentDateStr = new Date().toISOString().split('T')[0];

// ==========================================
// 3. LOGIN & NAVIGATION
// ==========================================
function toLoginPage() {
    document.getElementById('landingContainer').classList.remove('active');
    document.getElementById('loginContainer').classList.add('active');
    document.getElementById('email').focus();
}

// Replace the old login listener with this one:
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // This sends the email/password to your Node.js server!
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            // Your original loginUser function from the prototype
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
    
    // Load ALL data
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

document.getElementById('logoutBtn').addEventListener('click', () => {
    currentUser = null;
    document.getElementById('mainContainer').classList.remove('active');
    document.getElementById('loginContainer').classList.remove('active');
    document.getElementById('landingContainer').classList.add('active');
    document.getElementById('loginForm').reset();
});

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
    // Only show if user has "Manage Users" permission AND is Super Admin
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

// Navigation
document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = e.target.closest('a').dataset.page + 'Page';
        navigateToPage(pageId);
    });
});

function navigateToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    updateMenuActive();
    updatePageTitle();
    
    if (pageId === 'dashboardPage') setTimeout(updateAllStatistics, 100);
    if (pageId === 'uploadPage') loadDocuments();
    if (pageId === 'issuancePage') loadIssuanceData();
    if (pageId === 'accountsPage') {
        loadAccounts();
        loadPermissions();
    }
    if (pageId === 'mappingPage') {
        setTimeout(() => {
            const mapContainer = document.getElementById('mapContainer');
            if (mapContainer) mapContainer.style.display = 'block';
            setTimeout(initializeNaicMap, 200);
        }, 100);
    }
}

function updateMenuActive() {
    const activePage = document.querySelector('.page.active').id;
    const pageMap = {
        'dashboardPage': 'dashboard', 'uploadPage': 'upload', 'issuancePage': 'issuance', 'mappingPage': 'mapping', 'accountsPage': 'accounts'
    };
    const key = pageMap[activePage];
    document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === key) link.classList.add('active');
    });
}

function updatePageTitle() {
    const titleMap = { 'dashboardPage': 'Dashboard', 'uploadPage': 'Upload Document', 'issuancePage': 'Certificate Issuance', 'mappingPage': 'Geospatial Analytics', 'accountsPage': 'User Management' };
    const activePage = document.querySelector('.page.active').id;
    document.getElementById('pageTitle').textContent = titleMap[activePage] || 'Page';
}


// ==========================================
// 4. UPLOAD, OCR & MARRIAGE FORMS
// ==========================================
document.querySelectorAll('.doc-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.doc-type-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedDocType = btn.dataset.type;
        
        // If Marriage selected, check for Age inputs
        if(selectedDocType === 'marriage') {
            const groomInput = document.getElementById('groomAge');
            const brideInput = document.getElementById('brideAge');
            if(groomInput) groomInput.addEventListener('change', updateMarriageFormsInfo);
            if(brideInput) brideInput.addEventListener('change', updateMarriageFormsInfo);
        }
    });
});

// Image Preprocessing (Grayscale + Threshold)
function preprocessImageForOCR(file, callback) {
    if (file.type === 'application/pdf') {
        callback(null); 
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const threshold = avg > 128 ? 255 : 0;
                data[i] = threshold; data[i + 1] = threshold; data[i + 2] = threshold;
            }
            ctx.putImageData(imageData, 0, 0);
            callback(canvas.toDataURL('image/png'));
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    if (files.length > 0) {
        uploadedFile = files[0];
        preprocessImageForOCR(uploadedFile, (processedData) => {
            const newDoc = {
                id: Date.now(),
                name: uploadedFile.name,
                type: selectedDocType || 'Uncategorized',
                date: new Date().toLocaleDateString(),
                size: (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB',
                status: 'Processed', 
                previewData: processedData,
                personName: 'Extracted Name', // Mock OCR result
                barangay: 'Poblacion'
            };
            db.saveDocument(newDoc);
            alert(`File "${uploadedFile.name}" processed and saved!`);
            loadDocuments();
        });
    }
}

// Marriage Forms Logic
function updateMarriageFormsInfo() {
    const groomAge = parseInt(document.getElementById('groomAge').value) || 0;
    const brideAge = parseInt(document.getElementById('brideAge').value) || 0;
    const minAge = Math.min(groomAge, brideAge);
    const ageFormsInfo = document.getElementById('ageFormsInfo');
    const formsRequired = document.getElementById('formsRequired');
    
    if (minAge > 0) {
        let formsText = '';
        if (minAge >= 18 && minAge <= 20) formsText += '✓ <strong>Parental Consent Form</strong> (Required for ages 18-20)<br>';
        if (minAge >= 21) formsText += '✓ <strong>Marital Advice Form</strong> (Required for ages 21+)<br>';
        formsText += '✓ <strong>Notice of Marriage</strong> (Required for all marriages)<br>';
        
        if(formsRequired) formsRequired.innerHTML = formsText;
        if(ageFormsInfo) ageFormsInfo.style.display = 'block';
    } else {
        if(ageFormsInfo) ageFormsInfo.style.display = 'none';
    }
}

function saveMarriageLicense() {
    const groomAge = parseInt(document.getElementById('groomAge').value);
    const brideAge = parseInt(document.getElementById('brideAge').value);
    const barangay = document.getElementById('marriageBarangay').value;
    
    if (!groomAge || !brideAge) {
        alert('Please enter both groom and bride ages');
        return;
    }

    const consent = (Math.min(groomAge, brideAge) >= 18 && Math.min(groomAge, brideAge) <= 20);
    const advice = (Math.min(groomAge, brideAge) >= 21);
    
    const newDoc = {
        id: Date.now(),
        name: `Marriage_License_${Date.now()}.pdf`,
        type: 'marriage_license',
        date: new Date().toLocaleDateString(),
        size: '2.5 MB',
        status: 'Processed',
        barangay: barangay,
        personName: 'Couple Names',
        metadata: { groomAge, brideAge, consent, advice }
    };
    
    db.saveDocument(newDoc);
    alert(`Marriage License Saved!\nConsent Form: ${consent ? 'Yes' : 'No'}\nAdvice Form: ${advice ? 'Yes' : 'No'}`);
    navigateToPage('uploadPage');
}

function loadDocuments() {
    const list = document.getElementById('documentsList');
    if(!list) return;
    list.innerHTML = '';
    const docs = db.getAllDocuments();
    
    if (docs.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>No documents found</p></div>`;
        return;
    }
    
    docs.forEach(doc => {
        const item = document.createElement('div');
        item.className = 'document-item';
        item.innerHTML = `
            <div class="doc-info">
                <div class="doc-name">${doc.name}</div>
                <div class="doc-meta">${doc.type} • ${doc.date} • ${doc.size}</div>
            </div>
            <div class="doc-actions">
                <button class="btn-small" onclick="alert('Previewing ${doc.name}...')">View</button>
                <button class="btn-small danger" onclick="deleteDocument(${doc.id})">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function deleteDocument(id) {
    if(confirm('Delete this document?')) {
        db.deleteDocument(id);
        loadDocuments();
    }
}


// ==========================================
// 5. ISSUANCE, MODALS & PRINTING
// ==========================================
function loadIssuanceData() {
    loadIssuanceTable();
    updateAllStatistics();
}

function loadIssuanceTable(filterType = 'all') {
    const tbody = document.getElementById('issuanceTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let records = db.getAllIssuances();
    if (filterType !== 'all') records = records.filter(r => r.type === filterType);
    
    records.forEach(r => {
        const row = document.createElement('tr');
        const statusBg = r.status === 'Issued' ? '#d5f4e6' : '#fef5e7';
        const statusColor = r.status === 'Issued' ? '#27ae60' : '#f39c12';
        
        row.innerHTML = `
            <td style="padding: 12px;">${r.type.toUpperCase()}</td>
            <td style="padding: 12px;">${r.name}</td>
            <td style="padding: 12px;">${r.barangay}</td>
            <td style="padding: 12px;">${r.issuanceDate}</td>
            <td style="padding: 12px;"><span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 8px; border-radius: 4px;">${r.status}</span></td>
            <td style="padding: 12px;">
                <button class="btn-small" onclick="viewIssuanceDocument(${r.id})" style="background: #3498db; margin-right: 5px;">📄 View</button>
                <button class="btn-small" onclick="printIssuanceRecord(${r.id})" style="background: var(--secondary-color);">🖨️ Print</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterIssuance(type) { loadIssuanceTable(type); }

function addNewIssuance() {
    const certNumber = document.getElementById('newCertNumber').value;
    const certType = document.getElementById('newCertType').value;
    const certName = document.getElementById('newCertName').value;
    const certBarangay = document.getElementById('newCertBarangay').value;
    const certDate = document.getElementById('newCertDate').value;
    const certStatus = document.getElementById('newCertStatus').value;
    
    if (!certNumber || !certName) { alert('Missing fields'); return; }
    
    db.saveIssuance({ certNumber, type: certType, name: certName, barangay: certBarangay, issuanceDate: certDate, status: certStatus });
    alert('Certificate Issued!');
    loadIssuanceData();
}

// RESTORED: View Document Modal
function viewIssuanceDocument(id) {
    const record = db.getIssuanceById(id);
    if (!record) return;
    
    // Find associated doc if exists
    const docs = db.getAllDocuments();
    const matchingDoc = docs.find(d => d.personName && d.personName.includes(record.name));
    
    displayIssuanceDocumentModal(record, matchingDoc);
}

function displayIssuanceDocumentModal(record, document) {
    const modalHTML = `
        <div id="documentModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 10px; max-width: 800px; width: 100%; padding: 30px; position: relative;">
                <button onclick="document.getElementById('documentModal').remove()" style="position: absolute; top: 15px; right: 15px; border: none; background: none; font-size: 20px; cursor: pointer;">✕</button>
                
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">${record.type.toUpperCase()} Certificate</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div><strong>Name:</strong> ${record.name}</div>
                    <div><strong>Barangay:</strong> ${record.barangay}</div>
                    <div><strong>Date:</strong> ${record.issuanceDate}</div>
                    <div><strong>Status:</strong> ${record.status}</div>
                </div>
                
                ${document ? `
                <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin-bottom: 20px;">
                    <strong>Attached File:</strong> ${document.name} (${document.size})
                    ${document.previewData ? `<br><img src="${document.previewData}" style="max-width: 100%; height: auto; margin-top: 10px; border: 1px solid #ddd;">` : ''}
                </div>` : ''}
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-primary" onclick="printIssuanceRecord(${record.id})">🖨️ Print Certificate</button>
                    <button class="btn-small danger" onclick="document.getElementById('documentModal').remove()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    const existing = document.getElementById('documentModal');
    if(existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function printIssuanceRecord(id) {
    const record = db.getIssuanceById(id);
    if (!record) return;
    
    const w = window.open('', '_blank');
    w.document.write(`
        <html><head><title>Print</title><style>body{font-family: serif; padding: 40px; text-align: center; border: 5px double black; height: 90vh;}</style></head><body>
        <h1>CERTIFICATE OF ${record.type.toUpperCase()}</h1>
        <p>Civil Registry of Naic, Cavite</p>
        <hr>
        <div style="text-align: left; margin: 50px;">
            <p><strong>Cert No:</strong> ${record.certNumber}</p>
            <p><strong>Name:</strong> ${record.name}</p>
            <p><strong>Barangay:</strong> ${record.barangay}</p>
            <p><strong>Date Issued:</strong> ${record.issuanceDate}</p>
        </div>
        <script>setTimeout(() => window.print(), 500);</script>
        </body></html>
    `);
    w.document.close();
}


// ==========================================
// 6. USER & ACCOUNT MANAGEMENT (RESTORED)
// ==========================================

// OPEN ADD USER MODAL - Fix for the missing function
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

// CLOSE ADD USER MODAL
function closeAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) modal.remove();
}

// HANDLE ADD USER FORM SUBMISSION
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

function loadAccounts() {
    const list = document.getElementById('accountsList');
    if (!list) return;
    list.innerHTML = '';
    const users = db.getAllUsers();
    
    users.forEach((user) => {
        const item = document.createElement('div');
        item.className = 'account-item';
        item.innerHTML = `<div class="account-name">${user.name}</div><div class="account-role">${user.role}</div>`;
        item.addEventListener('click', () => displayAccountDetails(user));
        list.appendChild(item);
    });
    if(users.length > 0) displayAccountDetails(users[0]);
}

function displayAccountDetails(user) {
    const container = document.getElementById('accountDetailsContainer');
    if(!container) return;
    
    // Permission Checks
    const isSelf = currentUser.id === user.id;
    const canManage = currentUser.permissions.includes('Manage Users');
    
    let buttons = '';
    if(isSelf || canManage) {
        buttons += `<button class="btn-small" onclick="alert('Password Change Demo')">Change Password</button>`;
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

// RESTORED: Add User Modal
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.success) {
        currentUser = data.user;
        loginUser(); // This is your existing function that hides login and shows dashboard
    } else {
        alert("Invalid credentials found in Database");
    }
});

// RESTORED: Change Role Modal
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

// RESTORED: Edit Permissions
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

function loadPermissions() {
    const container = document.getElementById('permissionsContainer');
    if(!container) return;
    container.innerHTML = '';
    db.getAllUsers().forEach(user => {
        container.innerHTML += `
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
                <strong>${user.name}</strong> (${user.role})<br>
                <small>${user.permissions.join(', ')}</small>
            </div>
        `;
    });
}

// RESTORED: Template Editor
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


// ==========================================
// 7. DASHBOARD & STATISTICS
// ==========================================
function initializeDashboard() { updateAllStatistics(); }

function updateAllStatistics() {
    const docs = db.getAllDocuments();
    const issuances = db.getAllIssuances();
    
    if(document.getElementById('totalDocs')) document.getElementById('totalDocs').textContent = docs.length;
    if(document.getElementById('totalUsers')) document.getElementById('totalUsers').textContent = db.getAllUsers().length;
    if(document.getElementById('totalIssuances')) document.getElementById('totalIssuances').textContent = issuances.length;
    
    // Issuance this month
    const currentM = new Date().getMonth();
    const count = issuances.filter(i => new Date(i.issuanceDate).getMonth() === currentM).length;
    if(document.getElementById('issuedThisMonth')) document.getElementById('issuedThisMonth').textContent = count;
}


// ==========================================
// 8. MAP LOGIC (PINS + HOVER)
// ==========================================
// ==========================================
// COMPLETE NAIC BARANGAY DATA (Coords are approximate centers)
// ==========================================
const naicBarangays = [

    { name: "Gomez-Zamora (Pob.)", lat: 14.320, lng: 120.7652},
    { name: "Capt. C. Nazareno (Pob.)", lat: 14.3179, lng: 120.76559 },
    { name: "Ibayo Silangan", lat: 14.3225, lng: 120.7673 },
    { name: "Ibayo Estacion", lat: 14.32358, lng: 120.76485 },
    { name: "Kanluran", lat: 14.31728, lng: 120.76345 },
    { name: "Makina", lat: 14.31462, lng: 120.77060},
    { name: "Sapa", lat: 14.32049, lng: 120.75696 },
    { name: "Bucana Malaki", lat: 14.3251, lng: 120.75574 },
    { name: "Bucana Sasahan", lat: 14.3232, lng: 120.7598 },
    { name: "Bagong Karsada", lat: 14.3211, lng: 120.7535 },
    { name: "Balsahan", lat: 14.3198, lng: 120.7627 },
    { name: "Bancaan", lat: 14.3175, lng: 120.7512 },
    { name: "Muzon", lat: 14.29245, lng: 120.75202 },
    { name: "Latoria", lat: 14.3217999, lng: 120.761},
    { name: "Labac", lat: 14.3126, lng: 120.7373 },
    { name: "Mabolo", lat: 14.3148, lng: 120.7476 },
    { name: "San Roque", lat: 14.31058, lng: 120.7709 },             
    { name: "Santulan", lat: 14.3145, lng: 120.7685 },                
    { name: "Molino", lat: 14.2795, lng: 120.78071 },
    { name: "Calubcob", lat: 14.2976, lng: 120.7909 },
    { name: "Halang", lat: 14.2939, lng: 120.8007 },
    { name: "Malainen Bago", lat: 14.3078, lng: 120.7683 },
    { name: "Malainen Luma", lat: 14.3000, lng: 120.7700 },
    { name: "Palangue 1", lat: 14.2850, lng: 120.8097 },
    { name: "Palangue 2 & 3", lat: 14.2620, lng: 120.8297 },
    { name: "Humbac", lat: 14.3166, lng: 120.7689 },
    { name: "Munting Mapino", lat: 14.3348, lng: 120.7717 },
    { name: "Sabang", lat: 14.3146, lng: 120.7930 },
    { name: "Timalan Balsahan", lat: 14.3438, lng: 120.7808 },
    { name: "Timalan Concepcion", lat: 14.33699, lng: 120.7790 }
];

function initializeNaicMap() {
    const mapContainer = document.getElementById('mapContainer');
    
    // Safety check: ensure container exists and is visible
    if (!mapContainer || mapContainer.offsetParent === null) return;

    // Reset map if it already exists to prevent duplication
    if (window.naicMap) {
        window.naicMap.remove();
        window.naicMap = null;
    }

    // Initialize Map centered on Naic
    const map = L.map('mapContainer').setView([14.3150, 120.7700], 13);
    window.naicMap = map;

    // Add OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 12
    }).addTo(map);

    // Get Data for Statistics
    const issuances = db.getAllIssuances(); // Fetch from our MockDB
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let activeAreas = 0;

    // Iterate through ALL Barangays
    naicBarangays.forEach(brgy => {
        // 1. Calculate Statistics for this specific Barangay
        const monthlyCount = issuances.filter(i => 
            i.barangay === brgy.name && 
            new Date(i.issuanceDate).getMonth() === currentMonth &&
            new Date(i.issuanceDate).getFullYear() === currentYear
        ).length;

        const totalCount = issuances.filter(i => i.barangay === brgy.name).length;

        // 2. Create the Marker (Standard Pin)
        const marker = L.marker([brgy.lat, brgy.lng]).addTo(map);

        // 3. Define the Hover Content (Tooltip)
        const tooltipContent = `
            <div style="text-align: center; font-family: 'Segoe UI', sans-serif; min-width: 150px;">
                <strong style="color: #2c3e50; font-size: 14px; display: block; margin-bottom: 5px; border-bottom: 1px solid #eee; padding-bottom: 3px;">
                    ${brgy.name}
                </strong>
                <div style="font-size: 12px; text-align: left; padding: 0 5px;">
                    <div style="margin-bottom: 3px;">
                        📅 This Month: <b style="color: ${monthlyCount > 0 ? '#27ae60' : '#7f8c8d'}; float: right;">${monthlyCount}</b>
                    </div>
                    <div>
                        🗂️ Total Issued: <b style="color: #2980b9; float: right;">${totalCount}</b>
                    </div>
                </div>
            </div>
        `;

        // 4. Bind Tooltip (Hover settings)
        marker.bindTooltip(tooltipContent, {
            permanent: false,   // False = Show only on hover
            direction: 'top',   // Tooltip appears above the pin
            offset: [0, -10],   // Slight offset so it doesn't cover the pin head
            opacity: 1,
            className: 'barangay-tooltip' // Uses the CSS class we added earlier
        });

        if (monthlyCount > 0) activeAreas++;
    });

    // Update the "Most Active" stat card on the UI
    if(document.getElementById('activeBarangay')) {
        document.getElementById('activeBarangay').textContent = activeAreas + " Active Areas";
    }
}

function initializeOCR() { console.log("OCR Ready"); }