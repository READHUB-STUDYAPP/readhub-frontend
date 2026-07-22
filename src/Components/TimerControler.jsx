import React from "react";

const TimerControler = () => {
  return (
    <div className="absolute right-[16px] bottom-23 z-100 hidden">
      <div className="bg-primary w-[144px] h-[40.17px] flex rounded-[75.75px] px-4 justify-between items-center">
        <span className="flex items-center">
          <img src="/timer.svg" alt="timer" className="w-[16px]" />
          <p className="text-[13px] text-white font-medium pl-1">2m</p>
        </span>

        <img src="/pause.svg" alt="pause" className="w-[16px]" />

        <img src="/close.svg" alt="close" className="w-[16px]" />
      </div>
    </div>
  );
};

export default TimerControler;
