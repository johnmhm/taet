import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { Box } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '../hooks/useAudio.ts';

interface AvatarProps {
  position: [number, number, number];
  isMoving: boolean;
  moveDirection: THREE.Vector3;
  cameraDirection: THREE.Vector3;
}

// Animation constants
const BOUNCE_SPEED = 9;
const WALK_SPEED = 7;
const ROTATION_SPEED = 5;
const MAX_DUST_PARTICLES = 5;
const STEP_INTERVAL = 350;

const Avatar = forwardRef<THREE.Group, AvatarProps>(({ position, isMoving, moveDirection, cameraDirection }, ref) => {
  // Mesh refs
  const meshRefs = {
    body: useRef<THREE.Mesh>(null),
    head: useRef<THREE.Mesh>(null),
    leftEye: useRef<THREE.Mesh>(null),
    rightEye: useRef<THREE.Mesh>(null),
    leftArm: useRef<THREE.Mesh>(null),
    rightArm: useRef<THREE.Mesh>(null),
    leftLeg: useRef<THREE.Mesh>(null),
    rightLeg: useRef<THREE.Mesh>(null),
  };

  // State and other refs
  const audio = useAudio();
  const [dustPositions, setDustPositions] = useState<[number, number, number][]>([]);
  const lastStep = useRef(0);
  const [facingCamera, setFacingCamera] = useState(false);
  const targetRotation = useRef(0);
  const bounceTime = useRef(0);
  const walkCycle = useRef(0);

  // Handle footstep effects
  useEffect(() => {
    if (!isMoving || performance.now() - lastStep.current <= STEP_INTERVAL) return;

    audio.playSound('hit', 0.1);
    setDustPositions(prev => {
      const newDust = [...prev, [position[0], position[1], position[2]]];
      return newDust.slice(-MAX_DUST_PARTICLES);
    });
    lastStep.current = performance.now();
  }, [isMoving, position, audio]);

  // Animation frame update
  useFrame((_, delta) => {
    if (!Object.values(meshRefs).every(ref => ref.current)) return;

    updateRotation(delta);
    if (isMoving) {
      updateMovementAnimations(delta);
    } else {
      resetToIdle();
    }
  });

  const updateRotation = (delta: number) => {
    if (!ref || !('current' in ref) || !ref.current) return;

    const newRotation = isMoving && moveDirection.lengthSq() > 0
      ? Math.atan2(moveDirection.x, moveDirection.z)
      : Math.atan2(cameraDirection.x, cameraDirection.z) + Math.PI;

    targetRotation.current = newRotation;
    setFacingCamera(!isMoving);

    let rotationDiff = targetRotation.current - ref.current.rotation.y;
    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
    ref.current.rotation.y += rotationDiff * ROTATION_SPEED * delta;
  };

  const updateMovementAnimations = (delta: number) => {
    const { body, head, leftArm, rightArm, leftLeg, rightLeg, leftEye, rightEye } = meshRefs;

    // Update bounce and walk cycles
    bounceTime.current += delta * BOUNCE_SPEED;
    walkCycle.current += delta * WALK_SPEED;

    const bounceOffset = Math.abs(Math.sin(bounceTime.current)) * 0.1;
    const swingValue = Math.sin(walkCycle.current);

    // Apply animations
    body.current!.position.y = 0.5 + bounceOffset;
    head.current!.position.y = 1.2 + bounceOffset;

    leftArm.current!.rotation.x = swingValue * 0.4;
    rightArm.current!.rotation.x = -swingValue * 0.4;
    leftLeg.current!.rotation.x = -swingValue * 0.4;
    rightLeg.current!.rotation.x = swingValue * 0.4;

    // Update eye direction
    const eyeRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
    leftEye.current!.rotation.y = eyeRotation;
    rightEye.current!.rotation.y = eyeRotation;
  };

  const resetToIdle = () => {
    const { body, head } = meshRefs;
    body.current!.position.y = 0.5;
    head.current!.position.y = 1.2;
  };

  return (
    <group ref={ref} position={position}>
      <group>
        <Box ref={meshRefs.body} args={[1, 1, 1]} position={[0, 0.5, 0]}>
          <meshStandardMaterial color="#8797ff" />
        </Box>

        <Box ref={meshRefs.head} args={[0.8, 0.8, 0.8]} position={[0, 1.2, 0]}>
          <meshStandardMaterial color="#a1b5ff" />
        </Box>

        {/* Eyes */}
        <Box ref={meshRefs.leftEye} args={[0.15, 0.15, 0.1]} position={[-0.2, 1.3, 0.4]}>
          <meshStandardMaterial color="black" />
        </Box>
        <Box ref={meshRefs.rightEye} args={[0.15, 0.15, 0.1]} position={[0.2, 1.3, 0.4]}>
          <meshStandardMaterial color="black" />
        </Box>

        {/* Arms */}
        <Box ref={meshRefs.leftArm} args={[0.3, 0.8, 0.3]} position={[-0.65, 0.5, 0]}>
          <meshStandardMaterial color="#8797ff" />
        </Box>
        <Box ref={meshRefs.rightArm} args={[0.3, 0.8, 0.3]} position={[0.65, 0.5, 0]}>
          <meshStandardMaterial color="#8797ff" />
        </Box>

        {/* Legs */}
        <Box ref={meshRefs.leftLeg} args={[0.3, 0.6, 0.3]} position={[-0.3, -0.3, 0]}>
          <meshStandardMaterial color="#7687ff" />
        </Box>
        <Box ref={meshRefs.rightLeg} args={[0.3, 0.6, 0.3]} position={[0.3, -0.3, 0]}>
          <meshStandardMaterial color="#7687ff" />
        </Box>
      </group>
    </group>
  );
});

export default Avatar;