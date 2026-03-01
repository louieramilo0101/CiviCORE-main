// ==========================================
// MAIN APPLICATION LOGIC
// Core functions that are not module-specific
// ==========================================

// Note: API functions are async and return Promises
// Import: <script src="js/api.js"></script> must be in index.html

// Note: Authentication functions are in auth.js
// User info functions are in userInfo.js
// Navigation functions are in navigation.js

// ==========================================
// 1. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize application when DOM is ready
    console.log('CiviCORE Application Loaded');
});

// ==========================================
// 2. NAVIGATION
// ==========================================
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
        'dashboardPage': 'dashboard', 
        'uploadPage': 'upload', 
        'issuancePage': 'issuance', 
        'mappingPage': 'mapping', 
        'accountsPage': 'accounts'
    };
    const key = pageMap[activePage];
    document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === key) link.classList.add('active');
    });
}

function updatePageTitle() {
    const titleMap = { 
        'dashboardPage': 'Dashboard', 
        'uploadPage': 'Upload Document', 
        'issuancePage': 'Certificate Issuance', 
        'mappingPage': 'Geospatial Analytics', 
        'accountsPage': 'User Management' 
    };
    const activePage = document.querySelector('.page.active').id;
    document.getElementById('pageTitle').textContent = titleMap[activePage] || 'Page';
}


// ==========================================
// 3. MAP LOGIC
// ==========================================

// ==========================================
// NAIC BARANGAY DATA (Coords are approximate centers)
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

async function initializeNaicMap() {
    const mapContainer = document.getElementById('mapContainer');
    
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
    const issuances = await getAllIssuances();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let activeAreas = 0;

    // Iterate through ALL Barangays
    naicBarangays.forEach(brgy => {
        // Calculate Statistics for this specific Barangay
        const monthlyCount = issuances.filter(i => 
            i.barangay === brgy.name && 
            new Date(i.issuanceDate).getMonth() === currentMonth &&
            new Date(i.issuanceDate).getFullYear() === currentYear
        ).length;

        const totalCount = issuances.filter(i => i.barangay === brgy.name).length;

        // Create the Marker (Standard Pin)
        const marker = L.marker([brgy.lat, brgy.lng]).addTo(map);

        // Define the Hover Content (Tooltip)
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

        // Bind Tooltip (Hover settings)
        marker.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
            opacity: 1,
            className: 'barangay-tooltip'
        });

        if (monthlyCount > 0) activeAreas++;
    });

    // Update the "Most Active" stat card on the UI
    if(document.getElementById('activeBarangay')) {
        document.getElementById('activeBarangay').textContent = activeAreas + " Active Areas";
    }
}

function initializeOCR() { 
    console.log("OCR Ready"); 
}
