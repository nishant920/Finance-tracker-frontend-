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

const addCommitmentForm = document.getElementById("add-commitment-form");
const btnToggleAddCommitment = document.getElementById("btn-toggle-add-commitment");

const addTransactionForm = document.getElementById("add-transaction-form");
const btnToggleAddTransaction = document.getElementById("btn-toggle-add-transaction");

// Risk Warning Modal Elements
const riskModal = document.getElementById("risk-modal");
const riskModalMessage = document.getElementById("risk-modal-message");
const btnCancelRisk = document.getElementById("btn-cancel-risk");
const btnProceedRisk = document.getElementById("btn-proceed-risk");

// Input Fields
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");

const signupNameInput = document.getElementById("signup-name");
const signupEmailInput = document.getElementById("signup-email");
const signupPasswordInput = document.getElementById("signup-password");

const updateBalanceInput = document.getElementById("update-balance-input");

const commitmentNameInput = document.getElementById("commitment-name");
const commitmentAmountInput = document.getElementById("commitment-amount");
const commitmentDateInput = document.getElementById("commitment-date");
const commitmentFrequencySelect = document.getElementById("commitment-frequency");

const transactionAmountInput = document.getElementById("transaction-amount");
const transactionTypeSelect = document.getElementById("transaction-type");
const transactionCategoryInput = document.getElementById("transaction-category");
const transactionNoteInput = document.getElementById("transaction-note");

// Display Elements & Alert Boxes
const freeToSpendAmount = document.getElementById("free-to-spend-amount");
const commitmentsList = document.getElementById("commitments-list");
const transactionsList = document.getElementById("transactions-list");

const loginAlert = document.getElementById("login-alert");
const signupAlert = document.getElementById("signup-alert");
const dashboardAlert = document.getElementById("dashboard-alert");

// Switch Screen Links
const linkToSignup = document.getElementById("link-to-signup");
const linkToLogin = document.getElementById("link-to-login");

// Callback storage for proceed action on risk modal
let pendingProceedCallback = null;


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
  hideRiskModal();
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
  hideRiskModal();
  loginCard.classList.add("hidden");
  dashboardContainer.classList.add("hidden");
  signupCard.classList.remove("hidden");
}

/**
 * Switch view to show the Dashboard Screen and load user data
 */
function showDashboardView() {
  hideAlert(dashboardAlert);
  hideRiskModal();
  loginCard.classList.add("hidden");
  signupCard.classList.add("hidden");
  dashboardContainer.classList.remove("hidden");

  // Fetch balance, commitments, and transaction history on load
  fetchFreeToSpend();
  fetchCommitments();
  fetchTransactions();
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

/**
 * Shows the Risk Warning Confirmation Modal
 * @param {string} message Warning message returned from backend checkSpendRisk
 * @param {Function} onProceed Callback function to execute if user clicks "Proceed Anyway"
 */
function showRiskModal(message, onProceed) {
  riskModalMessage.textContent = message;
  pendingProceedCallback = onProceed;
  riskModal.classList.remove("hidden");
}

/**
 * Hides the Risk Warning Confirmation Modal
 */
function hideRiskModal() {
  riskModal.classList.add("hidden");
  pendingProceedCallback = null;
}


// --------------------------------------------------------------------------
// 4. API CALL & RENDER HANDLERS (BALANCE, COMMITMENTS, TRANSACTIONS)
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

    const balanceText = await response.text();
    const balanceNum = parseFloat(balanceText) || 0;
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

    updateBalanceForm.reset();
    updateBalanceForm.classList.add("hidden");
    fetchFreeToSpend();

  } catch (error) {
    console.error("Update balance error:", error);
    showAlert(dashboardAlert, "Unable to connect to server to update balance.", true);
  }
}

/**
 * Fetches the user's list of commitments from GET /api/commitments
 */
