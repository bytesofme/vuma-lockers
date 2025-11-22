// Vuma Lockers - Complete Frontend Management System
console.log('🚀 Vuma Lockers System Initialized');

// Configuration
const CONFIG = {
    appName: 'Vuma Lockers',
    version: '1.0.0',
    maxLockers: 20
};

// Data Management
class LockerManager {
    constructor() {
        this.lockers = this.loadLockers();
        this.currentUser = this.loadCurrentUser();
        this.isAdmin = this.currentUser ? this.currentUser.isAdmin : false;
    }

    loadLockers() {
        const saved = localStorage.getItem('vumaLockers');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Initialize default lockers
        return Array.from({ length: CONFIG.maxLockers }, (_, i) => ({
            locker_number: i + 1,
            status: 'available',
            is_open: false,
            current_user_id: null,
            last_updated: new Date().toISOString()
        }));
    }

    saveLockers() {
        localStorage.setItem('vumaLockers', JSON.stringify(this.lockers));
    }

    loadCurrentUser() {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    }

    saveCurrentUser(user) {
        this.currentUser = user;
        this.isAdmin = user ? user.isAdmin : false;
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
    }

    // Locker operations
    getLocker(number) {
        return this.lockers.find(l => l.locker_number === number);
    }

    toggleLocker(number) {
        const locker = this.getLocker(number);
        if (locker) {
            locker.is_open = !locker.is_open;
            locker.last_updated = new Date().toISOString();
            this.saveLockers();
            return { success: true, is_open: locker.is_open };
        }
        return { success: false, error: 'Locker not found' };
    }

    setMaintenance(number) {
        const locker = this.getLocker(number);
        if (locker) {
            locker.status = 'maintenance';
            locker.current_user_id = null;
            locker.is_open = false;
            locker.last_updated = new Date().toISOString();
            this.saveLockers();
            return { success: true };
        }
        return { success: false, error: 'Locker not found' };
    }

    releaseLocker(number) {
        const locker = this.getLocker(number);
        if (locker) {
            locker.status = 'available';
            locker.current_user_id = null;
            locker.is_open = false;
            locker.last_updated = new Date().toISOString();
            this.saveLockers();
            return { success: true };
        }
        return { success: false, error: 'Locker not found' };
    }

    assignLocker(number, studentId) {
        const locker = this.getLocker(number);
        if (locker && locker.status === 'available') {
            locker.status = 'occupied';
            locker.current_user_id = studentId;
            locker.is_open = true; // Auto-unlock when assigned
            locker.last_updated = new Date().toISOString();
            this.saveLockers();
            return { success: true };
        }
        return { success: false, error: 'Locker not available' };
    }

    getAvailableLockers() {
        return this.lockers.filter(l => l.status === 'available');
    }

    getOccupiedLockers() {
        return this.lockers.filter(l => l.status === 'occupied');
    }

    getUserLockers(userId) {
        return this.lockers.filter(l => l.current_user_id === userId);
    }
}

// UI Manager
class UIManager {
    constructor(lockerManager) {
        this.lockerManager = lockerManager;
        this.elements = this.initializeElements();
    }

    initializeElements() {
        const elements = {
            lockerGrid: document.getElementById('lockerGrid'),
            adminPanel: document.getElementById('adminPanel'),
            userPanel: document.getElementById('userPanel'),
            publicView: document.getElementById('publicView'),
            adminLoginBtn: document.getElementById('adminLoginBtn'),
            userLoginBtn: document.getElementById('userLoginBtn'),
            adminLoginForm: document.getElementById('adminLoginForm'),
            userLoginForm: document.getElementById('userLoginForm'),
            adminLoginFormElement: document.getElementById('adminLoginFormElement'),
            userLoginFormElement: document.getElementById('userLoginFormElement'),
            logoutBtn: document.getElementById('logoutBtn'),
            userLogoutBtn: document.getElementById('userLogoutBtn'),
            adminMessage: document.getElementById('adminMessage'),
            userMessage: document.getElementById('userMessage'),
            adminUsername: document.getElementById('adminUsername'),
            adminPassword: document.getElementById('adminPassword'),
            studentId: document.getElementById('studentId')
        };

        // Validate critical elements
        if (!elements.lockerGrid) {
            console.error('❌ Critical element lockerGrid not found');
        }

        return elements;
    }

