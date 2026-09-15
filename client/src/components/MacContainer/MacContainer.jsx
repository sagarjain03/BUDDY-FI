import { useRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * The laptop model in the Welcome hero. It opens and closes on a slow loop so
 * it no longer depends on a ScrollControls parent to animate.
 */
const MacContainer = () => {
  const groupRef = useRef(null);
  const model = useGLTF('./mac.glb');
  const tex = useTexture('./jane.jpg');

  const meshes = {};
  model.scene.traverse((child) => {
    meshes[child.name] = child;
  });

  if (meshes.matte?.material) {
    meshes.matte.material.map = tex;
    meshes.matte.material.emissiveIntensity = 0;
    meshes.matte.material.metalness = 0;
    meshes.matte.material.roughness = 1;
  }

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // 0 -> 1 -> 0, so the lid opens and closes smoothly forever.
    const open = (Math.sin(t * 0.35) + 1) / 2;

    if (meshes.screen) {
      meshes.screen.rotation.x = THREE.MathUtils.degToRad(180 - open * 90);
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.25;
    }
  });

  return (
    <group ref={groupRef} position={[0, -9, 20]}>
      <primitive object={model.scene} />
    </group>
  );
};

export default MacContainer;
