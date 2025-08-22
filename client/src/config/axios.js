import axios from "axios";

// Create axios instance with base configuration
const axiosInstance = axios.create({
  // Use relative URLs in development to work with CRA proxy
  // Use full URL in production
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL || "http://localhost:5000"
      : "", // Empty baseURL uses same origin (proxy handles routing)
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error("Network error:", error.message);
      // More descriptive error for development
      const networkError = new Error(
        process.env.NODE_ENV === "development"
          ? `Network error: ${error.message}. Make sure the server is running on port 5000.`
          : "Network error. Please check your connection.",
      );
      return Promise.reject(networkError);
    }

    // Handle HTTP errors
    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Don't automatically logout here - let AuthContext handle it
        console.log("Unauthorized request");
        break;
      case 403:
        console.error("Access forbidden");
        break;
      case 404:
        console.error("Resource not found");
        break;
      case 500:
        console.error("Server error");
        break;
      default:
        console.error("API error:", data?.message || error.message);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