async function fetchCommitments() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/commitments`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || "Failed to load commitments";
      showAlert(dashboardAlert, errorMessage, true);
      return;
    }

    const commitments = await response.json();
    renderCommitments(commitments);

  } catch (error) {
    console.error("Fetch commitments error:", error);
    showAlert(dashboardAlert, "Unable to connect to server to fetch commitments.", true);
  }
}

/**
 * Renders the array of commitments into the DOM list (shows name, amount, due date, status, mark-as-paid)
 */
function renderCommitments(commitments) {
  commitmentsList.innerHTML = "";

  if (!commitments || commitments.length === 0) {
    commitmentsList.innerHTML = `<p class="empty-state">No commitments added yet.</p>`;
    return;
  }

  commitments.forEach(item => {
    const isPending = item.status === "PENDING";
    const statusBadgeClass = isPending ? "badge-pending" : "badge-paid";
    const formattedAmount = `₹${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const itemDiv = document.createElement("div");
    itemDiv.className = "commitment-item";
    itemDiv.innerHTML = `
      <div class="commitment-info">
        <h4>${item.name}</h4>
        <div class="commitment-meta">
          <span>Due: ${item.dueDate}</span>
          <span>• ${item.frequency}</span>
        </div>
      </div>
      <div class="commitment-right">
        <span class="commitment-amount">${formattedAmount}</span>
        <span class="badge ${statusBadgeClass}">${item.status}</span>
        ${isPending ? `<button class="btn btn-sm btn-outline btn-mark-paid" data-id="${item.id}">Mark as Paid</button>` : ''}
      </div>
    `;

    commitmentsList.appendChild(itemDiv);
  });

  // Attach click listeners to "Mark as Paid" buttons
  document.querySelectorAll(".btn-mark-paid").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.getAttribute("data-id");
      handleMarkAsPaid(id);
    });
  });
}

/**
 * Handles adding a new commitment via POST /api/commitments
 */
async function handleAddCommitment(event) {
  event.preventDefault();
  hideAlert(dashboardAlert);

  const token = getAuthToken();
  if (!token) return;

  const payload = {
    name: commitmentNameInput.value.trim(),
    amount: parseFloat(commitmentAmountInput.value),
    dueDate: commitmentDateInput.value,
    frequency: commitmentFrequencySelect.value,
    status: "PENDING"
  };

  try {
    const response = await fetch(`${API_BASE_URL}/commitments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || "Failed to add commitment";
      showAlert(dashboardAlert, errorMessage, true);
      return;
    }

    addCommitmentForm.reset();
    addCommitmentForm.classList.add("hidden");
    
    fetchCommitments();
    fetchFreeToSpend();

  } catch (error) {
    console.error("Add commitment error:", error);
    showAlert(dashboardAlert, "Unable to connect to server to add commitment.", true);
  }
}

/**
 * Handles marking a commitment as paid via PATCH /api/commitments/{id}/pay
 */
async function handleMarkAsPaid(commitmentId) {
  hideAlert(dashboardAlert);

  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/commitments/${commitmentId}/pay`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || "Failed to mark commitment as paid";
      showAlert(dashboardAlert, errorMessage, true);
      return;
    }

    fetchCommitments();
    fetchFreeToSpend();

  } catch (error) {
    console.error("Mark as paid error:", error);
    showAlert(dashboardAlert, "Unable to connect to server to mark commitment as paid.", true);
  }
}

/**
 * Fetches the user's transaction history from GET /api/transactions
 */
async function fetchTransactions() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || "Failed to load transactions";
      showAlert(dashboardAlert, errorMessage, true);
      return;
    }

    const transactions = await response.json();
    renderTransactions(transactions);

  } catch (error) {
    console.error("Fetch transactions error:", error);
    showAlert(dashboardAlert, "Unable to connect to server to fetch transactions.", true);
  }
}

/**
 * Renders the array of transactions into the DOM list (limits to top 10 most recent)
 */
