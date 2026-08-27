import axios from "axios";
import { baseURL, apiEndpoints } from "./apiEndpoints";

const axiosConfig = axios.create({
    baseURL: baseURL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
    },
    withCredentials: true 
});

// List of endpoints that do not require authorization header
const excludeEndpoints = ["auth/login", "auth/register", "auth/refresh", "auth/logout", "auth/forget-password", "auth/password-token-verification", "auth/reset-password", "auth/google", "admin/login", "admin/invite/accept"];

// Request interceptor
axiosConfig.interceptors.request.use((config) => {
    const shouldSkipToken = excludeEndpoints.some((endpoint) => {
        return config.url?.includes(endpoint)
    });

    if (!shouldSkipToken) {
        const accessToken = localStorage.getItem("token");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor
axiosConfig.interceptors.response.use((response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Logout and refresh failures are terminal; retrying either request
        // through this interceptor can recursively trigger another logout.
        if (!originalRequest || originalRequest.url?.includes(apiEndpoints.LOGOUT) || originalRequest.url?.includes(apiEndpoints.REFRESH_TOKEN)) {
            return Promise.reject(error);
        }

        // Check if the error is 401 and not a retry request
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // The backend reads the refresh token from the HttpOnly cookie.
                const response = await axios.post(`${baseURL}${apiEndpoints.REFRESH_TOKEN}`, {}, { withCredentials: true });

                const { accessToken: newAccessToken } = response.data;
                localStorage.setItem("token", newAccessToken);

                // Update the authorization header and retry the original request
                axiosConfig.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                return axiosConfig(originalRequest);
            } catch (_error) {
                // If refresh token fails, logout
                handleLogout();
                return Promise.reject(_error);
            }
        }

        return Promise.reject(error);
    }
);

const handleLogout = () => {
    
    axiosConfig.post(apiEndpoints.LOGOUT, { refreshToken: localStorage.getItem("refreshToken") }).catch(err => console.error("Logout API call failed", err));

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = window.location.pathname.startsWith('/admin')
        ? '/admin/login'
        : '/login';
};

export default axiosConfig;