import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx"
import { ThemeProvider } from "./Context/ThemeContext.jsx";
import { applyTheme, readStoredMode } from "./Util/theme.js";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FileProvider } from "./Context/FileContext.jsx";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Before the first render, so the opening frame is already the right theme. A
// provider alone applies it one paint too late, which shows as a white flash on
// a dark theme every time the app is opened.
applyTheme(readStoredMode());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <FileProvider>
        <GoogleOAuthProvider clientId={clientId}>
          <ToastContainer />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GoogleOAuthProvider>
      </FileProvider>
    </ThemeProvider>
  </StrictMode>,
);
