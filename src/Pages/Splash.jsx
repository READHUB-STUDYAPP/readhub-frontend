import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import SplashScreen from '../Components/SplashScreen';

/**
 * The `/` route: decides where a reader belongs and sends them there.
 *
 * The boot gate has already held the splash for its moment by the time this
 * renders, so there is no second delay here -- it redirects immediately.
 *
 * A reader who is signed in goes to their library rather than the sign-in page.
 */
export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const signedIn = Boolean(localStorage.getItem('token'));
    navigate(signedIn ? '/home' : '/login', { replace: true });
  }, [navigate]);

  return <SplashScreen />;
}
