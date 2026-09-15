import Avatar from '../ui/Avatar';
import { genderLabel } from '../../lib/labels';

const Profile = ({ name, age, gender, email, id, avatar, bio, interests = [] }) => (
  <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
    <Avatar name={name} seed={id || email} avatar={avatar} size="xl" />

    <div className="min-w-0">
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{name}</h1>
      <p className="mt-1 text-sm text-ink-500">
        {age} &middot; {genderLabel(gender)}
      </p>
      <p className="mt-2 break-all text-sm text-ink-400">{email}</p>

      {bio && <p className="mt-3 text-sm leading-relaxed text-ink-600">{bio}</p>}

      {interests.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
          {interests.map((interest) => (
            <span key={interest} className="chip">
              {interest}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default Profile;
