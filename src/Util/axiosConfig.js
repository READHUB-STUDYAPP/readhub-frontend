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

const isAuthEndpoint = (url) => excludeEndpoints.some((endpoint) => url?.includes(endpoint));

/**
 * The refresh in flight, if there is one.
 *
 * Shared, so a screen firing several requests at once when its access token
 * has just expired performs one refresh rather than one per request. Without
 * it they race, and the losers retry with a token the winner has already
 * replaced.
 */
let refreshing = null;

const requestNewAccessToken = async () => {
    // The backend reads the refresh token from the httpOnly cookie, so there
    // is nothing to send but the credentials.
    const { data } = await axios.post(`${baseURL}${apiEndpoints.REFRESH_TOKEN}`, {}, { withCredentials: true });

    const accessToken = data?.accessToken;
    if (!accessToken) throw new Error("No access token in refresh response");

    localStorage.setItem("token", accessToken);
    return accessToken;
};

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

        // Never for an endpoint that carries no access token: a wrong password
        // answers 401, and refreshing after it is nonsense.
        if (isAuthEndpoint(originalRequest.url)) {
            return Promise.reject(error);
        }

        // Check if the error is 401 and not a retry request
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Whoever arrives first starts the refresh; the rest await it.
                refreshing = refreshing ?? requestNewAccessToken();
                const newAccessToken = await refreshing;

                // Update the authorization header and retry the original request
                axiosConfig.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                return axiosConfig(originalRequest);
            } catch (_error) {
                // If refresh token fails, logout
                handleLogout();
                return Promise.reject(_error);
            } finally {
                refreshing = null;
            }
        }

        return Promise.reject(error);
    }
);

const handleLogout = () => {
    
    axiosConfig.post(apiEndpoints.LOGOUT, {}).catch(() => {});

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = window.location.pathname.startsWith('/admin')
        ? '/admin/login'
        : '/login';
};

export default axiosConfig;