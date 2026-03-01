// ==========================================
// ISSUANCE - Certificate Issuance Management
// ==========================================

// Note: Uses API functions directly from api.js

// --- Initialize Issuance Page ---
async function initIssuancePage() {
    await loadBarangaysToDropdown();
    await generateCertNumber();
    await loadIssuanceData();
}

// --- Load Barangays to Dropdown ---
async function loadBarangaysToDropdown() {
    const barangaySelect = document.getElementById('newCertBarangay');
    if (!barangaySelect) return;
    
    try {
        const barangays = await getAllBarangays();
        barangaySelect.innerHTML = '';
        
        barangays.forEach(b => {
            const option = document.createElement('option');
            option.value = b.name;
            option.textContent = b.name;
            barangaySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading barangays:', error);
        // Fallback to Naic barangays if API fails
        const naicBarangays = [
            "Gomez-Zamora (Pob.)", "Capt. C. Nazareno (Pob.)", "Ibayo Silangan",
            "Ibayo Estacion", "Kanluran", "Makina", "Sapa", "Bucana Malaki",
            "Bucana Sasahan", "Bagong Karsada", "Balsahan", "Bancaan", "Muzon",
            "Latoria", "Labac", "Mabolo", "San Roque", "Santulan", "Molino",
            "Calubcob", "Halang", "Malainen Bago", "Malainen Luma", "Palangue 1",
            "Palangue 2 & 3", "Humbac", "Munting Mapino", "Sabang", "Timalan Balsahan",
            "Timalan Concepcion"
        ];
        barangaySelect.innerHTML = '';
        naicBarangays.forEach(b => {
            const option = document.createElement('option');
            option.value = b;
            option.textContent = b;
            barangaySelect.appendChild(option);
        });
    }
}

// --- Auto-generate Certificate Number ---
async function generateCertNumber() {
    const certType = document.getElementById('newCertType');
    const certNumberInput = document.getElementById('newCertNumber');
    if (!certType || !certNumberInput) return;
    
    try {
        const result = await getNextCertNumber(certType.value);
        certNumberInput.value = result.certNumber;
    } catch (error) {
        console.error('Error generating cert number:', error);
    }
}

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
    
    try {
        let records = await getAllIssuances();
        console.log('Fetched issuances:', records);
        console.log('Total records:', records.length);
        
        if (!Array.isArray(records)) {
            console.error('Error: Expected array but got:', typeof records);
            records = [];
        }
        
        if (filterType !== 'all') {
            records = records.filter(r => r.type === filterType);
        }
        
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">No records found</td></tr>';
            return;
        }
        
        records.forEach(r => {
            const row = document.createElement('tr');
            const statusBg = r.status === 'Issued' ? '#d5f4e6' : '#fef5e7';
            const statusColor = r.status === 'Issued' ? '#27ae60' : '#f39c12';
            
            row.innerHTML = `
                <td style="padding: 12px;">${r.type ? r.type.toUpperCase() : 'N/A'}</td>
                <td style="padding: 12px;">${r.name || 'N/A'}</td>
                <td style="padding: 12px;">${r.barangay || 'N/A'}</td>
                <td style="padding: 12px;">${r.issuanceDate || 'N/A'}</td>
                <td style="padding: 12px;"><span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 8px; border-radius: 4px;">${r.status || 'N/A'}</span></td>
                <td style="padding: 12px;">
                    <button class="btn-small" onclick="viewIssuanceDocument(${r.id})" style="background: #3498db; margin-right: 5px;">📄 View</button>
                    <button class="btn-small" onclick="printIssuanceRecord(${r.id})" style="background: var(--secondary-color);">🖨️ Print</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading issuance table:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: red;">Error loading data: ' + error.message + '</td></tr>';
    }
}

// --- Filter Issuance ---
function filterIssuance(type) {
    loadIssuanceTable(type);
}

// --- Search Certificates ---
async function searchCertificates() {
    const searchTerm = document.getElementById('certificateSearch').value.toLowerCase();
    const tbody = document.getElementById('issuanceTableBody');
    if (!tbody) return;
    
    const allRecords = await getAllIssuances();
    
    const filteredRecords = allRecords.filter(r => {
        const certNumber = (r.certNumber || '').toLowerCase();
        const name = (r.name || '').toLowerCase();
        const type = (r.type || '').toLowerCase();
        const barangay = (r.barangay || '').toLowerCase();
        
        return certNumber.includes(searchTerm) || 
               name.includes(searchTerm) || 
               type.includes(searchTerm) ||
               barangay.includes(searchTerm);
    });
    
    tbody.innerHTML = '';
    
    if (filteredRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">No records found</td></tr>';
        return;
    }
    
    filteredRecords.forEach(r => {
        const row = document.createElement('tr');
        const statusBg = r.status === 'Issued' ? '#d5f4e6' : '#fef5e7';
        const statusColor = r.status === 'Issued' ? '#27ae60' : '#f39c12';
        
        row.innerHTML = `
            <td style="padding: 12px;">${r.type ? r.type.toUpperCase() : 'N/A'}</td>
            <td style="padding: 12px;">${r.name || 'N/A'}</td>
            <td style="padding: 12px;">${r.barangay || 'N/A'}</td>
            <td style="padding: 12px;">${r.issuanceDate || 'N/A'}</td>
            <td style="padding: 12px;"><span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 8px; border-radius: 4px;">${r.status || 'N/A'}</span></td>
            <td style="padding: 12px;">
                <button class="btn-small" onclick="viewIssuanceDocument(${r.id})" style="background: #3498db; margin-right: 5px;">📄 View</button>
                <button class="btn-small" onclick="printIssuanceRecord(${r.id})" style="background: var(--secondary-color);">🖨️ Print</button>
            </td>
        `;
        tbody.appendChild(row);
    });
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
    
    const result = await saveIssuance({
        certNumber,
        type: certType,
        name: certName,
        barangay: certBarangay,
        issuanceDate: certDate,
        status: certStatus
    });
    
    // Show success modal
    showSuccessModal('Certificate has been issued successfully!');
    
    // Clear form fields
    document.getElementById('newCertName').value = '';
    document.getElementById('newCertDate').value = '';
    
    // Generate new certificate number for next entry
    await generateCertNumber();
    
    loadIssuanceData();
}

// --- View Issuance Document ---
async function viewIssuanceDocument(id) {
    console.log('Viewing issuance document with ID:', id);
    
    try {
        const record = await getIssuanceById(id);
        console.log('Fetched record:', record);
        
        if (!record) {
            console.error('No record found for ID:', id);
            alert('Record not found');
            return;
        }
        
        if (record.error) {
            console.error('Error fetching record:', record.error);
            alert('Error loading record: ' + record.error);
            return;
        }
        
        // Find associated doc if exists
        const docs = await getAllDocuments();
        console.log('All documents:', docs);
        
        const matchingDoc = docs.find(d => d.personName && d.personName.includes(record.name));
        console.log('Matching document:', matchingDoc);
        
        displayIssuanceDocumentModal(record, matchingDoc);
    } catch (error) {
        console.error('Error in viewIssuanceDocument:', error);
        alert('Error loading document: ' + error.message);
    }
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
    console.log('Printing issuance record with ID:', id);
    
    try {
        const record = await getIssuanceById(id);
        console.log('Fetched record for printing:', record);
        
        if (!record || record.error) {
            console.error('No record found or error:', record);
            alert('Record not found or error loading record');
            return;
        }
        
        const w = window.open('', '_blank');
        if (!w) {
            alert('Please allow popups to print');
            return;
        }
        
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
                <h1>CERTIFICATE OF ${record.type ? record.type.toUpperCase() : 'N/A'}</h1>
                <p>Civil Registry of Naic, Cavite</p>
                <hr>
                <div style="text-align: left; margin: 50px;">
                    <p><strong>Cert No:</strong> ${record.certNumber || 'N/A'}</p>
                    <p><strong>Name:</strong> ${record.name || 'N/A'}</p>
                    <p><strong>Barangay:</strong> ${record.barangay || 'N/A'}</p>
                    <p><strong>Date Issued:</strong> ${record.issuanceDate || 'N/A'}</p>
                </div>
                <script>setTimeout(() => window.print(), 500);</script>
            </body>
            </html>
        `);
        w.document.close();
    } catch (error) {
        console.error('Error in printIssuanceRecord:', error);
        alert('Error printing document: ' + error.message);
    }
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
    
    // Count pending issuances
    const pendingCount = issuances.filter(i => i.status === 'Pending').length;
    if(document.getElementById('pendingIssuance')) {
        document.getElementById('pendingIssuance').textContent = pendingCount;
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
