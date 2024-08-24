import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

const String = ({position}) => {
  const svgPathRef = useRef(null);

  useEffect(() => {
    const initialPath = "M 10 100 Q 250 50 700 100"; // Shorter string
    const finalPath = "M 10 100 Q 250 100 700 100"; // Shorter string

    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      const updatedPath = `M 10 100 Q ${clientX / 2} ${clientY / 2} 490 100`; // Adjusted for shorter string
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
    <div className={`string overflow-hidden absolute ${position}`}>
      <svg width="500" height="200" xmlns="http://www.w3.org/2000/svg">
        <path
          ref={svgPathRef}
          d="M 10 100 Q 250 100 700 100" // Shorter initial path
          stroke="black"
          fill="transparent"
        />
      </svg>
    </div>
  );
};

export default String;
