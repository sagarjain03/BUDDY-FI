import { API_URL } from './api';

export const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const GENDER_LABELS = Object.fromEntries(
  GENDERS.map((option) => [option.value, option.label])
);

/** Renders a stored gender slug as something a person would write. */
export const genderLabel = (value) => GENDER_LABELS[value] || value || '';

/**
 * Locally stored avatars come back as a path; hosted ones as a full URL.
 * Returns null when the member has no photo, so callers can fall back to
 * initials.
 */
export const avatarSrc = (avatar) => {
  const url = typeof avatar === 'string' ? avatar : avatar?.url;
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
};

/**
 * "Active 3 months ago" reads as abandoned, so anything older than a week
 * shows nothing at all rather than a stale timestamp.
 */
export const presenceLabel = ({ isOnline, lastSeenAt } = {}) => {
  if (isOnline) return 'Online';
  if (!lastSeenAt) return null;

  const minutes = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 60000);
  if (minutes < 1) return 'Active just now';
  if (minutes < 60) return `Active ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Active yesterday';
  if (days < 7) return `Active ${days} days ago`;
  return null;
};
