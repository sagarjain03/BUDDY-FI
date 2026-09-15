import { useId } from 'react';

const Input = ({ label, error, hint, className = '', id, ...props }) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`field-input ${error ? 'field-error' : ''}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
      {!error && hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
};

export default Input;
