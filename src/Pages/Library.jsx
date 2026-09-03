import React, { useEffect, useRef, useState } from 'react';
import ContCard from '../Components/ContCard';
import { Document, Page, pdfjs } from 'react-pdf';
import ViewPdf from '../Features/ViewPdf';
import { useNavigate } from 'react-router-dom';

import { useFiles } from '../Context/FileContext';
import Epub from 'epubjs';

import { extractPdfCover, extractEpubCover, generateCoverImage } from '../Utils/coverExtractor';
import { optimizePdfLossy } from '../Utils/pdfLossyOptimize';
import LoadingContCard from '../Components/LoadingContCard';
import { ReadHubImages } from '../assets/asset';
import { toast } from 'react-toastify';
import { discoverApi } from '../services/discover';
import { FiSearch, FiX } from 'react-icons/fi';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Library = () => {
  const {
    selectFile,
    files,
    getProgress,
    uploadBook,
    fetchBooks,
    setSelectedFile,
    currentPage,
    updateCurrentPage,
    deleteBook,
    setBookShared,
    setBookCategory,
    loading,
  } = useFiles();
  const navigate = useNavigate();

  const [fileType, setFileType] = useState(null);
  const [fileName, setFileName] = useState('');

  const [activeFilter, setActiveFilter] = useState('All books');
  const categories = ['Fiction', 'Educational & Academic Non-Fiction', 'Self-Help & Personal Growth', 'Biography/True Stories', 'LifeStyle'];
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCompressionInfo, setShowCompressionInfo] = useState(false);
  const [uploadStep, setUploadStep] = useState('uploading'); // 'compressing' | 'uploading'
  const [showCompressionSuccess, setShowCompressionSuccess] = useState(false);
  const [savedStoragePct, setSavedStoragePct] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const compressionSuccessTimerRef = useRef(null);

  const [isFetchingBooks, setIsFetchingBooks] = useState(false);

  //Refresh books on mount
  useEffect(() => {
    const fetch = async () => {
      try {
        setIsFetchingBooks(true);
        await fetchBooks();
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setIsFetchingBooks(false);
      }
    };
    fetch();
  }, [fetchBooks]);

  const handleFileSElect = async (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    const isPdf =
      selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');

    // Cloudinary upload limit is 10MB. For PDFs, we allow a lossy optimization pass.
    if (!isPdf && selectedFile.size > 10 * 1024 * 1024) {
      const mb = (selectedFile.size / (1024 * 1024)).toFixed(1);
      alert(`File is ${mb}MB. Max upload is 10MB right now.`);
      setIsUploading(false);
      setUploadProgress(0);
      setShowCompressionInfo(false);
      setUploadStep('uploading');
      try {
        event.target.value = '';
      } catch {}
      return;
    }

    setShowCompressionInfo(isPdf && selectedFile.size > 10 * 1024 * 1024);
    setUploadStep(isPdf && selectedFile.size > 10 * 1024 * 1024 ? 'compressing' : 'uploading');
    setIsUploading(true);
    setFileName(selectedFile.name);
    setUploadProgress(0);

    // Note: true “quality-preserving compression” to <10MB isn’t reliably possible for PDFs/EPUBs.
    // Note: Cloudinary currently limits uploads to 10MB on this plan (PDFs > 10MB are lossy-optimized before upload).

    if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
      await handlePdf(selectedFile);
    } else if (
      selectedFile.type === 'application/epub' ||
      selectedFile.name.toLowerCase().endsWith('.epub')
    ) {
      await handleEpub(selectedFile);
    } else {
      alert('Unsupported file type. Please upload .pdf or .epub files.');
      setIsUploading(false);
    }
  };

  //pdf handle

  const handlePdf = async (file) => {
    setFileType('pdf');

    try {
      setUploadProgress(10);

      // ✅ Read file as ArrayBuffer (not base64)
      const arrayBuffer = await file.arrayBuffer();

      const pdf = await pdfjs.getDocument({
        data: arrayBuffer,
        disableAutoFetch: true,
        disableStream: true,
      }).promise;

      // ✅ Extract cover from buffer (you'll adjust your function)
      const coverImage = await extractPdfCover(pdf);
      const totalPages = pdf.numPages;

      let uploadFile = file;
      let didCompress = false;
      let compressedBytes = file.size;
      if (file.size > 10 * 1024 * 1024) {
        setUploadStep('compressing');
        setUploadProgress(20);
        const optimizedBlob = await optimizePdfLossy(
          pdf,
          { maxBytes: 10 * 1024 * 1024 },
          ({ pass, page, totalPages: total }) => {
            const base = 20;
            const span = 35;
            const pagePct = total > 0 ? page / total : 0;
            const passBonus = Math.min(2, Math.max(0, pass - 1)) * 0.08;
            const pct = base + Math.round(Math.min(1, pagePct + passBonus) * span);
            setUploadProgress((prev) => (pct > prev ? pct : prev));
          },
        );

        uploadFile = new File([optimizedBlob], file.name, {
          type: 'application/pdf',
          lastModified: Date.now(),
        });

        didCompress = true;
        compressedBytes = optimizedBlob.size;
        setUploadStep('uploading');
      }

      await pdf.destroy();
      setUploadProgress(60);

      // give iOS a breather
      await new Promise((r) => setTimeout(r, 0));

      const uploadedBook = await uploadBook(
        uploadFile,
        {
          title: file.name.replace('.pdf', ''),
          author: 'Unknown',
          totalPages: totalPages,
          // Same guard as the EPUB path: a PDF whose first page will not
          // render leaves no cover, and the server refuses a book without one.
          coverImage: coverImage || generateCoverImage(file.name.replace('.pdf', ''), 'Unknown'),
        },
        (pct) => {
          const percent = Number(pct);
          if (!Number.isFinite(percent)) return;
          // Map upload progress into the "uploading" slice (60% -> 95%)
          const mapped = 60 + Math.round((Math.min(100, Math.max(0, percent)) / 100) * 35);
          setUploadProgress((prev) => (mapped > prev ? mapped : prev));
        },
      );

      setUploadProgress(100);
      await fetchBooks();

      if (didCompress) {
        const original = Number(file.size || 0);
        const compressed = Number(compressedBytes || 0);
        const pct =
          original > 0 && compressed > 0
            ? Math.max(
                0,
                Math.min(99, Math.round((1 - compressed / original) * 100)),
              )
            : 0;
        setSavedStoragePct(pct);
      }
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setShowCompressionInfo(false);
        setUploadStep('uploading');

        if (didCompress) {
          setShowCompressionSuccess(true);
          if (compressionSuccessTimerRef.current) {
            clearTimeout(compressionSuccessTimerRef.current);
          }
          compressionSuccessTimerRef.current = setTimeout(() => {
            setShowCompressionSuccess(false);
          }, 3000);
        }
      }, 500);
    } catch (error) {
      console.error('PDF upload failed:', error);
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.details ||
        '';
      const details = serverMsg || error?.message || '';
      alert(`Failed to upload pdf file${details ? `: ${details}` : ''}`);
      setIsUploading(false);
      setShowCompressionInfo(false);
      setUploadStep('uploading');
      setShowCompressionSuccess(false);
    }
  };

  //epub handle

  const handleEpub = async (file) => {
    setFileType('epub');

    try {
      const fileDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Unable to read EPUB'));
        reader.readAsDataURL(file);
      });
      const coverImage = await extractEpubCover(fileDataUrl);
      const book = Epub(file);
      await book.ready;
      const metadata = await book.loaded.metadata;
      let totalPages = 1;
      try {
        const locations = await book.locations.generate(1024);
        totalPages = Math.max(1, locations.length || 1);
      } catch {}
      book.destroy();

      const title = metadata.title || file.name.replace(/\.epub$/i, '');
      const author = metadata.creator || 'Unknown';

      await uploadBook(file, {
        title,
        author,
        totalPages,
        // Most EPUBs carry no cover image, and the server refuses a book
        // without one -- which is why these uploads failed with nothing on
        // screen to explain it. One is drawn when the file has none.
        coverImage: coverImage || generateCoverImage(title, author),
      }, (pct) => setUploadProgress(Math.max(0, Math.min(100, Number(pct) || 0))));

      setUploadProgress(100);
      await fetchBooks();
      setIsUploading(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('EPUB upload failed:', error);
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || '';
      alert(`Failed to upload epub file${serverMsg ? `: ${serverMsg}` : ''}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const openPdf = (file) => {
    setSelectedFile(file);
    navigate(`/viewpdf/${file._id}`);
  };

  const openEpub = (file) => {
    selectFile(file);
    navigate(`/viewepub/${file._id}`);
  };

  const filters = ['All books', 'Reading', 'Completed'];

  function filterBooks(books, filter) {
    let filtered = books;

    // Filter by status
    if (filter === 'reading') {
      filtered = books.filter((b) => {
        const page = currentPage[b._id] ?? b.lastPageRead ?? 0;
        return page > 0 && page < b.pages;
      });
    } else if (filter === 'completed') {
      filtered = books.filter((b) => {
        const page = currentPage[b._id] ?? b.lastPageRead ?? 0;
        return page >= b.pages;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (book) =>
          book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (categoryFilter !== 'All categories') {
      filtered = filtered.filter((book) => book.category === categoryFilter);
    }

    return filtered;
  }

  const filtered = filterBooks(files, activeFilter.toLowerCase());

  // Which book's sharing is in flight, so only that card's control waits.
  const [sharingId, setSharingId] = useState(null);

  /**
   * Shares a book, or withdraws it.
   *
   * One click, as on the phone. Only turning sharing *on* asks first: it puts
   * the book in front of every other reader and lets them take a copy, which
   * is not something to find out afterwards. Withdrawing is the undo, so it
   * happens immediately.
   */
  const handleToggleShare = async (book) => {
    const next = !book.isPublic;

    if (
      next &&
      !window.confirm(
        `Share "${book.title}"? It will appear in Explore, where anyone can add it to their own library.`,
      )
    ) {
      return;
    }

    setSharingId(book._id);
    try {
      await discoverApi.setVisibility(book._id, next);
      setBookShared(book._id, next);
      toast.success(next ? 'Shared in Explore.' : 'No longer shared.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not change sharing for that book.');
    } finally {
      setSharingId(null);
    }
  };

  const handleDelete = async (bookId) => {
    const confirm = window.confirm('Delete this book ?');
    if (!confirm) return;
    await deleteBook(bookId);
  };
  console.log(isFetchingBooks);
  return (
    <div className="px-[16px] pt-[40px] overflow-hidden pb-15">
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center px-5 xl:px-10 justify-center z-50">
          <div className="bg-surface rounded-lg p-6 flex flex-col justify-center items-center">
            <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            {showCompressionInfo ? (
              <div className="flex flex-col items-center gap-1">
                <p
                  className={`text-[16px] ${
                    uploadStep === 'compressing' ? 'text-ink-soft font-semibold' : 'text-ink-faint'
                  }`}
                >
                  Compressing your file....
                </p>
                <p className="text-ink-soft text-center text-xs">
                  Your file is larger than 10MB. We're compressing it to make uploads faster and
                  improve your reading experience.
                </p>

                {/* Progress Bar */}
                <div className="w-25 bg-surface-variant rounded-full h-2 mt-2">
                  <div
                    className="bg-brand h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-ink-faint text-center mt-1">{uploadProgress}%</p>

                <p
                  className={`text-[16px] ${
                    uploadStep === 'uploading' ? 'text-ink-faint text-xs' : 'text-ink-faint'
                  }`}
                >
                  ...almost done
                </p>

                <p className='text-ink-soft text-xs '><b>Tip:</b> You can create notes while reading your books</p>
              </div>
            ) : (
              <p className="text-ink-soft text-[16px]">Uploading book...</p>
            )}
          </div>
        </div>
      )}

      {showCompressionSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-7 flex flex-col justify-center items-center gap-3 shadow-xl w-[320px]">
            <p className="text-ink-soft text-[16px] font-semibold">
              File compressed successfully
            </p>

            <img src={ReadHubImages.confettiIcon} alt="" />

            <p className="text-ink-soft text-[15px]">
              Saved {savedStoragePct}% storage
            </p>
          </div>
        </div>
      )}
      <div className="flex justify-between mb-8 items-center">
        <p className="text-ink text-tittle_Large">Library</p>

        <label
          htmlFor="fileselect2"
          className="flex w-[40px] h-[40px] rounded-[8.04] bg-surface justify-center items-center"
        >
          <input
            type="file"
            accept=".pdf,.epub"
            id="fileselect2"
            onChange={handleFileSElect}
            className="hidden"
          />{' '}
          <svg
            className="w-[24px] h-[24px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path>
          </svg>
        </label>
      </div>

      {/*
        The search box.

        It had no `value` and no `onChange`, so `searchQuery` never changed and
        the filter below it -- which was written and working -- never ran:
        typing in here did nothing at all. The input also carried an inline
        white background and did not grow, so the text sat in a narrow strip of
        the row and the box stayed white in dark mode.
      */}
      <div className="mb-4 flex h-[46px] w-full items-center gap-3 rounded-[11px] border border-line bg-surface px-4 focus-within:border-brand">
        <FiSearch size={18} className="shrink-0 text-[var(--ink-faint)]" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by title or author"
          aria-label="Search your library"
          className="min-w-0 flex-1 bg-transparent text-body_Medium text-ink outline-none placeholder:text-[var(--ink-faint)]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="shrink-0 rounded-full p-1 text-[var(--ink-faint)] transition-colors hover:bg-surface-variant hover:text-ink"
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      <div className="flex justify-between text-body_Small font-medium mb-4">
        <label
          htmlFor="fileselect"
          className="h-[38px] xsm:w-[160px] w-[171px] border-1 rounded-[33px]  border-[var(--ink-soft)] flex justify-center items-center active:bg-black/10"
        >
          <input
            type="file"
            accept=".pdf,.epub"
            id="fileselect"
            onChange={handleFileSElect}
            className="hidden"
          />
          <img src="/Variant3c.svg" alt="icon" className="w-[24px]" />
          <p>Upload book</p>
        </label>
        <div className="h-[38px] w-[171px] xsm:w-[160px] border-1 rounded-[33px] border-[var(--ink-soft)] flex justify-center items-center">
          <img src="/Variant3b.svg" alt="icon" className="w-[24px]" />
          <p>Scan Cover</p>
        </div>
      </div>

      {/*
        The category filter.

        The chips were all the same white with only the text colour changing,
        so the selected one was almost impossible to pick out, and they were
        hardcoded light colours that ignored the theme. The selected chip now
        carries the brand, and `aria-pressed` says which is on for anyone not
        reading the colour.
      */}
      <div
        className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Filter books by category"
      >
        {['All categories', ...categories].map((option) => {
          const selected = categoryFilter === option;

          return (
            <button
              type="button"
              key={option}
              onClick={() => setCategoryFilter(option)}
              aria-pressed={selected}
              className={`shrink-0 rounded-full px-4 py-2 text-label_Large transition-colors ${
                selected
                  ? 'bg-brand font-semibold text-white'
                  : 'bg-surface text-[var(--ink-soft)] hover:bg-surface-variant hover:text-ink'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div>
        {!isFetchingBooks && files.length > 0 ? (
          <div>
            <div className="text-body_Small flex gap-4 w-full mb-8 overflow-scroll">
              <div className="flex justify-between w-200 gap-4">
                {filters.map((f, index) => (
                  <div
                    key={index}
                    onClick={() => setActiveFilter(f)}
                    className={`bg-surface w-[91px] h-[38px] rounded-[33px] flex justify-center items-center ${activeFilter !== f ? 'text-[var(--ink-soft)]' : 'text-ink'}`}
                  >
                    {`${f}(${filterBooks(files, f.toLocaleLowerCase()).length})`}
                  </div>
                ))}
              </div>
            </div>
            {filtered?.map((book) => {
              const page = currentPage[book._id] ?? book.lastPageRead ?? 0;
              return (
                <ContCard
                  key={book._id}
                  fileName={book.title}
                  page={page}
                  totalPage={book.pages}
                  progress={getProgress(page, book.pages)}
                  onOpen={() => (book.fileUrl.endsWith('.pdf') ? openPdf(book) : openEpub(book))}
                  progPercent={getProgress(page, book.pages) + '%'}
                  continueRead={page < 1 ? 'Start Reading' : 'Continue Reading'}
                  file={book}
                  coverImage={book.coverImageUrl}
                  category={book.category}
                  categories={categories}
                  onCategoryChange={(category) => setBookCategory(book._id, category)}
                  onDelete={() => handleDelete(book._id)}
                  showDelete={true}
                  isPublic={Boolean(book.isPublic)}
                  onToggleShare={() => handleToggleShare(book)}
                  isSharing={sharingId === book._id}
                />
              );
            })}
          </div>
        ) : isFetchingBooks ? (
          <div>
            <LoadingContCard />
            <LoadingContCard />
            <LoadingContCard />
            <LoadingContCard />
            <LoadingContCard />
          </div>
        ) : (
          <div className="w-full h-100 flex justify-center items-center">
            Let's upload some pdf files
          </div>
        )}
      </div>
    </div>
  );
};
export default Library;
