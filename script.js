// Signup Logic
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const user = { name, email, password, role: email.includes("admin") ? "admin" : "user" };
    localStorage.setItem(email, JSON.stringify(user));
    alert("Account created successfully!");
    window.location.href = "index.html";
  });

  // Password Strength Checker
  const passwordInput = document.getElementById("signupPassword");
  const strengthDisplay = document.getElementById("strength");
  passwordInput.addEventListener("input", () => {
    const val = passwordInput.value;
    if (val.length < 5) {
      strengthDisplay.textContent = "Weak password";
      strengthDisplay.style.color = "red";
    } else if (val.length < 8) {
      strengthDisplay.textContent = "Moderate strength";
      strengthDisplay.style.color = "orange";
    } else {
      strengthDisplay.textContent = "Strong password";
      strengthDisplay.style.color = "green";
    }
  });
}

// Login Logic
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const userData = localStorage.getItem(email);

    if (!userData) {
      document.getElementById("loginError").textContent = "User not found!";
      return;
    }

    const user = JSON.parse(userData);
    if (user.password !== password) {
      document.getElementById("loginError").textContent = "Incorrect password!";
      return;
    }

    if (user.role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      localStorage.setItem("activeUser", JSON.stringify(user));
      window.location.href = "user-dashboard.html";
    }
  });
}
