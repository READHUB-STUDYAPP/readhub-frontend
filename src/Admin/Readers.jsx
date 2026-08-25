import React, { useEffect, useState } from 'react';
import { ReadHubImages } from '../../assets/asset';
import { Link, useNavigate } from 'react-router-dom';
import axiosConfig from '../../Util/axiosConfig';
import { apiEndpoints } from '../../Util/apiEndpoints';

const Readers = () => {
  const navigate = useNavigate();
  const [readers, setReaders] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadReaders = async () => {
      if (!localStorage.getItem('token')) {
        navigate('/admin/login', { replace: true });
        return;
      }

      setLoading(true);
      try {
        const [readersResponse, adminResponse] = await Promise.all([
          axiosConfig.get(apiEndpoints.ADMIN_READERS, {
            params: { page, limit: 20, search, status, sort },
          }),
          page === 1 ? axiosConfig.get(apiEndpoints.ADMIN_ME) : Promise.resolve(null),
        ]);

        if (!mounted) return;
        setReaders(readersResponse.data.data || []);
        setPagination(readersResponse.data);
        if (adminResponse) setAdmin(adminResponse.data.admin);
        setError('');
      } catch (requestError) {
        if (!mounted) return;
        if ([401, 403].includes(requestError.response?.status)) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          navigate('/admin/login', { replace: true });
          return;
        }
        setError(requestError.response?.data?.message || 'Unable to load readers.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadReaders();
    return () => {
      mounted = false;
    };
  }, [navigate, page, search, sort, status]);

  const handleLogout = async () => {
    await axiosConfig.post(apiEndpoints.LOGOUT).catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/admin/login', { replace: true });
  };

  const formatReadingTime = (minutes = 0) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatLastActive = (date) => (date ? new Date(date).toLocaleString() : 'Never');

  return (
    <div>
      <div className="flex flex-row">
        <div className="left bg-blue-500 h-screen justify-between py-8 px-10 flex-1">
          <div className="top flex flex-col gap-20">
            <div className="logo justify-center text-center items-center flex flex-row gap-2">
              <span>
                <img src={ReadHubImages.ProperReadHubLogo} alt="" />
              </span>
            </div>
            <div className="navitems text-sm text-white font-normal flex flex-col gap-10">
              <div className="flex flex-row gap-2 items-center">
                <span>
                  <img src={ReadHubImages.dashboardIcon} alt="" />
                </span>
                <span>
                  <Link to="/admin/dashboard">Dashboard</Link>
                </span>
              </div>
              <div className="flex flex-row gap-2 items-center bg-blue-700 px-4 py-2.5 rounded-lg">
                <span>
                  <img src={ReadHubImages.peopleIcon} alt="" />
                </span>
                <span>
                  <Link to="/admin/readers">Readers</Link>
                </span>
              </div>
              <div className="flex flex-row gap-2 items-center">
                <span>
                  <img src={ReadHubImages.booksIconSvg} alt="" />
                </span>
                <span>
                  <Link to="/admin/books">Books</Link>
                </span>
              </div>
            </div>
          </div>

          <div className="bottom profileDetails flex flex-col gap-6 justify-center items-start">
            <div className=" w-full text-white">
              <hr />
            </div>
            <div className="flex flex-row items-center gap-4">
              <div className="w-9 h-9">
                <img src={ReadHubImages.blankCircleSvgIcon} alt="" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-50 font-medium">
                  {admin?.username || 'Admin'}
                </span>
                <span className="text-xs text-gray-50 font-light">Admin</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-row gap-10 items-center"
            >
              <span className="w-3 h-3">
                <img src={ReadHubImages.logoutSvgIcon} alt="" />
              </span>
              <span className="text-xs text-gray-50">Logout</span>
            </button>
          </div>
        </div>

        <div className="right w-full py-8 flex flex-col flex-8 bg-gray-50">
          <div className="topmost px-8 flex flex-row justify-between items-center">
            <div>
              <span className="text-gray-800 font-medium text-xl">Readers</span>
            </div>
            <label className="flex flex-row items-center gap-2 bg-gray-100 border border-blue-400 pr-20 pl-3 rounded-lg py-2">
              <span className="w-3.5 h-3.5">
                <img src={ReadHubImages.searchSvgIcon} alt="" />
              </span>
              <input
                aria-label="Search readers"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="text-xs text-gray-600 bg-transparent outline-none"
                placeholder="Search readers"
              />
            </label>
          </div>

          <div className="w-full">
            <span className="border border-blue-300 flex flex-row mt-7"></span>
          </div>

          <div className="flex flex-row items-center gap-5 px-8 py-8">
            <select
              aria-label="Filter reader status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="border border-blue-400 bg-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              aria-label="Sort readers"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="border border-blue-400 bg-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          <div className="w-full max-w-7xl mx-auto bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden font-sans">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-sm font-medium">
                    <th className="py-4 px-6">Reader</th>
                    <th className="py-4 px-6">Books</th>
                    <th className="py-4 px-6">Reading time</th>
                    <th className="py-4 px-6">Current book</th>
                    <th className="py-4 px-6">Last active</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {readers.map((reader) => (
                    <tr key={reader._id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Reader Column */}
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{reader.username}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{reader.email}</div>
                      </td>

                      {/* Books Column */}
                      <td className="py-4 px-6 text-gray-600">{reader.booksCount}</td>

                      {/* Reading Time Column */}
                      <td className="py-4 px-6 text-gray-600">
                        {formatReadingTime(reader.readingMinutes)}
                      </td>

                      {/* Current Book Column */}
                      <td className="py-4 px-6 text-gray-600">{reader.currentBook || 'None'}</td>

                      {/* Last Active Column */}
                      <td className="py-4 px-6 text-gray-600">
                        {formatLastActive(reader.lastActive)}
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">
                          {reader.status}
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
                  {!loading && readers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        No readers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {loading && <p className="p-6 text-center text-gray-600">Loading readers...</p>}
          {error && <p className="p-6 text-center text-red-600">{error}</p>}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 p-6">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="px-3 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page === pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="px-3 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Readers;