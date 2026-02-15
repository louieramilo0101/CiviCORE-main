// ==========================================
// DOCUMENTS - Upload, OCR & Document Handling
// ==========================================

// Global variables
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
                personName: 'Extracted Name',
                barangay: 'Poblacion'
            };
            db.saveDocument(newDoc);
            alert(`File "${uploadedFile.name}" processed and saved!`);
            loadDocuments();
        });
    }
}

// --- Load Documents List ---
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

// --- Delete Document ---
function deleteDocument(id) {
    if(confirm('Delete this document?')) {
        db.deleteDocument(id);
        loadDocuments();
    }
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
