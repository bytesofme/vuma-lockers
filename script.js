// Configuration
const BACKEND_URL = "https://vuma-lockers.up.railway.app";

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
let lockers = [];

// Initialize the app
async function initApp() {
    await loadLockers();
    checkAuthState();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    adminLoginBtn.addEventListener('click', () => toggleLoginForm('admin'));
    userLoginBtn.addEventListener('click', () => toggleLoginForm('user'));
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    userLoginForm.addEventListener('submit', handleUserLogin);
    logoutBtn.addEventListener('click', handleLogout);
    userLogoutBtn.addEventListener('click', handleLogout);
}

// Toggle login forms
function toggleLoginForm(type) {
    adminLoginForm.style.display = type === 'admin' ? 'block' : 'none';
    userLoginForm.style.display = type === 'user' ? 'block' : 'none';
}

// Handle Admin Login
async function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    try {
        const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = { username, isAdmin: true };
            isAdmin = true;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showAdminView();
            showMessage('admin', 'Login successful!', 'success');
        } else {
            showMessage('admin', data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('admin', 'Network error. Please try again.', 'error');
    }
}

// Handle User Login
async function handleUserLogin(e) {
    e.preventDefault();
    const studentId = document.getElementById('studentId').value;

    try {
        const response = await fetch(`${BACKEND_URL}/api/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentId })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = { studentId, isAdmin: false };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showUserView();
            showMessage('user', 'Login successful!', 'success');
        } else {
            showMessage('user', data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('user', 'Network error. Please try again.', 'error');
    }
}

// Handle Logout
function handleLogout() {
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem('currentUser');
    showPublicView();
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
    adminPanel.style.display = 'none';
    userPanel.style.display = 'none';
    lockerGrid.style.display = 'grid';
}

function showAdminView() {
    adminPanel.style.display = 'block';
    userPanel.style.display = 'none';
    lockerGrid.style.display = 'grid';
    loadLockers();
}

function showUserView() {
    adminPanel.style.display = 'none';
    userPanel.style.display = 'block';
    lockerGrid.style.display = 'grid';
    loadLockers();
}

// Load lockers from backend
async function loadLockers() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/lockers`);
        const data = await response.json();
        
        if (response.ok) {
            lockers = data;
            renderLockers();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error loading lockers:', error);
        showMessage(isAdmin ? 'admin' : 'user', 'Failed to load lockers', 'error');
    }
}

// Render lockers in the grid
function renderLockers() {
    lockerGrid.innerHTML = '';
    
    lockers.forEach(locker => {
        const lockerElement = document.createElement('div');
        lockerElement.className = `locker ${locker.status} ${locker.isOpen ? 'open' : ''}`;
        lockerElement.innerHTML = `
            <div class="locker-number">${locker.lockerNumber}</div>
            <div class="locker-status">${getStatusText(locker.status)}</div>
            ${locker.status === 'occupied' ? `<div class="locker-owner">${locker.currentUser}</div>` : ''}
            ${isAdmin ? `<div class="admin-controls">
                <button onclick="toggleLocker(${locker.lockerNumber})">${locker.isOpen ? 'Lock' : 'Unlock'}</button>
                <button onclick="maintainLocker(${locker.lockerNumber})">Maintain</button>
                <button onclick="releaseLocker(${locker.lockerNumber})">Release</button>
            </div>` : ''}
        `;
        
        // User can only interact with available lockers
        if (!isAdmin && locker.status === 'available') {
            lockerElement.classList.add('clickable');
            lockerElement.onclick = () => requestLocker(locker.lockerNumber);
        }
        
        lockerGrid.appendChild(lockerElement);
    });
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'available': 'Available',
        'occupied': 'Occupied',
        'maintenance': 'Maintenance'
    };
    return statusMap[status] || status;
}

// Admin functions
async function toggleLocker(lockerNumber) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/lockers/${lockerNumber}/toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (response.ok) {
            await loadLockers();
            showMessage('admin', `Locker ${lockerNumber} ${data.isOpen ? 'unlocked' : 'locked'}`, 'success');
        } else {
            showMessage('admin', data.error || 'Operation failed', 'error');
        }
    } catch (error) {
        showMessage('admin', 'Network error. Please try again.', 'error');
    }
}

async function maintainLocker(lockerNumber) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/lockers/${lockerNumber}/maintain`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (response.ok) {
            await loadLockers();
            showMessage('admin', `Locker ${lockerNumber} set to maintenance`, 'success');
        } else {
            showMessage('admin', data.error || 'Operation failed', 'error');
        }
    } catch (error) {
        showMessage('admin', 'Network error. Please try again.', 'error');
    }
}

async function releaseLocker(lockerNumber) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/lockers/${lockerNumber}/release`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (response.ok) {
            await loadLockers();
            showMessage('admin', `Locker ${lockerNumber} released`, 'success');
        } else {
            showMessage('admin', data.error || 'Operation failed', 'error');
        }
    } catch (error) {
        showMessage('admin', 'Network error. Please try again.', 'error');
    }
}

// User functions
async function requestLocker(lockerNumber) {
    if (!currentUser || isAdmin) return;

    try {
        const response = await fetch(`${BACKEND_URL}/api/lockers/${lockerNumber}/occupy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentId: currentUser.studentId })
        });

        const data = await response.json();

        if (response.ok) {
            await loadLockers();
            showMessage('user', `Locker ${lockerNumber} assigned to you!`, 'success');
        } else {
            showMessage('user', data.error || 'Failed to assign locker', 'error');
        }
    } catch (error) {
        showMessage('user', 'Network error. Please try again.', 'error');
    }
}

// Message display
function showMessage(panel, text, type) {
    const messageElement = panel === 'admin' ? adminMessage : userMessage;
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
    
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
