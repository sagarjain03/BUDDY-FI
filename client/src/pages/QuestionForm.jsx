import QuestionPage from '../components/Questionpage/QuestionPage';
import Logo from '../components/ui/Logo';
import questionimg from '../assets/question.png';

const QuestionForm = () => (
  <div className="flex min-h-screen flex-col lg:flex-row">
    <aside className="relative hidden lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:overflow-hidden lg:bg-ink-950 lg:p-12">
      <img
        src={questionimg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950/85 via-ink-950/50 to-brand-700/45" />

      <div className="relative">
        <Logo tone="light" />
      </div>

      <div className="relative max-w-sm">
        <p className="eyebrow text-brand-300">Discover your vibe</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-white">
          Tell us about your interests
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/65">
          Seven questions. Your answers decide who we introduce you to, so go with your gut.
        </p>
      </div>
    </aside>

    <main className="flex flex-1 items-center justify-center bg-ink-50 px-5 py-10 sm:px-8">
      <div className="w-full max-w-xl">
        <div className="mb-6 lg:hidden">
          <Logo />
        </div>
        <QuestionPage />
      </div>
    </main>
  </div>
);

export default QuestionForm;
