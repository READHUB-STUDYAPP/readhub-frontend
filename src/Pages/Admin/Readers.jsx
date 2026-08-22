import React from 'react'
import { ReadHubImages } from '../../assets/asset'

const Readers = () => {
  return (
    <div>
        <div className="flex flex-row">
            <div className="left bg-blue-500 justify-between py-8 px-10 flex-1">
          <div className="top flex flex-col gap-20">
            <div className="logo justify-center text-center items-center flex flex-row gap-2">
              <span>
                <img src={ReadHubImages.ProperReadHubLogo} alt=""/>
              </span>
            </div>
            <div className="navitems text-sm text-white font-normal flex flex-col gap-10">
              <div className='flex flex-row gap-2 items-center'><span><img src={ReadHubImages.dashboardIcon} alt="" /></span><span>Dashboard</span></div>
              <div className='flex flex-row gap-2 items-center bg-blue-700 px-4 py-2.5 rounded-lg'><span><img src={ReadHubImages.peopleIcon} alt="" /></span><span>Readers</span></div>
              <div className='flex flex-row gap-2 items-center'><span><img src={ReadHubImages.booksIconSvg} alt="" /></span><span>Books</span></div>
            </div>
          </div>

          <div className="bottom profileDetails flex flex-col gap-6 justify-center items-start">
            <div className=' w-full text-white'><hr/></div>
            <div className='flex flex-row items-center gap-4'><div className='w-9 h-9'><img src={ReadHubImages.blankCircleSvgIcon} alt="" /></div><div className='flex flex-col'><span className='text-sm text-gray-50 font-medium'>Best Quality</span><span className='text-xs text-gray-50 font-light'>Admin</span></div></div>
            <div className='flex flex-row gap-10 items-center'><span className='w-3 h-3'><img src={ReadHubImages.logoutSvgIcon} alt="" /></span><span className='text-xs text-gray-50'>Logout</span></div>
          </div>
        </div>

        <div className="right w-full py-8 flex flex-col flex-8 bg-gray-50">

            <div className="topmost px-8 flex flex-row justify-between items-center">
                <div className='flex flex-col text-gray-950 font-medium'><span className='text-xl'>Good morning, Admin👋</span><span className='text-base'>Here's what's happening on ReadHub</span></div>
                <div className='flex flex-row gap-12 items-center text-xs bg-gray-200 px-4 py-3 rounded-lg border border-blue-400'><span className='text-gray-950'>Activity from last 7 days</span><span><img src={ReadHubImages.dropdownSvg} alt="" /></span></div>
            </div>

            <div className='w-full'><span className='border border-blue-300 flex flex-row mt-7'></span></div>

            <div className="top grid grid-cols-4 gap-8 py-10 px-7">
                <div className="card flex flex-col gap-1 bg-gray-200 p-5 rounded-lg border border-blue-400">
                    <span className='text-sm text-gray-950 font-normal'>Total Readers</span><span className='text-5xl text-gray-900 font-bold'>50</span><span className='text-sm text-gray-900 font-normal'>+11 this month</span>
                </div>

                <div className="card flex flex-col gap-1 bg-gray-200 p-5 rounded-lg border border-blue-400">
                    <span className='text-sm text-gray-950 font-normal'>Total Reading Hours</span><span className='text-5xl text-gray-900 font-bold'>1250</span><span className='text-sm text-gray-900 font-normal'>+6 this month</span>
                </div>

                <div className="card flex flex-col gap-1 bg-gray-200 p-5 rounded-lg border border-blue-400">
                    <span className='text-sm text-gray-950 font-normal'>Total book in library</span><span className='text-5xl text-gray-900 font-bold'>250</span><span className='text-sm text-gray-900 font-normal'>+4 this month</span>
                </div>
                <div className="card flex flex-col gap-1 bg-gray-200 p-5 rounded-lg border border-blue-400">
                    <span className='text-sm text-gray-950 font-normal'>Books Completed</span><span className='text-5xl text-gray-900 font-bold'>50</span><span className='text-sm text-gray-900 font-normal'>+11 this month</span>
                </div>
            </div>

        </div>

        </div>
    </div>
  )
}

export default Readers