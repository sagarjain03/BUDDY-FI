import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { apiFetch, API_URL, getToken } from '../lib/api';
import { GENDERS, avatarSrc } from '../lib/labels';

const BIO_LIMIT = 240;
const MAX_INTERESTS = 8;

const EditProfile = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', age: '', gender: '', bio: '' });
  const [interests, setInterests] = useState([]);
  const [draftInterest, setDraftInterest] = useState('');
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Seeded once. A late response must never overwrite what has been typed
  // since — that silently ate a member's edits on a slow connection.
  const seeded = useRef(false);

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((result) => {
        const me = result.data.user;
        setUser(me);

        if (seeded.current) return;
        seeded.current = true;

        setForm({
          name: me.name || '',
          age: me.age ?? '',
          gender: me.gender || '',
          bio: me.bio || '',
        });
        setInterests(me.interests || []);
      })
      .catch((err) => setStatus({ tone: 'error', text: err.message }));
  }, []);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const addInterest = (event) => {
    event.preventDefault();
    const value = draftInterest.trim().slice(0, 30);
    if (!value || interests.length >= MAX_INTERESTS) return;
    if (interests.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      setDraftInterest('');
      return;
    }
    setInterests((current) => [...current, value]);
    setDraftInterest('');
  };

  const save = async (event) => {
    event.preventDefault();
    setStatus(null);
    setSaving(true);

    try {
      const result = await apiFetch('/api/auth/me', {
        method: 'PATCH',
        body: {
          name: form.name,
          age: Number(form.age),
          gender: form.gender,
          bio: form.bio,
          interests,
        },
      });
      setUser(result.data.user);
      setStatus({ tone: 'success', text: 'Profile saved' });
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not save your profile' });
    } finally {
      setSaving(false);
    }
  };

  const pickPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(null);
    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      const body = new FormData();
      body.append('avatar', file);

      // FormData needs the browser to set its own multipart boundary, so this
      // one request bypasses the JSON helper.
      const response = await fetch(`${API_URL}/api/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Upload failed');

      setUser((current) => ({ ...current, avatar: data.data.avatar }));
      setStatus({ tone: 'success', text: 'Photo updated' });
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not upload that image' });
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    setStatus(null);
    try {
      await apiFetch('/api/auth/me/avatar', { method: 'DELETE' });
      setUser((current) => ({ ...current, avatar: undefined }));
      setPreview(null);
      setStatus({ tone: 'success', text: 'Photo removed' });
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not remove that photo' });
    }
  };

  const shownAvatar = preview || avatarSrc(user?.avatar);

  return (
    <AppShell
      title="Edit profile"
      subtitle="This is what other members see. Your email is never shown."
      width="narrow"
      actions={
        <Button to="/profile" variant="outline">
          Back to profile
        </Button>
      }
    >
      {status && (
        <Alert tone={status.tone} className="mb-6">
          {status.text}
        </Alert>
      )}

      {!user && (
        <div className="card space-y-4 p-7">
          <div className="skeleton h-28 w-28 rounded-full" />
          <div className="skeleton h-5 w-44 rounded" />
        </div>
      )}

      {user && (
        <div className="space-y-6">
          {/* Photo ---------------------------------------------------- */}
          <section className="card p-7 sm:p-9">
            <h2 className="text-lg font-bold">Photo</h2>
            <p className="mt-1 text-sm text-ink-500">
              JPEG, PNG or WebP, up to 5&nbsp;MB. Without one you get a coloured circle
              with your initials, which is a perfectly good look.
            </p>

            <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row">
              {shownAvatar ? (
                <img
                  src={shownAvatar}
                  alt=""
                  className="h-28 w-28 shrink-0 rounded-full object-cover"
                />
              ) : (
                <Avatar name={user.name} seed={user._id} size="xl" />
              )}

              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  id="avatar-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={pickPhoto}
                  className="sr-only"
                />
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading…' : user.avatar ? 'Replace photo' : 'Upload photo'}
                </Button>
                {user.avatar && (
                  <Button variant="ghost" onClick={removePhoto} disabled={uploading}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Details -------------------------------------------------- */}
          <form onSubmit={save} className="space-y-6" noValidate>
            <section className="card space-y-4 p-7 sm:p-9">
              <h2 className="text-lg font-bold">About you</h2>

              <Input label="Name" name="name" value={form.name} onChange={change} required />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Age"
                  name="age"
                  type="number"
                  min="13"
                  max="120"
                  value={form.age}
                  onChange={change}
                />

                <div>
                  <label htmlFor="gender" className="field-label">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={change}
                    className="field-input"
                  >
                    {GENDERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="field-label">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  maxLength={BIO_LIMIT}
                  value={form.bio}
                  onChange={change}
                  placeholder="One or two lines people could actually reply to."
                  className="field-input h-auto py-2.5"
                />
                <p className="mt-1.5 text-right text-xs text-ink-400">
                  {form.bio.length}/{BIO_LIMIT}
                </p>
              </div>
            </section>

            <section className="card p-7 sm:p-9">
              <h2 className="text-lg font-bold">Interests</h2>
              <p className="mt-1 text-sm text-ink-500">
                Up to {MAX_INTERESTS}. These give people something to open with.
              </p>

              {interests.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() =>
                          setInterests((current) => current.filter((entry) => entry !== interest))
                        }
                        aria-label={`Remove ${interest}`}
                        className="text-brand-500 hover:text-brand-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={draftInterest}
                  onChange={(event) => setDraftInterest(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && addInterest(event)}
                  placeholder="Add an interest"
                  aria-label="Add an interest"
                  maxLength={30}
                  disabled={interests.length >= MAX_INTERESTS}
                  className="field-input flex-1"
                />
                <Button
                  variant="outline"
                  onClick={addInterest}
                  disabled={!draftInterest.trim() || interests.length >= MAX_INTERESTS}
                >
                  Add
                </Button>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => navigate('/profile')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
};

export default EditProfile;
