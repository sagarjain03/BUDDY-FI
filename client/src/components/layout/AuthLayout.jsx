import Logo from '../ui/Logo';

/**
 * Split layout shared by log in and sign up: brand panel on the left,
 * the form on the right. Collapses to a single column on small screens.
 */
const AuthLayout = ({ image, quote, quoteAuthor, children }) => (
  <div className="flex min-h-screen flex-col lg:flex-row">
    <div className="relative hidden lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:overflow-hidden lg:bg-ink-950 lg:p-12">
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950/85 via-ink-950/55 to-brand-700/45" />

      <div className="relative">
        <Logo tone="light" />
      </div>

      <div className="relative max-w-md">
        <p className="font-display text-3xl font-bold leading-snug text-white">{quote}</p>
        <p className="mt-4 text-sm font-medium text-white/60">{quoteAuthor}</p>
      </div>
    </div>

    <div className="flex flex-1 items-center justify-center bg-white px-5 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
