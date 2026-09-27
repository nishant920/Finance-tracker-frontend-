/* ==========================================================================
   TRANSACTIONS & RISK CHECK MODULE
   ========================================================================== */

import { API_BASE_URL, getAuthToken } from './config.js';
import { transactionsList, dashboardAlert, showAlert, hideAlert, showRiskModal } from './ui.js';
import { fetchFreeToSpend } from './balance.js';

export const addTransactionForm = document.getElementById("add-transaction-form");
export const transactionAmountInput = document.getElementById("transaction-amount");
export const transactionTypeSelect = document.getElementById("transaction-type");
export const transactionCategoryInput = document.getElementById("transaction-category");
export const transactionNoteInput = document.getElementById("transaction-note");

/**
 * Fetches the user's transaction history from GET /api/transactions
 */
export async function fetchTransactions() {
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
export function renderTransactions(transactions) {
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
export async function handleAddTransaction(event) {
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
export async function saveTransaction(payload) {
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
