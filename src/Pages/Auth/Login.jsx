import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { validateEmail } from "./validate";
import { ReadHubImages } from "../../assets/asset";
import AuthLayout, { AuthButton, AuthField, AuthProviders } from "../../Components/AuthLayout";
import axiosConfig from "../../Util/axiosConfig";
import { authInputClass } from "../../Util/authStyles";
import { apiEndpoints } from "../../Util/apiEndpoints";
import { LuEye, LuEyeOff, LuLoaderCircle } from "react-icons/lu";
import { storeSession } from "../../Util/session";

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

      storeSession(response.data);

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
        storeSession(response.data);
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
    <AuthLayout title="Welcome Back" subtitle="Continue your reading journey">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        {/* The error sits on the password field, as in the design: it is the
            one the reader is most likely to have got wrong, and the server
            will not say which of the two it was. */}
        <AuthField label="Password" error={error}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              placeholder="********"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${authInputClass(Boolean(error))} pr-12`}
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

        <button
          type="button"
          onClick={() => navigate("/forgotpassword")}
          className="self-end text-label_Medium font-semibold text-brand hover:underline"
        >
          Forgot Password?
        </button>

        <AuthButton loading={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <LuLoaderCircle className="h-4 w-4 animate-spin" />
              Signing In...
            </span>
          ) : (
            "Sign In"
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
            text="signin_with"
            width="280"
            logo_alignment="center"
          />
        </AuthProviders>

        <p className="text-center text-body_Medium text-ink-soft">
          {/* Was "Already have an account?" on the sign-in page, which is the
              sign-up page's line. */}
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="font-bold text-brand hover:underline"
          >
            Sign Up
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
