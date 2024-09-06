import React from 'react';
import Profile from '../components/Profile/Profile';
import Personality from '../components/Personality/Personality';
import Compatibility from '../components/Compatibility/Compatibility';
import About from '../components/About/About';
import Navigation from '../components/Button/Navigation';

const UserProfile = () => {
  const user = {
    name: 'Utkarsh',
    age: 19,
    location: 'Jabalpur',
    gender: 'Male',
    email: 'ug@gmail.com',
    image: 'https://plus.unsplash.com/premium_photo-1661297485356-2497102824d0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGdpcmwlMjBob3R8ZW58MHx8MHx8fDA%3D',
    traits: [
      { name: 'Movie Genre', icon: '🍿' },
      { name: 'Weekend Plans', icon: '🛍️' },
      { name: 'Music Taste', icon: '🎶' },
      { name: 'Coping Style', icon: '🧘‍♂️' },
      { name: 'Communication Mode', icon: '💬' },
      { name: 'Vacation Spot', icon: '🏖️' },
      { name: 'Social Setting', icon: '👥' },
    ],
    tags: ['Passionate', 'Empathetic', 'Curious', 'Adventurous'],
    about:
      'Jane is a UX Designer that works for a Fortune 500 company in Atlanta, GA. Ever since she was a child...',
    compatibilityScore: 40,
  };

  return (
    <div className="flex flex-col   h-screen   text-white">
      {/* Flex container to center align */}
      <div className= " h-screen  flex flex-col items-center bg-gray-800  shadow-lg  sm:w-3/5 md:w-2/5 lg:w-1/3">
        {/* Profile Image */}
        <img
          className="rounded-full w-32 h-32 object-cover"
          src={user.image}
          alt={`${user.name}'s profile`}
        />

       
        <Profile
          name={user.name}
          age={user.age}
          location={user.location}
          gender={user.gender}
          email={user.email}
        />
      </div>
    </div>
  );
};

export default UserProfile;
