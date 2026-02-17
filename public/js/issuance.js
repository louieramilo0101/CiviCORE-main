// ==========================================
// ISSUANCE - Certificate Issuance Management
// ==========================================

// Note: Uses API functions directly from api.js

// --- Load Issuance Data ---
async function loadIssuanceData() {
    await loadIssuanceTable();
    updateAllStatistics();
}

// --- Load Issuance Table ---
async function loadIssuanceTable(filterType = 'all') {
    const tbody = document.getElementById('issuanceTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let records = await getAllIssuances();
    if (filterType !== 'all') {
        records = records.filter(r => r.type === filterType);
    }
    
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

// --- Filter Issuance ---
function filterIssuance(type) {
    loadIssuanceTable(type);
}

// --- Add New Issuance ---
async function addNewIssuance() {
    const certNumber = document.getElementById('newCertNumber').value;
    const certType = document.getElementById('newCertType').value;
    const certName = document.getElementById('newCertName').value;
    const certBarangay = document.getElementById('newCertBarangay').value;
    const certDate = document.getElementById('newCertDate').value;
    const certStatus = document.getElementById('newCertStatus').value;
    
    if (!certNumber || !certName) {
        alert('Missing fields');
        return;
    }
    
    await saveIssuance({
        certNumber,
        type: certType,
        name: certName,
        barangay: certBarangay,
        issuanceDate: certDate,
        status: certStatus
    });
    
    alert('Certificate Issued!');
    loadIssuanceData();
}

// --- View Issuance Document ---
async function viewIssuanceDocument(id) {
    const record = await getIssuanceById(id);
    if (!record) return;
    
    // Find associated doc if exists
    const docs = await getAllDocuments();
    const matchingDoc = docs.find(d => d.personName && d.personName.includes(record.name));
    
    displayIssuanceDocumentModal(record, matchingDoc);
}

// --- Display Issuance Document Modal ---
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

// --- Print Issuance Record ---
async function printIssuanceRecord(id) {
    const record = await getIssuanceById(id);
    if (!record) return;
    
    const w = window.open('', '_blank');
    w.document.write(`
        <html>
        <head>
            <title>Print</title>
            <style>
                body {
                    font-family: serif;
                    padding: 40px;
                    text-align: center;
                    border: 5px double black;
                    height: 90vh;
                }
            </style>
        </head>
        <body>
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
        </body>
        </html>
    `);
    w.document.close();
}

// --- Update All Statistics (Dashboard) ---
async function updateAllStatistics() {
    const docs = await getAllDocuments();
    const issuances = await getAllIssuances();
    const users = await getAllUsers();
    
    if(document.getElementById('totalDocs')) {
        document.getElementById('totalDocs').textContent = docs.length;
    }
    if(document.getElementById('totalUsers')) {
        document.getElementById('totalUsers').textContent = users.length;
    }
    if(document.getElementById('totalIssuances')) {
        document.getElementById('totalIssuances').textContent = issuances.length;
    }
    
    // Issuance this month
    const currentM = new Date().getMonth();
    const count = issuances.filter(i => new Date(i.issuanceDate).getMonth() === currentM).length;
    if(document.getElementById('issuedThisMonth')) {
        document.getElementById('issuedThisMonth').textContent = count;
    }
}

// --- Initialize Dashboard ---
function initializeDashboard() {
    updateAllStatistics();
}
