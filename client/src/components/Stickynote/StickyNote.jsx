import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import stickyNoteImg from '../Stickynote/stickyNoteImg.png'
import arrow from '../Stickynote/arrow.png'
import arrow2 from '../Stickynote/arrow2.png'


const StickyNote = ({positionNote,positionArrow,positionText,hide,hide2,text}) => {
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
      
      <img src={stickyNoteImg} ref={stickyRef} alt="" className={`absolute ${positionNote} z-20`} />
      <img src={arrow} ref={arrowRef} alt="" className={`absolute ${positionArrow} h-52 w-52 z-30 ${hide}`}/>
      <img src={arrow2} ref={arrowRef} alt="" className={`absolute ${positionArrow} h-40 w-68 z-30 ${hide2}`}/>
      <p ref={noteRef} className={`text-md font-semibold text-black text-center absolute ${positionText} z-30 -rotate-12`}>
        {text}
      </p>

    </div>
  );
};

export default StickyNote;
