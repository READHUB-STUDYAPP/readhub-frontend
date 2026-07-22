import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useFiles } from "../Context/FileContext";

import EpubReader from "../Components/EpubReader";

const ViewEpub = () => {
  const { selectedFile2 } = useFiles();
  const readerRef = useRef(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [darkToggle, setDarkToggle] = useState(false);
  const [toggleSettings, setToggleSettings] = useState(true);
  const [scaleFont, setScaleFont] = useState(14);

  const increaseFont = () => {
    setScaleFont((prev) => Math.min(prev + 2, 30));
  };

  const reduceFont = () => {
    setScaleFont((prev) => Math.max(prev - 2, 14));
  };

  const jumpToPage = (page) => {
    if (readerRef.current) {
      readerRef.current.goToLocation(page);
      setPage();
      setToggleSettings(true); // Close settings after jumping
    }
  };
  return (
    <div
      className={`w-full h-full bg-fixed overflow-hidden   ${darkToggle ? "bg-[#0B111E] text-[#ECF0F8]" : "bg-white text-[black]"}`}
    >
      <div
        className={`flex justify-between p-4 w-full fixed z-10 items-center ${darkToggle ? "bg-[#0B111E] stroke-primary" : "bg-white stroke-[#1A1A1A]"}`}
      >
        <div className="flex items-center">
          <Link to="/library">
            <button className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </Link>
        </div>

        <div className="flex gap-6">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M17 3C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V20C18.9999 20.1751 18.9539 
                20.3472 18.8665 20.4989C18.7791 20.6506 18.6533 20.7767 18.5019 20.8646C18.3504 20.9525 18.1785 20.9991 18.0034 
                20.9997C17.8283 21.0003 17.6561 20.9549 17.504 20.868L12.992 18.29C12.6899 18.1174 12.3479 18.0266 12 18.0266C11.6521 
                18.0266 11.3101 18.1174 11.008 18.29L6.496 20.868C6.34394 20.9549 6.17174 21.0003 5.99662 20.9997C5.8215 20.9991 5.64961 
                20.9525 5.49814 20.8646C5.34667 20.7767 5.22094 20.6506 5.13352 20.4989C5.0461 20.3472 5.00006 20.1751 5 20V5C5 4.46957 5.21071
                 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17Z"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M2.06202 12.3474C1.97868 12.1229 1.97868 11.8759 2.06202 11.6514C2.87372 9.68324 4.25153 8.00042 6.02079 6.81628C7.79004 5.63214 9.87106 5 12 5C14.129 5 16.21 5.63214 17.9792 6.81628C19.7485 8.00042 21.1263 9.68324 21.938 11.6514C22.0214 11.8759 22.0214 12.1229 21.938 12.3474C21.1263 14.3155 19.7485 15.9983 17.9792 17.1825C16.21 18.3666 14.129 18.9988 12 18.9988C9.87106 18.9988 7.79004 18.3666 6.02079 17.1825C4.25153 15.9983 2.87372 14.3155 2.06202 12.3474Z"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M12 14.9994C13.6569 14.9994 15 13.6562 15 11.9994C15 10.3425 13.6569 8.99938 12 8.99938C10.3432 8.99938 9.00002 10.3425 9.00002 11.9994C9.00002 13.6562 10.3432 14.9994 12 14.9994Z"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          {!darkToggle ? (
            <div
              onClick={() => {
                setDarkToggle(!darkToggle);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M20.985 12.4864C20.8912 14.2225 20.2966 15.8944 19.273 17.2998C18.2494 18.7052 16.8406 19.7841 15.217 20.4059C13.5933 21.0278 11.8243 21.166 10.1237 20.8039C8.42318 20.4418 6.86392 19.5949 5.63442 18.3656C4.40493 17.1362 3.55785 15.577 3.19558 13.8765C2.83331 12.176 2.97136 10.4069 3.59304 8.78322C4.21472 7.15948 5.29342 5.75059 6.69874 4.72683C8.10406 3.70308 9.77583 3.1083 11.512 3.0144C11.917 2.9924 12.129 3.4744 11.914 3.8174C11.1949 4.96795 10.8869 6.32827 11.0405 7.67635C11.194 9.02443 11.7999 10.2807 12.7593 11.2401C13.7187 12.1995 14.9749 12.8054 16.323 12.9589C17.6711 13.1124 19.0314 12.8045 20.182 12.0854C20.526 11.8704 21.007 12.0814 20.985 12.4864Z"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          ) : (
            <div
              onClick={() => {
                setDarkToggle(!darkToggle);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
                  stroke="#2D7FF9"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          )}
          <div
            onClick={() => {
              setToggleSettings(!toggleSettings);
              console.log("Fugga");
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9.67082 4.13615C9.72591 3.55649 9.99515 3.0182 10.4259 2.62643C10.8567 2.23467 11.418 2.01758 12.0003 2.01758C12.5826 2.01758 13.1439 2.23467 13.5747 2.62643C14.0055 3.0182 14.2747 3.55649 14.3298 4.13615C14.3629 4.51061 14.4858 4.87157 14.688 5.18849C14.8901 5.50541 15.1657 5.76896 15.4913 5.95683C15.8169 6.1447 16.183 6.25135 16.5585 6.26777C16.9341 6.28419 17.3081 6.20989 17.6488 6.05115C18.1779 5.81093 18.7775 5.77617 19.3308 5.95364C19.8841 6.1311 20.3516 6.5081 20.6423 7.01126C20.933 7.51441 21.0261 8.10772 20.9035 8.67572C20.7808 9.24372 20.4512 9.74577 19.9788 10.0842C19.6712 10.3 19.4201 10.5868 19.2467 10.9202C19.0734 11.2536 18.9829 11.6239 18.9829 11.9997C18.9829 12.3754 19.0734 12.7457 19.2467 13.0791C19.4201 13.4125 19.6712 13.6993 19.9788 13.9152C20.4512 14.2535 20.7808 14.7556 20.9035 15.3236C21.0261 15.8916 20.933 16.4849 20.6423 16.988C20.3516 17.4912 19.8841 17.8682 19.3308 18.0457C18.7775 18.2231 18.1779 18.1884 17.6488 17.9482C17.3081 17.7894 16.9341 17.7151 16.5585 17.7315C16.183 17.7479 15.8169 17.8546 15.4913 18.0425C15.1657 18.2303 14.8901 18.4939 14.688 18.8108C14.4858 19.1277 14.3629 19.4887 14.3298 19.8632C14.2747 20.4428 14.0055 20.9811 13.5747 21.3729C13.1439 21.7646 12.5826 21.9817 12.0003 21.9817C11.418 21.9817 10.8567 21.7646 10.4259 21.3729C9.99515 20.9811 9.72591 20.4428 9.67082 19.8632C9.63776 19.4886 9.51491 19.1275 9.31268 18.8104C9.11045 18.4934 8.83479 18.2298 8.50905 18.0419C8.18331 17.854 7.81708 17.7474 7.4414 17.7311C7.06571 17.7147 6.69162 17.7892 6.35082 17.9482C5.82171 18.1884 5.22214 18.2231 4.66882 18.0457C4.11549 17.8682 3.64799 17.4912 3.3573 16.988C3.06661 16.4849 2.97353 15.8916 3.09618 15.3236C3.21882 14.7556 3.54842 14.2535 4.02082 13.9152C4.32844 13.6993 4.57955 13.4125 4.7529 13.0791C4.92626 12.7457 5.01677 12.3754 5.01677 11.9997C5.01677 11.6239 4.92626 11.2536 4.7529 10.9202C4.57955 10.5868 4.32844 10.3 4.02082 10.0842C3.54908 9.7456 3.22007 9.24375 3.09772 8.67613C2.97537 8.10852 3.06842 7.51569 3.3588 7.01286C3.64918 6.51004 4.11613 6.13313 4.66891 5.95539C5.22168 5.77766 5.8208 5.81179 6.34982 6.05115C6.69057 6.20989 7.06456 6.28419 7.44012 6.26777C7.81567 6.25135 8.18175 6.1447 8.50735 5.95683C8.83296 5.76896 9.10851 5.50541 9.31068 5.18849C9.51286 4.87157 9.6357 4.51061 9.66882 4.13615M14.9998 12.0002C14.9998 13.657 13.6567 15.0002 11.9998 15.0002C10.343 15.0002 8.99982 13.657 8.99982 12.0002C8.99982 10.3433 10.343 9.00015 11.9998 9.00015C13.6567 9.00015 14.9998 10.3433 14.9998 12.0002Z"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="top-15 relative">
        <div className="px-4 ">
          <h2 className="text-tittle_Medium font-medium text-[14px] leading-[20px] truncate">
            {selectedFile2.metadata?.title || selectedFile2.name}{" "}
            {selectedFile2.metadata?.author &&
              ` - ${selectedFile2.metadata.author}`}
          </h2>
          <h2 className="font-bold text-[20px] leading-[185%] pb-5">
            Page {page} of {total || "?"}
          </h2>
        </div>
        <div>
          {/* view epub */}

          <EpubReader
            ref={readerRef}
            file={selectedFile2}
            fontSize={scaleFont}
            theme={darkToggle ? "dark" : "light"}
            onLocationChange={({ current, total }) => {
              setPage(current);
              setTotal(total);
            }}
          />
        </div>
      </div>

      <div
        className={`bg-black/20 w-dvw h-dvh fixed z-11 flex items-baseline-last transition-all duration-300 ${toggleSettings ? "top-[100vh]" : "top-0"}`}
      >
        <div
          className={`w-dvw h-[50vh] relative rounded-t-[32px] p-[24px] flex flex-col gap-6  ${darkToggle ? "bg-[#011532]" : "bg-white"}`}
        >
          <div
            className={`flex  justify-between ${darkToggle ? "text-[#F5F9FF] stroke-[#F5F9FF]" : "text-[#333333] stroke-[#333333]"}`}
          >
            <p className=" font-medium text-[18px]">Reading Settings</p>
            <button
              className="w-5 h-5"
              onClick={() => {
                setToggleSettings(!toggleSettings);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="">
            <div>
              <div>
                <div
                  className={`flex justify-between  font-medium text-[16px] mb-4 ${darkToggle ? "text-[#F5F9FF] " : "text-[#808080]]"}`}
                >
                  <span className="flex">
                    <p>T</p>
                    <p className="pl-2">Font Size</p>
                  </span>

                  <p>{scaleFont}px</p>
                </div>

                <div
                  className={`flex justify-between items-center ${darkToggle ? "text-[#0653C6]" : "text-primary"}`}
                >
                  <button
                    className={`w-[50px] h-[40px] rounded-[12px] flex justify-center items-center ${darkToggle ? "bg-[#9CC3FC]" : "bg-light_primary"}`}
                    onClick={reduceFont}
                    disabled={scaleFont === 14}
                  >
                    A-
                  </button>
                  <span className="flex h-[7px] bg-[#e6e6e6] rounded-[12px] relative w-[170px]">
                    <span
                      className={`h-[7px] rounded-full transition-all duration-300 ease-out ${darkToggle ? "bg-[#0653C6]" : "bg-primary"}`}
                      style={{
                        width: `${Math.round((scaleFont / 30) * 100)}%`,
                      }}
                    ></span>
                  </span>
                  <button
                    className={`w-[50px] h-[40px] rounded-[12px] flex justify-center items-center ${darkToggle ? "bg-[#9CC3FC]" : "bg-light_primary"}`}
                    onClick={increaseFont}
                    disabled={scaleFont === 30}
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`text-[16px] overflow-scroll ${darkToggle ? "text-[#F5F9FF]" : "text-[#808080]"}`}
          >
            <p className="mb-4">Pages</p>
            <div className="flex flex-col gap-[10px] h-fit overflow-scroll">
              {Array.from({ length: total }, (_, i) => i + 1).map((pag) => (
                <span
                  key={pag}
                  onClick={() => {
                    jumpToPage(pag);
                  }}
                  className={`w-full rounded-[10px] p-[10px] h-[44px] flex ${pag === page && !darkToggle ? "bg-light_primary text-primary" : ""} ${pag === page && darkToggle ? "text-[#0653C6] bg-[#9CC3FC]" : ""}`}
                >
                  <p>Page {pag}</p>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEpub;
