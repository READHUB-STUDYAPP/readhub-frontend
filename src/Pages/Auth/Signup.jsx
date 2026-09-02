import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { LuEye, LuEyeOff, LuLoaderCircle } from "react-icons/lu";

import { validateEmail } from "./validate";
import { ReadHubImages } from "../../assets/asset";
import AuthLayout, { AuthButton, AuthField, AuthProviders } from "../../Components/AuthLayout";
import axiosConfig from "../../Util/axiosConfig";
import { authInputClass } from "../../Util/authStyles";
import { apiEndpoints } from "../../Util/apiEndpoints";
import { storeSession } from "../../Util/session";

const Signup = () => {
  const navigate = useNavigate();

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
        storeSession(response.data);
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
    <AuthLayout title="Create an account" subtitle="Sign up to start reading today">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField label="Username">
          <input
            type="text"
            id="username"
            autoComplete="username"
            placeholder="Your name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={authInputClass(false)}
          />
        </AuthField>

        <AuthField label="Email">
          <input
            type="email"
            id="email"
            autoComplete="email"
            placeholder="example@gmail.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass(false)}
          />
        </AuthField>

        <AuthField label="Password" hint="At least 8 characters">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="new-password"
              placeholder="********"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${authInputClass(false)} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink"
            >
              {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
            </button>
          </div>
        </AuthField>

        {/* The mismatch is shown on this field rather than the first: it is the
            one to correct, and the reader is looking at it. */}
        <AuthField
          label="Confirm Password"
          error={confirmPassword && password !== confirmPassword ? "Passwords do not match" : ""}
        >
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="********"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${authInputClass(Boolean(confirmPassword) && password !== confirmPassword)} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((shown) => !shown)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink"
            >
              {showConfirmPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
            </button>
          </div>
        </AuthField>

        {error && <p className="text-label_Medium text-danger">{error}</p>}

        <AuthButton loading={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <LuLoaderCircle className="h-4 w-4 animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </AuthButton>

        <AuthProviders>
          {/* The SDK draws this button inside an iframe, so its corners cannot
              be styled from here -- `shape="pill"` is how it is asked for, and
              it matches the rounded actions on the rest of the page. */}
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            shape="pill"
            size="large"
            text="signup_with"
            width="280"
            logo_alignment="center"
          />
        </AuthProviders>

        <p className="text-center text-body_Medium text-ink-soft">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-bold text-brand hover:underline"
          >
            Sign in
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;
