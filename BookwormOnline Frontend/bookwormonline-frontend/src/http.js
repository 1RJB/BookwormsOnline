import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// Add a request interceptor
instance.interceptors.request.use(function (config) {
  // Retrieve access token from local storage
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Retrieve CSRF token (if stored)
  const csrfToken = localStorage.getItem("csrfToken");
  if (csrfToken) {
    config.headers["X-XSRF-TOKEN"] = csrfToken;
  }

  // Example: remove "user" from request body
  if (config.data && config.data.user) {
    delete config.data.user;
  }

  return config;
}, function (error) {
  return Promise.reject(error);
});

// Add a response interceptor
instance.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    localStorage.clear();
    window.location = "/login";
  }
  return Promise.reject(error);
});

export default instance;