import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppShell from '../components/layout/AppShell';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import MatchRing from '../components/ui/MatchRing';
import PresenceDot from '../components/ui/PresenceDot';
import ConnectButton from '../components/ui/ConnectButton';
import { RevealGroup, RevealItem } from '../components/motion/Reveal';
import { hoverLift, usePrefersReducedMotion } from '../lib/motion';
import { apiFetch } from '../lib/api';
import { genderLabel } from '../lib/labels';

const SORTS = [
  { value: 'match', label: 'Best match' },
  { value: 'distance', label: 'Nearest' },
  { value: 'newest', label: 'Newest' },
];

const RADIUS_OPTIONS = [
  { value: 0, label: 'Anywhere' },
  { value: 5, label: '5 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
];

const FILTERS = [
  { value: 0, label: 'Everyone' },
  { value: 40, label: '40%+' },
  { value: 60, label: '60%+' },
  { value: 80, label: '80%+' },
];

const CardSkeleton = () => (
  <div className="card p-6">
    <div className="flex items-center gap-4">
      <div className="skeleton h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="skeleton h-14 w-14 rounded-full" />
    </div>
    <div className="mt-6 space-y-2">
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-4/5 rounded" />
    </div>
  </div>
);

const MatchCard = ({ match }) => {
  const reduced = usePrefersReducedMotion();
  const { user, percent, shared, distance } = match;

  return (
    <RevealItem>
      <motion.article
        className="card flex h-full flex-col p-6"
        initial="rest"
        whileHover={reduced ? undefined : 'hover'}
        animate="rest"
        variants={hoverLift}
      >
        <div className="flex items-start gap-4">
          <Avatar name={user.name} seed={user._id} avatar={user.avatar} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold">{user.name}</h2>
            <p className="text-sm text-ink-500">
              {user.age} &middot; {genderLabel(user.gender)}
            </p>
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <PresenceDot user={user} withLabel />
              {distance && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-400">
                  <span aria-hidden="true">📍</span>
                  {distance.label}
                </span>
              )}
            </span>
          </div>
          <MatchRing percent={percent} size={56} />
        </div>

        {user.bio && <p className="mt-4 line-clamp-2 text-sm text-ink-600">{user.bio}</p>}

        {shared.length > 0 ? (
          <div className="mt-5 border-t border-ink-100 pt-4">
            <p className="text-xs uppercase tracking-wider text-ink-400">You both picked</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {shared.map((label) => (
                <span key={label} className="chip bg-brand-50 text-brand-700">
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-5 border-t border-ink-100 pt-4 text-sm text-ink-400">
            {percent === 0
              ? 'Nothing in common yet — but opposites make good stories.'
              : `No identical answers, but ${percent}% of your tastes lean the same way.`}
          </p>
        )}

        <div className="mt-auto space-y-2 pt-6">
          <ConnectButton userId={user._id} connection={match.connection} fullWidth />
          <Button to={`/discover/${user._id}`} variant="ghost" fullWidth>
            See why you match
          </Button>
        </div>
      </motion.article>
    </RevealItem>
  );
};

const ShowUsers = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('match');
  const [minScore, setMinScore] = useState(0);
  const [radius, setRadius] = useState(0);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch(
        `/api/discover?sort=${sort}&minScore=${minScore}&page=${page}&limit=12` +
          (radius > 0 ? `&radius=${radius}` : '')
      );
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [sort, minScore, radius, page]);

  useEffect(() => {
    load();
  }, [load]);

  const matches = data?.data?.matches || [];
  const newMembers = data?.data?.newMembers || [];
  const quizIncomplete = data && !data.quizComplete;

  return (
    <AppShell
      title="Discover"
      subtitle="Ranked by how much you actually have in common. Emails stay private until you both connect."
      actions={
        <Button to="/location" variant="outline">
          Update location
        </Button>
      }
    >
      {error && <Alert tone="error">{error}</Alert>}

      {quizIncomplete && (
        <Alert tone="info" className="mb-6">
          You have answered {data.answered} of {data.totalQuestions} questions. Finish the
          quiz to get real match scores.{' '}
          <Link to="/submit-answer" className="font-semibold underline">
            Finish it now
          </Link>
        </Alert>
      )}

      {/* Controls ---------------------------------------------------- */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-ink-200 bg-white p-1">
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSort(option.value);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                sort === option.value
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-xl border border-ink-200 bg-white p-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setMinScore(option.value);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                minScore === option.value
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* A radius is meaningless without the caller's own position. */}
        {data?.hasLocation && (
          <div className="flex rounded-xl border border-ink-200 bg-white p-1">
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setRadius(option.value);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  radius === option.value
                    ? 'bg-ink-900 text-white'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {data && !loading && (
          <span className="text-sm text-ink-400">
            {data.total} {data.total === 1 ? 'match' : 'matches'}
          </span>
        )}
      </div>

      {data && !data.hasLocation && !loading && (
        <Alert tone="info" className="mb-6">
          Add your location to sort and filter people by distance.{' '}
          <Link to="/location" className="font-semibold underline">
            Share it now
          </Link>
        </Alert>
      )}

      {/* Results ----------------------------------------------------- */}
      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <CardSkeleton key={key} />
          ))}
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <EmptyState
          icon="👋"
          title={
            radius > 0
              ? `Nobody within ${radius} km yet`
              : minScore > 0
                ? 'Nobody above that score yet'
                : 'Nobody else here yet'
          }
          description={
            radius > 0
              ? 'Try a wider radius, or switch back to Anywhere.'
              : minScore > 0
                ? 'Try lowering the filter, or check back as more people finish the quiz.'
                : 'You are early. As soon as other people finish the quiz, they will show up right here.'
          }
          action={
            radius > 0 ? (
              <Button variant="outline" onClick={() => setRadius(0)}>
                Search anywhere
              </Button>
            ) : minScore > 0 ? (
              <Button variant="outline" onClick={() => setMinScore(0)}>
                Show everyone
              </Button>
            ) : (
              <Button to="/welcome" variant="outline">
                Back to home
              </Button>
            )
          }
        />
      )}

      {!loading && matches.length > 0 && (
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <MatchCard key={match.user._id} match={match} />
          ))}
        </RevealGroup>
      )}

      {/* Pagination -------------------------------------------------- */}
      {data && data.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-ink-500">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((value) => Math.min(data.totalPages, value + 1))}
            disabled={page >= data.totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* New members ------------------------------------------------- */}
      {!loading && newMembers.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-bold">New members</h2>
          <p className="mt-1 text-sm text-ink-500">
            They have not finished the quiz yet, so there is nothing to score.
          </p>

          <RevealGroup className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {newMembers.map(({ user }) => (
              <RevealItem key={user._id}>
                <article className="card flex items-center gap-4 p-5">
                  <Avatar name={user.name} seed={user._id} avatar={user.avatar} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold">{user.name}</h3>
                    <p className="text-sm text-ink-500">
                      {user.age} &middot; {genderLabel(user.gender)}
                    </p>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}
    </AppShell>
  );
};

export default ShowUsers;
