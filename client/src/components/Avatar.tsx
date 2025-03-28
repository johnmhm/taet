import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';
import { useAudio } from '../lib/stores/useAudio';

// Dust particle component that appears when moving
const FootstepDust = ({ position }: { position: [number, number, number] }) => {
  const particles = useRef<THREE.Group>(null);
  const particlesData = useRef<Array<{
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    age: number;
    maxAge: number;
  }>>([]);

  // Create particles
  useEffect(() => {
    if (!particles.current) return;

    // Clear any existing particles
    while (particles.current.children.length > 0) {
      particles.current.remove(particles.current.children[0]);
    }

    particlesData.current = [];

    // Create 10 dust particles
    for (let i = 0; i < 10; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshBasicMaterial({ 
          color: 0xbbbbbb,
          transparent: true, 
          opacity: 0.6
        })
      );

      // Random offset for the particle
      const offsetX = (Math.random() - 0.5) * 0.5;
      const offsetZ = (Math.random() - 0.5) * 0.5;

      particle.position.set(
        position[0] + offsetX, 
        position[1], 
        position[2] + offsetZ
      );

      particles.current.add(particle);

      // Store particle data for animation
      particlesData.current.push({
        position: new THREE.Vector3(
          position[0] + offsetX,
          position[1],
          position[2] + offsetZ
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          Math.random() * 0.08,
          (Math.random() - 0.5) * 0.05
        ),
        age: 0,
        maxAge: 1 + Math.random()
      });
    }
  }, [position]);

  // Animate particles
  useFrame((_, delta) => {
    if (!particles.current) return;

    // Update each particle
    particlesData.current.forEach((data, i) => {
      if (i >= particles.current!.children.length) return;

      const particle = particles.current!.children[i];

      // Update age
      data.age += delta;

      // If particle is still active
      if (data.age < data.maxAge) {
        // Apply velocity
        data.position.add(data.velocity);

        // Apply gravity-like effect
        data.velocity.y -= 0.01 * delta;

        // Update position
        particle.position.copy(data.position);

        // Fade out as it ages
        const opacity = 1 - (data.age / data.maxAge);
        (particle as THREE.Mesh).material = new THREE.MeshBasicMaterial({
          color: 0xbbbbbb,
          transparent: true,
          opacity: Math.max(0, opacity * 0.6)
        });

        // Grow slightly
        const scale = 1 + (data.age / data.maxAge);
        particle.scale.set(scale, scale, scale);
      } else {
        // Hide completed particles
        (particle as THREE.Mesh).material = new THREE.MeshBasicMaterial({ 
          transparent: true, 
          opacity: 0 
        });
      }
    });
  });

  return <group ref={particles} />;
};

interface AvatarProps {
  position: [number, number, number];
  isMoving: boolean;
  moveDirection: THREE.Vector3;
  cameraDirection: THREE.Vector3;
}

