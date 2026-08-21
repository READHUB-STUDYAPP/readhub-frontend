import React from 'react';
import { ReadHubImages } from '../../assets/asset';

const Dashboard = () => {
  return (
    <div>
      <div className='flex-row flex'>
        <div className="left bg-blue-500 justify-between py-8 px-10 flex-1">
          <div className="top flex flex-col gap-20">
            <div className="logo justify-center text-center items-center flex flex-row gap-2">
              <span>
                <img src={ReadHubImages.ProperReadHubLogo} alt=""/>
              </span>
            </div>
            <div className="navitems text-sm text-white font-normal flex flex-col gap-10">
              <div className='flex flex-row gap-2 items-center bg-blue-700 px-4 py-2.5 rounded-lg'><span><img src={ReadHubImages.dashboardIcon} alt="" /></span><span>Dashboard</span></div>
              <div className='flex flex-row gap-2 items-center'><span><img src={ReadHubImages.peopleIcon} alt="" /></span><span>Readers</span></div>
              <div className='flex flex-row gap-2 items-center'><span><img src={ReadHubImages.booksIconSvg} alt="" /></span><span>Books</span></div>
            </div>
          </div>
          <div className="profileDetails"></div>
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

            <div className="middleElement flex flex-row gap-10 px-7">
                <div className="statistics bg-gray-200 flex items-end gap-25 flex-row flex-3 p-10 border border-blue-400 rounded-lg">
                    <div className='flex flex-col-reverse gap-12 pb-20'><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span></div>
                    <div className='flex flex-col items-center gap-8'>
                        <div className='flex flex-row gap-17 items-end'><span className='bg-blue-500 w-2 h-7 rounded-t-lg p-3'></span><span className='bg-blue-500 w-2 h-15 rounded-t-lg p-3'></span><span className='bg-blue-500 w-2 h-20 rounded-t-lg p-3'></span><span className='bg-blue-500 w-2 h-7 rounded-t-lg p-3'></span><span className='bg-blue-500 w-2 h-17 rounded-t-lg p-3'></span><span className='bg-blue-500 w-2 h-7 rounded-t-lg p-3'></span><span className='bg-blue-500 w-2 h-30 rounded-t-lg p-3'></span></div>
                        <div className='flex flex-row gap-20 items-center'><span>M</span><span>T</span><span>W</span><span>TH</span><span>F</span><span>SA</span><span>S</span></div>
                    </div>
                </div>
                <div className="PopularBooks flex flex-1 flex-col p-4 rounded-lg border border-blue-400 bg-gray-200 gap-7">
                    <div className='flex flex-row justify-between items-center'><span className='text-base font-medium'>Popular books</span><span className='text-xs font-medium underline'>View all</span></div>
                    <div className='flex flex-col gap-4 items-start'>
                        <div className='book flex flex-row items-center gap-2'>
                            <div><img src={ReadHubImages.trendingbook1} alt="" /></div>
                            <div className='flex flex-col items-start'><span className='text-base text-gray-900 font-medium'>Atomic habits</span><span className='text-sm text-gray-700'>James Clear</span><span className='text-xs text-gray-500 pt-2'>100 readers</span></div>
                        </div>
                        <div className='book flex flex-row items-center gap-2'>
                            <div><img src={ReadHubImages.trendingbook2} alt="" /></div>
                            <div className='flex flex-col items-start'><span className='text-base text-gray-900 font-medium'>Another Kind</span><span className='text-sm text-gray-700'>James Clear</span><span className='text-xs text-gray-500 pt-2'>150 readers</span></div>
                        </div>
                        <div className='book flex flex-row items-center gap-2'>
                            <div><img src={ReadHubImages.trendingbook3} alt="" /></div>
                            <div className='flex flex-col items-start'><span className='text-base text-gray-900 font-medium'>Black Hearts</span><span className='text-sm text-gray-700'>James Clear</span><span className='text-xs text-gray-500 pt-2'>20 readers</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bottomElement px-7 pt-7 flex flex-col gap-2">
                <div><span className='text-lg font-medium'>Recent reader activity</span></div>
                <div className='flex flex-col gap-2'>
                    <div className='flex flex-row justify-between items-center pr-20'>
                        <div className='text-sm'><span>Amaka Okafor read for 25 minutes - </span><span className='text-blue-600'>Atomic Habits</span></div><div className='text-sm'><span>2m ago</span></div>
                    </div>

                    <div className='flex flex-row justify-between items-center pr-20'>
                        <div className='text-sm'><span>James Kingston read for 15 minutes - </span><span className='text-blue-600'>Another Kind</span></div><div className='text-sm'><span>5m ago</span></div>
                    </div>

                    <div className='flex flex-row justify-between items-center pr-20'>
                        <div className='text-sm'><span>Daniel Bright read for 40 minutes - </span><span className='text-blue-600'>Black Hearts</span></div><div className='text-sm'><span>7m ago</span></div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
