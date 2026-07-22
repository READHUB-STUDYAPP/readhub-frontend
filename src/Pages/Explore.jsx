import React from "react";
import { ReadHubImages } from "../assets/asset";
import { useNavigate } from "react-router-dom";

const Explore = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="p-5 min-h-screen bg-gray-100">
        <div className="flex flex-col gap-1 justify-start items-start mt-10">
          <span className="text-3xl font-semibold">Explore</span>
          <span className="text-sm font-normal text-gray-600">
            Discover new reads and tips
          </span>
        </div>

        <div className="card flex flex-col gap-4 bg-blue-500 rounded-3xl p-5 mt-7.5">
          <div className="flex justify-start items-start">
            <img src={ReadHubImages.sparkleIcon} alt="icon" />
          </div>
          <div className="px-4">
            <span className="text-white text-lg">
              “The more that you read, the more things you will know. The more
              that you learn, the more places you’ll go.”
            </span>
          </div>
          <div>
            <span className="text-gray-100 text-sm">_Dr Seuss</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mt-7.5">
          <div className="flex flex-col gap-1.5 items-center justify-center bg-blue-200 rounded-2xl p-6">
            <span>
              <img src={ReadHubImages.timerIcon} alt="books" />
            </span>
            <span className="text-blue-600 text-sm">Start Focus</span>
          </div>
          <div
            className="flex flex-col gap-1.5 items-center justify-center bg-blue-200 rounded-2xl p-6 active:bg-blue-200/80"
            onClick={() => {
              navigate("/library");
            }}
          >
            <span>
              <img src={ReadHubImages.libraryIcon} alt="icon" />
            </span>
            <span className="text-blue-600">My Library</span>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 mt-7.5">
          <div className="flex justify-start items-start">
            <span className="text-xl font-medium">Trending Books</span>
          </div>
          <div className="cards grid grid-cols-3 gap-2">
            <span>
              <img src={ReadHubImages.trendingbook1} alt="books" />
            </span>
            <span>
              <img src={ReadHubImages.trendingbook2} alt="books" />
            </span>
            <span>
              <img src={ReadHubImages.trendingbook3} alt="books" />
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 justify-start items-start mt-7.5">
          <div>
            <span></span>
            <span className="text-lg font-medium">Reading Tips</span>
          </div>
          <div className="cards flex flex-col gap-5 items-start justify-start">
            <div className="card bg-white w-full p-4 rounded-xl flex justify-start items-start flex-row gap-4">
              <div className="p-3 rounded-lg flex justify-center items-center bg-blue-100">
                <span>
                  <img src={ReadHubImages.timerIcon} alt="icon" />
                </span>
              </div>
              <div className="flex flex-col gap-0.5 justify-start items-start">
                <span className="text-lg font-medium">
                  Set a Reading Schedule
                </span>
                <span className="text-sm font-normal text-gray-500">
                  Read at the same time everyday to a build a habit
                </span>
              </div>
            </div>
            <div className="card bg-white w-full p-4 rounded-xl flex justify-start items-start flex-row gap-4">
              <div className="p-3 rounded-lg flex justify-center items-center bg-blue-100">
                <span>
                  <img src={ReadHubImages.timeIcon} alt="icon" />
                </span>
              </div>
              <div className="flex flex-col gap-0.5 justify-start items-start">
                <span className="text-lg font-medium">Set Daily Goals</span>
                <span className="text-sm font-normal text-gray-500">
                  Start with 20minutes and gradually increase
                </span>
              </div>
            </div>
            <div className="card bg-white w-full p-4 rounded-xl flex justify-start items-start flex-row gap-4">
              <div className="p-3 rounded-lg flex justify-center items-center bg-blue-200">
                <span>
                  <img src={ReadHubImages.timerIcon} alt="icon" />
                </span>
              </div>
              <div className="flex flex-col gap-0.5 justify-start items-start">
                <span className="text-lg font-medium">Use Focus Mode</span>
                <span className="text-sm font-normal text-gray-500">
                  Eliminate distraction with our readlock feature
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col mt-7.5">
          <div></div>
          <div className="cards"></div>
        </div>
      </div>
    </>
  );
};

export default Explore;
