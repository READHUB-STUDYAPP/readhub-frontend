import React from 'react'
import { ReadHubImages } from '../../assets/asset'
import { useNavigate } from 'react-router-dom'

const OnboardingFourth = () => {

    const navigate = useNavigate();

  return (
    <div>
        <div className='py-10 px-3 flex flex-col justify-center items-center gap-15'>
            <div className='flex flex-col items-end gap-3' onClick={()=> navigate('/signup')}><span><img src={ReadHubImages.loading3} alt="" /></span><span className='text-sm'>Skip</span></div>
            <div className='mt-30'><img src={ReadHubImages.onboardImg3} alt="" /></div>
            <div className='mt-20 flex flex-col items-center text-center gap-2'><span className="text-blue-500 text-2xl font-semibold">Read more. Stay consistent</span><span className='text-base font-normal text-gray-950'>Set reading goals and keep yourself motivated<br />one page at a time</span></div>
            <div className='mt-5' onClick={()=> navigate('/signup')}><span className='bg-blue-600 py-3.5 px-25 rounded-4xl text-gray-50'>Start Reading</span></div>
        </div>
    </div>
  )
}

export default OnboardingFourth