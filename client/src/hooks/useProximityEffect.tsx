import { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '../lib/stores/usePlayerStore';
import { useAudio } from '../lib/stores/useAudio';

// Define the sound effect types from our audio store
type SoundEffectType = 'hit' | 'success' | 'ambient' | 'stockUp' | 'stockDown' | 'weatherCalm' | 'weatherStorm' | 'cryptoAlert';

interface UseProximityEffectProps {
  position: [number, number, number];
  triggerDistance?: number;
  exitDistance?: number;
  onEnter?: () => void;
  onExit?: () => void;
  soundEffect?: SoundEffectType;
  soundIntensity?: number;
}

export function useProximityEffect({
  position,
  triggerDistance = 5,
  exitDistance = 7,
  onEnter,
  onExit,
  soundEffect,
  soundIntensity = 1,
}: UseProximityEffectProps) {
  const [isNear, setIsNear] = useState(false);
  const [hasTriggeredSound, setHasTriggeredSound] = useState(false);
  const { playerPosition } = usePlayerStore();
  const audio = useAudio();

  // Calculate the distance between player and object
  const calculateDistance = () => {
    const playerPos = new THREE.Vector3(
      playerPosition.x,
      playerPosition.y,
      playerPosition.z
    );
    const objectPos = new THREE.Vector3(
      position[0],
      position[1],
      position[2]
    );
    return playerPos.distanceTo(objectPos);
  };

  // Check proximity on each frame
  useFrame(() => {
    const distance = calculateDistance();

    // Handle entering proximity
    if (!isNear && distance <= triggerDistance) {
      setIsNear(true);
      onEnter?.();

      // Play sound effect once when entering
      if (soundEffect && !hasTriggeredSound && !audio.isMuted) {
        // Type assertion to ensure the soundEffect is a valid key
        audio.playPositionalSound(soundEffect as any, position, soundIntensity);
        setHasTriggeredSound(true);
      }
    }
    // Handle exiting proximity
    else if (isNear && distance > exitDistance) {
      setIsNear(false);
      setHasTriggeredSound(false);
      onExit?.();
    }
  });

  return { isNear };
}