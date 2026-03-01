// ==========================================
// DOCUMENTS - Upload, OCR & Document Handling
// ==========================================

// Note: Uses API functions directly from api.js

// Global variables for this module
let selectedDocType = null;
let uploadedFile = null;

// --- Document Type Selection ---
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

// --- Image Preprocessing for OCR ---
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
                data[i] = threshold;
                data[i + 1] = threshold;
                data[i + 2] = threshold;
            }
            ctx.putImageData(imageData, 0, 0);
            callback(canvas.toDataURL('image/png'));
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// --- File Upload Handlers ---
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

async function handleFiles(files) {
    if (files.length > 0) {
        uploadedFile = files[0];
        preprocessImageForOCR(uploadedFile, async (processedData) => {
            const newDoc = {
                id: Date.now(),
                name: uploadedFile.name,
                type: selectedDocType || 'Uncategorized',
                date: new Date().toLocaleDateString(),
                size: (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB',
                status: 'Processed', 
                previewData: processedData,
                personName: 'Extracted Name',
                barangay: 'Poblacion'
            };
            await saveDocument(newDoc);
            alert(`File "${uploadedFile.name}" processed and saved!`);
            loadDocuments();
        });
    }
}

// --- Load Documents List ---
async function loadDocuments() {
    const list = document.getElementById('documentsList');
    if(!list) return;
    list.innerHTML = '';
    const docs = await getAllDocuments();
    
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
                <button class="btn-small" onclick="viewDocument(${doc.id})">View</button>
                <button class="btn-small danger" onclick="deleteDocument(${doc.id})">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// --- View Document ---
async function viewDocument(id) {
    const docs = await getAllDocuments();
    const doc = docs.find(d => d.id === id);
    
    if (!doc) {
        alert('Document not found');
        return;
    }
    
    displayDocumentModal(doc);
}

// --- Display Document Modal ---
function displayDocumentModal(doc) {
    const typeIcons = {
        'birth': '👶',
        'death': '⚰️',
        'marriage': '💍',
        'marriage_license': '💍',
        'Uncategorized': '📄'
    };
    
    const icon = typeIcons[doc.type] || '📄';
    const statusBg = doc.status === 'Processed' ? '#d5f4e6' : '#fef5e7';
    const statusColor = doc.status === 'Processed' ? '#27ae60' : '#f39c12';
    
    const modalHTML = `
        <div id="documentModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 10px; max-width: 800px; width: 100%; padding: 30px; position: relative; max-height: 90vh; overflow-y: auto;">
                <button onclick="document.getElementById('documentModal').remove()" style="position: absolute; top: 15px; right: 15px; border: none; background: none; font-size: 20px; cursor: pointer;">✕</button>
                
                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
                    ${icon} ${doc.type ? doc.type.toUpperCase() : 'DOCUMENT'} Details
                </h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div><strong>Document Name:</strong> ${doc.name}</div>
                    <div><strong>Type:</strong> ${doc.type || 'N/A'}</div>
                    <div><strong>Date:</strong> ${doc.date || 'N/A'}</div>
                    <div><strong>Size:</strong> ${doc.size || 'N/A'}</div>
                    <div><strong>Status:</strong> <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 8px; border-radius: 4px;">${doc.status || 'N/A'}</span></div>
                    <div><strong>Person Name:</strong> ${doc.personName || 'N/A'}</div>
                    <div><strong>Barangay:</strong> ${doc.barangay || 'N/A'}</div>
                </div>
                
                ${doc.previewData ? `
                <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin-bottom: 20px;">
                    <strong>Document Preview:</strong>
                    <div style="margin-top: 10px; text-align: center;">
                        <img src="${doc.previewData}" style="max-width: 100%; max-height: 400px; height: auto; border: 1px solid #ddd; border-radius: 5px;" alt="Document Preview">
                    </div>
                </div>` : ''}
                
                ${doc.metadata ? `
                <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #9b59b6; margin-bottom: 20px;">
                    <strong>Additional Metadata:</strong>
                    <pre style="margin-top: 10px; white-space: pre-wrap; font-size: 12px;">${JSON.stringify(doc.metadata, null, 2)}</pre>
                </div>` : ''}
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-small danger" onclick="deleteDocument(${doc.id}); document.getElementById('documentModal').remove();">Delete</button>
                    <button class="btn-small" onclick="document.getElementById('documentModal').remove()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    const existing = document.getElementById('documentModal');
    if(existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// --- Delete Document ---
async function deleteDocument(id) {
    if(confirm('Delete this document?')) {
        await deleteDocumentAPI(id);
        loadDocuments();
    }
}

// Wrapper for delete document API
async function deleteDocumentAPI(id) {
    const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    return await response.json();
}

// --- Marriage Forms Logic ---
function updateMarriageFormsInfo() {
    const groomAge = parseInt(document.getElementById('groomAge').value) || 0;
    const brideAge = parseInt(document.getElementById('brideAge').value) || 0;
    const minAge = Math.min(groomAge, brideAge);
    const ageFormsInfo = document.getElementById('ageFormsInfo');
    const formsRequired = document.getElementById('formsRequired');
    
    if (minAge > 0) {
        let formsText = '';
        if (minAge >= 18 && minAge <= 20) {
            formsText += '✓ <strong>Parental Consent Form</strong> (Required for ages 18-20)<br>';
        }
        if (minAge >= 21) {
            formsText += '✓ <strong>Marital Advice Form</strong> (Required for ages 21+)<br>';
        }
        formsText += '✓ <strong>Notice of Marriage</strong> (Required for all marriages)<br>';
        
        if(formsRequired) formsRequired.innerHTML = formsText;
        if(ageFormsInfo) ageFormsInfo.style.display = 'block';
    } else {
        if(ageFormsInfo) ageFormsInfo.style.display = 'none';
    }
}

// --- Save Marriage License ---
async function saveMarriageLicense() {
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
    
    await saveDocument(newDoc);
    alert(`Marriage License Saved!\nConsent Form: ${consent ? 'Yes' : 'No'}\nAdvice Form: ${advice ? 'Yes' : 'No'}`);
    navigateToPage('uploadPage');
}
