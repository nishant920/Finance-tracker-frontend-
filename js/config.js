/* ==========================================================================
   CONFIG & AUTH TOKEN STATE MANAGEMENT MODULE
   ========================================================================== */

// Backend API Base URL configuration - change this easily for deployment
export const API_BASE_URL = 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8080/api"
    : "http://13.48.30.132:8080/api";

/**
 * Retrieve the JWT token stored in browser localStorage
 */
export function getAuthToken() {
  return localStorage.getItem("authToken");
}

/**
 * Store the JWT token in browser localStorage for persistent session
 */
export function setAuthToken(token) {
  localStorage.setItem("authToken", token);
}

/**
 * Remove the JWT token from localStorage (logout helper)
 */
export function removeAuthToken() {
  localStorage.removeItem("authToken");
}
