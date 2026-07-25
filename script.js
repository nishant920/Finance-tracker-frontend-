/* ==========================================================================
   PERSONAL FINANCE TRACKER - FRONTEND APPLICATION SCRIPT
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. CONFIGURATION & STATE MANAGEMENT
// --------------------------------------------------------------------------

// Backend API Base URL configuration - change this easily for deployment
const API_BASE_URL = "http://localhost:8080/api";

/**
 * Retrieve the JWT token stored in browser localStorage
 */
function getAuthToken() {
  return localStorage.getItem("authToken");
}

/**
 * Store the JWT token in browser localStorage for persistent session
 */
function setAuthToken(token) {
  localStorage.setItem("authToken", token);
}

/**
 * Remove the JWT token from localStorage (logout helper)
 */
function removeAuthToken() {
  localStorage.removeItem("authToken");
}


// --------------------------------------------------------------------------
// 2. DOM ELEMENT REFERENCES
// --------------------------------------------------------------------------

// Containers / Screens
const loginCard = document.getElementById("login-card");
const signupCard = document.getElementById("signup-card");
const dashboardContainer = document.getElementById("dashboard-container");

// Forms & Action Controls
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const updateBalanceForm = document.getElementById("update-balance-form");
const btnToggleUpdateBalance = document.getElementById("btn-toggle-update-balance");

// Input Fields
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");

const signupNameInput = document.getElementById("signup-name");
const signupEmailInput = document.getElementById("signup-email");
const signupPasswordInput = document.getElementById("signup-password");

const updateBalanceInput = document.getElementById("update-balance-input");

// Display Elements & Alert Boxes
const freeToSpendAmount = document.getElementById("free-to-spend-amount");
const loginAlert = document.getElementById("login-alert");
const signupAlert = document.getElementById("signup-alert");
const dashboardAlert = document.getElementById("dashboard-alert");

// Switch Screen Links
const linkToSignup = document.getElementById("link-to-signup");
const linkToLogin = document.getElementById("link-to-login");


// --------------------------------------------------------------------------
// 3. UI SCREEN SWITCHING & ALERT HELPERS
// --------------------------------------------------------------------------

/**
 * Switch view to show the Login Screen
 */
function showLoginForm() {
  hideAlert(loginAlert);
  hideAlert(signupAlert);
  hideAlert(dashboardAlert);
  signupCard.classList.add("hidden");
  dashboardContainer.classList.add("hidden");
  loginCard.classList.remove("hidden");
}

/**
 * Switch view to show the Signup Screen
 */
function showSignupForm() {
  hideAlert(loginAlert);
  hideAlert(signupAlert);
  hideAlert(dashboardAlert);
  loginCard.classList.add("hidden");
  dashboardContainer.classList.add("hidden");
  signupCard.classList.remove("hidden");
}

/**
 * Switch view to show the Dashboard Screen and load user balance
 */
function showDashboardView() {
  hideAlert(dashboardAlert);
  loginCard.classList.add("hidden");
  signupCard.classList.add("hidden");
  dashboardContainer.classList.remove("hidden");

  // Fetch and display free-to-spend balance on dashboard load
  fetchFreeToSpend();
}

/**
 * Helper function to display user-friendly alert messages (Error or Success)
 * @param {HTMLElement} alertElement - The div element to show the alert in
 * @param {string} message - Text message to display
 * @param {boolean} isError - True for red error box, false for green success box
 */
function showAlert(alertElement, message, isError = true) {
  alertElement.textContent = message;
  alertElement.className = "alert " + (isError ? "alert-error" : "alert-success");
  alertElement.style.display = "block";
}

/**
 * Helper function to hide an alert box
 */
function hideAlert(alertElement) {
  alertElement.style.display = "none";
  alertElement.textContent = "";
}


// --------------------------------------------------------------------------
// 4. API CALL HANDLERS
// --------------------------------------------------------------------------

/**
 * Fetches the user's current Free-to-Spend balance from GET /api/balance/free-to-spend
 */
