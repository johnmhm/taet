import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Lighting() {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  
  // Animate the sun position
  useFrame(({ clock }) => {
    if (directionalLightRef.current) {
      // Move light in a gentle circular pattern to create dynamic shadows
      const angle = clock.elapsedTime * 0.1;
      directionalLightRef.current.position.x = Math.cos(angle) * 10;
      directionalLightRef.current.position.z = Math.sin(angle) * 10;
    }
  });
  
  return (
    <>
      {/* Main directional light (sun) */}
      <directionalLight
        ref={directionalLightRef}
        position={[10, 10, 5]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Ambient light to fill shadows */}
      <ambientLight intensity={0.5} />
      
      {/* Hemisphere light for more realistic outdoor lighting */}
      <hemisphereLight 
        args={["#87CEEB", "#382a13", 0.7]} // Sky blue from above, brownish from ground
      />
    </>
  );
}
