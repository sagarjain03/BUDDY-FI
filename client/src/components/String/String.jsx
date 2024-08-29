import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

const String = () => {
  const svgPathRef = useRef(null);

  useEffect(() => {
    const initialPath = "M 10 100 Q 400 50 900 100"; // Longer string
    const finalPath = "M 10 100 Q 400 100 900 100"; // Longer string

    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      const updatedPath = `M 10 100 Q ${clientX / 2} ${clientY / 2} 900 100`; // Adjusted for longer string
      gsap.to(svgPathRef.current, {
        attr: { d: updatedPath },
        duration: 0.3,
        ease: 'power3.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(svgPathRef.current, {
        attr: { d: finalPath },
        duration: 0.3,
        ease: 'elastic.out(1, 0.2)',
      });
    };

    const stringElement = document.querySelector('.string');
    stringElement.addEventListener('mousemove', handleMouseMove);
    stringElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      stringElement.removeEventListener('mousemove', handleMouseMove);
      stringElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className={`string overflow-hidden absolute bottom-14 left-64`}>
      <svg width="1000" height="200" xmlns="http://www.w3.org/2000/svg">
        <path
          ref={svgPathRef}
          d="M 10 100 Q 400 100 900 100" 
          stroke="black"
          fill="transparent"
        />
      </svg>
    </div>
  );
};

export default String;
