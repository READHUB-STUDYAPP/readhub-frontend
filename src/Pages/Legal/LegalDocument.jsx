import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

/** How far a clause's text is held clear of its number. */
const MARKER = '2.25rem';

/**
 * Renders one of the legal documents.
 *
 * The blocks come from the same content files the phone app renders, so the two
 * cannot drift into saying different things about the same policy -- which for
 * a privacy policy is a real problem, not a tidiness one.
 *
 * Numbered clauses are set in a hanging indent so the numbers form a column the
 * eye can run down: these are pages someone opens to find one clause, not to
 * read start to finish. Body text is justified, as in the source document, and
 * the column is capped near 70 characters so justification does not open rivers
 * of white space on a wide screen.
 */
export default function LegalDocument({ document }) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="text-ink-soft transition-colors hover:text-ink"
        >
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-headline_Small font-extrabold text-ink">{document.title}</h1>
      </div>

      <article className="flex flex-col gap-2">
        {document.blocks.map((block, index) => (
          <Block key={`${block.type}-${index}`} block={block} />
        ))}
      </article>
    </div>
  );
}

function Block({ block }) {
  const { type, marker, text } = block;

  if (type === 'heading' || type === 'subheading') {
    const heading = type === 'heading';

    return (
      <div
        className={`flex gap-2 ${heading ? 'mt-6' : 'mt-4 pl-3'}`}
        style={marker ? undefined : { paddingLeft: 0 }}
      >
        {marker && (
          <span
            className={`shrink-0 font-bold text-ink ${heading ? 'text-tittle_Medium' : 'text-label_Large'}`}
            style={{ width: MARKER }}
          >
            {marker}
          </span>
        )}
        {heading ? (
          <h2 className="flex-1 text-tittle_Medium font-bold text-ink">{text}</h2>
        ) : (
          <h3 className="flex-1 text-label_Large font-semibold text-ink">{text}</h3>
        )}
      </div>
    );
  }

  if (type === 'meta') {
    return <p className="text-label_Medium text-ink-faint">{text}</p>;
  }

  if (type === 'item') {
    return (
      <div className="flex gap-2 pl-6">
        {/* The marker is supplied here: in the source these are Word list
            items, whose bullets live in the numbering definition and would
            otherwise be lost. */}
        <span aria-hidden="true" className="text-ink-faint">
          •
        </span>
        <p className="flex-1 text-body_Medium text-ink-soft">{text}</p>
      </div>
    );
  }

  return <p className="text-justify text-body_Medium text-ink-soft">{text}</p>;
}
