import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AuthLayout, { AuthButton, AuthField } from '../../Components/AuthLayout';
import { apiEndpoints, baseURL } from '../../Util/apiEndpoints';
import { authInputClass } from '../../Util/authStyles';
import axiosConfig from '../../Util/axiosConfig';
import { storeSession } from '../../Util/session';

const validateEmail = (value) => /\S+@\S+\.\S+/.test(String(value).trim());

/**
 * Signing in to the admin panel.
 *
 * The same form as the reader's sign-in, in the same layout, with a tag saying
 * which door this is -- an admin panel that looks like a different product
 * suggests a different account, and it is not: there is no separate admin
 * sign-in on the server. An admin signs in through the ordinary endpoint and
 * `requireAdmin` gates the panel by the role held in the database.
 *
 * Which is why the role is checked twice here. The token says what the server
 * put in it, but `admin/me` is the server answering the actual question, and
 * that is the one worth trusting before showing anyone the panel.
 */
export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axiosConfig.post(apiEndpoints.LOGIN, {
        email: email.trim().toLowerCase(),
        password,
      });

      const { accessToken, role } = response.data;
      if (!accessToken) throw new Error('The server did not return an access token.');

      storeSession(response.data);

      if (role !== 'admin') {
        localStorage.removeItem('token');
        await axiosConfig.post(apiEndpoints.LOGOUT, {}).catch(() => {});
        setError('This account does not have admin access.');
        return;
      }

      // The server's own answer, not the token's claim about it.
      await axiosConfig.get(apiEndpoints.ADMIN_ME);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }

      setError(
        err.response?.data?.message ||
          (err.request
            ? `Unable to reach the API at ${baseURL}${apiEndpoints.LOGIN}. Check that the backend is running and VITE_API_BASE_URL is correct.`
            : err.message || 'Authentication failed. Please check your credentials.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variant="centred" title="Welcome Back" subtitle="Sign in to manage ReadHub">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Which door this is. */}
        <span className="self-center rounded-full bg-brand-wash px-3 py-1 text-label_Medium font-bold uppercase tracking-wide text-brand md:self-start">
          Admin
        </span>

        <AuthField label="Email">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@readhub.study"
            autoComplete="email"
            className={authInputClass(false)}
          />
        </AuthField>

        <AuthField label="Password" error={error}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            className={authInputClass(Boolean(error))}
          />
        </AuthField>

        <AuthButton loading={loading}>Sign in</AuthButton>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-label_Large text-ink-soft transition-colors hover:text-ink"
        >
          Not an admin? Sign in as a reader
        </button>
      </form>
    </AuthLayout>
  );
}
