import { ReadHubImages } from "../../assets/asset";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import axiosConfig from "../../Util/axiosConfig";
import { apiEndpoints } from "../../Util/apiEndpoints";
import { useFiles } from "../../Context/FileContext";

const Settings = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [readingGoal, setReadingGoal] = useState(() => {
    const saved = localStorage.getItem("readingGoal");
    return saved ? parseInt(saved) : 30;
  });
  const { setReadingGoal: setReadingGoalGlobal } = useFiles();
  const goalSaveTimerRef = useRef(null);
  const [goalLockedToday, setGoalLockedToday] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await axiosConfig.get(apiEndpoints.USER_PROFILE);
        setUser(data.user);
        setEditedUsername(data.user.username);
        setEditedEmail(data.user.email);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axiosConfig.get(apiEndpoints.BOOK_STATS);
        setGoalLockedToday(Boolean(data?.goalLockedToday));

        // Keep local/global goal in sync with backend whenever we can.
        if (Number.isFinite(Number(data?.dailyGoal))) {
          const next = Math.round(Number(data.dailyGoal));
          setReadingGoal(next);
          setReadingGoalGlobal(next);
        }
      } catch (error) {
        console.error("Error fetching reading stats:", error);
      }
    };

    fetchStats();
  }, [setReadingGoalGlobal]);

  const handleReadingGoalChange = (value) => {
    if (goalLockedToday) return;
    const next = Number(value);
    setReadingGoal(next);
    setReadingGoalGlobal(next);

    // Debounce backend update while dragging the slider
    if (goalSaveTimerRef.current) clearTimeout(goalSaveTimerRef.current);
    goalSaveTimerRef.current = setTimeout(async () => {
      try {
        await axiosConfig.patch(apiEndpoints.BOOK_GOAL, { dailyGoal: next });
      } catch (error) {
        const status = error?.response?.status;
        if (status === 403) {
          setGoalLockedToday(true);
          setMessage({
            type: "error",
            text: "Reading goal is locked until tomorrow.",
          });
          try {
            const { data } = await axiosConfig.get(apiEndpoints.BOOK_STATS);
            if (Number.isFinite(Number(data?.dailyGoal))) {
              const lockedGoal = Math.round(Number(data.dailyGoal));
              setReadingGoal(lockedGoal);
              setReadingGoalGlobal(lockedGoal);
            }
          } catch (e) {
            console.error("Error refreshing stats after goal lock:", e);
          }
          return;
        }
        console.error("Error updating reading goal:", error);
      }
    }, 500);
  };

  const handleEditToggle = () => {
    if (user) {
      setIsEditing(!isEditing);
      setEditedUsername(user.username);
      setEditedEmail(user.email);
      setMessage({ type: "", text: "" });
    }
  };

  const handleSaveSettings = async () => {
    if (!editedUsername.trim() || !editedEmail.trim()) {
      setMessage({ type: "error", text: "Username and email cannot be empty" });
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await axiosConfig.patch(apiEndpoints.UPDATE_PROFILE, {
        username: editedUsername,
        email: editedEmail,
      });

      setUser(data.updatedUser);
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await axiosConfig.delete(apiEndpoints.DELETE_PROFILE);
      setMessage({ type: "success", text: "Account deleted successfully!" });
      setShowDeleteModal(false);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to delete account",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="p-5 bg-gray-100 min-h-screen">
        <div className="flex flex-row gap-2 items-center justify-start mt-5">
          <span onClick={() => navigate("/profile")}>
            <img src={ReadHubImages.BackwardArrow} alt="" />
          </span>
          <span className="text-2xl font-medium">Settings</span>
        </div>

        <div className="card bg-white px-4 py-8 mt-5 rounded-xl flex justify-start items-start gap-7 flex-col">
          <div className="flex flex-row gap-3 justify-start items-center w-full">
            <span>
              <img src={ReadHubImages.profileIcon} alt="" className="w-5 h-5" />
            </span>
            <span className="text-xl font-semibold text-black">Profile</span>
            {!isEditing && (
              <button
                onClick={handleEditToggle}
                className="ml-auto text-blue-500 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>
          <div className="userDetails flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1 justify-start items-start w-full">
              <span className="text-lg font-normal">Display name</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  className="border border-gray-300 px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your display name"
                />
              ) : (
                <span className="border border-gray-300 px-4 py-3 w-full rounded-xl">
                  {user ? user.username : "username"}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 justify-start items-start w-full">
              <span className="text-lg font-normal">Email</span>
              {isEditing ? (
                <input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="border border-gray-300 px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              ) : (
                <span className="border border-gray-300 px-4 py-3 w-full rounded-xl">
                  {user ? user.email : "username@gmail.com"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-white p-4 flex flex-col justify-start items-start gap-7 mt-10 rounded-xl w-full">
          <div className="flex flex-row gap-4 items-center justify-start">
            <span>
              <img
                className="invert-[0.5] sepia-[1] hue-rotate-[190deg] saturate-[500%]"
                src={ReadHubImages.circlesIcon}
                alt=""
              />
            </span>
            <span className="text-2xl font-semibold">Reading Goals</span>
          </div>

          <div className="flex flex-col gap-3 justify-start items-start w-full">
            <div className="flex flex-row w-full justify-between">
              <span className="text-gray-800 text-sm font-normal">
                Daily Reading Goals
              </span>
              <span className="text-gray-800 text-sm font-normal">
                {readingGoal}mins
              </span>
            </div>
            <div className="slider w-full">
              <input
                type="range"
                min="0"
                max="30"
                value={readingGoal}
                onChange={(e) =>
                  handleReadingGoalChange(parseInt(e.target.value))
                }
                disabled={goalLockedToday}
                className={`w-full h-2 bg-gray-200 rounded-lg appearance-none accent-blue-500 ${goalLockedToday ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              />
            </div>
            {goalLockedToday && (
              <span className="text-xs text-gray-600">
                Reading goal is locked until tomorrow.
              </span>
            )}
          </div>
        </div>

        <div className="card bg-white px-8 py-6 flex flex-col justify-start items-start gap-7 mt-10 rounded-xl">
          <div className="flex flex-row gap-2.5 justify-start items-center">
            <span>
              <img src={ReadHubImages.notificationIcon} alt="" />
            </span>
            <span className="text-lg">Notifications</span>
          </div>
          <div className="flex flex-row w-full justify-between items-center">
            <div className="flex flex-row gap-2.5 justify-start items-center pl-1">
              <span>
                <img src={ReadHubImages.pushNotificationIcon} alt="" />
              </span>
              <span className="text-md pl-1">Push Notifications</span>
            </div>
            <div>
              <img src={ReadHubImages.toggleOnIcon} alt="" />
            </div>
          </div>
          <div className="flex flex-row w-full justify-between items-center">
            <div className="flex flex-row gap-2.5 justify-start items-center">
              <span>
                <img src={ReadHubImages.soundIcon} alt="" />
              </span>
              <span className="text-md">Sound</span>
            </div>
            <div>
              <img src={ReadHubImages.toggleOnIcon} alt="" />
            </div>
          </div>
          <div className="flex flex-row w-full justify-between items-center">
            <div className="flex flex-row gap-2.5 justify-start items-center">
              <span>
                <img
                  src={ReadHubImages.vibrationIcon}
                  alt=""
                  className="w-6 h-4"
                />
              </span>
              <span className="text-md">Vibration</span>
            </div>
            <div>
              <img src={ReadHubImages.toggleOnIcon} alt="" />
            </div>
          </div>
        </div>

        <div className="cards mt-10 flex flex-col gap-0.5 justify-center items-center">
          <div className="card bg-white flex rounded-t-xl flex-row justify-between w-full items-center p-5">
            <div className="flex flex-row gap-2 items-center justify-start">
              <span>
                <img
                  src={ReadHubImages.exportIcon}
                  alt=""
                  className="filter invert-50"
                />
              </span>
              <span className="text-black">Export Data</span>
            </div>
            <div>
              <img
                src={ReadHubImages.ForwardArrow}
                alt=""
                className="filter invert-75"
              />
            </div>
          </div>
          <div className="card bg-white flex flex-row justify-between w-full items-center p-5">
            <div className="flex flex-row gap-2 items-center justify-start">
              <span>
                <img src={ReadHubImages.privacyPolicyIcon} alt="" />
              </span>
              <span className="text-black">Privacy Policy</span>
            </div>
            <div>
              <img
                src={ReadHubImages.ForwardArrow}
                alt=""
                className="filter invert-75"
              />
            </div>
          </div>
          <div className="card bg-white flex flex-row justify-between w-full items-center p-5">
            <div className="flex flex-row gap-2 items-center justify-start">
              <span>
                <img src={ReadHubImages.termsOfServiceIcon} alt="" />
              </span>
              <span className="text-black">Terms of Service</span>
            </div>
            <div>
              <img
                src={ReadHubImages.ForwardArrow}
                alt=""
                className="filter invert-75"
              />
            </div>
          </div>
          <div
            className="card bg-white flex rounded-b-xl flex-row justify-between w-full items-center p-5"
            onClick={() => navigate("/profile/settings")}
          >
            <div className="flex flex-row gap-2 items-center justify-start">
              <span>
                <img src={ReadHubImages.helpAndSupportIcon} alt="" />
              </span>
              <span className="text-black">Help & Support</span>
            </div>
            <div>
              <img
                src={ReadHubImages.ForwardArrow}
                alt=""
                className="filter invert-75"
              />
            </div>
          </div>
        </div>

        <div
          className="card mt-10 justify-center items-center border border-gray-300 rounded-lg p-3 flex flex-row gap-3 cursor-pointer hover:bg-red-50"
          onClick={() => setShowDeleteModal(true)}
        >
          <span>
            <img src={ReadHubImages.deleteIcon} alt="" />
          </span>
          <span className="text-red-600">Delete Account</span>
        </div>

        {message.text && (
          <div
            className={`mt-5 p-4 rounded-lg text-center font-medium ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-sm mx-4 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Delete Account
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your account? This action cannot
                be undone and all your data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-300 rounded-xl p-3 font-medium text-gray-700 hover:bg-gray-400 disabled:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 rounded-xl p-3 font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="w-full flex gap-3 mt-7 mb-30">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex-1 bg-blue-500 rounded-xl p-3 justify-center flex font-normal text-white hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleEditToggle}
              disabled={isSaving}
              className="flex-1 bg-gray-300 rounded-xl p-3 justify-center flex font-normal text-gray-700 hover:bg-gray-400 disabled:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="card w-full items-center bg-blue-500 rounded-xl p-3 justify-center flex mt-7 mb-30">
            <span className="font-normal text-white">Settings Saved</span>
          </div>
        )}
      </div>
    </>
  );
};

export default Settings;
