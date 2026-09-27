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
        const resendContainer = document.createElement("div");
        resendContainer.style.marginTop = "0.75rem";

        const resendBtn = document.createElement("button");
        resendBtn.className = "btn btn-sm btn-outline";
        resendBtn.textContent = "📩 Resend Verification Email";
        resendBtn.onclick = () => handleResendVerification(email);

        resendContainer.appendChild(resendBtn);
        loginAlert.appendChild(resendContainer);
      }
    }

  } catch (error) {
    console.error("Login error:", error);
    showAlert(loginAlert, "Unable to connect to backend server. Please check your connection.", true);
  }
}

/**
 * Handles resending verification email via POST /api/auth/resend-verification?email=...
 */
export async function handleResendVerification(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification?email=${encodeURIComponent(email)}`, {
      method: "POST"
    });

    const message = await response.text();

    if (response.ok) {
      showAlert(loginAlert, message || "Verification email sent successfully! Please check your inbox.", false);
    } else {
      showAlert(loginAlert, message || "Failed to resend verification email.", true);
    }

  } catch (error) {
    console.error("Resend verification error:", error);
    showAlert(loginAlert, "Unable to connect to server to resend verification email.", true);
  }
}
