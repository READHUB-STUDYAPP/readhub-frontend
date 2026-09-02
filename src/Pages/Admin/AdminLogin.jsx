import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../Auth/validate';
import axiosConfig from '../../Util/axiosConfig';
import { apiEndpoints, baseURL } from '../../Util/apiEndpoints';
import { LuEye, LuEyeOff, LuLoaderCircle } from 'react-icons/lu';

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axiosConfig.post(apiEndpoints.LOGIN, {
        email: email.trim().toLowerCase(),
        password,
      });
      const { accessToken, role } = response.data;

      if (!accessToken) {
        throw new Error("The server did not return an access token.");
      }

      localStorage.setItem("token", accessToken);

      if (role !== "admin") {
        localStorage.removeItem("token");
        setError("This account does not have admin access.");
        await axiosConfig.post(apiEndpoints.LOGOUT).catch(() => {});
        return;
      }

      // requireAdmin verifies the role from the database for protected routes.
      await axiosConfig.get(apiEndpoints.ADMIN_ME);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      }
      setError(
        err.response?.data?.message ||
          (err.request
            ? `Unable to reach the API at ${baseURL}${apiEndpoints.LOGIN}. Check that the backend is running and VITE_API_BASE_URL is correct.`
            : err.message || "Authentication failed. Please check your credentials."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='bg-gray-50 h-screen w-screen justify-center items-center p-20'>
       <div className='bg-gray-100 border border-blue-400 p-4 max-w-5xl flex flex-col gap-5 justify-center items-center rounded-lg'>
        <div className='text-gray-900 text-5xl font-semibold'><span>Login</span></div>
        <form onSubmit={handleSubmit} className="signupForm">
            <div className="inputFields">
              <div className="field">
                <label htmlFor="">Email</label>
                <input
                  type="text"
                  id="email"
                  className="form-control"
                  placeholder="example@gmail.com"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>

              <div className="field">
                <label htmlFor="">Password</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="form-control"
                    placeholder="********"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: "#4d4d4d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  className="errorText"
                  style={{
                    color: "red",
                    alignItems: "center",
                    backgroundColor: "none",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                disabled={loading}
                className={`btn-primary bg-blue-400 rounded-lg text-white w-full py-3 text-lg font-medium flex items-center justify-center gap-2 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                type="submit"
              >
                {loading ? (
                  <>
                    <LuLoaderCircle className="animate-spin w-4 h-4" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

            </div>
          </form>
       </div>
    </div>
  )
}

export default AdminLogin