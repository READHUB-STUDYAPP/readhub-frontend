import React from 'react' 
import { ReadHubImages } from '../../assets/asset'
import { useNavigate } from 'react-router-dom'

const OnboardingThird = () => {

    const navigate = useNavigate();

  return (
    <div>
        <div className='py-10 px-3 flex flex-col justify-center items-center gap-15'>
            <div className='flex flex-col items-end gap-3' onClick={()=> navigate('/onboarding4')}><span><img src={ReadHubImages.loading2} alt="" /></span><span className='text-sm'>Skip</span></div>
            <div className='mt-30'><img src={ReadHubImages.onboardImg2} alt="" /></div>
            <div className='mt-20 flex flex-col items-center text-center gap-2'><span className="text-blue-500 text-2xl font-semibold">Read at your pace</span><span className='text-base font-normal text-gray-950'>Pick up where you left off and keep track of your <br /> progress as you read</span></div>
            <div className='mt-5' onClick={()=> navigate('/onboarding4')}><span className='bg-blue-600 py-3.5 px-25 rounded-4xl text-gray-50'>Next</span></div>
        </div>
    </div>
  )
}

export default OnboardingThird