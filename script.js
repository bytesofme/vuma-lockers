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
            // Clear form
            document.getElementById('adminUsername').value = '';
            document.getElementById('adminPassword').value = '';
        } else {
            showMessage('admin', data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
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
            // Clear form
            document.getElementById('studentId').value = '';
        } else {
            showMessage('user', data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('user', 'Network error. Please try again.', 'error');
    }
}

// Handle Logout
function handleLogout() {
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem('currentUser');
    showPublicView();
    showMessage(isAdmin ? 'admin' : 'user', 'Logged out successfully', 'success');
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
    // Reset login forms
    adminLoginForm.style.display = 'none';
    userLoginForm.style.display = 'none';
}

function showAdminView() {
    adminPanel.style.display = 'block';
    userPanel.style.display = 'none';
    lockerGrid.style.display = 'grid';
    adminLoginForm.style.display = 'none';
    loadLockers();
}

function showUserView() {
    adminPanel.style.display = 'none';
    userPanel.style.display = 'block';
    lockerGrid.style.display = 'grid';
    userLoginForm.style.display = 'none';
    loadLockers();
}

// Load lockers from backend
async function loadLockers() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/lockers`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        lockers = data;
        renderLockers();
        
    } catch (error) {
        console.error('Error loading lockers:', error);
        // Fallback to demo data if backend is down
        lockers = Array.from({ length: 20 }, (_, i) => ({
            locker_number: i + 1,
            status: 'available',
            is_open: false,
            current_user_id: null
        }));
        renderLockers();
        showMessage(isAdmin ? 'admin' : 'user', 'Using demo data - backend unavailable', 'error');
    }
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
        lockerElement.innerHTML = `
            <div class="locker-number">${locker.locker_number}</div>
            <div class="locker-status">${getStatusText(locker.status)}</div>
            ${locker.status === 'occupied' && locker.current_user_id ? `<div class="locker-owner">${locker.current_user_id}</div>` : ''}
            ${isAdmin ? `
            <div class="admin-controls">
                <button onclick="toggleLocker(${locker.locker_number})" class="btn-toggle">${locker.is_open ? '🔒 Lock' : '🔓 Unlock'}</button>
                <button onclick="maintainLocker(${locker.locker_number})" class="btn-maintain">🛠️ Maintain</button>
                <button onclick="releaseLocker(${locker.locker_number})" class="btn-release">🔄 Release</button>
            </div>
            ` : ''}
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        await loadLockers();
        showMessage('admin', `Locker ${lockerNumber} ${data.isOpen ? 'unlocked' : 'locked'}`, 'success');
        
    } catch (error) {
        console.error('Toggle error:', error);
        showMessage('admin', 'Failed to toggle locker', 'error');
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await loadLockers();
        showMessage('admin', `Locker ${lockerNumber} set to maintenance`, 'success');
        
    } catch (error) {
        console.error('Maintain error:', error);
        showMessage('admin', 'Failed to set maintenance', 'error');
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await loadLockers();
        showMessage('admin', `Locker ${lockerNumber} released`, 'success');
        
    } catch (error) {
        console.error('Release error:', error);
        showMessage('admin', 'Failed to release locker', 'error');
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

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to assign locker');
        }

        await loadLockers();
        showMessage('user', `Locker ${lockerNumber} assigned to you!`, 'success');
        
    } catch (error) {
        console.error('Request locker error:', error);
        showMessage('user', error.message || 'Failed to assign locker', 'error');
    }
}

// Message display
function showMessage(panel, text, type) {
    const messageElement = panel === 'admin' ? adminMessage : userMessage;
    if (messageElement) {
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 4000);
    }
}

// Make functions globally available
window.toggleLocker = toggleLocker;
window.maintainLocker = maintainLocker;
window.releaseLocker = releaseLocker;
window.requestLocker = requestLocker;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
