import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { apiFetch, setToken } from '../../lib/api';
import { GENDERS } from '../../lib/labels';

const EMPTY = {
  name: '',
  email: '',
  age: '',
  password: '',
  confirmPassword: '',
  gender: '',
};

const SignUpForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Tell us your name';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Enter a valid email';
    if (!formData.age || Number(formData.age) < 13 || Number(formData.age) > 120) {
      errors.age = 'Age must be between 13 and 120';
    }
    if (formData.password.length < 8) errors.password = 'At least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.gender) errors.gender = 'Pick one';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        auth: false,
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          age: Number(formData.age),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          gender: formData.gender,
        },
      });

      // Registration signs the user in, so the quiz step is already authenticated.
      setToken(data.token);
      navigate('/submit-answer', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-extrabold">Create your account</h1>
      <p className="mt-2 text-sm text-ink-500">
        Takes a minute. Then seven quick questions and you are in.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
        <Alert tone="error">{error}</Alert>

        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Aarav Mehta"
          value={formData.name}
          onChange={handleChange}
          error={fieldErrors.name}
        />

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Age"
            name="age"
            type="number"
            min="13"
            max="120"
            placeholder="21"
            value={formData.age}
            onChange={handleChange}
            error={fieldErrors.age}
          />

          <div>
            <label htmlFor="signup-gender" className="field-label">
              Gender
            </label>
            <select
              id="signup-gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`field-input ${fieldErrors.gender ? 'field-error' : ''}`}
            >
              <option value="">Choose one</option>
              {GENDERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.gender && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.gender}</p>
            )}
          </div>
        </div>

        <div className="relative">
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-[34px] text-ink-400 hover:text-ink-700"
          >
            {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
          </button>
        </div>

        <Input
          label="Confirm password"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Type it again"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
        />

        <label className="flex items-start gap-2.5 pt-1 text-sm text-ink-600">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="font-medium text-brand-600 hover:text-brand-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-medium text-brand-600 hover:text-brand-700">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <Button type="submit" size="lg" fullWidth disabled={submitting} className="!mt-6">
          {submitting ? 'Creating account\u2026' : 'Create account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default SignUpForm;
