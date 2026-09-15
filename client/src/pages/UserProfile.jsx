import { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import Profile from '../components/Profile/Profile';
import Personality from '../components/Personality/Personality';
import Compatibility from '../components/Compatibility/Compatibility';
import About from '../components/About/About';
import ChangePassword from '../components/Profile/ChangePassword';
import Sessions from '../components/Profile/Sessions';
import DangerZone from '../components/Profile/DangerZone';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { apiFetch } from '../lib/api';

// A small nicety only. Anything without an icon still renders fine, so adding
// a question in the database needs no change here.
const ICONS = {
  'movie-genre': '🍿',
  'weekend-plans': '🛍️',
  'music-taste': '🎶',
  communication: '💬',
  vacation: '🏖️',
  'tough-day': '🧘',
  'social-setting': '👥',
};

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [quiz, setQuiz] = useState({ answers: [], total: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [me, answers] = await Promise.all([
          apiFetch('/api/auth/me'),
          apiFetch('/api/auth/answers').catch(() => ({ data: { answers: [], total: 0 } })),
        ]);
        setUser(me.data.user);
        setQuiz(answers.data);
      } catch (err) {
        setError(err.message || 'Could not load your profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const traits = quiz.answers.map((answer) => ({
    name: answer.label,
    icon: ICONS[answer.key] || '•',
    value: answer.answerLabel,
  }));
  const answered = traits.length;
  const total = quiz.total || answered;
  const completeness = total === 0 ? 0 : (answered / total) * 100;

  return (
    <AppShell
      title="Your profile"
      subtitle="This is what other members see, minus your email address."
      width="narrow"
      actions={
        <>
          <Button to="/profile/edit">Edit profile</Button>
          <Button to="/settings/notifications" variant="outline">
            Settings
          </Button>
          <Button to="/profile/blocked" variant="outline">
            Blocked
          </Button>
          {user?.role === 'admin' && (
            <Button to="/admin/reports" variant="outline">
              Reports
            </Button>
          )}
        </>
      }
    >
      {error && <Alert tone="error">{error}</Alert>}

      {loading && (
        <div className="card space-y-4 p-7">
          <div className="skeleton h-20 w-20 rounded-full" />
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-3 w-28 rounded" />
        </div>
      )}

      {user && (
        <div className="space-y-6">
          <section className="card p-7 sm:p-9">
            <Profile
              id={user._id}
              name={user.name}
              age={user.age}
              gender={user.gender}
              email={user.email}
              avatar={user.avatar}
              bio={user.bio}
              interests={user.interests}
            />

            <div className="mt-8 border-t border-ink-100 pt-7">
              <Compatibility score={completeness} />
            </div>
          </section>

          <section className="card p-7 sm:p-9">
            <h2 className="text-lg font-bold">Your vibe</h2>
            <p className="mb-5 mt-1 text-sm text-ink-500">
              {answered} of {total} questions answered.
            </p>
            <Personality traits={traits} />
          </section>

          <section className="card p-7 sm:p-9">
            <About
              description={`${user.name} joined BUDDYFI to meet people who match their vibe. Answers from the seven-question quiz decide who shows up in their Discover feed.`}
            />
          </section>

          <section className="card p-7 sm:p-9">
            <Sessions />
          </section>

          <section className="card p-7 sm:p-9">
            <ChangePassword />
          </section>

          <section className="card p-7 sm:p-9">
            <DangerZone />
          </section>
        </div>
      )}
    </AppShell>
  );
};

export default UserProfile;
