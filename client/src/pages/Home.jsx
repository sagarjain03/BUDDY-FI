import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Button from '../components/Button/Button';
import Circle from '../components/Circles/Circle';
import Header from '../components/Headers/Header';
import String from '../components/String/String';
import Description from '../components/Description/Description';
import Footer from '../components/Footer/Footer';
import girl1 from '../assets/girl1.png';
import girl2 from '../assets/girl2.png';

const Home = () => {
  
  
  const girl1Ref = useRef(null);
  const girl2Ref = useRef(null);
  const circleRefs = useRef([]);

  useEffect(() => {
    
    gsap.to(girl1Ref.current, {
      y: -20,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      duration: 4,
    });

    gsap.to(girl2Ref.current, {
      y: 20,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      duration: 4,
    });

    
    circleRefs.current.forEach((circle, index) => {
      gsap.to(circle, {
        scale: 1.1,
        rotate: 360,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        duration: 3 + index, // different timing for each circle
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-yellow-200 to-yellow-300 relative overflow-hidden">
      <Header  position="top-28 left-20" />
      <String position="top-52 left-20" />

      <Button color="bg-yellow-400" text="LOG-IN" position="top-[21rem] left-20" />
      <Button color="bg-transparent" text="REGISTER+" position="top-[21rem] left-60" />

      <Description />
      <String position="top-[28rem] left-20" />
      <Footer  />

      <img ref={girl1Ref} src={girl1} alt="girlImg" className="h-[31rem] w-[31rem] absolute z-20 top-0 right-80" />
      <img ref={girl2Ref} src={girl2} alt="girlImg" className="h-96 w-96 absolute z-20 bottom-0 right-0" />

      <Circle ref={(el) => (circleRefs.current[0] = el)} position="-top-20 -left-20" round="rounded-full" height="h-64" width="w-64" />
      <Circle ref={(el) => (circleRefs.current[1] = el)} position="top-1/2 right-0 translate-y-[-50%]" round="rounded-tl-full rounded-bl-full" height="h-80" width="w-40" />
      <Circle ref={(el) => (circleRefs.current[2] = el)} position="bottom-0 left-1/2 translate-x-[-50%]" height="h-40" width="w-80" round="rounded-tr-full rounded-tl-full" />
    </div>
  );
};

export default Home;
