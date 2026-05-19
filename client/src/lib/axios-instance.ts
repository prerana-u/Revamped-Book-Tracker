import axios from "axios";

// Create axios instance with base config
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  //       ↑ Use environment variable if available, fallback to placeholder API

  headers: {
    "Content-Type": "application/json", // Always send JSON
  },
});

// Request interceptor - runs BEFORE every request
api.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      //    ↑ Automatically add token to every request!
    }

    return config; // Must return config
  },
  (error) => {
    // Handle request errors (rare, but possible)
    return Promise.reject(error);
  },
);

// Response interceptor - runs AFTER every response
api.interceptors.response.use(
  (response) => response, // Success - just pass through

  (error) => {
    // Handle response errors (common!)

    if (error.response?.status === 401) {
      // Unauthorized - token expired or invalid
      localStorage.removeItem("token"); // Clear invalid token
      window.location.href = "/login"; // Redirect to login
      // This runs on EVERY 401, automatically!
    }

    return Promise.reject(error); // Must reject for error handling
  },
);
