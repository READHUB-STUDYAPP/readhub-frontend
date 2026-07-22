import React from 'react'

const LoadingContCard = () => {
  return (
   <div
      className={`bg-white px-[16px] py-2 rounded-[10px] mb-8 `}
    >
      <div className="flex justify-between mb-2">
        <div className="h-[136px] flex w-[110px] rounded-[10px] bg-[#C4C4C4] justify-center max-xsm:w-[100px] max-xsm:h-[120px] animate-pulse">
        </div>
        <div className="w-[210px] max-xsm:w-[185px] flex flex-col justify-evenly relative">
   

          <div className='h-[18px] w-[206px] bg-[#E6E6E6] rounded-[3px] animate-pulse'>

          </div>
          
          <div className='h-[18px] w-[100px] bg-[#E6E6E6] rounded-[3px] animate-pulse'>

          </div>
          
          <div className='h-[18px] w-[100px] bg-[#E6E6E6] rounded-[3px] animate-pulse'>

          </div>
          <div>
            <span className="flex h-[7px] bg-[#E6E6E6] rounded-[12px] relative">
              <span
                className="h-[7px] w-20 animate-pulse bg-[#737373] rounded-full transition-all duration-300 ease-out"

              ></span>
            </span>
          </div>
        </div>
      </div>
      <div>
        <button
          className="h-[46px] w-full rounded-[11px] bg-[#C4C4C4] text-primary font-semibold flex justify-center items-center animate-pulse"
        >
    
        </button>
      </div>
    </div>
  )
}

export default LoadingContCard