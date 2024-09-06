import React from 'react';

const Compatibility = ({ score }) => {
  return (
    <div className="relative">
      <div className="absolute w-20 h-20 rounded-full border-4 border-gray-300 flex justify-center items-center text-2xl font-bold">
        {score}%
      </div>
    </div>
  );
};

export default Compatibility;
