import React, { useEffect, useMemo, useState } from 'react'
import { ReadHubImages } from '../../assets/asset'
import { useNavigate } from 'react-router-dom'
import axiosConfig from '../../Util/axiosConfig'
import { apiEndpoints } from '../../Util/apiEndpoints'
import { useFiles } from '../../Context/FileContext'

const Statistics = () => {

  const navigate = useNavigate()
  const { files, highlights: highlightMap, currentPage, readingGoal, liveReadingMinutes } = useFiles()

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const totalHighlights = useMemo(() => {
    const entries = Object.values(highlightMap || {})
    return entries.reduce(
      (sum, items) => sum + (Array.isArray(items) ? items.length : 0),
      0,
    )
  }, [highlightMap])

  const totalBooks = Array.isArray(files) ? files.length : 0

  // Match Library.jsx "completed/reading" logic so Statistics aligns with what user sees in Library.
  const { completedFromLibrary, readingFromLibrary } = useMemo(() => {
    const list = Array.isArray(files) ? files : []
    let completedCount = 0
    let readingCount = 0

    list.forEach((b) => {
      const id = b?._id
      const pages = Number(b?.pages || 0)
      if (!id || !Number.isFinite(pages) || pages <= 0) return

      const page = Number(currentPage?.[id] ?? b?.lastPageRead ?? 0)
      if (!Number.isFinite(page)) return

      if (page >= pages) {
        completedCount += 1
      } else if (page > 0 && page < pages) {
        readingCount += 1
      }
    })

    return { completedFromLibrary: completedCount, readingFromLibrary: readingCount }
  }, [files, currentPage])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await axiosConfig.get(apiEndpoints.BOOK_STATS)
        setStats(response.data)
        setError(null)
      } catch (err) {
        console.error('Error fetching statistics:', err)
        setError('Failed to load statistics')
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStats();
  }, [])

  const dailyGoal = stats?.dailyGoal ?? readingGoal ?? 30
  const todayReadingMinutes = (stats?.todayReadingMinutes ?? 0) + (liveReadingMinutes || 0)
  const totalHoursRead = stats?.totalHoursRead ?? 0
  const currentStreak = stats?.currentStreak ?? 0
  const bestStreak = stats?.bestStreak ?? 0
  const completedBooks = completedFromLibrary
  const currentlyReading = readingFromLibrary

  const weekLabels = useMemo(() => ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'], [])
  const weekMinutes = Array.isArray(stats?.weekMinutes) && stats.weekMinutes.length === 7
    ? stats.weekMinutes
    : Array.from({ length: 7 }, () => 0)
  const weekMax = Math.max(dailyGoal, ...weekMinutes, 1)

  const todayProgressPct =
    dailyGoal > 0 ? Math.min(100, Math.round((todayReadingMinutes / dailyGoal) * 100)) : 0

  const completedPct =
    totalBooks > 0 ? Math.min(100, Math.round((completedBooks / totalBooks) * 100)) : 0

  const readingPct =
    totalBooks > 0 ? Math.min(100, Math.round((currentlyReading / totalBooks) * 100)) : 0

  // Guard against any temporary backend/client mismatch where bestStreak hasn't caught up yet.
  const safeBestStreak = Math.max(bestStreak, currentStreak)
  const streakPct =
    safeBestStreak > 0
      ? Math.min(100, Math.round((currentStreak / safeBestStreak) * 100))
      : 0
  // Ensure tiny streak percentages are still visible.
  const streakBarPct =
    !loading && currentStreak > 0 && streakPct === 0 ? 2 : streakPct

  const achievements = useMemo(() => {
    const hours = Number(totalHoursRead || 0)
    const highlightsCount = Number(totalHighlights || 0)

    return {
      firstBook: completedBooks >= 1,
      streak7: safeBestStreak >= 7,
      highlights100: highlightsCount >= 100,
      books10: completedBooks >= 10,
      streak30: safeBestStreak >= 30,
      hours1000: Number.isFinite(hours) && hours >= 1000,
    }
  }, [completedBooks, safeBestStreak, totalHoursRead, totalHighlights])

  const achievementCardClass = (achieved) =>
    `flex flex-col justify-center items-center gap-4 rounded-xl py-5 px-1 border transition-colors ${
      achieved
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-blue-50 border-transparent'
    }`

  return (
    <>
    <div  className='p-5 bg-gray-100 min-h-screen'>
        <div className='flex flex-row gap-2 items-center justify-start mt-5'>
            <span onClick={() => navigate("/profile")}><img src={ReadHubImages.BackwardArrow} alt="" /></span>
             <span className='text-2xl font-medium'>Statistics</span>
        </div>

        {error && (
          <div className='mt-4 bg-red-50 text-red-700 border border-red-200 rounded-lg p-3'>
            {error}
          </div>
        )}

        <div className="cards grid grid-cols-2 gap-4 mt-10">
            <div className='flex flex-col gap-3 bg-white p-5 rounded-lg'>
                <span><img src={ReadHubImages.bookIcon} alt="" className='w-6 h-6' /></span>
                <span className='font-semibold text-xl'>{loading ? '...' : completedBooks}</span>
                <span className='font-light'>Books Read</span>
            </div>
            <div className='flex flex-col gap-3 bg-white p-5 rounded-lg'>
                <span><img src={ReadHubImages.timeIcon} alt=""  className='w-6 h-6'/></span>
                <span className='font-semibold text-xl'>{loading ? '...' : `${totalHoursRead}h`}</span>
                <span className='font-light'>Total Hours</span>
            </div>
            <div className='flex flex-col gap-3 bg-white p-5 rounded-lg'>
                <span><img src={ReadHubImages.fireIcon} alt="" className='w-6 h-8' /></span>
                <span className='font-semibold text-xl'>{loading ? '...' : currentStreak}</span>
                <span className='font-light'>Day Streak</span>
            </div>
            <div className='flex flex-col gap-3 bg-white p-5 rounded-lg'>
                <span><img src={ReadHubImages.highlightIcon} alt="" className='w-8 h-8' /></span>
                <span className='font-semibold text-xl'>{totalHighlights}</span>
                <span className='font-light'>Highlights</span>
            </div>
        </div>


        <div className="card mt-10 bg-blue-500 flex flex-col gap-5 p-5 rounded-2xl justify-start items-start w-full">
            <div className='flex flex-row justify-between w-full items-center'>
                <div className='flex flex-row items-center justify-center gap-2'>
                    <span><img src={ReadHubImages.circlesIcon} alt="" /></span>
                    <span className='text-white text-lg'>Daily Reading Goal</span>
                </div>
                <div><span><img src={ReadHubImages.ForwardArrow} alt="" /></span></div>
            </div>
            <div className='flex flex-col gap-1 w-full justify-start items-start'>
                <div className='flex flex-row justify-between items-center gap-46 w-full'>
                    <div><span className='text-white text-sm'>Today's Progress</span></div>
                    <div><span className='text-white text-sm'>{loading ? '.../...' : `${Math.round(todayReadingMinutes)}/${dailyGoal}min`}</span></div>
                </div>
                <div className="w-full h-3 bg-blue-200 mt-5 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-blue-700 rounded-lg transition-all duration-300"
                    style={{ width: `${todayProgressPct}%` }}
                  />
                </div>
            </div>
        </div>

        <div className="card flex flex-col gap-8 px-4 py-8 bg-white rounded-2xl mt-10">
            <div className='flex flex-row gap-2 items-center justify-start'>
                <span><img src={ReadHubImages.calendarIcon} alt="" /></span>
                <span className='text-xl font-medium'>This week</span>
            </div>
            <div className='flex flex-row w-full items-end justify-between gap-2 h-32'>
              {weekLabels.map((label, idx) => {
                const minutes = Number(weekMinutes[idx] || 0)
                const metGoal = minutes >= dailyGoal
                const height = Math.max(10, Math.round((minutes / weekMax) * 110))

                return (
                  <div key={label} className='flex flex-col items-center justify-end gap-2 flex-1'>
                    <div
                      className={`${metGoal ? 'bg-blue-500' : 'bg-blue-300'} w-full max-w-[44px] rounded-t-3xl transition-all duration-300`}
                      style={{ height: `${height}px` }}
                      title={loading ? '' : `${minutes} min`}
                    />
                    <span className='text-sm text-gray-700'>{label}</span>
                  </div>
                )
              })}
            </div>
            <div className='flex flex-row gap-4 items-center justify-center'>
                <div className='flex flex-row gap-2 justify-center items-center'>
                    <div className='p-2 w-2 h-2 rounded bg-blue-500'><span></span></div>
                    <span className='text-sm'>Goal met</span>
                </div>
                <div className='flex flex-row gap-2 justify-center items-center'>
                    <div className='p-2 w-2 h-2 rounded bg-blue-300'><span></span></div>
                    <span className='text-gray-700 text-sm'>Under goal</span>
                </div>
            </div>
        </div>

        <div className="card mt-10 bg-white px-6 py-8 rounded-lg flex flex-col justify-start items-start gap-4">
            <div className='flex flex-row gap-4 justify-start items-center'>
                <span><img src={ReadHubImages.progressIcon} alt="" className='w-6 h-4' /></span>
                <span className='text-xl font-semibold text-gray-800'>Reading Progress</span>
            </div>
            <div className='flex flex-col gap-3 justify-start items-start w-full mt-3'>
                <div className='flex flex-row w-full justify-between items-center'>
                    <span className='text-gray-600'>Completed books</span>
                    <span className='text-gray-600'>{loading ? '...' : completedBooks}</span>
                </div>
                <div className='h-3 rounded-xl bg-gray-200 w-full overflow-hidden'>
                  <div className='h-full bg-blue-500 rounded-xl' style={{ width: `${completedPct}%` }} />
                </div>
            </div>
            <div className='flex flex-col gap-3 justify-start items-start w-full'>
                <div className='flex flex-row w-full justify-between items-center'>
                    <span className='text-gray-600'>Currently Reading</span>
                    <span className='text-gray-600'>{loading ? '...' : currentlyReading}</span>
                </div>
                <div className='h-3 rounded-xl bg-gray-200 w-full overflow-hidden'>
                  <div className='h-full bg-blue-300 rounded-xl' style={{ width: `${readingPct}%` }} />
                </div>
            </div>
            <div className='flex flex-col gap-3 justify-start items-start w-full'>
                <div className='flex flex-row w-full justify-between items-center'>
                    <span className='text-gray-600'>Best Streak</span>
                    <span className='text-gray-600'>{loading ? '...' : `${safeBestStreak} days`}</span>
                </div>
                <div className='h-3 rounded-xl bg-gray-200 w-full overflow-hidden'>
                  <div
                    className='h-full bg-blue-500 rounded-xl transition-all duration-300'
                    style={{ width: `${loading ? 0 : streakBarPct}%` }}
                  />
                </div>
            </div>
        </div>

        <div className="card bg-white rounded-2xl mt-10 mb-20 px-3 py-5 flex flex-col gap-10">
            <div className='flex flex-row gap-4 justify-start items-center'>
                <span><img src={ReadHubImages.achievementIcon} alt="" className='w-4 h-6' /></span>
                <span className='text-xl font-semibold'>Achievements</span>
            </div>

            <div className="cards  grid grid-cols-3 gap-2">
                <div className={achievementCardClass(achievements.firstBook)}>
                    <span><img src={ReadHubImages.bookAchievementIcon} alt="" /></span>
                    <span>First Book</span>
                </div>
                <div className={achievementCardClass(achievements.streak7)}>
                    <span><img src={ReadHubImages.fireStreakIcon} alt="" /></span>
                    <span>7 Day Streak</span>
                </div>
                <div className={achievementCardClass(achievements.highlights100)}>
                    <span><img src={ReadHubImages.starHighlightIcon} alt="" /></span>
                    <span>100 Highlights</span>
                </div>
                <div className={achievementCardClass(achievements.books10)}>
                    <span><img src={ReadHubImages.booksIcon} alt="" /></span>
                    <span>10 Books</span>
                </div>
                <div className={achievementCardClass(achievements.streak30)}>
                    <span><img src={ReadHubImages.streakTrophyIcon} alt="" /></span>
                    <span>30 Day Streak</span>
                </div>
                <div className={achievementCardClass(achievements.hours1000)}>
                    <span><img src={ReadHubImages.diamondIcon} alt="" /></span>
                    <span>1000 Hours</span>
                </div>
            </div>
        </div>
    </div>
    </>
  )
}

export default Statistics
