import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import stickyNoteImg from '../Stickynote/stickyNoteImg.png'
import arrow from '../Stickynote/arrow.png'


const StickyNote = () => {
  const noteRef = useRef(null);
  const stickyRef = useRef(null);
  const arrowRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      noteRef.current,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.7)' }
    );
  }, []);
  useEffect(() => {
    gsap.fromTo(
      stickyRef.current,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.7)' }
    );
  }, []);
  useEffect(() => {
    gsap.fromTo(
      arrowRef.current,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.7)' }
    );
  }, []);

  return (
    <div
      // ref={noteRef}
      // className="bg-yellow-200 shadow-orange-500 shadow-2xl w-48 h-48 absolute top-20 left-72 transform -translate-x-1/2 -rotate-12 p-2"
    >
      
      <img src={stickyNoteImg} ref={stickyRef} alt="" className='absolute top-0 left-20 z-20' />
      <img src={arrow} ref={arrowRef} alt="" className='absolute bottom-64 left-52 h-52 w-52 z-30'/>
      <p ref={noteRef} className="text-xl font-semibold text-black text-center absolute top-20 left-36 z-30 -rotate-12">
        Kuch Logon Ke Saath <br />Rehne Se Hi Sab Theek <br />Ho Jata Hai - Aditi
      </p>

    </div>
  );
};

export default StickyNote;
