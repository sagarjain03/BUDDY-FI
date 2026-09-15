import Logo from '../ui/Logo';
import Button from '../ui/Button';

const MarketingNav = () => (
  <header className="absolute inset-x-0 top-0 z-30">
    <div className="container-page flex h-20 items-center justify-between">
      <Logo tone="light" />
      <div className="flex items-center gap-2">
        <Button to="/login" variant="onDark" className="hidden sm:inline-flex">
          Log in
        </Button>
        <Button to="/register">Get started</Button>
      </div>
    </div>
  </header>
);

export default MarketingNav;
