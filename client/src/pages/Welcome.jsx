import React from 'react'
import MacContainer from '../components/MacContainer/MacContainer'
import { Canvas } from '@react-three/fiber';

import { Environment, ScrollControls } from '@react-three/drei';

import "./style.css";
import Navbar from '../components/Navbar/Navbar';
const Welcome = () => {
  return (<>
   {/* <Navbar/> */}
    <Canvas camera={{ fov: 20, position: [0, -2, 120] }} > 
    {/* <OrbitControls />  */}

    <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/4k/studio_small_09_4k.exr" /> {/* Corrected Environment */}

    <ScrollControls>
    <MacContainer/>
    </ScrollControls>
  </Canvas></>
   
  )
}

export default Welcome
