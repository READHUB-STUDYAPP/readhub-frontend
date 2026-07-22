import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { LuEye, LuEyeOff, LuLoaderCircle } from "react-icons/lu";

import { validateEmail } from "./validate";
import { ReadHubImages } from "../../assets/asset";
import axiosConfig from "../../Util/axiosConfig";
import { apiEndpoints } from "../../Util/apiEndpoints";
import "../Auth/Signup.css";

const Signup = () => {
  const navigate = useNavigate();

  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic validation
    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter your email address");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axiosConfig.post(apiEndpoints.REGISTER, {
        username: name,
        email,
        password,
      });
      if (response.status === 201 || response.status === 200) {
        toast.success("Profile created successfully.");
        navigate("/login");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "An error occurred during registration."
      );
    } finally {
      setLoading(false);
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
        localStorage.setItem("token", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        navigate("/home");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "An error occurred during Google login."
      );
      toast.error(
        err.response?.data?.message || "An error occurred during Google login."
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
            <span className="heading">Create an Account</span>
            <span className="subheading">
              Signup to start reading instantly
            </span>
          </div>

          <form className="signupForm" onSubmit={handleSubmit}>
            <div className="inputFields">
              <div className="field">
                <label htmlFor="">Username</label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  placeholder="Johnny D"
                  required
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                />
              </div>

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

              <div className="field">
                <label htmlFor="">Confirm Password</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    className="form-control"
                    placeholder="********"
                    required
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    value={confirmPassword}
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
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
                    {showConfirmPassword ? (
                      <LuEyeOff size={18} />
                    ) : (
                      <LuEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  className="errorText"
                  style={{
                    color: "red",
                    alignItems: "center",
                    backgroundColor: "transparent",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                disabled={loading}
                className={`btn-primary bg-blue-400 rounded-lg w-full py-3 text-white text-lg font-medium flex items-center justify-center gap-2 submitButton ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
                type="submit"
              >
                {loading ? (
                  <>
                    <LuLoaderCircle className="animate-spin w-5 h-5" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
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
                  onClick={() => navigate("/login")}
                  style={{ color: "#2D7FF9" }}
                >
                  Sign In
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Signup;
