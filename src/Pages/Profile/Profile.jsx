import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ReadHubImages } from '../../assets/asset';
import { useNavigate } from 'react-router-dom';
import ProfilePhotoSelector from '../../Components/ProfilePhotoSelector';
import { apiEndpoints } from '../../Util/apiEndpoints';
import axiosConfig from '../../Util/axiosConfig';
import { useFiles } from '../../Context/FileContext';

const Profile = () => {
    const [image, setImage] = useState(null);
    const [user, setUser] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const { files, highlights: highlightMap, currentPage, readingGoal, liveReadingMinutes } = useFiles()
    const [stats, setStats] = useState(null)

    // Match Library.jsx "completed/reading" logic so Statistics aligns with what user sees in Library.
      const { completedFromLibrary, readingFromLibrary } = useMemo(() => {
        const list = Array.isArray(files) ? files : []
        let completedCount = 0
        let readingCount = 0
    
        list.forEach((b) => {
          const id = b?._id
          const pages = Number(b?.pages || 0)
          if (!id || !Number.isFinite(pages) || pages <= 0) return
    
          const page = Number(currentPage?.[id] ?? b?.lastPageRead ?? 0)
          if (!Number.isFinite(page)) return
    
          if (page >= pages) {
            completedCount += 1
          } else if (page > 0 && page < pages) {
            readingCount += 1
          }
        })
    
        return { completedFromLibrary: completedCount, readingFromLibrary: readingCount }
      }, [files, currentPage])

    const completedBooks = completedFromLibrary
    const currentlyReading = readingFromLibrary

    const totalBooks = Array.isArray(files) ? files.length : 0;

    const totalHighlights = useMemo(() => {
        const entries = Object.values(highlightMap || {})
        return entries.reduce(
          (sum, items) => sum + (Array.isArray(items) ? items.length : 0),
          0,
        )
      }, [highlightMap])

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const { data } = await axiosConfig.get(apiEndpoints.USER_PROFILE);
                setUser(data.user);
                setImage(data.user.profilePicture);
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };
        fetchUserProfile();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axiosConfig.get(apiEndpoints.BOOK_STATS)
                setStats(response.data)
            } catch (error) {
                console.error('Error fetching book stats:', error)
            }
        }
        fetchStats()
    }, [])

    const dailyGoal = stats?.dailyGoal ?? readingGoal ?? 30
    const todayMinutes = (stats?.todayReadingMinutes ?? 0) + (liveReadingMinutes || 0)
    const todayMinutesRounded = Math.max(0, Math.round(todayMinutes))
    const todayProgressPct =
        dailyGoal > 0 ? Math.min(100, Math.round((todayMinutes / dailyGoal) * 100)) : 0

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const { default: axios } = await import('axios');

        try {
            // getting signature from backend
            const { data: signatureData } = await axiosConfig.get(apiEndpoints.CLOUDINARY_SIGNATURE);

            // Validate cloudName was returned by backend
            if (!signatureData?.cloudName) {
                throw new Error('Backend did not provide Cloudinary cloud name. Check that CLOUDINARY_CLOUD_NAME is set on the backend server.');
            }

            // uploading image to cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', signatureData.apiKey);
            formData.append('timestamp', signatureData.timestamp);
            formData.append('signature', signatureData.signature);
            formData.append('folder', signatureData.folder);

            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;
            const { data: cloudinaryData } = await axios.post(cloudinaryUrl, formData);

            const newProfilePicture = cloudinaryData.secure_url;

            // 3. Update user profile
            const { data: updatedUserData } = await axiosConfig.patch(apiEndpoints.UPDATE_PROFILE, {
                profilePicture: newProfilePicture,
            });

            setUser(updatedUserData.updatedUser);
            setImage(newProfilePicture);
        } catch (error) {
            // distinguish between authentication and cloudinary errors
            console.error('Error uploading image:', error);
            if (error.response && error.response.status === 401) {
                // if backend returned 401 while getting signature or refresh logic kicked in,
                // force logout so the user can re-authenticate
                console.warn('Unauthorized while uploading image, redirecting to login');
                handleLogout();
            }
        }
    };

    const handleEditIconClick = () => {
        fileInputRef.current.click();
    };

    return (
        <>
            <div className="p-5 bg-gray-100 min-h-screen">
                <div className="pageTitle">
                    <h1 className="text-2xl font-semibold text-left mt-10">Profile</h1>
                </div>
                <div className="card mt-5 flex items-start justify-start flex-col gap-5 p-5 bg-white rounded-lg">
                    <div className="userDetails flex gap-9 items-center w-full flex-row">
                        <div className="image relative">
                            <span className="userimage w-20 h-20">
                                <ProfilePhotoSelector image={image} />
                            </span>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                                accept="image/*"
                            />
                            <span
                                className="editIcon absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full items-center justify-center cursor-pointer"
                                onClick={handleEditIconClick}
                            >
                                <img src={ReadHubImages.EditIcon} alt="" />
                            </span>
                        </div>
                        <div className="userInfo flex items-start justify-start flex-col">
                            <span className="username text-lg font-medium">
                                {user ? user.username : 'username'}
                            </span>
                            <span className="useremail underline text-sm text-gray-800">
                                {user ? user.email : 'user@gmail.com'}
                            </span>
                        </div>
                    </div>
                    <div className="upgrade bg-blue-500 text-white flex items-center justify-center w-full gap-3 rounded-lg p-3 text-center">
                        <span>
                            <img src={ReadHubImages.crown} alt="" />
                        </span>
                        <span>Upgrade to Premium</span>
                    </div>
                </div>

                <div className="card mt-10 flex bg-white rounded-lg justify-between flex-row gap-5 text-center items-center px-7 py-3">
                    <div className="flex flex-row justify-center items-center gap-5">
                        <div>
                            <img src={ReadHubImages.lightIcon} alt="" className="w-6 h-6" />
                        </div>
                        <div className="flex items-start justify-start gap-0.5 text-lg flex-col">
                            <span className="text-md font-medium">Dark Mode</span>
                            <span className="text-sm text-gray-700">
                                Switch to dark theme
                            </span>
                        </div>
                    </div>
                    <div className="toggleButton">
                        <img src={ReadHubImages.switchIcon} alt="" />
                    </div>
                </div>

                <div className="cards grid grid-cols-2 gap-4 mt-10">
                    <div className="flex flex-col gap-3 bg-white p-5 rounded-lg">
                        <span>
                            <img src={ReadHubImages.bookIcon} alt="" className="w-6 h-6" />
                        </span>
                        <span className="font-semibold text-xl">{completedBooks}</span>
                        <span className="font-light">Books Read</span>
                    </div>
                    <div className="flex flex-col gap-3 bg-white p-5 rounded-lg">
                        <span>
                            <img src={ReadHubImages.timeIcon} alt="" className="w-6 h-6" />
                        </span>
                        <span className="font-semibold text-xl">{stats?.totalHoursRead ?? 0}h</span>
                        <span className="font-light">Total Hours</span>
                    </div>
                    <div className="flex flex-col gap-3 bg-white p-5 rounded-lg">
                        <span>
                            <img src={ReadHubImages.fireIcon} alt="" className="w-6 h-8" />
                        </span>
                        <span className="font-semibold text-xl">{stats?.currentStreak ?? 0}</span>
                        <span className="font-light">Day Streak</span>
                    </div>
                    <div className="flex flex-col gap-3 bg-white p-5 rounded-lg">
                        <span>
                            <img src={ReadHubImages.highlightIcon} alt="" className="w-8 h-8" />
                        </span>
                        <span className="font-semibold text-xl">{totalHighlights}</span>
                        <span className="font-light">Highlights</span>
                    </div>
                </div>

                <div className="card mt-10 bg-blue-500 flex flex-col gap-5 p-5 rounded-2xl justify-start items-start">
                    <div className="flex flex-row justify-between w-full items-center">
                        <div className="flex flex-row items-center justify-center gap-2">
                            <span>
                                <img src={ReadHubImages.circlesIcon} alt="" />
                            </span>
                            <span className="text-white text-lg">Daily Reading Goal</span>
                        </div>
                        <div>
                            <span>
                                <img src={ReadHubImages.ForwardArrow} alt="" />
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                        <div className="flex flex-row justify-between items-center gap-46">
                            <div>
                                <span className="text-white text-sm">Today's Progress</span>
                            </div>
                            <div>
                                <span className="text-white text-sm">{todayMinutesRounded}/{dailyGoal}min</span>
                            </div>
                        </div>
                        <div className="w-full h-3 bg-blue-200 mt-5 rounded-lg overflow-hidden">
                            <div
                                className="h-full bg-blue-700 rounded-lg transition-all duration-300"
                                style={{ width: `${todayProgressPct}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="cards mt-10 flex flex-col gap-0.5 justify-center items-center">
                    <div onClick={() => navigate('/profile/settings')} className="card bg-white flex rounded-t-xl flex-row justify-between w-full items-center p-5">
                        <div className="flex flex-row gap-2 items-center justify-start">
                            <span>
                                <img src={ReadHubImages.circlesIcon} alt="" className="filter invert-50" />
                            </span>
                            <span className="text-black">Reading Goals</span>
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
                        className="card bg-white flex flex-row justify-between w-full items-center p-5"
                        onClick={() => navigate('/profile/statistics')}
                    >
                        <div className="flex flex-row gap-2 items-center justify-start">
                            <span>
                                <img src={ReadHubImages.statisticsIcon} alt="" />
                            </span>
                            <span className="text-black">Statistics</span>
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
                                <img src={ReadHubImages.cloudIcon} alt="" />
                            </span>
                            <span className="text-black">Backup & Sync</span>
                        </div>
                        <div className="flex flex-row gap-4 items-center">
                            <span className="bg-blue-100 text-sm py-0.5 px-3 rounded-xl text-blue-800">
                                Premium
                            </span>
                            <img
                                src={ReadHubImages.ForwardArrow}
                                alt=""
                                className="filter invert-75"
                            />
                        </div>
                    </div>
                    <div
                        className="card bg-white flex rounded-b-xl flex-row justify-between w-full items-center p-5"
                        onClick={() => navigate('/profile/settings')}
                    >
                        <div className="flex flex-row gap-2 items-center justify-start">
                            <span>
                                <img src={ReadHubImages.settingsIcon} alt="" />
                            </span>
                            <span className="text-black">Settings</span>
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
                    className="card mt-10 justify-center items-center mb-40 border border-gray-300 rounded-lg p-3 flex flex-row gap-3"
                    onClick={handleLogout}
                >
                    <span>
                        <img src={ReadHubImages.signoutIcon} alt="" />
                    </span>
                    <span className="text-red-500">Sign Out</span>
                </div>
            </div>
        </>
    );
};

export default Profile;
