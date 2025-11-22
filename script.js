// Fully functional frontend-only version for Vuma Lockers
const lockers = JSON.parse(localStorage.getItem('vumaLockers')) || Array.from({ length: 20 }, (_, i) => ({
    locker_number: i + 1,
    status: 'available',
    is_open: false,
    current_user_id: null
}));

// Save lockers to localStorage
function saveLockers() {
    localStorage.setItem('vumaLockers', JSON.stringify(lockers));
}

// DOM Elements
const lockerGrid = document.getElementById('lockerGrid');
const adminPanel = document.getElementById('adminPanel');
const userPanel = document.getElementById('userPanel');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const userLoginBtn = document.getElementById('userLoginBtn');
const adminLoginForm = document.getElementById('adminLoginForm');
const userLoginForm = document.getElementById('userLoginForm');
const adminView = document.getElementById('adminView');
const userView = document.getElementById('userView');
const logoutBtn = document.getElementById('logoutBtn');
const userLogoutBtn = document.getElementById('userLogoutBtn');
const adminMessage = document.getElementById('adminMessage');
const userMessage = document.getElementById('userMessage');

// State
let currentUser = null;
let isAdmin = false;

// Initialize the app
function initApp() {
    console.log('🚀 Vuma Lockers Initialized');
    loadLockers();
    checkAuthState();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    if (adminLoginBtn) adminLoginBtn.addEventListener('click', () => toggleLoginForm('admin'));
    if (userLoginBtn) userLoginBtn.addEventListener('click', () => toggleLoginForm('user'));
    if (adminLoginForm) adminLoginForm.addEventListener('submit', handleAdminLogin);
    if (userLoginForm) userLoginForm.addEventListener('submit', handleUserLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (userLogoutBtn) userLogoutBtn.addEventListener('click', handleLogout);
}

// Toggle login forms
function toggleLoginForm(type) {
    if (adminLoginForm) adminLoginForm.style.display = type === 'admin' ? 'block' : 'none';
    if (userLoginForm) userLoginForm.style.display = type === 'user' ? 'block' : 'none';
}

// Handle Admin Login
function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    // Simple admin validation
    if (username === 'admin' && password === 'admin123') {
        currentUser = { username, isAdmin: true };
        isAdmin = true;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showAdminView();
        showMessage('admin', 'Admin login successful!', 'success');
        // Clear form
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
    } else {
        showMessage('admin', 'Invalid admin credentials', 'error');
    }
}

// Handle User Login
function handleUserLogin(e) {
    e.preventDefault();
    const studentId = document.getElementById('studentId').value;

    // Simple student ID validation
    if (studentId && studentId.length >= 3) {
        currentUser = { studentId, isAdmin: false };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showUserView();
        showMessage('user', `Welcome, Student ${studentId}!`, 'success');
        // Clear form
        document.getElementById('studentId').value = '';
    } else {
        showMessage('user', 'Please enter a valid student ID (min 3 characters)', 'error');
    }
}

// Handle Logout
function handleLogout() {
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem('currentUser');
    showPublicView();
    showMessage('admin', 'Logged out successfully', 'success');
}

// Check authentication state
function checkAuthState() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isAdmin = currentUser.isAdmin;
        if (isAdmin) {
            showAdminView();
        } else {
            showUserView();
        }
    } else {
        showPublicView();
    }
}

// View management
function showPublicView() {
    if (adminPanel) adminPanel.style.display = 'none';
    if (userPanel) userPanel.style.display = 'none';
    if (lockerGrid) lockerGrid.style.display = 'grid';
    // Reset login forms
    if (adminLoginForm) adminLoginForm.style.display = 'none';
    if (userLoginForm) userLoginForm.style.display = 'none';
}

function showAdminView() {
    if (adminPanel) adminPanel.style.display = 'block';
    if (userPanel) userPanel.style.display = 'none';
    if (lockerGrid) lockerGrid.style.display = 'grid';
    if (adminLoginForm) adminLoginForm.style.display = 'none';
    loadLockers();
}

function showUserView() {
    if (adminPanel) adminPanel.style.display = 'none';
    if (userPanel) userPanel.style.display = 'block';
    if (lockerGrid) lockerGrid.style.display = 'grid';
    if (userLoginForm) userLoginForm.style.display = 'none';
    loadLockers();
}

