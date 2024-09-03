import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';
import gsap from 'gsap';

const SocialLogin = () => {
  const iconsRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      iconsRef.current.children,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.3,
        ease: 'power3.out'
      }
    );
  }, []);

  return (
    <div className="mt-4 text-center">
      <p className="text-sm mb-4">Or</p>
      <div
        ref={iconsRef}
        className="flex justify-center space-x-4"
      >
        <FontAwesomeIcon icon={faGoogle} size="2x" className="text-red-600 cursor-pointer" />
        <FontAwesomeIcon icon={faFacebook} size="2x" className="text-blue-600 cursor-pointer" />
        <FontAwesomeIcon icon={faInstagram} size="2x" className="text-pink-600 cursor-pointer" />
      </div>
    </div>
  );
};

export default SocialLogin;
