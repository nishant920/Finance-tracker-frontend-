/* ==========================================================================
   UI DISPLAY & ALERT MANAGEMENT MODULE
   ========================================================================== */

import { removeAuthToken } from './config.js';
import { fetchFreeToSpend } from './balance.js';
import { fetchCommitments } from './commitments.js';
import { fetchTransactions } from './transactions.js';

// DOM Element References - Screens
export const loginCard = document.getElementById("login-card");
export const signupCard = document.getElementById("signup-card");
export const dashboardContainer = document.getElementById("dashboard-container");

// DOM Element References - Buttons & Links
export const btnLogout = document.getElementById("btn-logout");
export const linkToSignup = document.getElementById("link-to-signup");
export const linkToLogin = document.getElementById("link-to-login");

export const btnToggleUpdateBalance = document.getElementById("btn-toggle-update-balance");
export const btnToggleAddCommitment = document.getElementById("btn-toggle-add-commitment");
export const btnToggleAddTransaction = document.getElementById("btn-toggle-add-transaction");

// DOM Element References - Risk Modal
export const riskModal = document.getElementById("risk-modal");
export const riskModalMessage = document.getElementById("risk-modal-message");
export const btnCancelRisk = document.getElementById("btn-cancel-risk");
export const btnProceedRisk = document.getElementById("btn-proceed-risk");

// DOM Element References - Display Elements & Alert Boxes
export const freeToSpendAmount = document.getElementById("free-to-spend-amount");
export const commitmentsList = document.getElementById("commitments-list");
export const transactionsList = document.getElementById("transactions-list");

export const loginAlert = document.getElementById("login-alert");
export const signupAlert = document.getElementById("signup-alert");
export const dashboardAlert = document.getElementById("dashboard-alert");

// Callback storage for proceed action on risk modal
let pendingProceedCallback = null;

/**
 * Switch view to show the Login Screen
 */
export function showLoginForm() {
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
export function showSignupForm() {
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
export function showDashboardView() {
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
 */
export function showAlert(alertElement, message, isError = true) {
  alertElement.textContent = message;
  alertElement.className = "alert " + (isError ? "alert-error" : "alert-success");
  alertElement.style.display = "block";
}

/**
 * Helper function to hide an alert box
 */
export function hideAlert(alertElement) {
  alertElement.style.display = "none";
  alertElement.textContent = "";
}

/**
 * Shows the Risk Warning Confirmation Modal
 */
export function showRiskModal(message, onProceed) {
  riskModalMessage.textContent = message;
  pendingProceedCallback = onProceed;
  riskModal.classList.remove("hidden");
}

/**
 * Hides the Risk Warning Confirmation Modal
 */
export function hideRiskModal() {
  riskModal.classList.add("hidden");
  pendingProceedCallback = null;
}

/**
 * Execute pending proceed action for risk modal
 */
export function executeRiskProceed() {
  if (pendingProceedCallback) {
    pendingProceedCallback();
  }
  hideRiskModal();
}

/**
 * Handles logging out the user by clearing localStorage and switching to login view
 */
export function handleLogout() {
  removeAuthToken();
  showLoginForm();
  showAlert(loginAlert, "Logged out successfully.", false);
}