function renderTransactions(transactions) {
  transactionsList.innerHTML = "";

  if (!transactions || transactions.length === 0) {
    transactionsList.innerHTML = `<p class="empty-state">No transactions recorded yet.</p>`;
    return;
  }

  // Display top 10 most recent transactions
  const recentTransactions = transactions.slice(0, 10);

  recentTransactions.forEach(item => {
    const isSpend = item.transactionType === "SPEND";
    const amountClass = isSpend ? "transaction-amount-spend" : "transaction-amount-income";
    const badgeClass = isSpend ? "badge-spend" : "badge-income";
    const sign = isSpend ? "-" : "+";
    const formattedAmount = `${sign}₹${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // Format ISO timestamp into readable date & time (e.g. 25 Jul 2026, 08:30 PM)
    const formattedTime = new Date(item.timestamp).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const itemDiv = document.createElement("div");
    itemDiv.className = "transaction-item";
    itemDiv.innerHTML = `
      <div class="transaction-info">
        <h4>${item.category}</h4>
        <div class="transaction-meta">
          <span>${formattedTime}</span>
          ${item.note ? `<span>• ${item.note}</span>` : ''}
        </div>
      </div>
      <div class="transaction-right">
        <span class="${amountClass}">${formattedAmount}</span>
        <span class="badge ${badgeClass}">${item.transactionType}</span>
      </div>
    `;

    transactionsList.appendChild(itemDiv);
  });
}

/**
 * Main Handler for Adding a Transaction with Spend Risk Check
 */
async function handleAddTransaction(event) {
  event.preventDefault();
  hideAlert(dashboardAlert);

  const token = getAuthToken();
  if (!token) return;

  const amount = parseFloat(transactionAmountInput.value);
  const transactionType = transactionTypeSelect.value;
  const category = transactionCategoryInput.value.trim();
  const note = transactionNoteInput.value.trim() || null;

  const payload = { amount, transactionType, category, note };

  // If adding a SPEND transaction, run pre-spend risk check first!
  if (transactionType === "SPEND") {
    try {
      const riskResponse = await fetch(`${API_BASE_URL}/balance/check-risk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      if (riskResponse.ok) {
        const riskData = await riskResponse.json();

        // If transaction creates risk, present the confirmation warning modal!
        if (riskData.risk) {
          showRiskModal(riskData.message, () => saveTransaction(payload));
          return;
        }
      }
    } catch (err) {
      console.error("Risk check error:", err);
    }
  }

  // If no risk or transactionType is INCOME, save directly
  saveTransaction(payload);
}

/**
 * Saves a transaction to POST /api/transactions
 */
async function saveTransaction(payload) {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || "Failed to record transaction";
      showAlert(dashboardAlert, errorMessage, true);
      return;
    }

    addTransactionForm.reset();
    addTransactionForm.classList.add("hidden");

    fetchTransactions();
    fetchFreeToSpend();

  } catch (error) {
    console.error("Save transaction error:", error);
    showAlert(dashboardAlert, "Unable to connect to server to record transaction.", true);
  }
}


// --------------------------------------------------------------------------
// 5. AUTH HANDLERS (SIGNUP & LOGIN)
// --------------------------------------------------------------------------

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
// 6. SESSION PERSISTENCE & INITIALIZATION
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
// 7. EVENT LISTENERS SETUP
// --------------------------------------------------------------------------

// Switch screens on link click
linkToSignup.addEventListener("click", showSignupForm);
linkToLogin.addEventListener("click", showLoginForm);

// Form submit handlers
signupForm.addEventListener("submit", handleSignup);
loginForm.addEventListener("submit", handleLogin);
updateBalanceForm.addEventListener("submit", handleUpdateBalance);
addCommitmentForm.addEventListener("submit", handleAddCommitment);
addTransactionForm.addEventListener("submit", handleAddTransaction);

// Toggle inline update balance form
btnToggleUpdateBalance.addEventListener("click", () => {
  hideAlert(dashboardAlert);
  updateBalanceForm.classList.toggle("hidden");
});

// Toggle inline add commitment form
btnToggleAddCommitment.addEventListener("click", () => {
  hideAlert(dashboardAlert);
  addCommitmentForm.classList.toggle("hidden");
});

// Toggle inline add transaction form
btnToggleAddTransaction.addEventListener("click", () => {
  hideAlert(dashboardAlert);
  addTransactionForm.classList.toggle("hidden");
});

// Risk Modal Action Buttons
btnCancelRisk.addEventListener("click", hideRiskModal);

btnProceedRisk.addEventListener("click", () => {
  if (pendingProceedCallback) {
    pendingProceedCallback();
  }
  hideRiskModal();
});

// Run session check when page loads
window.addEventListener("DOMContentLoaded", checkExistingSession);
