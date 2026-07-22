import React from "react";
import { useFiles } from "../Context/FileContext";

const ContCard = ({
  fileName,
  page,
  totalPage,
  progress,
  onOpen,
  progPercent,
  continueRead,
  hideNotStarted,
  file,
  coverImage,
  onDelete,
  showDelete = false,
}) => {
  const validProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={`bg-white px-[16px] py-2 rounded-[10px] mb-8 ${hideNotStarted}`}
    >
      <div className="flex justify-between mb-2">
        <div className="h-[136px] flex w-[110px] rounded-[10px] bg-primary justify-center max-xsm:w-[100px] max-xsm:h-[120px] overflow-hidden">
          <img
            src={coverImage || `/note_stack.svg`}
            alt="books"
            className=" inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="w-[210px] max-xsm:w-[185px] flex flex-col justify-evenly relative">
         {showDelete && (
  <div
    onClick={onDelete}
    className="absolute right-0 top-3.5 bg-white"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className="stroke-red-600"
    >
      <g opacity="0.5">
        <path
          d="M3 5.25H15M7.5 8.25V12.75M10.5 8.25V12.75M3.75 5.25L4.5 14.25C4.5 14.6478 4.65804 15.0294 4.93934 15.3107C5.22064 15.592 5.60218 15.75 6 15.75H12C12.3978 15.75 12.7794 15.592 13.0607 15.3107C13.342 15.0294 13.5 14.6478 13.5 14.25L14.25 5.25M6.75 5.25V3C6.75 2.80109 6.82902 2.61032 6.96967 2.46967C7.11032 2.32902 7.30109 2.25 7.5 2.25H10.5C10.6989 2.25 10.8897 2.32902 11.0303 2.46967C11.171 2.61032 11.25 2.80109 11.25 3V5.25"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  </div>
)}

          <div>
            <p className="text-tittle_Medium text-black font-semibold truncate">
              {fileName}
            </p>
          </div>
          <div>
            <span className="flex text-tittle_Small text-[#5f5f61] justify-between mb-3 font-medium">
              <p>Progress</p>
              <p>{progPercent}</p>
            </span>
            <span className="flex h-[7px] bg-[#e6e6e6] rounded-[12px] relative">
              <span
                className="h-[7px] bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${validProgress}%` }}
              ></span>
            </span>
          </div>
          <div>
            <p className="text-[#5f5f61] max-xsm:text-[15px]">
              {`page ${page} of ${totalPage}`}
            </p>
          </div>
        </div>
      </div>
      <div>
        <button
          onClick={onOpen}
          className="h-[46px] w-full rounded-[11px] bg-primary/56 text-primary font-semibold flex justify-center items-center active:bg-primary"
        >
          <img src="/play_arrow.svg" alt="playicon" className="w-[24px]" />
          {continueRead}
        </button>
      </div>
    </div>
  );
};

export default ContCard;