    setupEventListeners() {
        const { e } = this.elements;

        // Login buttons
        if (e.adminLoginBtn) e.adminLoginBtn.addEventListener('click', () => this.showLoginForm('admin'));
        if (e.userLoginBtn) e.userLoginBtn.addEventListener('click', () => this.showLoginForm('user'));

        // Login forms
        if (e.adminLoginFormElement) e.adminLoginFormElement.addEventListener('submit', (event) => this.handleAdminLogin(event));
        if (e.userLoginFormElement) e.userLoginFormElement.addEventListener('submit', (event) => this.handleUserLogin(event));

        // Logout buttons
        if (e.logoutBtn) e.logoutBtn.addEventListener('click', () => this.handleLogout());
        if (e.userLogoutBtn) e.userLogoutBtn.addEventListener('click', () => this.handleLogout());
    }

    showLoginForm(type) {
        const { e } = this.elements;
        if (type === 'admin') {
            e.adminLoginForm.style.display = 'block';
            e.userLoginForm.style.display = 'none';
            if (e.adminUsername) e.adminUsername.focus();
        } else {
            e.userLoginForm.style.display = 'block';
            e.adminLoginForm.style.display = 'none';
            if (e.studentId) e.studentId.focus();
        }
    }

    handleAdminLogin(event) {
        event.preventDefault();
        const { e } = this.elements;
        
        const username = e.adminUsername ? e.adminUsername.value : '';
        const password = e.adminPassword ? e.adminPassword.value : '';

        // Simple admin validation
        if (username === 'admin' && password === 'admin123') {
            this.lockerManager.saveCurrentUser({ username, isAdmin: true });
            this.showAdminView();
            this.showMessage('admin', '✅ Admin login successful!', 'success');
            
            // Clear form
            if (e.adminUsername) e.adminUsername.value = '';
            if (e.adminPassword) e.adminPassword.value = '';
        } else {
            this.showMessage('admin', '❌ Invalid admin credentials', 'error');
        }
    }

    handleUserLogin(event) {
        event.preventDefault();
        const { e } = this.elements;
        
        const studentId = e.studentId ? e.studentId.value : '';

        // Simple student validation
        if (studentId && studentId.length >= 3) {
            this.lockerManager.saveCurrentUser({ studentId, isAdmin: false });
            this.showUserView();
            this.showMessage('user', `✅ Welcome, Student ${studentId}!`, 'success');
            
            // Clear form
            if (e.studentId) e.studentId.value = '';
        } else {
            this.showMessage('user', '❌ Please enter a valid student ID (min 3 characters)', 'error');
        }
    }

    handleLogout() {
        this.lockerManager.saveCurrentUser(null);
        this.showPublicView();
        this.showMessage('admin', '👋 Logged out successfully', 'success');
    }

    showPublicView() {
        const { e } = this.elements;
        if (e.adminPanel) e.adminPanel.style.display = 'none';
        if (e.userPanel) e.userPanel.style.display = 'none';
        if (e.publicView) e.publicView.style.display = 'flex';
        if (e.adminLoginForm) e.adminLoginForm.style.display = 'none';
        if (e.userLoginForm) e.userLoginForm.style.display = 'none';
        this.renderLockers();
    }

    showAdminView() {
        const { e } = this.elements;
        if (e.adminPanel) e.adminPanel.style.display = 'flex';
        if (e.userPanel) e.userPanel.style.display = 'none';
        if (e.publicView) e.publicView.style.display = 'none';
        if (e.adminLoginForm) e.adminLoginForm.style.display = 'none';
        this.renderLockers();
    }

    showUserView() {
        const { e } = this.elements;
        if (e.adminPanel) e.adminPanel.style.display = 'none';
        if (e.userPanel) e.userPanel.style.display = 'flex';
        if (e.publicView) e.publicView.style.display = 'none';
        if (e.userLoginForm) e.userLoginForm.style.display = 'none';
        this.renderLockers();
    }

    renderLockers() {
        const { e } = this.elements;
        if (!e.lockerGrid) {
            console.error('Cannot render lockers: lockerGrid element not found');
            return;
        }

        e.lockerGrid.innerHTML = '';

        this.lockerManager.lockers.forEach(locker => {
            const lockerElement = this.createLockerElement(locker);
            e.lockerGrid.appendChild(lockerElement);
        });
    }

