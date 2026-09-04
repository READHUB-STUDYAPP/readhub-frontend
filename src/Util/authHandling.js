import axios from 'axios';

import { apiEndpoints, baseURL } from './apiEndpoints';

/**
 * One session policy, for every axios instance in the app.
 *
 * There are two instances -- the general one in `axiosConfig`, and the one in
 * `services/api` that fetches books, the profile and reading stats -- and they
 * used to disagree about what an expired token means. The first refreshed and
 * carried on; the second did this:
 *
 *     if (error.response?.status === 401) {
 *       localStorage.removeItem("token");
 *       window.location.href = "/login";
 *     }
 *
 * No refresh, no attempt at one. An access token lives fifteen minutes, so a
 * quarter of an hour into any session the next book or stats call threw the
 * reader out to the sign-in page -- while the refresh cookie sitting in their
 * browser would have renewed it. That is the "logged out all the time".
 *
 * So the policy lives here and both instances take it, which also means a
 * third instance cannot quietly reintroduce a different one.
 */

// Endpoints that carry no access token, and where a 401 means "these
// credentials are wrong" rather than "this token has expired".
const AUTH_ENDPOINTS = [
  'auth/login',
  'auth/register',
  'auth/refresh',
  'auth/logout',
  'auth/forget-password',
  'auth/password-token-verification',
  'auth/reset-password',
  'auth/google',
  'admin/login',
  'admin/invite/accept',
];

const isAuthEndpoint = (url) => AUTH_ENDPOINTS.some((endpoint) => url?.includes(endpoint));

/**
 * The refresh in flight, if there is one.
 *
 * Module-level, so it is shared across every instance: a screen that fires a
 * book request and a profile request at the same moment, through two different
 * instances, performs one refresh rather than two racing each other.
 */
let refreshing = null;

const requestNewAccessToken = async () => {
  // The refresh token is an httpOnly cookie on the web -- unreadable here, and
  // sent only because the request carries credentials. A stored one is passed
  // when it exists, for a native client using this code.
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

const signOut = () => {
  axios.post(`${baseURL}${apiEndpoints.LOGOUT}`, {}, { withCredentials: true }).catch(() => {});

  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  const path = window.location.pathname;
  const target = path.startsWith('/admin') ? '/admin/login' : '/login';

  // Already on the way in: redirecting again would interrupt someone halfway
  // through typing their password.
  if (path !== target) window.location.href = target;
};

/** Adds the bearer token, and renews it once when the server says it is stale. */
export function installAuthHandling(instance) {
  instance.interceptors.request.use(
    (config) => {
      if (!isAuthEndpoint(config.url)) {
        const accessToken = localStorage.getItem('token');
        if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // `error.response` is absent when the request never reached the server --
      // offline, a timeout. Reading `.status` off it throws from inside this
      // handler and surfaces as an unrelated error.
      const status = error.response?.status;

      const shouldRefresh =
        status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isAuthEndpoint(originalRequest.url);

      if (!shouldRefresh) return Promise.reject(error);

      originalRequest._retry = true;

      try {
        refreshing = refreshing ?? requestNewAccessToken();
        const accessToken = await refreshing;

        instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        // The session really is over: the cookie is missing, expired or
        // revoked. This is the only path that signs a reader out.
        signOut();
        return Promise.reject(refreshError);
      } finally {
        refreshing = null;
      }
    },
  );

  return instance;
}