// Load lockers
function loadLockers() {
    renderLockers();
}

// Render lockers in the grid
function renderLockers() {
    if (!lockerGrid) {
        console.error('Locker grid element not found');
        return;
    }
    
    lockerGrid.innerHTML = '';
    
    lockers.forEach(locker => {
        const lockerElement = document.createElement('div');
        lockerElement.className = `locker ${locker.status} ${locker.is_open ? 'open' : ''}`;
        
        let adminControls = '';
        if (isAdmin) {
            adminControls = `
            <div class="admin-controls">
                <button onclick="toggleLocker(${locker.locker_number})" class="btn-toggle">${locker.is_open ? '🔒 Lock' : '🔓 Unlock'}</button>
                <button onclick="maintainLocker(${locker.locker_number})" class="btn-maintain">🛠️ Maintain</button>
                <button onclick="releaseLocker(${locker.locker_number})" class="btn-release">🔄 Release</button>
            </div>
            `;
        }
        
        lockerElement.innerHTML = `
            <div class="locker-number">Locker ${locker.locker_number}</div>
            <div class="locker-status">${getStatusText(locker.status)}</div>
            ${locker.status === 'occupied' && locker.current_user_id ? `<div class="locker-owner">Student: ${locker.current_user_id}</div>` : ''}
            ${locker.is_open ? '<div class="locker-open">🔓 OPEN</div>' : ''}
            ${adminControls}
        `;
        
        // User can only interact with available lockers
        if (!isAdmin && locker.status === 'available') {
            lockerElement.classList.add('clickable');
            lockerElement.onclick = () => requestLocker(locker.locker_number);
        }
        
        lockerGrid.appendChild(lockerElement);
    });
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'available': '🟢 Available',
        'occupied': '🔴 Occupied', 
        'maintenance': '🟡 Maintenance'
    };
    return statusMap[status] || status;
}

// Admin functions
function toggleLocker(lockerNumber) {
    const locker = lockers.find(l => l.locker_number === lockerNumber);
    if (locker) {
        locker.is_open = !locker.is_open;
        saveLockers();
        loadLockers();
        showMessage('admin', `Locker ${lockerNumber} ${locker.is_open ? 'unlocked 🔓' : 'locked 🔒'}`, 'success');
    }
}

function maintainLocker(lockerNumber) {
    const locker = lockers.find(l => l.locker_number === lockerNumber);
    if (locker) {
        locker.status = 'maintenance';
        locker.current_user_id = null;
        locker.is_open = false;
        saveLockers();
        loadLockers();
        showMessage('admin', `Locker ${lockerNumber} set to maintenance 🛠️`, 'success');
    }
}

function releaseLocker(lockerNumber) {
    const locker = lockers.find(l => l.locker_number === lockerNumber);
    if (locker) {
        locker.status = 'available';
        locker.current_user_id = null;
        locker.is_open = false;
        saveLockers();
        loadLockers();
        showMessage('admin', `Locker ${lockerNumber} released and available 🔄`, 'success');
    }
}

// User functions
function requestLocker(lockerNumber) {
    if (!currentUser || isAdmin) return;

    const locker = lockers.find(l => l.locker_number === lockerNumber);
    if (locker && locker.status === 'available') {
        locker.status = 'occupied';
        locker.current_user_id = currentUser.studentId;
        locker.is_open = true; // Auto-unlock when assigned
        saveLockers();
        loadLockers();
        showMessage('user', `🎉 Locker ${lockerNumber} assigned to you! It's now unlocked.`, 'success');
    } else {
        showMessage('user', '❌ Locker is not available', 'error');
    }
}

// Message display
function showMessage(panel, text, type) {
    let messageElement;
    if (panel === 'admin') {
        messageElement = adminMessage;
    } else {
        messageElement = userMessage;
    }
    
    if (messageElement) {
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 4000);
    } else {
        // Fallback alert if message element not found
        alert(text);
    }
}

// Make functions globally available
window.toggleLocker = toggleLocker;
window.maintainLocker = maintainLocker;
window.releaseLocker = releaseLocker;
window.requestLocker = requestLocker;

// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
