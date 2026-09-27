/* ==========================================================================
   AUTHENTICATION MODULE (LOGIN, SIGNUP, VERIFICATION)
   ========================================================================== */

import { API_BASE_URL, setAuthToken } from './config.js';
import { loginAlert, signupAlert, showAlert, hideAlert, showDashboardView } from './ui.js';

export const loginForm = document.getElementById("login-form");
export const signupForm = document.getElementById("signup-form");

export const loginEmailInput = document.getElementById("login-email");
export const loginPasswordInput = document.getElementById("login-password");

export const signupNameInput = document.getElementById("signup-name");
export const signupEmailInput = document.getElementById("signup-email");
export const signupPasswordInput = document.getElementById("signup-password");

/**
 * Handles User Signup / Registration
 * Endpoint: POST /api/auth/save
 */
export async function handleSignup(event) {
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
    showAlert(signupAlert, "Account created! Check your email to verify your account.", false);
    
    // Mount Resend Verification Email button with a 30-second cooldown timer!
    attachResendButton(signupAlert, email, 30);

  } catch (error) {
    console.error("Signup error:", error);
    showAlert(signupAlert, "Unable to connect to backend server. Please make sure backend is running.", true);
  }
}

/**
 * Handles User Login & Token Acquisition
 * Endpoint: POST /api/auth/login
 */
export async function handleLogin(event) {
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

      // If email is unverified, offer inline "Resend Verification Email" button!
      if (errorMessage.toLowerCase().includes("verify your email")) {
        attachResendButton(loginAlert, email, 0);
      }
    }

  } catch (error) {
    console.error("Login error:", error);
    showAlert(loginAlert, "Unable to connect to backend server. Please check your connection.", true);
  }
}

/**
 * Attaches a dynamic "Resend Verification Email" button with a 30-second cooldown timer
 */
function attachResendButton(containerElement, email, initialCooldownSeconds = 30) {
  const existingResend = containerElement.querySelector(".resend-container");
  if (existingResend) existingResend.remove();

  const resendContainer = document.createElement("div");
  resendContainer.className = "resend-container";
  resendContainer.style.marginTop = "0.75rem";

  const resendBtn = document.createElement("button");
  resendBtn.className = "btn btn-sm btn-outline";

  let cooldown = initialCooldownSeconds;

  function updateButtonState() {
    if (cooldown > 0) {
      resendBtn.disabled = true;
      resendBtn.style.opacity = "0.6";
      resendBtn.style.cursor = "not-allowed";
      resendBtn.textContent = `⏳ Resend in ${cooldown}s`;
    } else {
      resendBtn.disabled = false;
      resendBtn.style.opacity = "1";
      resendBtn.style.cursor = "pointer";
      resendBtn.textContent = "📩 Resend Verification Email";
    }
  }

  updateButtonState();

  if (cooldown > 0) {
    const timer = setInterval(() => {
      cooldown--;
      updateButtonState();
      if (cooldown <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  }

  resendBtn.onclick = async () => {
    if (cooldown > 0) return;
    await handleResendVerification(email, containerElement);
    // Restart 30-second cooldown timer after resending
    attachResendButton(containerElement, email, 30);
  };

  resendContainer.appendChild(resendBtn);
  containerElement.appendChild(resendContainer);
}

/**
 * Handles resending verification email via POST /api/auth/resend-verification?email=...
 * Connects directly to backend AuthController: @PostMapping("/resend-verification")
 */
export async function handleResendVerification(email, targetAlertElement = loginAlert) {
  let targetEmail = email;

  if (!targetEmail) {
    targetEmail = prompt("Enter your email address to resend verification link:");
    if (!targetEmail || !targetEmail.trim()) return;
    targetEmail = targetEmail.trim();
  }

  try {
    showAlert(targetAlertElement, "Sending verification email...", false);

    const response = await fetch(`${API_BASE_URL}/auth/resend-verification?email=${encodeURIComponent(targetEmail)}`, {
      method: "POST"
    });

    const message = await response.text();

    if (response.ok) {
      showAlert(targetAlertElement, message || "Verification email sent successfully! Please check your inbox.", false);
    } else {
      showAlert(targetAlertElement, message || "Failed to resend verification email.", true);
    }

  } catch (error) {
    console.error("Resend verification error:", error);
    showAlert(targetAlertElement, "Unable to connect to server to resend verification email.", true);
  }
}
