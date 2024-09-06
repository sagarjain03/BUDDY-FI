// import React from 'react';

// const Navbar = () => {
//   return (
//     <div className="bg-gray-900 p-4 w-75% rounded-b-3xl flex justify-between items-center shadow-lg">
//       {/* Left side: Logo */}
//       <div className="flex items-center">
//         <span className="text-white text-2xl font-bold tracking-wider">BUDDYFI</span>
//       </div>
      
//       {/* Right side: Navigation Links */}
//       <div className="flex items-center space-x-8 text-white">
//         {/* Find My Buddy */}
//         <div className="flex flex-col items-center">
//           <span className="text-orange-500 text-lg">&#128073;</span> {/* Hand pointing icon */}
//           <span className="text-sm mt-1">Find My Buddy</span>
//         </div>

//         {/* Chat */}
//         <div className="flex flex-col items-center">
//           <span className="text-lg">&#9993;</span> {/* Paper plane icon */}
//           <span className="text-sm mt-1">CHAT</span>
//         </div>

//         {/* Profile */}
//         <div className="flex flex-col items-center">
//           <span className="text-lg">&#128100;</span> {/* User icon */}
//           <span className="text-sm mt-1">PROFILE</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Navbar;

import React from 'react';

const Navbar = () => {
  return (
    <div 
      className=" backdrop-blur-xl opacity-100 rounded-b-3xl  p-4 w-[80vw] h-[10%] border-2 border-white mx-auto rounded-b-2xl flex justify-around items-center mb-10 "
      style={{ height: '10vh' }}  // Set the height to cover 15% of the screen
    >
      {/* Left side: Logo */}
      <div className="flex items-center">
        <span className="text-white text-5xl font-bold  tracking-wider transform transition-transform duration-200 ease-in-out hover:scale-110"
         style={{
          textShadow: '9px 9px 6.13px #C93535', // Custom shadow
        }}
        >BUDDYFI</span>
        {/* Increased the text size to scale with the navbar */}
      </div>
      
      {/* Right side: Navigation Links */}
      <div className="flex items-center space-x-8 text-white">
        {/* Find My Buddy */}
        <div className="flex flex-col items-center">
          {/* <span className="text-orange-500 text-2xl">&#128073;</span> Increased icon size */}
          <img src="src/assets/navbar/fmb icon.svg" alt="find my buddy icon picked from figma" className='w-8 h-8 transform transition-transform duration-150 ease-in-out hover:scale-125' />
          <span className="text-lg mt-1">Find My Buddy</span> {/* Increased text size */}
        </div>

        {/* Chat */}
        <div className="flex flex-col items-center">
          {/* <span className="text-xl">&#9993;</span> Increased icon size */}
          <img src="src/assets/navbar/chat-icon.svg" alt="chat icon logo from figma" className="w-7 h-8 transform transition-transform duration-150 ease-in-out hover:scale-125" />
          <span className="text-lg mt-1">CHAT</span> {/* Increased text size */}
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center">
          {/* <span className="text-xl">&#128100;</span> Increased icon size */}
          <img src="src/assets/navbar/profile-icon.svg" alt="profile icon logo from figma" className="w-8 h-8 transform transition-transform duration-150 ease-in-out hover:scale-125 " />
          <span className="text-lg mt-1">PROFILE</span> {/* Increased text size */}
        </div>
      </div>
    </div>
  );
};

export default Navbar;

