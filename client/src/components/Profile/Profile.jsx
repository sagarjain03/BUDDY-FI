import React from 'react';

const Profile = ({ name, age, location, gender, email }) => {
  return (
    <div className="flex items-center p-5  text-white">
      {/* <img
        src={image}
        alt={`${name}'s profile`}
        className="rounded-full w-32 h-32 object-cover"
      /> */}
      <div className="ml-6">
        <h2 className="text-4xl font-bold">{name.toUpperCase()}</h2>
        <p className="mt-2 text-gray-400">Age: {age}</p>
        <p>Location: {location}</p>
        <p>Email: {email}</p>
      </div>
    </div>
  );
};

export default Profile;
