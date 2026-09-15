import Navbar from './Navbar';
import VerifyBanner from './VerifyBanner';
import Footer from './Footer';

/**
 * Chrome shared by every signed-in page: sticky nav, a titled page header and
 * the footer. Pages only supply their own content.
 */
const AppShell = ({ title, subtitle, actions, children, width = 'default' }) => (
  <div className="flex min-h-screen flex-col bg-ink-50">
    <Navbar />
    <VerifyBanner />

    <main className="flex-1">
      {(title || actions) && (
        <div className="border-b border-ink-100 bg-white">
          <div className="container-page flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {title && <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>}
              {subtitle && <p className="mt-1.5 max-w-xl text-sm text-ink-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
          </div>
        </div>
      )}

      <div
        className={`container-page py-8 sm:py-10 ${width === 'narrow' ? 'max-w-3xl' : ''}`}
      >
        {children}
      </div>
    </main>

    <Footer />
  </div>
);

export default AppShell;
