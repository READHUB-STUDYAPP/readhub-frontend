import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { communitiesApi } from '../../services/communities';

/**
 * Where an invite link lands.
 *
 * The code is in the URL, so the only thing to do is use it and get out of the
 * way. A link that needs a form in the middle is a link that loses people.
 */
export default function JoinCommunity() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState('joining');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await communitiesApi.join({ code });
        if (cancelled) return;

        if (result.status === 202) {
          setState('requested');
          setMessage('Your request has been sent to the admins.');
          return;
        }
        toast.success(`Welcome to ${result.community?.name ?? 'the community'}.`);
        navigate(`/communities/${result.community?._id}`, { replace: true });
      } catch (error) {
        if (cancelled) return;
        setState('failed');
        setMessage(
          error?.response?.data?.message ||
            'That invite link is not valid. It may have been rotated.',
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      {state === 'joining' && (
        <>
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
          <p className="text-body_Medium text-ink-soft">Joining the community…</p>
        </>
      )}

      {state !== 'joining' && (
        <>
          <p className="text-tittle_Large font-bold text-ink">
            {state === 'requested' ? 'Request sent' : 'That link did not work'}
          </p>
          <p className="text-body_Medium text-ink-soft">{message}</p>
          <button
            type="button"
            onClick={() => navigate('/communities')}
            className="rounded-full bg-brand px-5 py-2.5 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            Go to Communities
          </button>
        </>
      )}
    </div>
  );
}