    createLockerElement(locker) {
        const element = document.createElement('div');
        const statusClass = `locker ${locker.status} ${locker.is_open ? 'open' : ''}`;
        element.className = statusClass;

        // Admin controls
        let adminControls = '';
        if (this.lockerManager.isAdmin) {
            adminControls = `
                <div class="admin-controls">
                    <button onclick="app.toggleLocker(${locker.locker_number})" class="btn-toggle">
                        ${locker.is_open ? '🔒 Lock' : '🔓 Unlock'}
                    </button>
                    <button onclick="app.maintainLocker(${locker.locker_number})" class="btn-maintain">
                        🛠️ Maintain
                    </button>
                    <button onclick="app.releaseLocker(${locker.locker_number})" class="btn-release">
                        🔄 Release
                    </button>
                </div>
            `;
        }

        // Locker content
        element.innerHTML = `
            <div class="locker-number">Locker ${locker.locker_number}</div>
            <div class="locker-status">${this.getStatusText(locker.status)}</div>
            ${locker.status === 'occupied' && locker.current_user_id ? 
                `<div class="locker-owner">👤 ${locker.current_user_id}</div>` : ''}
            ${locker.is_open ? '<div class="locker-open">🔓 OPEN</div>' : ''}
            ${adminControls}
        `;

        // User interaction for available lockers
        if (!this.lockerManager.isAdmin && locker.status === 'available') {
            element.classList.add('clickable');
            element.addEventListener('click', () => this.requestLocker(locker.locker_number));
        }

        return element;
    }

    getStatusText(status) {
        const statusMap = {
            'available': '🟢 Available',
            'occupied': '🔴 Occupied',
            'maintenance': '🟡 Maintenance'
        };
        return statusMap[status] || status;
    }

    showMessage(panel, text, type) {
        const { e } = this.elements;
        const messageElement = panel === 'admin' ? e.adminMessage : e.userMessage;
        
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.className = `message ${type}`;
            messageElement.style.display = 'block';

            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 4000);
        } else {
            // Fallback to console and alert
            console.log(`${type.toUpperCase()}: ${text}`);
            if (type === 'error') {
                alert(text);
            }
        }
    }

    // Public methods for global access
    toggleLocker(number) {
        const result = this.lockerManager.toggleLocker(number);
        if (result.success) {
            this.renderLockers();
            this.showMessage('admin', `Locker ${number} ${result.is_open ? 'unlocked 🔓' : 'locked 🔒'}`, 'success');
        } else {
            this.showMessage('admin', result.error, 'error');
        }
    }

    maintainLocker(number) {
        const result = this.lockerManager.setMaintenance(number);
        if (result.success) {
            this.renderLockers();
            this.showMessage('admin', `Locker ${number} set to maintenance 🛠️`, 'success');
        } else {
            this.showMessage('admin', result.error, 'error');
        }
    }

    releaseLocker(number) {
        const result = this.lockerManager.releaseLocker(number);
        if (result.success) {
            this.renderLockers();
            this.showMessage('admin', `Locker ${number} released 🔄`, 'success');
        } else {
            this.showMessage('admin', result.error, 'error');
        }
    }

    requestLocker(number) {
        if (!this.lockerManager.currentUser || this.lockerManager.isAdmin) return;

        const result = this.lockerManager.assignLocker(number, this.lockerManager.currentUser.studentId);
        if (result.success) {
            this.renderLockers();
            this.showMessage('user', `🎉 Locker ${number} assigned to you! It's now unlocked.`, 'success');
        } else {
            this.showMessage('user', result.error, 'error');
        }
    }
}

// Initialize application
class VumaLockersApp {
    constructor() {
        this.lockerManager = new LockerManager();
        this.uiManager = new UIManager(this.lockerManager);
    }

    init() {
        console.log('🚀 Initializing Vuma Lockers App...');
        
        // Setup event listeners
        this.uiManager.setupEventListeners();

        // Show appropriate view based on authentication
        if (this.lockerManager.currentUser) {
            if (this.lockerManager.isAdmin) {
                this.uiManager.showAdminView();
            } else {
                this.uiManager.showUserView();
            }
        } else {
            this.uiManager.showPublicView();
        }

        // Make app globally available
        window.app = this;

        console.log('✅ Vuma Lockers App initialized successfully');
    }

    // Public methods for global access
    toggleLocker(number) {
        this.uiManager.toggleLocker(number);
    }

    maintainLocker(number) {
        this.uiManager.maintainLocker(number);
    }

    releaseLocker(number) {
        this.uiManager.releaseLocker(number);
    }

    requestLocker(number) {
        this.uiManager.requestLocker(number);
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const app = new VumaLockersApp();
    app.init();
});

// Global functions for HTML onclick handlers
window.toggleLocker = function(number) {
    if (window.app) window.app.toggleLocker(number);
};

window.maintainLocker = function(number) {
    if (window.app) window.app.maintainLocker(number);
};

window.releaseLocker = function(number) {
    if (window.app) window.app.releaseLocker(number);
};

window.requestLocker = function(number) {
    if (window.app) window.app.requestLocker(number);
};
