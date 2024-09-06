import React from 'react';

const Personality = ({ traits }) => {
  return (
    <div className="p-5">
      <h3 className="text-xl font-semibold mb-4">Personality</h3>
      <ul className="space-y-2">
        {traits.map((trait, index) => (
          <li key={index} className="flex items-center">
            <span className="text-lg mr-2">{trait.icon}</span>
            <span>{trait.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Personality;
