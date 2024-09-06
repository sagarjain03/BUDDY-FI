import React from 'react';

const Navigation = ({ onPrevious, onNext }) => {
  return (
    <div className="flex justify-center space-x-4 mt-6">
      <button
        className="bg-red-500 w-10 h-10 rounded-full text-white text-xl"
        onClick={onPrevious}
      >
        &#x2190;
      </button>
      <button
        className="bg-green-500 w-10 h-10 rounded-full text-white text-xl"
        onClick={onNext}
      >
        &#x2192;
      </button>
    </div>
  );
};

export default Navigation;
