// src/config/const.js
import {jwtDecode} from "jwt-decode";

export const APIURL = import.meta.env.VITE_API_URL ?? "";
export const IMAGE_URL = import.meta.env.VITE_AWS_BASE_URL ?? "";

// Utility function to check if session has expired
export const isSessionExpired = () => {
  const token = localStorage.getItem('token'); // Or get from sessionStorage or cookies
  if (token) {
    try {
      const decodedToken = jwtDecode(token); // Decode the JWT token using jwt-decode
      const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
      return decodedToken.exp <= currentTime; // Check if the token is expired
    } catch (error) {
      console.error("Error decoding token", error);
      return true; // If token is malformed or not valid, treat as expired
    }
  }
  return true; // If no token is found, consider the session expired
};
