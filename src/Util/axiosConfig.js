import axios from "axios";
import { baseURL } from "./apiEndpoints";
import { installAuthHandling } from "./authHandling";

/**
 * The app's API client.
 *
 * The bearer token and the renew-on-401 behaviour come from `authHandling`,
 * which the other instance in `services/api` takes as well -- one session
 * policy, applied in one place, so the two cannot disagree about what an
 * expired token means.
 */
const axiosConfig = axios.create({
    baseURL: baseURL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
    },
    // Carries the refresh cookie. The session depends on it: the server keeps
    // the refresh token httpOnly, so JavaScript can only pass it along.
    withCredentials: true
});

installAuthHandling(axiosConfig);

export default axiosConfig;
