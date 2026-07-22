import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosConfig from '../../Util/axiosConfig';
import { apiEndpoints } from '../../Util/apiEndpoints';
import { LuLoaderCircle } from 'react-icons/lu';

const NewPassword = () => {

       const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


   const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if(!password.trim()){
        setError("Please enter your password");
        setLoading(false);
        return;
    }

    if(password.length < 6){
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
    }

    if(password !== confirmPassword){
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Get the code from sessionStorage
    const code = sessionStorage.getItem('resetCode');
    const email = sessionStorage.getItem('resetEmail');

    if (!code || !email) {
      setError("Session expired. Please request a new OTP.");
      setLoading(false);
      return;
    }

    try {
      // Call reset-password API
      await axiosConfig.patch(apiEndpoints.RESET_PASSWORD, {
        email: email,
        code: code,
        password: password,
      });

      setLoading(false);
      toast.success("Password reset successfully!");

      // Clear the sessionStorage
      sessionStorage.removeItem('resetCode');
      sessionStorage.removeItem('resetEmail');

      // Navigate to login page
      navigate("/login");
    } catch (err) {
      setLoading(false);
      const message =
        err.response?.data?.message ||
        "Failed to reset password. Please try again.";
      setError(message);
      toast.error(message);
    }

   }

  return (
    <>
    <div style={{justifyContent: "start", paddingTop: "8rem"}} className="signup">
      <div className="signupContent">
        <div className="header">
          <span className="heading">Create New Password</span>
          <span className="subheading">Set a new password to continue</span>
        </div>


          <form onSubmit={handleSubmit} className='signupForm'>

            <div className="inputFields">

              <div className='field'>
              <label htmlFor="">Password</label>
              <input type="password" 
              id='password'
              className='form-control'
              placeholder='********'
              required
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              />
            </div>

            <div className='field'>
              <label htmlFor="">Confirm New Password</label>
              <input type="password" 
              id='confirmPassword'
              className='form-control'
              placeholder='********'
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              />
            </div>

            {error && (
                        <p className="errorText" style={{color: "red", alignItems: "center", backgroundColor: "none"}}>
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
    </>
  )
}

export default NewPassword