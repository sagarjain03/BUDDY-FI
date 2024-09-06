// import React from 'react'
// import MacContainer from '../components/MacContainer/MacContainer'
// import { Canvas } from '@react-three/fiber';

// import { Environment, ScrollControls } from '@react-three/drei';

// import "./style.css";
// import Navbar from '../components/Navbar/Navbar';
// const Welcome = () => {
//   return (<>
//    {/* <Navbar/> */}
//     <Canvas camera={{ fov: 20, position: [0, -2, 120] }} >
//     {/* <OrbitControls />  */}

//     <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/4k/studio_small_09_4k.exr" /> {/* Corrected Environment */}

//     <ScrollControls>
//     <MacContainer/>
//     </ScrollControls>
//   </Canvas>

//   <Navbar/>

//   </>

//   )
// }

// export default Welcome
import React from "react";
import MacContainer from "../components/MacContainer/MacContainer";
import { Canvas } from "@react-three/fiber";
import { Environment, ScrollControls } from "@react-three/drei";

import "./style.css";
import Navbar from "../components/Navbar/Navbar";
import Button from "../components/Button/Button";

const Welcome = () => {
  return (
    <div className='bg-[url("/src/assets/bg.png")] bg-cover bg-center'>
      {/* Navbar placed at the top of the page */}
      <Navbar />

      {/* Centered text section */}
      <div className="flex items-center flex-col justify-between h-[100px] bg-transparent row-gap-75px">
        <p className="text-white text-center text-[20px] font-extrabold md:text-3xl leading-tight max-w-[1208px] relative transform transition-transform duration-200 ease-in-out hover:scale-110 text-stroke-1 text-stroke-black">
          Welcome to{" "}
          <span className="text-transparent font-extrabold bg-clip-text bg-gradient-to-r from-[#BAB9B8] to-[#FF0000] text-stroke-1 text-stroke-black">
            Buddyfi
          </span>
          , your gateway to finding the friends you didn’t know you were
          missing!
          <span className="absolute inset-0 " style={{}}></span>
        </p>

        <p className="bg-gradient-to-r from-neon-pink via-neon-blue to-electric-purple text-transparent bg-clip-text animate-glow text-center text-2xl font-extrabold md:text-3xl leading-tight max-w-[1208px] relative transform transition-transform duration-200 ease-in-out hover:scale-110 text-stroke-1 text-stroke-black">
          Don't keep your next BFF waiting!"
        </p>
        <p className="text-white text-center text-2xl font-extrabold md:text-3xl leading-tight max-w-[1208px] relative transform transition-transform duration-200 ease-in-out hover:scale-110 text-stroke-1 text-stroke-black">
          The best friendships start right here.
        </p>

        <p className="text-white text-center text-2xl font-extrabold md:text-3xl leading-tight max-w-[1208px] relative transform transition-transform duration-200 ease-in-out hover:scale-110 text-stroke-1 text-stroke-black">
          Scroll down to find your tribe! Pinky promise, no dating drama!
        </p>
      </div>

      {/* Canvas content */}
      <div className="z-10">
        <Canvas camera={{ fov: 20, position: [0, -2, 120] }}>
          {/* <OrbitControls />  */}
          <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/4k/studio_small_09_4k.exr" />{" "}
          {/* Corrected Environment */}
          <ScrollControls>
            <MacContainer />
          </ScrollControls>
        </Canvas>
      </div>
      <div className="flex justify-center w:[200px] h-[800px]items-center  bg-transparent relative top-[-37vh] transform transition-transform duration-200 ease-in-out ">
        <button
          type=""
          className="w-[200px] border border-white border-2 hover:border-red-500 opacity-75 backdrop-blur-md bg-black text-white p-2 rounded-md font-bold hover:bg-gray-800  "
        >
          Find my Buddy
        </button>
        {/* <img
          src="src/assets/navbar/fmb icon.svg"
          alt="find my buddy icon"
          className=""
        /> */}
      </div>
    </div>
  );
};

export default Welcome;