async function fetchFreeToSpend() {
  const token = getAuthToken();
  if (!token) {
    showLoginForm();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/balance/free-to-spend`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      // Token expired or invalid -> logout user
      removeAuthToken();
      showLoginForm();
      showAlert(loginAlert, "Session expired. Please log in again.", true);
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || "Failed to load balance";
      showAlert(dashboardAlert, errorMessage, true);
      return;
    }

    // Response body contains the balance number (e.g. 50000.00)
    const balanceText = await response.text();
    const balanceNum = parseFloat(balanceText) || 0;

    // Display formatted currency string (e.g. ₹50,000.00)
    freeToSpendAmount.textContent = `₹${balanceNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  } catch (error) {
    console.error("Fetch balance error:", error);
    showAlert(dashboardAlert, "Unable to connect to server to fetch balance.", true);
  }
}

/**
 * Handles setting/updating the user's balance via PUT /api/balance
 */
async function handleUpdateBalance(event) {
  event.preventDefault();
  hideAlert(dashboardAlert);

  const token = getAuthToken();
  if (!token) {
    showLoginForm();
    return;
  }

  const newBalance = parseFloat(updateBalanceInput.value);
  if (isNaN(newBalance) || newBalance < 0) {
    showAlert(dashboardAlert, "Please enter a valid balance amount.", true);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/balance`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ balance: newBalance })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || "Failed to update balance";
      showAlert(dashboardAlert, errorMessage, true);
      return;
    }

    // Success flow: hide inline form, clear input, refetch and re-display free-to-spend
    updateBalanceForm.reset();
    updateBalanceForm.classList.add("hidden");
    fetchFreeToSpend();

  } catch (error) {
    console.error("Update balance error:", error);
    showAlert(dashboardAlert, "Unable to connect to server to update balance.", true);
  }
}

/**
 * Handles User Signup / Registration
 * Endpoint: POST /api/auth/save
 */
async function handleSignup(event) {
  event.preventDefault();
  hideAlert(signupAlert);

  const name = signupNameInput.value.trim();
  const email = signupEmailInput.value.trim();
  const password = signupPasswordInput.value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || data.error || "Failed to register account";
      showAlert(signupAlert, errorMessage, true);
      return;
    }

    signupForm.reset();
    showAlert(signupAlert, "Check your email to verify your account, then log in", false);

  } catch (error) {
    console.error("Signup error:", error);
    showAlert(signupAlert, "Unable to connect to backend server. Please make sure backend is running.", true);
  }
}

/**
 * Handles User Login & Token Acquisition
 * Endpoint: POST /api/auth/login
 */
async function handleLogin(event) {
  event.preventDefault();
  hideAlert(loginAlert);

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const token = await response.text();
      setAuthToken(token);
      console.log("Logged in successfully! Token persisted in localStorage.");

      loginForm.reset();
      showDashboardView();

    } else {
      let errorMessage = "Invalid email or password";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }

      showAlert(loginAlert, errorMessage, true);
    }

  } catch (error) {
    console.error("Login error:", error);
    showAlert(loginAlert, "Unable to connect to backend server. Please check your connection.", true);
  }
}


// --------------------------------------------------------------------------
// 5. SESSION PERSISTENCE & INITIALIZATION
// --------------------------------------------------------------------------

/**
 * Checks for an existing JWT token in localStorage on page load.
 * If token exists, automatically transitions to the Dashboard view.
 */
function checkExistingSession() {
  const token = getAuthToken();
  if (token) {
    console.log("Found active session token in localStorage. Showing dashboard.");
    showDashboardView();
  } else {
    showLoginForm();
  }
}


// --------------------------------------------------------------------------
// 6. EVENT LISTENERS SETUP
// --------------------------------------------------------------------------

// Switch screens on link click
linkToSignup.addEventListener("click", showSignupForm);
linkToLogin.addEventListener("click", showLoginForm);

// Form submit handlers
signupForm.addEventListener("submit", handleSignup);
loginForm.addEventListener("submit", handleLogin);
updateBalanceForm.addEventListener("submit", handleUpdateBalance);

// Toggle inline update balance form
btnToggleUpdateBalance.addEventListener("click", () => {
  hideAlert(dashboardAlert);
  updateBalanceForm.classList.toggle("hidden");
});

// Run session check when page loads
window.addEventListener("DOMContentLoaded", checkExistingSession);
