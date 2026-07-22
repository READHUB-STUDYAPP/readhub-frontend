import React from 'react'
import { ReadHubImages } from '../../assets/asset'
import { useNavigate } from 'react-router-dom'

const OnboardingFourth = () => {

    const navigate = useNavigate();

  return (
    <div className='min-h-screen bg-white'>
            
            <div className="bg-white px-4 py-6 flex flex-col gap-5 justify-center items-center pt-20 w-full">
                <div className=""><img src={ReadHubImages.FourthOnboardingImage} alt="ReadHub" /></div>
                <div className="mt-3 flex flex-col gap-2.5 items-center justify-center">
                    <span className="text-2xl text-blue-500 font-bold">Turn reading into growth</span>
                    <span className="text-gray-600 text-md font-medium text-center">Build a personal knowledge library that grows <br /> with you</span>
                </div>
                <div className="button  w-full flex items-center justify-center mt-10"
                onClick={()=> navigate('/signup')}
                >
                    <span className='items-center bg-blue-400 text-white p-3 rounded-lg'>Next</span>
                </div>
            </div>

        </div>
  )
}

export default OnboardingFourth