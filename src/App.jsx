import { useEffect, useState } from "react";
import AppShell from "./Components/AppShell";
import SplashScreen from "./Components/SplashScreen";

import { Route, Routes, useLocation } from "react-router-dom";
import GoalCelebrationOverlay from "./Components/GoalCelebrationOverlay";

import Home from "./Pages/Home";
import Library from "./Pages/Library";
import Notes from "./Pages/Notes";
import Explore from "./Pages/Explore";
import TimerControler from "./Components/TimerControler";
import Focus from "./Pages/Focus";

import ViewPdf from "./Features/ViewPdf";

import Group from "./Pages/Groups/Group";
import GroupComments from "./Pages/Groups/GroupComments";
import Groups from "./Pages/Groups/Groups";
import Splash from "./Pages/Splash";
import Signup from "./Pages/Auth/Signup";
import Login from "./Pages/Auth/Login";
import ForgotPassword from "./Pages/Auth/ForgotPassword";
import Otp from "./Pages/Auth/Otp";
import NewPassword from "./Pages/Auth/NewPassword";
import Profile from "./Pages/Profile/Profile";
import Settings from "./Pages/Profile/Settings";
import Statistics from "./Pages/Profile/Statistics";
import Privacy from "./Pages/Legal/Privacy";
import Terms from "./Pages/Legal/Terms";
import ViewEpub from "./Features/ViewEpub";
import Dashboard from "./Pages/Admin/Dashboard";
import Readers from "./Pages/Admin/Readers";
import Books from "./Pages/Admin/Books";
import AdminLogin from "./Pages/Admin/AdminLogin";
import AdminAcceptInvite from "./Pages/Admin/AdminAcceptInvite";

/** How long the splash holds before the app appears. */
const SPLASH_MS = 1400;

function App() {
  const location = useLocation();

  /**
   * Which routes sit inside the app shell.
   *
   * Matched by prefix rather than exact equality, so a nested screen -- a
   * group, its comments, settings -- keeps the navigation instead of dropping
   * the reader onto a page with no way back. The reader and the onboarding and
   * auth screens stay outside it: those want the whole window.
   */
  const shellRoutes = [
    "/home",
    "/library",
    "/notes",
    "/explore",
    "/groups",
    "/focus",
    "/profile",
    "/privacy",
    "/terms",
  ];
  const inShell = shellRoutes.some(
    (route) => location.pathname === route || location.pathname.startsWith(`${route}/`),
  );

  /**
   * The splash, on every page load.
   *
   * Deliberately not only on `/`: a refresh anywhere -- and a link opened
   * straight to a book -- shows it too, which is what makes the web app feel
   * like the same product as the phone one rather than a website that happens
   * to share its data.
   *
   * It gates the routes rather than overlaying them, so nothing underneath
   * mounts and starts fetching until the moment has passed. The route the
   * reader asked for is preserved: this is a delay, not a redirect.
   */
  // Not for the admin panel: that is a different job, done by someone at work,
  // and a reader's splash screen in front of it is only a delay.
  const isAdmin = location.pathname.startsWith("/admin");
  const [booting, setBooting] = useState(!isAdmin);

  useEffect(() => {
    if (isAdmin) return;

    const timer = setTimeout(() => setBooting(false), SPLASH_MS);
    return () => clearTimeout(timer);
  }, [isAdmin]);

  const [showGoalCelebration, setShowGoalCelebration] = useState(false);

  useEffect(() => {
    // Celebration is triggered when leaving ViewPdf (set in sessionStorage).
    // Show it on the next screen (Home/Library/etc), but never on the reader route itself.
    if (location.pathname.startsWith("/viewpdf")) return;

    try {
      const raw = sessionStorage.getItem("rh_goalCelebration");
      if (!raw) return;

      sessionStorage.removeItem("rh_goalCelebration");

      const payload = JSON.parse(raw);
      const at = Number(payload?.at || 0);
      if (!Number.isFinite(at) || Date.now() - at > 15000) return;

      setShowGoalCelebration(true);
    } catch {
      sessionStorage.removeItem("rh_goalCelebration");
    }
  }, [location.pathname]);

  const routes = (
    <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/settings" element={<Settings />} />
        <Route path="/profile/statistics" element={<Statistics />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route path="/focus" element={<Focus />} />

        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<Group />} />
        <Route path="/groups/:groupId/comments" element={<GroupComments />} />

        <Route path="/viewpdf/:fileId" element={<ViewPdf />} />
        <Route path="/viewepub/:fileId" element={<ViewEpub />} />

        {/* The web app opens on the splash and hands straight to auth. The
            three explanatory slides the phone app shows now sit beside the
            sign-in form instead. */}
        <Route path="/" element={<Splash />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/newpassword" element={<NewPassword />} />

        {/* The admin panel. Outside the reader's shell, deliberately: it has
            its own navigation and is not somewhere a reader browses to. */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/readers" element={<Readers />} />
        <Route path="/admin/books" element={<Books />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/accept-invite" element={<AdminAcceptInvite />} />
    </Routes>
  );

  if (booting) return <SplashScreen />;

  return (
    <div className="font-manrope min-h-dvh bg-page text-ink">
      <GoalCelebrationOverlay
        open={showGoalCelebration}
        durationMs={2000}
        onDone={() => setShowGoalCelebration(false)}
      />

      {inShell ? (
        <AppShell>
          <TimerControler />
          {routes}
        </AppShell>
      ) : (
        routes
      )}
    </div>
  );
}

export default App;
