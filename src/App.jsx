import { lazy, Suspense, useEffect, useState } from "react";
import AppShell from "./Components/AppShell";
import SplashScreen from "./Components/SplashScreen";

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import GoalCelebrationOverlay from "./Components/GoalCelebrationOverlay";

// Eager: this is the route a first-time visitor lands on, so it must not
// wait on a second round trip before anything appears.
import Landing from "./Pages/Landing";

/*
 * Everything past the front door loads on demand.
 *
 * The landing page is the first thing a visitor downloads, and it used to
 * arrive behind the entire application -- the reader, the EPUB viewer, the
 * admin panel, all of it -- before a single word could be painted. Splitting
 * them means a first-time visitor fetches the page they asked for and nothing
 * else, and a signed-in reader pays for a chunk only when they open that part
 * of the app.
 */
const Home = lazy(() => import("./Pages/Home"));
const Library = lazy(() => import("./Pages/Library"));
const Notes = lazy(() => import("./Pages/Notes"));
const Explore = lazy(() => import("./Pages/Explore"));
const Focus = lazy(() => import("./Pages/Focus"));
const ViewPdf = lazy(() => import("./Features/ViewPdf"));
const ViewEpub = lazy(() => import("./Features/ViewEpub"));
const Group = lazy(() => import("./Pages/Groups/Group"));
const GroupComments = lazy(() => import("./Pages/Groups/GroupComments"));
const Groups = lazy(() => import("./Pages/Groups/Groups"));
const Communities = lazy(() => import("./Pages/Communities/Communities"));
const Community = lazy(() => import("./Pages/Communities/Community"));
const JoinCommunity = lazy(() => import("./Pages/Communities/JoinCommunity"));
const Buddies = lazy(() => import("./Pages/Buddies/Buddies"));
const BuddyProfile = lazy(() => import("./Pages/Buddies/BuddyProfile"));
const BuddySpace = lazy(() => import("./Pages/Buddies/BuddySpace"));
const Signup = lazy(() => import("./Pages/Auth/Signup"));
const Login = lazy(() => import("./Pages/Auth/Login"));
const ForgotPassword = lazy(() => import("./Pages/Auth/ForgotPassword"));
const Otp = lazy(() => import("./Pages/Auth/Otp"));
const NewPassword = lazy(() => import("./Pages/Auth/NewPassword"));
const Profile = lazy(() => import("./Pages/Profile/Profile"));
const Settings = lazy(() => import("./Pages/Profile/Settings"));
const Statistics = lazy(() => import("./Pages/Profile/Statistics"));
const Privacy = lazy(() => import("./Pages/Legal/Privacy"));
const Terms = lazy(() => import("./Pages/Legal/Terms"));
const Dashboard = lazy(() => import("./Pages/Admin/Dashboard"));
const Readers = lazy(() => import("./Pages/Admin/Readers"));
const Books = lazy(() => import("./Pages/Admin/Books"));
const AdminLogin = lazy(() => import("./Pages/Admin/AdminLogin"));
const AdminAcceptInvite = lazy(() => import("./Pages/Admin/AdminAcceptInvite"));


import TimerControler from "./Components/TimerControler";



/** How long the splash holds before the app appears. */
const SPLASH_MS = 1400;

/**
 * Who `/` is for.
 *
 * A signed-out visitor gets the landing page. A signed-in reader gets their
 * library, because somebody who already uses ReadHub has no use for a pitch --
 * and because this is the route the app itself opens on.
 *
 * Read synchronously during render rather than in an effect, so a returning
 * reader never sees a frame of marketing before being redirected away.
 */
function LandingOrHome() {
  let signedIn = false;
  try {
    signedIn = Boolean(localStorage.getItem("token"));
  } catch {
    // Private mode, or storage blocked. Treat it as signed out: the landing
    // page is the safe answer for somebody we cannot identify.
    signedIn = false;
  }

  return signedIn ? <Navigate to="/home" replace /> : <Landing />;
}

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
    "/communities",
    "/buddies",
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
  /*
    Nor for the landing page. That splash exists to make the web app feel like
    the phone app; in front of a marketing page it is 1.4 seconds of brand
    animation standing between a stranger and the reason to care, which is the
    one place on the whole site where a delay costs the most.
  */
  const isLanding = location.pathname === "/";
  const [booting, setBooting] = useState(!isAdmin && !isLanding);

  useEffect(() => {
    if (isAdmin || isLanding) return;

    const timer = setTimeout(() => setBooting(false), SPLASH_MS);
    return () => clearTimeout(timer);
  }, [isAdmin, isLanding]);

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

  /*
    A plain hold while a chunk arrives.

    The app's own splash would be wrong here -- it is a boot animation, and a
    reader moving between two screens they are already inside has not rebooted
    anything. This is a blank surface of the right colour, which is what makes
    a fast chunk look like no wait at all.
  */
  const routes = (
    <Suspense fallback={<div className="min-h-dvh bg-page" aria-busy="true" />}>
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

        <Route path="/communities" element={<Communities />} />
        <Route path="/communities/join/:code" element={<JoinCommunity />} />
        <Route path="/communities/:communityId" element={<Community />} />
        <Route path="/buddies" element={<Buddies />} />
        <Route path="/buddies/u/:userId" element={<BuddyProfile />} />
        <Route path="/buddies/:buddyId" element={<BuddySpace />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<Group />} />
        <Route path="/groups/:groupId/comments" element={<GroupComments />} />

        <Route path="/viewpdf/:fileId" element={<ViewPdf />} />
        <Route path="/viewepub/:fileId" element={<ViewEpub />} />

        {/*
            `/` is the landing page for anybody not signed in, and a straight
            redirect for anybody who is. A returning reader opening the app
            should get their library, not a pitch for the product they already
            use.
        */}
        <Route path="/" element={<LandingOrHome />} />
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
    </Suspense>
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
