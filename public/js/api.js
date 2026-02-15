// ==========================================
// API LAYER - MySQL Database via Node.js Server
// ==========================================

const API_BASE = ''; // Use relative URLs (same origin)

// Documents API
async function getAllDocuments() {
    const response = await fetch(`${API_BASE}/api/documents`);
    return await response.json();
}

async function saveDocument(doc) {
    const response = await fetch(`${API_BASE}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
    });
    return await response.json();
}

async function deleteDocument(id) {
    const response = await fetch(`${API_BASE}/api/documents/${id}`, { method: 'DELETE' });
    return await response.json();
}

// Issuances API
async function getAllIssuances() {
    const response = await fetch(`${API_BASE}/api/issuances`);
    return await response.json();
}

async function getIssuanceById(id) {
    const response = await fetch(`${API_BASE}/api/issuances/${id}`);
    return await response.json();
}

async function saveIssuance(record) {
    const response = await fetch(`${API_BASE}/api/issuances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
    });
    return await response.json();
}

// Users API
async function getAllUsers() {
    const response = await fetch(`${API_BASE}/api/users`);
    return await response.json();
}

async function getUserById(id) {
    const response = await fetch(`${API_BASE}/api/users/${id}`);
    return await response.json();
}

async function updateUser(user) {
    const response = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role, permissions: user.permissions })
    });
    return await response.json();
}

// Templates API
async function getTemplates() {
    const response = await fetch(`${API_BASE}/api/templates`);
    return await response.json();
}

async function updateTemplate(type, content) {
    const response = await fetch(`${API_BASE}/api/templates/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    return await response.json();
}
