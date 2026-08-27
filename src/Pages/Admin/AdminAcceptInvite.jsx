import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LuEye, LuEyeOff, LuLoaderCircle } from "react-icons/lu";
import axiosConfig from "../../Util/axiosConfig";
import { apiEndpoints } from "../../Util/apiEndpoints";

const AdminAcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = searchParams.get("token") || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("This invitation link is missing its token.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosConfig.post(apiEndpoints.ADMIN_ACCEPT_INVITE, {
        token,
        username: username.trim(),
        password,
      });
      setMessage(response.data.message || "Admin account ready. You can now log in.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to accept this invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6">
      <section className="w-full max-w-md bg-white border border-blue-200 rounded-xl shadow-sm p-8">
        <p className="text-sm font-medium text-blue-600 mb-2">ReadHub administration</p>
        <h1 className="text-3xl font-semibold text-gray-900">Accept admin invite</h1>
        <p className="text-sm text-gray-600 mt-2 mb-6">Create the account you will use to access the admin panel.</p>

        {message ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">{message}</p>
            <button type="button" onClick={() => navigate("/admin/login")} className="w-full rounded-lg bg-blue-500 py-3 text-white font-medium">Continue to admin login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm text-gray-700">Username<input className="form-control mt-1 w-full" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
            <label className="block text-sm text-gray-700">Password
              <span className="relative block mt-1"><input className="form-control w-full" required minLength="6" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}</button></span>
            </label>
            <label className="block text-sm text-gray-700">Confirm password<input className="form-control mt-1 w-full" required minLength="6" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button disabled={loading} type="submit" className="w-full rounded-lg bg-blue-500 py-3 text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2">{loading && <LuLoaderCircle className="animate-spin" size={18} />} {loading ? "Creating account..." : "Create admin account"}</button>
          </form>
        )}
      </section>
    </main>
  );
};

export default AdminAcceptInvite;