import React from 'react'
import { ReadHubImages } from '../../assets/asset'
import { useNavigate } from 'react-router-dom'

const OnboardingSecond = () => {

    const navigate = useNavigate();

  return (
    <div className='min-h-screen bg-white'>

        <div className=" bg-white px-4 py-6">

            <div className="justify-end items-end relative"  onClick={()=> navigate('/onboarding3')}>
                <span className='text-md font-normal absolute right-[10%] top-1/2'>Skip</span>
            </div>


        <div className=" flex flex-col gap-5 justify-center items-center mt-10 w-full">

            <div className=""><img src={ReadHubImages.SecondOnboardingImage} alt="ReadHub" /></div>

            <div className="flex flex-col gap-2.5 items-center justify-center mt-3">
                <span className="text-2xl text-blue-500 font-bold">Read with intention</span>
                <span className="text-gray-600 text-md font-medium text-center">Don't just read more. Read what truly matters <br /> to you</span>
            </div>

            <div className="button w-full flex items-center justify-center mt-10"onClick={()=> navigate('/onboarding3')}>
                <span className='items-center bg-blue-400 text-white p-3 rounded-lg'>Next</span>
            </div>

        </div>

        </div>
    </div>
  )
}

export default OnboardingSecond