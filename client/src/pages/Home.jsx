import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import MarketingNav from '../components/layout/MarketingNav';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import Parallax from '../components/motion/Parallax';
import Reveal, { RevealGroup, RevealItem } from '../components/motion/Reveal';
import { EASE, hoverLift, usePrefersReducedMotion } from '../lib/motion';
import homeBack from '../assets/home-back.png';
import faceIcon from '../assets/communicate/face.png';
import musicIcon from '../assets/music/rock.png';
import beachIcon from '../assets/vacation/beach.png';

const STEPS = [
  {
    number: '01',
    title: 'Answer seven questions',
    body: 'Movies, music, weekends, how you handle a rough day. Two minutes, no essays.',
  },
  {
    number: '02',
    title: 'We score your vibe',
    body: 'Identical answers count double, near-misses count too. You get a real percentage.',
  },
  {
    number: '03',
    title: 'Meet your people',
    body: 'Browse matches ranked highest first, see exactly what you share, start a chat.',
  },
];

const FEATURES = [
  {
    image: musicIcon,
    title: 'Taste, not selfies',
    body: 'Matching starts from what you love, not how photogenic you were that morning.',
  },
  {
    image: faceIcon,
    title: 'Talk your way',
    body: 'Texting, voice notes, video, or meeting in person — say which one is actually you.',
  },
  {
    image: beachIcon,
    title: 'Friends nearby',
    body: 'Share your location once and see the people close enough to actually hang out.',
  },
];

const STATS = [
  ['7', 'questions'],
  ['2 min', 'to join'],
  ['0', 'dating drama'],
];

const Hero = () => {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();

  // Content drifts up and fades as you scroll past it, so the hero hands over
  // to the next section rather than just scrolling away.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[680px] items-center overflow-hidden bg-ink-950 pt-20"
    >
      <Parallax speed={0.28} className="absolute inset-0">
        <img src={homeBack} alt="" className="h-full w-full object-cover opacity-55" />
      </Parallax>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/55 to-ink-950/95" />

      {/* Slow-drifting colour blooms, a layer in front of the photo. */}
      <Parallax speed={-0.12} className="pointer-events-none absolute inset-0" cover={false}>
        <div className="absolute -right-24 top-10 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />
      </Parallax>

      <motion.div
        className="container-page relative py-20 sm:py-28"
        style={reduced ? undefined : { y, opacity }}
      >
        <motion.div
          className="max-w-2xl"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur"
          >
            Friendship first
          </motion.span>

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 28 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
            }}
            className="mt-6 font-display text-4xl font-extrabold leading-[1.08] text-white sm:text-6xl"
          >
            Find friends who
            <span className="text-brand-400"> match your vibe.</span>
          </motion.h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
            }}
            className="mt-5 max-w-lg text-lg leading-relaxed text-white/75"
          >
            No swiping on strangers. Answer seven honest questions and meet people who
            spend their weekends the way you want to spend yours.
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
            }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button to="/register" size="lg">
              Create your account
            </Button>
            <Button to="/login" size="lg" variant="onDark">
              I already have one
            </Button>
          </motion.div>

          <motion.dl
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-white/15 pt-8"
          >
            {STATS.map(([value, label]) => (
              <motion.div
                key={label}
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
                }}
              >
                <dt className="font-display text-2xl font-bold text-white">{value}</dt>
                <dd className="mt-0.5 text-xs uppercase tracking-wider text-white/50">
                  {label}
                </dd>
              </motion.div>
            ))}
          </motion.dl>
        </motion.div>
      </motion.div>
    </section>
  );
};

const Home = () => {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />
      <Hero />

      {/* How it works ----------------------------------------------- */}
      <section className="section">
        <div className="container-page">
          <Reveal>
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 max-w-xl text-3xl font-extrabold sm:text-4xl">
              Three steps between you and a new friend
            </h2>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3" staggerChildren={0.12}>
            {STEPS.map((step) => (
              <RevealItem key={step.number}>
                <motion.div
                  className="card h-full p-7"
                  initial="rest"
                  whileHover={reduced ? undefined : 'hover'}
                  animate="rest"
                  variants={hoverLift}
                >
                  <span className="font-display text-sm font-bold text-brand-500">
                    {step.number}
                  </span>
                  <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.body}</p>
                </motion.div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Features ---------------------------------------------------- */}
      <section className="border-y border-ink-100 bg-ink-50 py-16 sm:py-24">
        <div className="container-page">
          <Reveal>
            <p className="eyebrow">Why it works</p>
            <h2 className="mt-3 max-w-xl text-3xl font-extrabold sm:text-4xl">
              Built for real friendships, not a numbers game
            </h2>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3" staggerChildren={0.12}>
            {FEATURES.map((feature) => (
              <RevealItem key={feature.title}>
                <motion.article
                  className="card h-full overflow-hidden"
                  initial="rest"
                  whileHover={reduced ? undefined : 'hover'}
                  animate="rest"
                  variants={hoverLift}
                >
                  {/* The image drifts inside its frame as the card scrolls by. */}
                  <div className="h-44 overflow-hidden">
                    <Parallax speed={0.18} className="h-full">
                      <img
                        src={feature.image}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </Parallax>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{feature.body}</p>
                  </div>
                </motion.article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Closing CTA ------------------------------------------------- */}
      <section className="section">
        <div className="container-page">
          <Reveal variant="scaleIn">
            <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-8 py-14 text-center sm:px-16 sm:py-20">
              <Parallax speed={-0.15} className="pointer-events-none absolute inset-0" cover={false}>
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" />
                <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
              </Parallax>

              <div className="relative">
                <h2 className="mx-auto max-w-xl font-display text-3xl font-extrabold text-white sm:text-4xl">
                  Do not keep your next best friend waiting
                </h2>
                <p className="mx-auto mt-4 max-w-md text-white/70">
                  Seven questions is all it takes to find out who has been looking for
                  someone exactly like you.
                </p>
                <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button to="/register" size="lg">
                    Get started free
                  </Button>
                  <Button to="/login" size="lg" variant="onDark">
                    Log in
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
