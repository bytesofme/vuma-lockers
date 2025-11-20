// This function runs when any page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Vuma Lockers System Loaded!");
    
    // Check if we're on login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        setupLoginForm();
    }
    
    // Check if we're on signup page
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        setupSignupForm();
    }
});

// Setup Login Form - DEMO VERSION FOR PRESENTATION
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Get form values
        const role = document.getElementById('userRole').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Simple validation
        if (!role || !email || !password) {
            showMessage("Please fill in all fields!", "error");
            return;
        }
        
        // Show loading
        const button = loginForm.querySelector('button[type="submit"]');
        showLoading(button, "Logging in...");
        
        // ✅ USE DEMO LOGIN FOR PRESENTATION (no backend needed)
        const result = await demoLogin(role, email, password);
        
        if (result.success) {
            showMessage("Login successful! Redirecting...", "success");
            redirectToDashboard(role);
        } else {
            showMessage(result.message || "Invalid email or password", "error");
            hideLoading(button, "Login to System");
        }
    });
}

// Setup Signup Form - DEMO VERSION FOR PRESENTATION
function setupSignupForm() {
    const signupForm = document.getElementById('signupForm');
    
    signupForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Get form values
        const role = document.getElementById('userRole').value;
        const fullName = document.getElementById('fullName').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        
        // Validation
        if (!role || !fullName || !phone || !email || !password || !confirmPassword) {
            showMessage("Please fill in all fields!", "error");
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage("Passwords do not match!", "error");
            return;
        }
        
        if (password.length < 6) {
            showMessage("Password must be at least 6 characters!", "error");
            return;
        }
        
        if (!agreeTerms) {
            showMessage("You must agree to the terms and conditions!", "error");
            return;
        }
        
        // Show loading
        const button = signupForm.querySelector('button[type="submit"]');
        showLoading(button, "Creating Account...");
        
        // Use demo registration
        const result = await demoRegister(role, fullName, phone, email, password);
        
        if (result.success) {
            showMessage("Account created successfully! Redirecting to login...", "success");
            setTimeout(function() {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showMessage(result.message || "Registration failed. Please try again.", "error");
            hideLoading(button, "Create Account");
        }
    });
}

// Redirect to dashboard
function redirectToDashboard(role) {
    setTimeout(function() {
        switch(role) {
            case 'admin':
                window.location.href = 'admin.html';
                break;
            case 'agent':
                window.location.href = 'agent.html';
                break;
            case 'customer':
                window.location.href = 'customer.html';
                break;
            default:
                showMessage('Unknown role selected', 'error');
        }
    }, 1000);
}

// Show loading state
function showLoading(button, text) {
    button.innerHTML = text;
    button.disabled = true;
}

// Hide loading state
function hideLoading(button, text) {
    button.innerHTML = text;
    button.disabled = false;
}

// Show message to user
function showMessage(message, type) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = message;
    
    // Style the message
    messageDiv.style.padding = '10px';
    messageDiv.style.margin = '10px 0';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.fontWeight = 'bold';
    
    if (type === 'success') {
        messageDiv.style.background = '#d4edda';
        messageDiv.style.color = '#155724';
        messageDiv.style.border = '1px solid #c3e6cb';
    } else {
        messageDiv.style.background = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.style.border = '1px solid #f5c6cb';
    }
    
    // Add to page
    const form = document.querySelector('form');
    form.parentNode.insertBefore(messageDiv, form);
    
    // Remove after 3 seconds
    setTimeout(function() {
        messageDiv.remove();
    }, 3000);
}

// ==================== DEMO FUNCTIONS FOR PRESENTATION ====================

// Demo login function - works without backend
async function demoLogin(role, email, password) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Accept any login for demo
            if (email && password) {
                resolve({
                    success: true,
                    data: {
                        user_id: Math.floor(Math.random() * 1000),
                        name: email.split('@')[0],
                        role: role
                    }
                });
            } else {
                resolve({
                    success: false,
                    message: "Please enter email and password"
                });
            }
        }, 1500);
    });
}

// Demo register function - works without backend
async function demoRegister(role, fullName, phone, email, password) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                message: "Account created successfully!"
            });
        }, 1500);
    });
}

// Demo parcel deposit function
async function demoDepositParcel(trackingNumber, recipientPhone, parcelSize) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const lockerSizes = {
                'small': 'S',
                'medium': 'M', 
                'large': 'L',
                'xlarge': 'XL'
            };
            
            const sizeCode = lockerSizes[parcelSize] || 'M';
            const lockerId = `LKR-${sizeCode}${Math.floor(Math.random() * 20) + 1}`;
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            resolve({
                success: true,
                message: "Parcel deposited successfully! SMS sent to customer.",
                locker_id: lockerId,
                otp_code: otpCode,
                sms_data: {
                    to: recipientPhone,
                    message: `📦 VUMA: Package #${trackingNumber} ready at ${lockerId}. OTP: ${otpCode}`,
                    status: 'delivered'
                }
            });
        }, 2000);
    });
}

// Store user data in localStorage for demo
function storeDemoUser(role, email) {
    localStorage.setItem('currentUser', JSON.stringify({
        id: Math.floor(Math.random() * 1000),
        name: email.split('@')[0],
        email: email,
        role: role,
        loginTime: new Date().toISOString()
    }));
}

// ==================== BACKUP: ORIGINAL BACKEND FUNCTIONS ====================

// Keep these for when you deploy backend later
const API_BASE = 'https://your-app-name.up.railway.app/api';;

async function loginToBackend(role, email, password) {
    try {
        const response = await fetch(`${API_BASE}/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('currentUser', JSON.stringify({
                id: data.user_id,
                name: data.name,
                email: email,
                role: data.role,
                loginTime: new Date().toISOString()
            }));
            
            return { success: true, data: data };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

async function registerToBackend(userData) {
    try {
        const response = await fetch(`${API_BASE}/register.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

