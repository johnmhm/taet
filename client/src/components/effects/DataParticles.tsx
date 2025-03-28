import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DataParticlesProps {
  count?: number;
  color?: string | THREE.Color;
  size?: number;
  position?: [number, number, number];
  spread?: number;
  speed?: number;
  intensity?: number; // 0 to 1, controls number of active particles
  fadeDistance?: number;
}

type ParticleType = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  isActive: boolean;
};

export function DataParticles({
  count = 100,
  color = '#ffffff',
  size = 0.05,
  position = [0, 0, 0],
  spread = 2,
  speed = 0.2,
  intensity = 0.5,
  fadeDistance = 15,
}: DataParticlesProps) {
  // Refs for particles
  const points = useRef<THREE.Points>(null);
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Generate random particles positions
  const particles = useMemo(() => {
    const temp: ParticleType[] = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * spread;
      const y = (Math.random() * spread) / 2; // More particles at the bottom
      const z = (Math.random() - 0.5) * spread;
      
      // Add some randomization for animation
      const vx = (Math.random() - 0.5) * 0.01;
      const vy = Math.random() * 0.02; // Upward direction
      const vz = (Math.random() - 0.5) * 0.01;
      
      // Active flag - only a percentage of particles will be visible based on intensity
      const isActive = i < count * intensity;
      
      temp.push({ x, y, z, vx, vy, vz, isActive });
    }
    return temp;
  }, [count, spread, intensity]);
  
  // Create geometry for particles
  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    
    // Set positions
    const positions = new Float32Array(count * 3);
    const opacities = new Float32Array(count);
    
    particles.forEach((particle, i) => {
      positions[i * 3] = particle.x;
      positions[i * 3 + 1] = particle.y;
      positions[i * 3 + 2] = particle.z;
      
      // Set opacity based on whether particle is active
      opacities[i] = particle.isActive ? Math.random() * 0.5 + 0.5 : 0;
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    
    return geometry;
  }, [particles, count]);
  
  // Create a vertex shader that uses opacity attribute
  const vertexShader = `
    attribute float opacity;
    varying float vOpacity;
    
    void main() {
      vOpacity = opacity;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = ${size.toFixed(3)} * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  
  // Create a fragment shader that uses varying opacity
  const fragmentShader = `
    uniform vec3 color;
    varying float vOpacity;
    
    void main() {
      // Soft circle shape
      float r = 0.5;
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      float r2 = dot(cxy, cxy);
      float alpha = 1.0 - smoothstep(r * (r - 0.5), r, r2);
      
      // Apply opacity from vertex
      gl_FragColor = vec4(color, alpha * vOpacity);
    }
  `;
  
  // Create uniforms for shader
  const uniforms = useMemo(() => ({
    color: { value: new THREE.Color(color) }
  }), []);
  
  // Update color whenever it changes
  useEffect(() => {
    if (shaderMaterialRef.current && shaderMaterialRef.current.uniforms.color) {
      shaderMaterialRef.current.uniforms.color.value = new THREE.Color(color);
    }
  }, [color]);
  
  // Update particles each frame
  useFrame(({ camera, clock }) => {
    if (!points.current || !shaderMaterialRef.current) return;
    
    const positions = points.current.geometry.attributes.position.array as Float32Array;
    const opacities = points.current.geometry.attributes.opacity.array as Float32Array;
    const time = clock.getElapsedTime();
    
    // Animate particles
    particles.forEach((particle, i) => {
      // Position updates
      const idx = i * 3;
      
      // Only move active particles
      if (particle.isActive) {
        positions[idx] += particle.vx * speed;
        positions[idx + 1] += particle.vy * speed;
        positions[idx + 2] += particle.vz * speed;
        
        // Add some mild wave movement
        positions[idx] += Math.sin(time + i) * 0.005 * speed;
        positions[idx + 2] += Math.cos(time + i * 0.5) * 0.005 * speed;
        
        // Reset particles that go too high
        if (positions[idx + 1] > spread) {
          positions[idx + 1] = -0.1;
          // Randomize x and z a bit
          positions[idx] = (Math.random() - 0.5) * spread;
          positions[idx + 2] = (Math.random() - 0.5) * spread;
        }
        
        // Opacity update - create pulsing effect 
        opacities[i] = (Math.sin(time * 2 + i) * 0.25 + 0.75) * (particle.isActive ? 1 : 0);
      } else {
        opacities[i] = 0;
      }
    });
    
    // Update geometry
    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.geometry.attributes.opacity.needsUpdate = true;
    
    // Update material opacity based on camera distance
    const distance = camera.position.distanceTo(
      new THREE.Vector3(position[0], position[1], position[2])
    );
    
    // Fade out particles as camera gets further away
    const fadeFactor = Math.max(0, 1 - Math.max(0, distance - 5) / fadeDistance);
    shaderMaterialRef.current.opacity = fadeFactor * 0.8;
  });
  
  return (
    <points ref={points} position={position}>
      <bufferGeometry attach="geometry" {...particlesGeometry} />
      <shaderMaterial
        ref={shaderMaterialRef}
        attach="material"
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}