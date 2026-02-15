// ==========================================
// MAIN - Initialization & Configuration
// ==========================================

// Global constants
const today = new Date();
const currentYear = today.getFullYear();
const currentDateStr = new Date().toISOString().split('T')[0];

// Global charts object
let charts = {};
let printRecords = [];

// ==========================================
// INITIALIZATION ON PAGE LOAD
// ==========================================

// Any code that needs to run on page load can go here
// The scripts are loaded in order, so db, auth, navigation, etc. are already available

console.log("CiviCORE - All modules loaded successfully!");
