import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Link } from 'react-router-dom';
import MacContainer from '../components/MacContainer/MacContainer';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { apiFetch } from '../lib/api';
import './style.css';

const QUICK_ACTIONS = [
  {
    to: '/show-users',
    icon: '🧭',
    title: 'Discover people',
    body: 'Browse members who answered the same seven questions.',
  },
  {
    to: '/chat',
    icon: '💬',
    title: 'Open the chat',
    body: 'Say hello in the shared room and see who replies.',
  },
  {
    to: '/location',
    icon: '📍',
    title: 'Set your location',
    body: 'Share where you are to meet people close enough to hang out.',
  },
  {
    to: '/profile',
    icon: '🪪',
    title: 'Check your profile',
    body: 'See exactly what other members see about you.',
  },
];

const Welcome = () => {
  const [name, setName] = useState('');

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((data) => setName(data.data.user.name))
      .catch(() => setName(''));
  }, []);

  const firstName = name.split(' ')[0];

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero ---------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-ink-950">
          <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />

          <div className="container-page relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
            <div className="animate-fade-up">
              <p className="eyebrow text-brand-300">You are in</p>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Welcome{firstName ? `, ${firstName}` : ''}.
                <br />
                Your people are waiting.
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
                Your answers are saved. Now go find the friends you did not know you were
                missing — no dating drama, pinky promise.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button to="/show-users" size="lg">
                  Find my buddy
                </Button>
                <Button to="/profile" size="lg" variant="onDark">
                  View my profile
                </Button>
              </div>
            </div>

            <div className="welcome-canvas h-[280px] w-full sm:h-[360px] lg:h-[420px]">
              <Canvas camera={{ fov: 22, position: [0, -2, 120] }}>
                <ambientLight intensity={1.1} />
                <directionalLight position={[10, 20, 15]} intensity={2.2} />
                <directionalLight position={[-12, -4, -10]} intensity={0.8} />
                <Suspense fallback={null}>
                  <MacContainer />
                </Suspense>
              </Canvas>
            </div>
          </div>
        </section>

        {/* Quick actions -------------------------------------------------- */}
        <section className="container-page py-12 sm:py-16">
          <h2 className="text-2xl font-extrabold">Where to next</h2>
          <p className="mt-1.5 text-sm text-ink-500">Four places worth starting from.</p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.to} to={action.to} className="card-interactive block p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 text-xl">
                  {action.icon}
                </span>
                <h3 className="mt-4 text-base font-bold">{action.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{action.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Welcome;
