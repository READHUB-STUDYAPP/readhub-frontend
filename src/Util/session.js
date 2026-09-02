/**
 * Saves the session.
 *
 * The refresh token is stored only when the server actually returned one,
 * which on the web it does not -- it comes back as an httpOnly cookie instead.
 * `localStorage.setItem(key, undefined)` stores the *string* "undefined",
 * which is truthy, so the app believed it held a refresh token and sent that
 * word to the server on every renewal. The server rejected it, and the reader
 * was signed out.
 */
export function storeSession({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem('token', accessToken);

  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  else localStorage.removeItem('refreshToken');
}
