
import { useCallback } from 'react';

export function useAudio() {
  const playSound = useCallback((soundName: string, volume = 1) => {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = volume;
    audio.play().catch(err => console.log(`Failed to load sound: /sounds/${soundName}.mp3`));
  }, []);

  return { playSound };
}
