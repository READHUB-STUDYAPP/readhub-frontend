import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { validateEmail } from './validate';
import axiosConfig from '../../Util/axiosConfig';
import { apiEndpoints } from '../../Util/apiEndpoints';

const ForgotPassword = () => {

    const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


   const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateEmail(email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
    }
    setError("");

    try {
        await axiosConfig.post(apiEndpoints.FORGOT_PASSWORD, { email });
        // Store email in sessionStorage for the password reset flow
        sessionStorage.setItem("resetEmail", email);
        setLoading(false);
        navigate("/otp");
    } catch (err) {
        setLoading(false);
        setError("Failed to send OTP. Please try again.");
    }
   }


  return (
    <>
    <div className="signup" style={{justifyContent: "start"}}>
      <div className="signupContent" style={{marginTop: "8rem"}}>
        <div className="header">
          <span className="heading">Forgot Password</span>
          <span className="subheading">Enter your email to reset your password</span>
        </div>


          <form onSubmit={handleSubmit} className='signupForm'>

            <div className="inputFields">

            <div className='field'>
              <label htmlFor="email">Email</label>
              <input type="text" 
              id='email'
              className='form-control'
              placeholder='example@gmail.com'
              required
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              />
              </div>

            {error && (
                        <p className="errorText" style={{color: "red", alignItems: "center"}}>
                            {error}
                        </p>
            )}

            <button type="submit" className="submitButton" disabled={loading}>
              <span style={{padding: ".8rem 7.5rem", fontSize: "1rem"}}>{loading ? "Sending..." : "Request OTP"}</span>
            </button>

        </div>
          </form>
      </div>
    </div>
    </>
  )
}

export default ForgotPassword