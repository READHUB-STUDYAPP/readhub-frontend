import axios from 'axios';
import { baseURL, apiEndpoints } from './apiEndpoints';

const axiosConfig = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  // Sends the refresh cookie. The whole session depends on this: the server
  // keeps the refresh token in an httpOnly cookie, which JavaScript cannot read
  // and can only pass along.
  withCredentials: true,
});

// Endpoints that carry no access token, and where a 401 means "these
// credentials are wrong" rather than "this token has expired".
const excludeEndpoints = [
  'auth/login',
  'auth/register',
  'auth/refresh',
  'auth/logout',
  'auth/forget-password',
  'auth/password-token-verification',
  'auth/reset-password',
  'auth/google',
];

const isAuthEndpoint = (url) => excludeEndpoints.some((endpoint) => url?.includes(endpoint));

// Request interceptor
axiosConfig.interceptors.request.use(
  (config) => {
    if (!isAuthEndpoint(config.url)) {
      const accessToken = localStorage.getItem('token');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * The refresh in flight, if there is one.
 *
 * Shared, so that a screen firing five requests at once when its access token
 * has just expired performs one refresh and not five. Without this the five
 * race, and four of them retry with a token that the winner has already
 * replaced.
 */
let refreshing = null;

/**
 * Asks for a new access token.
 *
 * The refresh token is not read from storage here, because on the web it is not
 * there to read: the server returns it in the response body only to the native
 * clients, and hands the browser an httpOnly cookie instead. The old code
 * required a `refreshToken` in localStorage and logged the reader out when it
 * found none -- which on the web was always -- so every expired access token
 * ended the session even though the cookie beside it would have renewed it.
 *
 * A stored token is still sent when there is one, so a native client using this
 * module keeps working.
 */
const requestNewAccessToken = async () => {
  // A build of this app once wrote the string "undefined" here; treat that,
  // and "null", as the absence they were meant to be.
  const saved = localStorage.getItem('refreshToken');
  const stored = saved && saved !== 'undefined' && saved !== 'null' ? saved : null;

  const { data } = await axios.post(
    `${baseURL}${apiEndpoints.REFRESH_TOKEN}`,
    stored ? { refreshToken: stored } : {},
    { withCredentials: true },
  );

  const accessToken = data?.accessToken;
  if (!accessToken) throw new Error('No access token in refresh response');

  localStorage.setItem('token', accessToken);
  return accessToken;
};

// Response interceptor
axiosConfig.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // `error.response` is absent when the request never reached the server --
    // offline, DNS failure, a timeout. Reading `.status` off it threw a
    // TypeError from inside this handler, which surfaced as an unrelated error
    // rather than the connection problem it was.
    const status = error.response?.status;

    const shouldTryRefresh =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      // Never for the auth endpoints: a wrong password answers 401, and
      // refreshing after it would be nonsense. A 401 from the refresh endpoint
      // itself must not start another refresh either.
      !isAuthEndpoint(originalRequest.url);

    if (!shouldTryRefresh) return Promise.reject(error);

    originalRequest._retry = true;

    try {
      // Whoever arrives first starts the refresh; the rest await the same one.
      refreshing = refreshing ?? requestNewAccessToken();
      const accessToken = await refreshing;

      axiosConfig.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return axiosConfig(originalRequest);
    } catch (refreshError) {
      // The session really is over: the cookie is missing, expired, or was
      // revoked. This is the only path that signs the reader out.
      handleLogout();
      return Promise.reject(refreshError);
    } finally {
      refreshing = null;
    }
  },
);

const handleLogout = () => {
  // Tells the server to drop this device's session. Fire-and-forget: the local
  // sign-out must not wait on the network, and it is pointless to report a
  // failure of a call made while being signed out anyway.
  axios
    .post(`${baseURL}${apiEndpoints.LOGOUT}`, {}, { withCredentials: true })
    .catch(() => {});

  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');

  // Already on an auth screen: redirecting again would interrupt someone
  // halfway through typing their password.
  if (!isAuthEndpoint(window.location.pathname) && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

export default axiosConfig;
