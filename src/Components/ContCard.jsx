import React from "react";
import { FiGlobe, FiLock, FiTrash2 } from "react-icons/fi";
import { useFiles } from "../Context/FileContext";

const ContCard = ({
  fileName,
  page,
  totalPage,
  progress,
  onOpen,
  progPercent,
  continueRead,
  hideNotStarted,
  file,
  coverImage,
  onDelete,
  showDelete = false,
  isPublic = false,
  onToggleShare,
  isSharing = false,
  category,
  categories = [],
  onCategoryChange,
}) => {
  const validProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={`bg-surface p-4 rounded-[10px] mb-8 ${hideNotStarted}`}
    >
      <div className="flex gap-4 mb-4">
        <div className="h-[136px] w-[110px] shrink-0 rounded-[10px] bg-primary max-xsm:w-[100px] max-xsm:h-[120px] overflow-hidden">
          <img
            src={coverImage || `/note_stack.svg`}
            alt="books"
            className="w-full h-full object-cover"
          />
        </div>

        {/*
          The details take whatever width is left.

          This column was pinned to 210px, so on a wide browser the card grew
          and the text did not -- which is why a long title arrived truncated
          in the middle of an otherwise empty card. `min-w-0` is what lets it
          shrink on a narrow screen instead of pushing the cover off the edge.
        */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          {/*
            The title and this book's actions share a row.

            Both icons used to be positioned absolutely over this column, which
            printed them on top of the title -- the lock landed in the middle of
            a word. In a row the title simply ends where the buttons begin.
          */}
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-tittle_Medium text-ink font-semibold leading-snug line-clamp-2">
              {fileName}
            </p>

            <div className="flex shrink-0 items-center gap-1">
              {onCategoryChange && (
                /* The select covers the icon, so the whole thing is the
                   control -- it sits in the row with the other two actions
                   rather than floating over the title. */
                <label
                  className="relative flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-surface-variant"
                  title="Set book category"
                >
                  <span className="sr-only">Set book category</span>
                  <svg
                    className="w-[18px] h-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11Z" />
                  </svg>
                  <select
                    aria-label={`Set category for ${fileName}`}
                    value={category || ""}
                    onChange={(event) => onCategoryChange(event.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {onToggleShare && (
                <button
                  type="button"
                  onClick={onToggleShare}
                  disabled={isSharing}
                  aria-pressed={isPublic}
                  aria-label={
                    isPublic
                      ? `Stop sharing ${fileName}`
                      : `Share ${fileName} with other readers`
                  }
                  title={
                    isPublic ? "Shared in Explore" : "Share with other readers"
                  }
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-variant disabled:opacity-50 ${
                    isPublic ? "text-primary" : "text-[var(--ink-faint)]"
                  }`}
                >
                  {isPublic ? <FiGlobe size={17} /> : <FiLock size={17} />}
                </button>
              )}

              {showDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label={`Remove ${fileName}`}
                  title="Remove from your library"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10"
                >
                  <FiTrash2 size={17} />
                </button>
              )}
            </div>
          </div>

          <div>
            <span className="flex text-tittle_Small text-[var(--ink-soft)] justify-between mb-2 font-medium">
              <p>Progress</p>
              <p>{progPercent}</p>
            </span>
            <span className="flex h-[7px] bg-[var(--border)] rounded-[12px] relative">
              <span
                className="h-[7px] bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${validProgress}%` }}
              ></span>
            </span>
          </div>

          <p className="text-[var(--ink-soft)] max-xsm:text-[15px]">
            {`page ${page} of ${totalPage}`}
          </p>
        </div>
      </div>
      <div>
        {/*
          `bg-primary/56` with `text-primary` put the brand blue on 56% of
          itself, which is the label and the button in nearly the same colour --
          legible in the mock and not much else. The wash is the same pairing
          the shortcuts on Explore use.
        */}
        <button
          onClick={onOpen}
          className="h-[46px] w-full rounded-[11px] bg-brand-wash text-primary font-semibold flex justify-center items-center gap-1 transition-colors hover:bg-primary/15 active:bg-primary/20"
        >
          <img src="/play_arrow.svg" alt="" className="w-[24px]" />
          {continueRead}
        </button>
      </div>
    </div>
  );
};

export default ContCard;
