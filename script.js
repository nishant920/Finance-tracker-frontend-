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

// Forms
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

// Input Fields
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");

const signupNameInput = document.getElementById("signup-name");
const signupEmailInput = document.getElementById("signup-email");
const signupPasswordInput = document.getElementById("signup-password");

// Alert Boxes for Messages & Errors
const loginAlert = document.getElementById("login-alert");
const signupAlert = document.getElementById("signup-alert");

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
  loginCard.classList.add("hidden");
  dashboardContainer.classList.add("hidden");
  signupCard.classList.remove("hidden");
}

/**
 * Switch view to show the Dashboard Screen after successful login
 */
function showDashboardView() {
  loginCard.classList.add("hidden");
  signupCard.classList.add("hidden");
  dashboardContainer.classList.remove("hidden");
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
 * Handles User Signup / Registration
 * Endpoint: POST /api/auth/save
 */
async function handleSignup(event) {
  // Prevent default HTML form refresh
  event.preventDefault();
  hideAlert(signupAlert);

  // Extract user input values
  const name = signupNameInput.value.trim();
  const email = signupEmailInput.value.trim();
  const password = signupPasswordInput.value;

  try {
    // Send HTTP POST request to backend API
    const response = await fetch(`${API_BASE_URL}/auth/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    // Check if HTTP response status is NOT 2xx (e.g. 400 or 409 error)
    if (!response.ok) {
      // Extract user-friendly error message from backend ErrorResponse object
      const errorMessage = data.message || data.error || "Failed to register account";
      showAlert(signupAlert, errorMessage, true);
      return;
    }

    // Success flow
    signupForm.reset();
    showAlert(signupAlert, "Check your email to verify your account, then log in", false);

  } catch (error) {
    // Catch network failures or backend unreachable errors
    console.error("Signup error:", error);
    showAlert(signupAlert, "Unable to connect to backend server. Please make sure backend is running.", true);
  }
}

/**
 * Handles User Login & Token Acquisition
 * Endpoint: POST /api/auth/login
 */
async function handleLogin(event) {
  // Prevent default HTML form refresh
  event.preventDefault();
  hideAlert(loginAlert);

  // Extract user input values
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  try {
    // Send HTTP POST request to backend login endpoint
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    // Handle plain text JWT token or JSON error response
    if (response.ok) {
      // Login endpoint returns raw JWT string token
      const token = await response.text();

      // Store token in localStorage so user stays logged in after page refresh
      setAuthToken(token);
      console.log("Logged in successfully! Token persisted in localStorage.");

      // Clear input fields and transition to Dashboard view
      loginForm.reset();
      showDashboardView();

    } else {
      // If error response returned JSON (from GlobalExceptionHandler)
      let errorMessage = "Invalid email or password";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Fallback if response is text
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }

      showAlert(loginAlert, errorMessage, true);
    }

  } catch (error) {
    // Catch network failures or server offline errors
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

// Run session check when page loads
window.addEventListener("DOMContentLoaded", checkExistingSession);
