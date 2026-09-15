import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import MatchRing from '../components/ui/MatchRing';
import ConnectButton from '../components/ui/ConnectButton';
import SafetyMenu from '../components/ui/SafetyMenu';
import { RevealGroup, RevealItem } from '../components/motion/Reveal';
import { apiFetch } from '../lib/api';
import { genderLabel } from '../lib/labels';

const MATCH_STYLES = {
  exact: {
    label: 'Same answer',
    row: 'border-accent-400/40 bg-accent-400/10',
    badge: 'bg-accent-500 text-white',
  },
  similar: {
    label: 'Same vibe',
    row: 'border-brand-200 bg-brand-50',
    badge: 'bg-brand-500 text-white',
  },
  none: {
    label: 'Different',
    row: 'border-ink-100 bg-white',
    badge: 'bg-ink-200 text-ink-600',
  },
  unanswered: {
    label: 'Not answered',
    row: 'border-dashed border-ink-200 bg-ink-50',
    badge: 'bg-ink-100 text-ink-400',
  },
};

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await apiFetch(`/api/discover/${id}`);
        setMatch(result.data);
      } catch (err) {
        setError(err.message || 'Could not load this member');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const exact = match?.breakdown.filter((row) => row.match === 'exact').length || 0;
  const similar = match?.breakdown.filter((row) => row.match === 'similar').length || 0;

  return (
    <AppShell
      title="Why you match"
      subtitle="Every question, side by side."
      width="narrow"
      actions={
        <Button to="/show-users" variant="outline">
          Back to discover
        </Button>
      }
    >
      {error && <Alert tone="error">{error}</Alert>}

      {loading && (
        <div className="card space-y-4 p-7">
          <div className="skeleton h-20 w-20 rounded-full" />
          <div className="skeleton h-5 w-44 rounded" />
          <div className="skeleton h-3 w-28 rounded" />
        </div>
      )}

      {match && (
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="relative bg-ink-950 px-7 py-8 sm:px-9">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-500/25 blur-3xl" />
              <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <Avatar
                  name={match.user.name}
                  seed={match.user._id}
                  avatar={match.user.avatar}
                  size="lg"
                />
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2 className="font-display text-2xl font-extrabold text-white">
                    {match.user.name}
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    {match.user.age} &middot; {genderLabel(match.user.gender)}
                    {match.distance && <> &middot; {match.distance.label}</>}
                  </p>
                  {match.user.bio && (
                    <p className="mt-2 text-sm text-white/75">{match.user.bio}</p>
                  )}
                </div>
                <MatchRing percent={match.percent} size={88} stroke={7} />
                <div className="absolute right-0 top-0">
                  <SafetyMenu
                    userId={match.user._id}
                    userName={match.user.name}
                    onChanged={(what) => what === 'blocked' && navigate('/show-users')}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-ink-100 border-t border-ink-100">
              {[
                ['Same answer', exact],
                ['Same vibe', similar],
                ['Match', `${match.percent}%`],
              ].map(([label, value]) => (
                <div key={label} className="px-4 py-5 text-center">
                  <p className="font-display text-xl font-bold">{value}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-ink-400">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {!match.quizComplete && (
            <Alert tone="info">
              {match.user.name} has not finished the quiz, so this score only covers the
              questions they did answer.
            </Alert>
          )}

          <RevealGroup className="space-y-3" staggerChildren={0.06}>
            {match.breakdown.map((row) => {
              const style = MATCH_STYLES[row.match] || MATCH_STYLES.none;

              return (
                <RevealItem key={row.key}>
                  <div className={`rounded-2xl border p-5 ${style.row}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-ink-800">{row.prompt}</p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}
                      >
                        {style.label}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white/70 px-3.5 py-2.5">
                        <dt className="text-xs uppercase tracking-wider text-ink-400">You</dt>
                        <dd className="mt-0.5 text-sm font-medium text-ink-800">
                          {row.yours || '—'}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-white/70 px-3.5 py-2.5">
                        <dt className="text-xs uppercase tracking-wider text-ink-400">
                          {match.user.name.split(' ')[0]}
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium text-ink-800">
                          {row.theirs || '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="sm:w-64">
              <ConnectButton
                userId={match.user._id}
                connection={match.connection}
                size="lg"
                fullWidth
              />
            </div>
            <Button to="/show-users" size="lg" variant="outline">
              Keep browsing
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default MatchDetail;
