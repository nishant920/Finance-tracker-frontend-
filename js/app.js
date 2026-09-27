/* ==========================================================================
   MAIN APPLICATION ENTRY POINT MODULE
   ========================================================================== */

import { getAuthToken } from './config.js';
import {
  btnLogout,
  linkToSignup,
  linkToLogin,
  btnToggleUpdateBalance,
  btnToggleAddCommitment,
  btnToggleAddTransaction,
  btnCancelRisk,
  btnProceedRisk,
  showLoginForm,
  showSignupForm,
  showDashboardView,
  hideAlert,
  hideRiskModal,
  executeRiskProceed,
  handleLogout,
  dashboardAlert
} from './ui.js';
import { loginForm, signupForm, handleLogin, handleSignup } from './auth.js';
import { updateBalanceForm, handleUpdateBalance } from './balance.js';
import { addCommitmentForm, handleAddCommitment } from './commitments.js';
import { addTransactionForm, handleAddTransaction } from './transactions.js';

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
// EVENT LISTENERS SETUP
// --------------------------------------------------------------------------

// Logout handler
btnLogout.addEventListener("click", handleLogout);

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
btnProceedRisk.addEventListener("click", executeRiskProceed);

// Run session check when DOM is ready
window.addEventListener("DOMContentLoaded", checkExistingSession);
