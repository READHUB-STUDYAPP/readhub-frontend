import React, { useState } from "react";
import ContCard from "../Components/ContCard";
import { useNavigate } from "react-router-dom";
import { useFiles } from "../Context/FileContext";
import { useEffect } from "react";
import { apiEndpoints } from "../Util/apiEndpoints";
import axiosConfig from "../Util/axiosConfig";
import LoadingContCard from "../Components/LoadingContCard";

const Home = () => {
  const navigate = useNavigate();
  const [continueRead, setContinueRead] = useState(false);
  const {
    files,
    getProgress,
    selectFile,
    setSelectedFile,
    currentPage,
    fetchBooks,
    loading,
    readingGoal,
    liveReadingMinutes,
  } = useFiles();
  const [user, setUser] = useState(null);
  const [image, setImage] = useState(null);
  const [stats, setStats] = useState(null);

  const [isFetchingUserInfo, setIsFetchingUserInfo] = useState(false)

  // for fetching the user details so that it displays the username
  useEffect(() => {
    const fetchUserProfile = async () => {

      setIsFetchingUserInfo(true);
      try {
        const { data } = await axiosConfig.get(apiEndpoints.USER_PROFILE);
        setUser(data.user);
        setImage(data.user.profilePicture);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally{
        setIsFetchingUserInfo(false)
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosConfig.get(apiEndpoints.BOOK_STATS);
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching book stats:", error);
      }
    };

    fetchStats();
  }, []);

  const dailyGoal = stats?.dailyGoal ?? readingGoal ?? 30;
  const todayMinutes =
    (stats?.todayReadingMinutes ?? 0) + (liveReadingMinutes || 0);
  const todayMinutesRounded = Math.max(0, Math.round(todayMinutes));
  const todayMinutesDisplay = Math.min(dailyGoal, todayMinutesRounded);
  const progressPct =
    dailyGoal > 0
      ? Math.min(100, Math.round((todayMinutes / dailyGoal) * 100))
      : 0;
  const remainingMinutes = Math.max(0, Math.ceil(dailyGoal - todayMinutes));

  const openPdf = (file) => {
    setSelectedFile(file);
    navigate(`/viewpdf/${file._id}`);
  };

  function filterBooks(books) {
    return books.filter((b) => {
      const page = currentPage[b._id] ?? b.lastPageRead ?? 0;
      return page > 0 && page < b.pages;
    });
  }

  const filtered = filterBooks(files);

  return (
    <>
    
    {isFetchingUserInfo ? <div><div className="pb-30">
      
      <div className="flex pt-13 pb-[26px] justify-between items-center px-[16px]">
        <div className="flex flex-row items-center">
          <span className="flex h-[46px] w-[46px] bg-[#C4C4C4] rounded-full justify-center items-center animate-pulse">
           
          </span>
          <span className="flex flex-col pl-1 w-fit">
            <p className="bg-[#D9D9D9] h-3 animate-pulse rounded-[3px]">
            </p>
            <p className="w-20 mt-1 h-[17px] bg-[#D9D9D9] animate-pulse rounded-[3px]">
            </p>
          </span>
        </div>
        <div>
          <div
            className="w-40 h-[36px] bg-[#E6E6E6] animate-pulse rounded-full flex justify-center items-center px-3 sm:px-[24px] relative overflow-hidden"
          >
      
          </div>
        </div>
      </div>

      <div className="px-[16px] pb-[26px] xsm:text-[15px]">
        <div className="bg-[#E6E6E6] animate-pulse min-h-[177px] rounded-[20px] relative overflow-hidden text-white px-[16px] py-[23px] flex flex-col justify-between">
          <span className="flex h-[100px] w-[100px] bg-white/20 rounded-full absolute left-72 top-[-30px]"></span>
          <span className="flex h-[100px] w-[100px] bg-white/20 rounded-full absolute top-30 left-[-40px]"></span>
        </div>
      </div>

      <div className="flex justify-between px-[16px] pb-5">
        <div>
          <div className="bg-[#E6E6E6] animate-pulse w-[79px] h-[80px] rounded-[15.89px] flex flex-col justify-center items-center">
            
          </div>
        </div>

           <div>
          <div className="bg-[#E6E6E6] animate-pulse w-[79px] h-[80px] rounded-[15.89px] flex flex-col justify-center items-center">
            
          </div>
        </div>

           <div>
          <div className="bg-[#E6E6E6] animate-pulse w-[79px] h-[80px] rounded-[15.89px] flex flex-col justify-center items-center">
            
          </div>
        </div>
           <div>
          <div className="bg-[#E6E6E6] animate-pulse w-[79px] h-[80px] rounded-[15.89px] flex flex-col justify-center items-center">
            
          </div>
        </div>
      </div>

      <div className="px-[16px] pb-10">
        <div className="bg-[#fff] px-[16px] min-h-[133px] rounded-[20px] py-[20px] flex flex-col justify-between ">
          <p className="bg-[#E6E6E6] animate-pulse w-30 h-[18px] rounded-[3px]"></p>
          <p className="bg-[#E6E6E6] animate-pulse w-40 h-[18px] leading-4 rounded-[3px]">
          </p>
          <p className="bg-[#E6E6E6] animate-pulse w-25 h-[18px] rounded-[3px]"></p>
        </div>
      </div>

          <div className="px-4">
            <div className="font-medium mb-5 bg-[#D9D9D9] animate-pulse h-[20px] w-40 rounded-[3px]"></div>
            <LoadingContCard/>
          </div>
  
    </div></div> 
    
    
    
    
    : <div className="pb-30">
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .rh-streak-glow,
          .rh-fire-alive {
            animation: none !important;
          }
        }
        @keyframes rh_streak_glow {
          0% { box-shadow: 0 0 0 rgba(255,91,4,0.0); transform: translateZ(0); }
          50% { box-shadow: 0 0 14px rgba(255,91,4,0.28), 0 0 28px rgba(255,91,4,0.14); }
          100% { box-shadow: 0 0 0 rgba(255,91,4,0.0); }
        }
        @keyframes rh_fire_alive {
          0% { transform: translateY(0) rotate(-2deg) scale(1); filter: saturate(1); }
          35% { transform: translateY(-1px) rotate(2deg) scale(1.03); filter: saturate(1.15); }
          70% { transform: translateY(0) rotate(-1deg) scale(1.01); filter: saturate(1.05); }
          100% { transform: translateY(0) rotate(-2deg) scale(1); filter: saturate(1); }
        }
      `}</style>
      <div className="flex pt-13 pb-[26px] justify-between items-center px-[16px]">
        <div className="flex flex-row items-center">
          <span className="flex h-[46px] w-[46px] bg-[#d9d9d9] rounded-full justify-center items-center">
            {image ? (
              <img
                src={image}
                alt="profile"
                className="w-[46px] h-[46px] rounded-full object-cover"
              />
            ) : (
              <img
                src="/profile.svg"
                alt="profile placeholder"
                className="w-[30px] h-[30px]"
              />
            )}
          </span>
          <span className="flex flex-col pl-1 w-fit">
            <p className="text-tittle_Small font-medium max-xsm:text-[12px]">
              Welcome back
            </p>
            <p className="text-tittle_Large font-medium max-xsm:text-[17px] leading-7 max-xsm:max-w-20 max-sm:max-w-32 truncate">
              {user ? user.username : "Reader"}
            </p>
          </span>
        </div>
        <div>
          <div
            className="rh-streak-glow w-fit h-[36px] bg-[#ff5800]/40 border-1 border-[#ff5b04] text-[#ff5b04] font-medium rounded-full flex justify-center items-center px-3 sm:px-[24px] max-xsm:text-[13px] max-xsm:px-1 relative overflow-hidden"
            style={{ animation: "rh_streak_glow 2.6s ease-in-out infinite" }}
          >
            <span className="absolute inset-[-10px] bg-[#ff5b04]/10 blur-xl opacity-40" />
            <p className="truncate relative z-10">
              {stats?.currentStreak ?? 0} day Reading streak{" "}
            </p>
            <img
              src="/fire.svg"
              alt="fire"
              className="rh-fire-alive w-[24px] max-xsm:w-[16px] relative z-10"
              style={{ animation: "rh_fire_alive 1.35s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>

      <div className="px-[16px] pb-[26px] xsm:text-[15px]">
        <div className="bg-primary min-h-[177px] rounded-[20px] relative overflow-hidden text-white px-[16px] py-[23px] flex flex-col justify-between">
          <span className="flex h-[100px] w-[100px] bg-white/20 rounded-full absolute left-72 top-[-30px]"></span>
          <span className="flex h-[100px] w-[100px] bg-white/20 rounded-full absolute top-30 left-[-40px]"></span>
          <div className="flex items-center">
            <img src="/Group2.svg" alt="asset" className="w-[20px] h-[20px]" />
            <p className="pl-2 font-medium">Daily Reading Goal</p>
          </div>
          <div className="flex flex-col">
            <span className="flex items-baseline-last">
              <p className="text-display_Medium leading-10">
                {todayMinutesDisplay}
              </p>
              <p className="">/ {dailyGoal} min</p>
            </span>
            <span className="w-full bg-[#cde1fe] h-[14px] flex rounded-full overflow-hidden">
              <span
                className="h-full bg-blue-700 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </span>
          </div>
          <div>
            <p className="font-medium">
              {remainingMinutes === 0
                ? `You have reached your goal of today`
                : `${remainingMinutes} minutes to reach your goal `}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between px-[16px] pb-5">
        <div>
          <div className="bg-white w-[79px] h-[80px] rounded-[15.89px] flex flex-col justify-center items-center">
            <div
              className="bg-primary rounded-[8.45px] w-[42px] h-[42.53px] flex justify-center active:bg-primary/80"
              onClick={() => {
                navigate("/library");
              }}
            >
              <img src="/library_books.svg" className="w-[24px]" />
            </div>
            <p className="text-[#4d4d4d] text-body_Small">Library</p>
          </div>
        </div>

        <div>
          <div className="bg-white w-[79px] h-[80px] rounded-[15.89px] flex flex-col justify-center items-center">
            <div
              className="bg-[#F59E0B] rounded-[8.45px] w-[42px] h-[42.53px] flex justify-center active:bg-[#F59E0B]/80"
              onClick={() => {
                navigate("/notes");
              }}
            >
              <img src="/note_stack.svg" className="w-[24px]" />
            </div>
            <p className="text-[#4d4d4d] text-body_Small">Notes</p>
          </div>
        </div>

        <div>
          <div className="bg-white w-[79px] h-[80px] rounded-[15.89px] flex flex-col justify-center items-center">
            <div
              className="bg-[#10B981] rounded-[8.45px] w-[42px] h-[42.53px] flex justify-center active:bg-[#10B981]/80"
              onClick={() => {
                navigate("/focus");
              }}
            >
              <img src="/lock_clock.svg" className="w-[24px]" />
            </div>
            <p className="text-[#4d4d4d] text-body_Small">Focus</p>
          </div>
        </div>

        <div>
          <div className="bg-white w-[79px] h-[80px] rounded-[15.89px] flex flex-col justify-center items-center">
            <div
              className="bg-[#A855F7] rounded-[8.45px] w-[42px] h-[42.53px] flex justify-center active:bg-[#A855F7]/80"
              onClick={() => {
                navigate("/explore");
              }}
            >
              <img src="/explore.svg" className="w-[24px]" />
            </div>
            <p className="text-[#4d4d4d] text-body_Small">Explore</p>
          </div>
        </div>
      </div>

      <div className="px-[16px] pb-10">
        <div className="bg-[#fff] px-[16px] min-h-[133px] rounded-[20px] py-[20px] flex flex-col justify-between">
          <p className="text-tittle_Small text-[#5f5f61]">Daily Inspiration</p>
          <p className="text-black font-medium text-[14px] leading-4">
            “Reading is essential for those who seek to rise above the ordinary”
          </p>
          <p className="text-primary text-tittle_Small">- Jim John</p>
        </div>
      </div>

      {!loading ? (
        filtered.length > 0 ? (
          <div className="px-4">
            <div className="font-medium mb-5">Continue Reading</div>
            {filtered.map((file) => {
              const page = currentPage[file._id] ?? file.lastPageRead ?? 0;
              return (
                <ContCard
                  key={file._id}
                  fileName={file.title}
                  page={page}
                  totalPage={file.pages}
                  progress={getProgress(page, file.pages)}
                  onOpen={() => {
                    file.fileUrl?.endsWith(".pdf")
                      ? openPdf(file)
                      : openEpub(file);
                  }}
                  progPercent={getProgress(page, file.pages) + "%"}
                  continueRead={page < 1 ? "Start Reading" : "Continue Reading"}
                  coverImage={file.coverImageUrl}
                  file={file}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex px-4 pt-5 justify-center flex-col text-center">
            <p>Nothing here for now...try reading some books</p>
            <p className="mt-2">
              Go to{" "}
              <a href="/library" className="underline text-primary">
                Library
              </a>
            </p>
          </div>
        )
      ) : <LoadingContCard/>}
    </div>}
    </>
  );
};

export default Home;
