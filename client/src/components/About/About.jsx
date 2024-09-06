import React from 'react';

const About = ({ description }) => {
  return (
    <div className="p-5 bg-gray-800 text-white mt-5">
      <h3 className="text-xl font-bold mb-4">About</h3>
      <p>{description}</p>
    </div>
  );
};

export default About;
