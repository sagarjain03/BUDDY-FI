import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  onDark: 'btn-on-dark',
};

const SIZES = {
  md: 'btn-md',
  lg: 'btn-lg',
};

/**
 * One button for the whole app. Renders an <a>-style router Link when `to` is
 * given, otherwise a real <button>.
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  className = '',
  fullWidth = false,
  ...props
}) => {
  const classes = [
    'btn',
    SIZES[size] || SIZES.md,
    VARIANTS[variant] || VARIANTS.primary,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
