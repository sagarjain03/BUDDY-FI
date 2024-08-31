import React from 'react';

const Navbar = () => {
  return (
    <div className="bg-gray-900 p-4 rounded-t-3xl flex justify-between items-center shadow-lg">
      {/* Left side: Logo */}
      <div className="flex items-center">
        <span className="text-white text-2xl font-bold tracking-wider">BUDDYFI</span>
      </div>
      
      {/* Right side: Navigation Links */}
      <div className="flex items-center space-x-8 text-white">
        {/* Find My Buddy */}
        <div className="flex flex-col items-center">
          <span className="text-orange-500 text-lg">&#128073;</span> {/* Hand pointing icon */}
          <span className="text-sm mt-1">Find My Buddy</span>
        </div>

        {/* Chat */}
        <div className="flex flex-col items-center">
          <span className="text-lg">&#9993;</span> {/* Paper plane icon */}
          <span className="text-sm mt-1">CHAT</span>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center">
          <span className="text-lg">&#128100;</span> {/* User icon */}
          <span className="text-sm mt-1">PROFILE</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
