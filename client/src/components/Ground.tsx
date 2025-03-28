import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

export default function Ground() {
  const groundRef = useRef<THREE.Mesh>(null);

  // Create a custom shader material for the gradient effect
  const gradientMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        colorClose: { value: new THREE.Color("#ffffff") }, // White/very light gray
        colorFar: { value: new THREE.Color("#bbbbbb") },   // Much lighter gray for the far color
        cameraPosition: { value: new THREE.Vector3() }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 colorClose;
        uniform vec3 colorFar;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          // Calculate distance-based gradient
          float distanceFromCenter = length(vPosition.xy);
          float depth = smoothstep(0.0, 1.0, pow(distanceFromCenter / 25.0, 0.8));
          vec3 color = mix(colorClose, colorFar, depth);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false,
      side: THREE.DoubleSide
    });
  }, []);

  // Create a circular disc geometry
  const discGeometry = useMemo(() => {
    // Create a circular disc with higher segment count for smoother edges
    const radius = 50;
    const segments = 64;
    return new THREE.CircleGeometry(radius, segments);
  }, []);

  // Update shader uniforms based on camera position
  useFrame((state) => {
    if (gradientMaterial) {
      gradientMaterial.uniforms.cameraPosition.value.copy(state.camera.position);
    }
  });

  return (
    <mesh 
      ref={groundRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.05, 0]} 
      receiveShadow
    >
      <primitive object={discGeometry} />
      <primitive object={gradientMaterial} />
    </mesh>
  );
}
