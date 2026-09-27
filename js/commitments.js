/* ==========================================================================
   COMMITMENTS MANAGEMENT MODULE
   ========================================================================== */

import { API_BASE_URL, getAuthToken } from './config.js';
import { commitmentsList, dashboardAlert, showAlert, hideAlert } from './ui.js';
import { fetchFreeToSpend } from './balance.js';

export const addCommitmentForm = document.getElementById("add-commitment-form");
export const commitmentNameInput = document.getElementById("commitment-name");
export const commitmentAmountInput = document.getElementById("commitment-amount");
export const commitmentDateInput = document.getElementById("commitment-date");
export const commitmentFrequencySelect = document.getElementById("commitment-frequency");

/**
 * Fetches the user's list of commitments from GET /api/commitments
 */
export async function fetchCommitments() {
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
 * Renders the array of commitments into the DOM list
 */
export function renderCommitments(commitments) {
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
export async function handleAddCommitment(event) {
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
export async function handleMarkAsPaid(commitmentId) {
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
