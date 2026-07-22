import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { validateEmail } from "./validate";
import { ReadHubImages } from "../../assets/asset";
import axiosConfig from "../../Util/axiosConfig";
import { apiEndpoints } from "../../Util/apiEndpoints";
import { LuEye, LuEyeOff, LuLoaderCircle } from "react-icons/lu";

const Login = () => {
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
        email,
        password,
      });

      const { accessToken, refreshToken } = response.data;

      // Store tokens in localStorage
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      setLoading(false);
      navigate("/home");
    } catch (err) {
      setLoading(false);
      if (err.response) {
        setError(
          err.response.data.message ||
            "Authentication failed. Please check your credentials.",
        );
      } else if (err.request) {
        setError("Network error. Please try again later.");
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    setLoading(true);
    try {
      const response = await axiosConfig.post(apiEndpoints.GOOGLE_AUTH, {
        idToken,
      });
      if (response.status === 200) {
        toast.success("Logged in successfully.");
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("token", response.data.accessToken);
        navigate("/home");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "An error occurred during Google login.",
      );
      toast.error(
        err.response?.data?.message || "An error occurred during Google login.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
    toast.error("Google login failed. Please try again.");
  };

  return (
    <>
      <div className="signup">
        <div className="signupContent">
          <div className="header">
            <span className="heading">Welcome Back</span>
            <span className="subheading">Continue your reading journey</span>
          </div>

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

              <div style={{ justifyContent: "end", marginLeft: "12rem" }}>
                <span
                  style={{ color: "#2d7ff9" }}
                  onClick={() => navigate("/forgotpassword")}
                >
                  Forgot Password?
                </span>
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

              <div className="separator">
                <hr className="short-line" />
                <span>Or continue with</span>
                <hr className="short-line" />
              </div>

              <div className="icons">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
                <span>
                  <img
                    className="googleImg"
                    src={ReadHubImages.AppleIcon}
                    alt="Apple login"
                  />
                </span>
              </div>

              <div className="loginOption">
                <span style={{ color: "#4d4d4d" }}>
                  Already have an account?
                </span>
                <span
                  onClick={() => navigate("/signup")}
                  style={{ color: "#2D7FF9" }}
                >
                  Sign Up
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
