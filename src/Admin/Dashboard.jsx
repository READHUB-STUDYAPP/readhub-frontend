import React, { useEffect, useState } from 'react';
import { ReadHubImages } from '../../assets/asset';
import { Link, useNavigate } from 'react-router-dom';
import axiosConfig from '../../Util/axiosConfig';
import { apiEndpoints } from '../../Util/apiEndpoints';

const Dashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      if (!localStorage.getItem('token')) {
        navigate('/admin/login', { replace: true });
        return;
      }

      try {
        const response = await axiosConfig.get(apiEndpoints.ADMIN_OVERVIEW);
        if (mounted) setOverview(response.data);
      } catch (requestError) {
        if (!mounted) return;

        if ([401, 403].includes(requestError.response?.status)) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          navigate('/admin/login', { replace: true });
          return;
        }

        setError(
          requestError.response?.data?.message ||
            'Unable to load the admin dashboard.',
        );
      }
    };

    loadOverview();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await axiosConfig.post(apiEndpoints.LOGOUT).catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/admin/login', { replace: true });
  };

  if (!overview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">{error || 'Loading dashboard...'}</p>
      </div>
    );
  }

  const { stats, weekMinutes, popularBooks, recentActivity } = overview;
  const maxWeekMinutes = Math.max(...weekMinutes, 1);
  const formatTime = (date) =>
    date ? new Date(date).toLocaleString() : 'Unknown time';

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
              <div className='flex flex-row gap-2 items-center bg-blue-700 px-4 py-2.5 rounded-lg'><span><img src={ReadHubImages.dashboardIcon} alt="" /></span><span><Link to="/admin/dashboard">Dashboard</Link></span></div>
              <div className='flex flex-row gap-2 items-center'><span><img src={ReadHubImages.peopleIcon} alt="" /></span><span><Link to="/admin/readers">Readers</Link></span></div>
              <div className='flex flex-row gap-2 items-center'><span><img src={ReadHubImages.booksIconSvg} alt="" /></span><span><Link to="/admin/books">Books</Link></span></div>
            </div>
          </div>

          <div className="bottom profileDetails flex flex-col gap-6 justify-center items-start">
            <div className=' w-full text-white'><hr/></div>
            <div className='flex flex-row items-center gap-4'><div className='w-9 h-9'><img src={ReadHubImages.blankCircleSvgIcon} alt="" /></div><div className='flex flex-col'><span className='text-sm text-gray-50 font-medium'>Best Quality</span><span className='text-xs text-gray-50 font-light'>Admin</span></div></div>
<button type="button" onClick={handleLogout} className='flex flex-row gap-10 items-center'><span className='w-3 h-3'><img src={ReadHubImages.logoutSvgIcon} alt="" /></span><span className='text-xs text-gray-50'>Logout</span></button>
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
 <span className='text-sm text-gray-950 font-normal'>Total Readers</span><span className='text-5xl text-gray-900 font-bold'>{stats.totalReaders}</span><span className='text-sm text-gray-900 font-normal'>+{stats.newReadersThisMonth} this month</span>
                </div>

<div className="card flex flex-col gap-1 bg-gray-200 p-5 rounded-lg border border-blue-400">
<span className='text-sm text-gray-950 font-normal'>Total Reading Hours</span><span className='text-5xl text-gray-900 font-bold'>{stats.totalReadingHours}</span><span className='text-sm text-gray-900 font-normal'>This month</span>
                </div>

                <div className="card flex flex-col gap-1 bg-gray-200 p-5 rounded-lg border border-blue-400">
<span className='text-sm text-gray-950 font-normal'>Total books in library</span><span className='text-5xl text-gray-900 font-bold'>{stats.totalBooks}</span><span className='text-sm text-gray-900 font-normal'>Current total</span>
                </div>
                <div className="card flex flex-col gap-1 bg-gray-200 p-5 rounded-lg border border-blue-400">
<span className='text-sm text-gray-950 font-normal'>Active Readers</span><span className='text-5xl text-gray-900 font-bold'>{stats.activeReaders}</span><span className='text-sm text-gray-900 font-normal'>Last 14 days</span>
                </div>
            </div>

            <div className="middleElement flex flex-row gap-10 px-7">
                <div className="statistics bg-gray-200 flex items-end gap-25 flex-row flex-3 p-10 border border-blue-400 rounded-lg">
                    <div className='flex flex-col-reverse gap-12 pb-20'><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span></div>
                    <div className='flex flex-col items-center gap-8'>
<div className='flex flex-row gap-6 items-end h-40'>{weekMinutes.map((minutes, index) => <span key={index} title={`${minutes} minutes`} className='bg-blue-500 w-3 rounded-t-lg' style={{ height: `${Math.max((minutes / maxWeekMinutes) * 100, minutes ? 4 : 1)}%` }}></span>)}</div>
                        <div className='flex flex-row gap-8 items-center'><span>M</span><span>T</span><span>W</span><span>TH</span><span>F</span><span>SA</span><span>S</span></div>
                    </div>
                </div>
                <div className="PopularBooks flex flex-1 flex-col p-4 rounded-lg border border-blue-400 bg-gray-200 gap-7">
                    <div className='flex flex-row justify-between items-center'><span className='text-base font-medium'>Popular books</span><span className='text-xs font-medium underline'>View all</span></div>
<div className='flex flex-col gap-4 items-start'>{popularBooks.map((book) => (
                      <div key={book.title} className='book flex flex-row items-center gap-2'>
                        <div><img className="w-8 h-10 object-cover" src={book.coverImageUrl || ReadHubImages.trendingbook1} alt="" /></div>
                        <div className='flex flex-col items-start'><span className='text-base text-gray-900 font-medium'>{book.title}</span><span className='text-xs text-gray-500 pt-2'>{book.readers} readers</span></div>
                      </div>
                    ))}
                    </div>
                </div>
            </div>

            <div className="bottomElement px-7 pt-7 flex flex-col gap-2">
                <div><span className='text-lg font-medium'>Recent reader activity</span></div>
<div className='flex flex-col gap-2'>{recentActivity.map((activity, index) => (
                <div key={`${activity.reader}-${activity.at}-${index}`} className='flex flex-row justify-between items-center pr-20'>
                  <div className='text-sm'><span>{activity.reader} read for {activity.minutes} minutes - </span><span className='text-blue-600'>{activity.book}</span></div><div className='text-sm'><span>{formatTime(activity.at)}</span></div>
                </div>
                ))}</div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;