import React from 'react'
import { ReadHubImages } from '../../assets/asset'
import { Link } from 'react-router-dom';

const Books = () => {

    const booksData = [
  { id: 1, Book: 'Atomic Habits', Genre: 'Self-improvement', Author: 'James Clear', Readers: '22', Status: 'Active'},
  { id: 2, Book: 'Atomic Habits', Genre: 'Self-improvement', Author: 'James Clear', Readers: '22', Status: 'Active'},
  { id: 3, Book: 'Atomic Habits', Genre: 'Self-improvement', Author: 'James Clear', Readers: '22', Status: 'Active'},
  { id: 4, Book: 'Atomic Habits', Genre: 'Self-improvement', Author: 'James Clear', Readers: '22', Status: 'Active'},
  { id: 5, Book: 'Atomic Habits', Genre: 'Self-improvement', Author: 'James Clear', Readers: '22', Status: 'Active'},
];

  return (
    <div>
        <div className="flex flex-row">
            <div className="left bg-blue-500 h-screen justify-between py-8 px-10 flex-1">
          <div className="top flex flex-col gap-20">
            <div className="logo justify-center text-center items-center flex flex-row gap-2">
              <span>
                <img src={ReadHubImages.ProperReadHubLogo} alt=""/>
              </span>
            </div>
            <div className="navitems text-sm text-white font-normal flex flex-col gap-10">
              <div className='flex flex-row gap-2 items-center'><span><img src={ReadHubImages.dashboardIcon} alt="" /></span><span><Link to="/admin/dashboard">Dashboard</Link></span></div>
              <div className='flex flex-row gap-2 items-center '><span><img src={ReadHubImages.peopleIcon} alt="" /></span><span><Link to="/admin/readers">Readers</Link></span></div>
              <div className='flex flex-row gap-2 items-center bg-blue-700 px-4 py-2.5 rounded-lg'><span><img src={ReadHubImages.booksIconSvg} alt="" /></span><span><Link to="/admin/books">Books</Link></span></div>
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
            <div>
              <span className="text-gray-800 font-medium text-xl">Books</span>
            </div>
            <div className="flex flex-row items-center gap-2 bg-gray-100 border border-blue-400 pr-20 pl-3 rounded-lg py-2">
              <span className="w-3.5 h-3.5">
                <img src={ReadHubImages.searchSvgIcon} alt="" />
              </span>
              <span className="text-xs text-gray-600">Search titles or readers</span>
            </div>
          </div>

            <div className='w-full'><span className='border border-gray-300 flex flex-row mt-7'></span></div>

            <div className='py-8 px-6'><span className='text-gray-600 font-medium text-sm'>Manage the ReadHub library</span></div>

            <div className="flex flex-row items-center gap-5 px-8.5 pb-4">
            <div className="flex flex-row gap-20 items-center border border-blue-400 bg-gray-200 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-600">All statuses</span>
              <span className="w-2 h-2">
                <img src={ReadHubImages.dropdownSvg} alt="" />
              </span>
            </div>
            <div className="flex flex-row gap-20 items-center border border-blue-400 bg-gray-200 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-600">Join Date</span>
              <span className="w-2 h-2">
                <img src={ReadHubImages.dropdownSvg} alt="" />
              </span>
            </div>
          </div>
          
          <div className="w-full max-w-7xl mx-auto bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-sm font-medium">
              <th className="py-4 px-6">Book</th>
              <th className="py-4 px-6">Genre</th>
              <th className="py-4 px-6">Author</th>
              <th className="py-4 px-6">Readers</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {booksData.map((book) => (
              <tr key={book.id} className="hover:bg-gray-50/50 transition-colors">
                {/* Reader Column */}
                <td className="py-4 px-6 flex flex-row items-center gap-2">
                  <div><img className='w-8 h-10' src={ReadHubImages.trendingbook1} alt="" /></div>
                  <div className="font-medium text-gray-900">{book.Book}</div>
                  
                </td>
                
                {/* Books Column */}
                <td className="py-4 px-6 text-gray-600">{book.Genre}</td>

                {/* Reading Time Column */}
                <td className="py-4 px-6 text-gray-600">{book.Author}</td>

                {/* Current Book Column */}
                <td className="py-4 px-6 text-gray-600">{book.Readers}</td>

                {/* Status Column */}
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">
                    {book.Status}
                  </span>
                </td>

                {/* Actions Column */}
                <td className="py-4 px-6 text-right">
                  <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

        </div>

        </div>
    </div>
  )
}

export default Books