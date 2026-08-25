import React, { useEffect, useState } from 'react';
import { ReadHubImages } from '../../assets/asset';
import { Link, useNavigate } from 'react-router-dom';
import axiosConfig from '../../Util/axiosConfig';
import { apiEndpoints } from '../../Util/apiEndpoints';

const Books = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
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

    const loadBooks = async () => {
      if (!localStorage.getItem('token')) {
        navigate('/admin/login', { replace: true });
        return;
      }

      setLoading(true);
      try {
        const [booksResponse, adminResponse] = await Promise.all([
          axiosConfig.get(apiEndpoints.ADMIN_BOOKS, {
            params: { page, limit: 20, search, status, sort },
          }),
          page === 1 ? axiosConfig.get(apiEndpoints.ADMIN_ME) : Promise.resolve(null),
        ]);

        if (!mounted) return;
        setBooks(booksResponse.data.data || []);
        setPagination(booksResponse.data);
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
        setError(requestError.response?.data?.message || 'Unable to load books.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadBooks();
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

  if (!books.length && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading books...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-row">
        <div className="left bg-blue-500 h-screen justify-between py-8 px-10 flex-1">
          <div className="top flex flex-col gap-20">
            <div className="logo justify-center text-center items-center flex flex-row gap-2">
              <span>
                <img src={ReadHubImages.ProperReadHubLogo} alt="ReadHub" />
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
              <div className="flex flex-row gap-2 items-center">
                <span>
                  <img src={ReadHubImages.peopleIcon} alt="" />
                </span>
                <span>
                  <Link to="/admin/readers">Readers</Link>
                </span>
              </div>
              <div className="flex flex-row gap-2 items-center bg-blue-700 px-4 py-2.5 rounded-lg">
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
            <div className="w-full text-white">
              <hr />
            </div>
            <div className="flex flex-row items-center gap-4">
              <div className="w-9 h-9">
                <img src={admin?.profilePicture || ReadHubImages.blankCircleSvgIcon} alt="" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-50 font-medium">
                  {admin?.username || 'Admin'}
                </span>
                <span className="text-xs text-gray-50 font-light">{admin?.role || 'admin'}</span>
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
              <span className="text-gray-800 font-medium text-xl">Books</span>
            </div>
            <label className="flex flex-row items-center gap-2 bg-gray-100 border border-blue-400 pr-20 pl-3 rounded-lg py-2">
              <span className="w-3.5 h-3.5">
                <img src={ReadHubImages.searchSvgIcon} alt="" />
              </span>
              <input
                aria-label="Search books"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="text-xs text-gray-600 bg-transparent outline-none"
                placeholder="Search titles"
              />
            </label>
          </div>

          <div className="w-full">
            <span className="border border-gray-300 flex flex-row mt-7" />
          </div>
          <div className="py-8 px-6">
            <span className="text-gray-600 font-medium text-sm">Manage the ReadHub library</span>
          </div>

          <div className="flex flex-row items-center gap-5 px-8.5 pb-4">
            <select
              aria-label="Filter book status"
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
              aria-label="Sort books"
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

          {error && <p className="p-6 text-center text-red-600">{error}</p>}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {books.map((book) => (
                    <tr key={book.title} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 flex flex-row items-center gap-2">
                        <img
                          className="w-8 h-10 object-cover"
                          src={book.coverImageUrl || ReadHubImages.trendingbook1}
                          alt=""
                        />
                        <span className="font-medium text-gray-900">{book.title}</span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{book.genre || 'Not available'}</td>
                      <td className="py-4 px-6 text-gray-600">{book.author || 'Not available'}</td>
                      <td className="py-4 px-6 text-gray-600">{book.readers}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">
                          {book.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!loading && books.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">
                        No books found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {loading && <p className="p-6 text-center text-gray-600">Loading books...</p>}
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

export default Books;