const Avatar = forwardRef<THREE.Group, AvatarProps>(({ position, isMoving, moveDirection, cameraDirection }, ref) => {
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const audio = useAudio();
  const [dustPositions, setDustPositions] = useState<[number, number, number][]>([]);
  const lastStep = useRef(0);
  const [facingCamera, setFacingCamera] = useState(false);
  const targetRotation = useRef(0);

  // Animation parameters
  const bounceTime = useRef(0);
  const walkCycle = useRef(0);

  // Create footstep dust when moving
  useEffect(() => {
    if (isMoving && performance.now() - lastStep.current > 350) {
      // Play footstep sound
      audio.playSound('hit', 0.1);

      // Add dust particles at current position
      setDustPositions(prev => [...prev, [position[0], position[1], position[2]]]);

      // Remove old dust particles if there are too many
      if (dustPositions.length > 5) {
        setDustPositions(prev => prev.slice(1));
      }

      lastStep.current = performance.now();
    }
  }, [isMoving, position, audio, dustPositions.length]);

  // Handle animations and rotations
  useFrame((_, delta) => {
    if (!headRef.current || !bodyRef.current || !leftArmRef.current || !rightArmRef.current || 
        !leftLegRef.current || !rightLegRef.current || !leftEyeRef.current || !rightEyeRef.current) return;

    // Calculate the right rotation based on movement or camera-facing
    if (isMoving) {
      // Calculate direction to face when moving
      if (moveDirection.lengthSq() > 0) {
        targetRotation.current = Math.atan2(moveDirection.x, moveDirection.z);
        setFacingCamera(false);
      }
    } else if (!facingCamera) {
      // When stopped, face the camera
      targetRotation.current = Math.atan2(cameraDirection.x, cameraDirection.z) + Math.PI;
      setFacingCamera(true);
    }

    // Apply smooth rotation transition to the entire avatar
    if (ref && 'current' in ref && ref.current) {
      // Get current rotation
      const currentRotation = ref.current.rotation.y;

      // Calculate the shortest angle between current and target rotation
      let rotationDiff = targetRotation.current - currentRotation;

      // Make sure we rotate the shorter way
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

      // Apply smooth rotation
      ref.current.rotation.y += rotationDiff * 5 * delta;
    }

    // Update bouncing animation
    if (isMoving) {
      // Increase walk cycle for leg and arm movements
      walkCycle.current += delta * 7;

      // Bounce animation for the entire body
      bounceTime.current += delta * 9;
      const bounceOffset = Math.abs(Math.sin(bounceTime.current)) * 0.1;
      bodyRef.current.position.y = 0.5 + bounceOffset;
      headRef.current.position.y = 1.2 + bounceOffset;

      // Arm and leg swing animations
      const swingValue = Math.sin(walkCycle.current);
      leftArmRef.current.rotation.x = swingValue * 0.4;
      rightArmRef.current.rotation.x = -swingValue * 0.4;
      leftLegRef.current.rotation.x = -swingValue * 0.4;
      rightLegRef.current.rotation.x = swingValue * 0.4;

      // Reset eye positions
      leftEyeRef.current.position.set(-0.2, 1.3, 0.4);
      rightEyeRef.current.position.set(0.2, 1.3, 0.4);

      // When moving, eyes should match camera direction
      // This makes the avatar look in the same direction as the camera

      // Get the camera's forward direction
      const cameraForwardLocal = new THREE.Vector3(
        cameraDirection.x,
        0, // Keep eyes level horizontally
        cameraDirection.z
      ).normalize();

      // Calculate rotation angle to match camera direction
      const lookAngle = Math.atan2(cameraForwardLocal.x, cameraForwardLocal.z);

      // Apply the rotation to both eyes
      const eyeRotation = lookAngle;
      leftEyeRef.current.rotation.y = eyeRotation;
      rightEyeRef.current.rotation.y = eyeRotation;
    } else {
      // Reset animations when not moving
      bodyRef.current.position.y = 0.5;
      headRef.current.position.y = 1.2;

      // Slow down arm and leg movements
      leftArmRef.current.rotation.x *= 0.9;
      rightArmRef.current.rotation.x *= 0.9;
      leftLegRef.current.rotation.x *= 0.9;
      rightLegRef.current.rotation.x *= 0.9;

      // When stationary, use the same eye direction logic as when moving
      if (facingCamera) {
        // Reset positions
        leftEyeRef.current.position.set(-0.2, 1.3, 0.4);
        rightEyeRef.current.position.set(0.2, 1.3, 0.4);

        // Get the camera's forward direction
        const cameraForwardLocal = new THREE.Vector3(
          cameraDirection.x,
          0, // Keep eyes level horizontally
          cameraDirection.z
        ).normalize();

        // Calculate rotation angle to match camera direction
        const lookAngle = Math.atan2(cameraForwardLocal.x, cameraForwardLocal.z);

        // Apply the rotation to both eyes
        const eyeRotation = lookAngle;
        leftEyeRef.current.rotation.y = eyeRotation;
        rightEyeRef.current.rotation.y = eyeRotation;
      }
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Dust particles at feet when moving */}
      {dustPositions.map((pos, index) => (
        <FootstepDust key={index} position={pos} />
      ))}

      {/* Colored box avatar with animations */}
      <group scale={[0.5, 0.5, 0.5]}>
        {/* Base body */}
        <Box 
          ref={bodyRef} 
          args={[1, 1, 1]} 
          position={[0, 0.5, 0]}
        >
          <meshStandardMaterial color="#8797ff" />
        </Box>

        {/* Head */}
        <Box 
          ref={headRef} 
          args={[0.8, 0.8, 0.8]} 
          position={[0, 1.2, 0]}
        >
          <meshStandardMaterial color="#a1b5ff" />
        </Box>

        {/* Eyes - now with animation */}
        <Box 
          ref={leftEyeRef} 
          args={[0.15, 0.15, 0.1]} 
          position={[-0.2, 1.3, 0.4]}
        >
          <meshStandardMaterial color="black" />
        </Box>
        <Box 
          ref={rightEyeRef} 
          args={[0.15, 0.15, 0.1]} 
          position={[0.2, 1.3, 0.4]}
        >
          <meshStandardMaterial color="black" />
        </Box>

        {/* Arms - now with swing animation */}
        <Box 
          ref={leftArmRef} 
          args={[0.3, 0.8, 0.3]} 
          position={[-0.65, 0.5, 0]}
        >
          <meshStandardMaterial color="#8797ff" />
        </Box>
        <Box 
          ref={rightArmRef} 
          args={[0.3, 0.8, 0.3]} 
          position={[0.65, 0.5, 0]}
        >
          <meshStandardMaterial color="#8797ff" />
        </Box>

        {/* Legs - now with swing animation */}
        <Box 
          ref={leftLegRef} 
          args={[0.3, 0.6, 0.3]} 
          position={[-0.3, -0.3, 0]}
        >
          <meshStandardMaterial color="#7687ff" />
        </Box>
        <Box 
          ref={rightLegRef} 
          args={[0.3, 0.6, 0.3]} 
          position={[0.3, -0.3, 0]}
        >
          <meshStandardMaterial color="#7687ff" />
        </Box>
      </group>
    </group>
  );
});

export default Avatar;