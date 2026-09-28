/* ==========================================================================
   BALANCE MANAGEMENT MODULE
   ========================================================================== */

import { API_BASE_URL, getAuthToken, removeAuthToken } from './config.js';
import { freeToSpendAmount, dashboardAlert, showAlert, hideAlert, showLoginForm } from './ui.js';

export const updateBalanceForm = document.getElementById("update-balance-form");
export const updateBalanceInput = document.getElementById("update-balance-input");

/**
 * Fetches the user's current Free-to-Spend balance from GET /api/balance/free-to-spend
 */
export async function fetchFreeToSpend() {
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
      showAlert(document.getElementById("login-alert"), "Session expired. Please log in again.", true);
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
export async function handleUpdateBalance(event) {
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
    const response = await fetch(`${API_BASE_URL}/balance/update`, {
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
