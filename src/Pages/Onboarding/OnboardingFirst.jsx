import React from 'react'
import { ReadHubImages } from '../../assets/asset'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const OnboardingFirst = () => {

    const navigate = useNavigate();
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/onboarding2");
        }, 2000)
        return () => clearTimeout(timer);
      }, [navigate] )

  return (
    <div className='min-h-screen min-w-screen bg-blue-500 flex justify-center items-center'>
        <div className="p-8 flex items-center justify-center gap-5 flex-col bg-blue-500">
            <div className=""><img src={ReadHubImages.FirstOnboardingImageIcon} alt="ReadHub" /></div>
            <div className="font-medium text-2xl text-white"><span>Read.Track.Stay Consistent</span></div>
        </div>
    </div>
  )
}

export default OnboardingFirst