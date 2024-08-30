import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Sidebar = ({text}) => {
  const textRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      textRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'bounce.out' }
    );
  }, []);

  return (
    <div className="bg-yellow-400 w-1/4 h-screen flex items-center justify-center">
      <h1
        ref={textRef}
        className="text-8xl font-extrabold transform -rotate-90 text-transparent bg-clip-text bg-gradient-to-t from-yellow-600 to-orange-500"
      >
        {text}
      </h1>
    </div>
  );
};

export default Sidebar;
