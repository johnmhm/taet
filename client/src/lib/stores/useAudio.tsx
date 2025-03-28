import { create } from "zustand";
import { Howl, Howler } from "howler";
import * as THREE from "three";
import { usePlayerStore } from "./usePlayerStore";
import { soundAssets } from "../soundAssets";

interface SoundEffects {
  hit: Howl | null;
  success: Howl | null;
  ambient: Howl | null;
  stockUp: Howl | null;
  stockDown: Howl | null;
  weatherCalm: Howl | null;
  weatherStorm: Howl | null;
  cryptoAlert: Howl | null;
}

interface AudioState {
  backgroundMusic: Howl | null;
  sounds: SoundEffects;
  isMuted: boolean;
  volume: number;
  
  // Initialization
  initializeAudio: () => void;
  
  // Setter functions
  setBackgroundMusic: (src: string) => void;
  setSound: (name: keyof SoundEffects, src: string) => void;
  
  // Control functions
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  playSound: (name: keyof SoundEffects, volume?: number) => void;
  playPositionalSound: (name: keyof SoundEffects, position: [number, number, number], intensity?: number) => void;
  
  // Legacy functions for compatibility
  playHit: () => void;
  playSuccess: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  sounds: {
    hit: null,
    success: null,
    ambient: null,
    stockUp: null,
    stockDown: null,
    weatherCalm: null, 
    weatherStorm: null,
    cryptoAlert: null
  },
  isMuted: true, // Start muted by default
  volume: 0.5,
  
  initializeAudio: () => {
    // Setup global Howler settings
    Howler.volume(get().volume);
    
    // Helper function to create sounds with error handling
    const createSound = (src: string, options: Partial<Howl> = {}): Howl => {
      return new Howl({
        src: [src],
        volume: 0.5,
        html5: true, // Use HTML5 Audio to reduce loading issues
        preload: true,
        onloaderror: () => {
          console.warn(`Failed to load sound: ${src}`);
        },
        ...options
      });
    };
    
    // Create basic sound effects using our sound assets
    const hit = createSound(soundAssets.hit, { volume: 0.5 });
    const success = createSound(soundAssets.success, { volume: 0.5 });
    
    // Create data-related sound effects
    const stockUp = createSound(soundAssets.stockUp, { volume: 0.4 });
    const stockDown = createSound(soundAssets.stockDown, { volume: 0.4 });
    const weatherCalm = createSound(soundAssets.weatherCalm, { 
      volume: 0.3, 
      loop: true 
    });
    const weatherStorm = createSound(soundAssets.weatherStorm, { 
      volume: 0.4, 
      loop: true 
    });
    const cryptoAlert = createSound(soundAssets.cryptoAlert, { volume: 0.4 });
    const ambient = createSound(soundAssets.ambient, { 
      volume: 0.2, 
      loop: true 
    });
    
    // Background music
    const backgroundMusic = createSound(soundAssets.ambient, {
      volume: 0.3,
      loop: true
    });
    
    // Don't autoplay here, wait for user interaction
    
    set({
      backgroundMusic,
      sounds: {
        hit,
        success,
        ambient,
        stockUp,
        stockDown,
        weatherCalm,
        weatherStorm,
        cryptoAlert
      }
    });
  },
  
  setBackgroundMusic: (src) => {
    const { backgroundMusic } = get();
    
    if (backgroundMusic) {
      backgroundMusic.stop();
    }
    
    const newMusic = new Howl({
      src: [src],
      volume: 0.3,
      loop: true,
      html5: true
    });
    
    if (!get().isMuted) {
      newMusic.play();
    }
    
    set({ backgroundMusic: newMusic });
  },
  
  setSound: (name, src) => {
    const { sounds } = get();
    const currentSound = sounds[name];
    
    if (currentSound) {
      currentSound.stop();
    }
    
    const newSound = new Howl({
      src: [src],
      volume: 0.5,
      html5: true
    });
    
    set(state => ({
      sounds: {
        ...state.sounds,
        [name]: newSound
      }
    }));
  },
  
  toggleMute: () => {
    const { isMuted, backgroundMusic, sounds } = get();
    const newMutedState = !isMuted;
    
    set({ isMuted: newMutedState });
    
    // Mute/unmute background music
    if (backgroundMusic) {
      backgroundMusic.mute(newMutedState);
      
      // If unmuting and not playing, start music
      if (!newMutedState && !backgroundMusic.playing()) {
        backgroundMusic.play();
      }
    }
    
    // Mute/unmute all sound effects
    Object.values(sounds).forEach(sound => {
      if (sound) sound.mute(newMutedState);
    });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  setVolume: (volume) => {
    const { backgroundMusic, sounds } = get();
    
    set({ volume });
    
    if (backgroundMusic) {
      backgroundMusic.volume(volume * 0.6); // Background music a bit quieter
    }
    
    // Adjust volume for all sound effects
    Object.values(sounds).forEach(sound => {
      if (sound) sound.volume(volume);
    });
  },
  
  playSound: (name, volume) => {
    const { sounds, isMuted } = get();
    const sound = sounds[name];
    
    if (sound && !isMuted) {
      try {
        if (volume !== undefined) {
          sound.volume(volume);
        }
        sound.play();
      } catch (error) {
        console.warn(`Error playing sound ${name}:`, error);
      }
    }
  },
  
  playPositionalSound: (name, position, intensity = 1) => {
    const { sounds, isMuted } = get();
    const sound = sounds[name];
    
    if (sound && !isMuted) {
      try {
        // Get player position from the store
        const { playerPosition } = usePlayerStore.getState();
        const playerPos = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
        const soundPos = new THREE.Vector3(position[0], position[1], position[2]);
        
        // Calculate distance and direction
        const distance = playerPos.distanceTo(soundPos);
        
        // Apply distance-based volume attenuation
        const maxDistance = 20;
        const volumeFactor = Math.max(0, 1 - (distance / maxDistance));
        
        // Adjust volume based on intensity (data value) and distance
        const adjustedVolume = Math.min(get().volume * intensity * volumeFactor, 1);
        
        // Create a new instance for this positional sound
        const soundInstance = sound.play();
        sound.volume(adjustedVolume, soundInstance);
        
        // Set 3D spatial position (if supported)
        if (sound.pos) {
          sound.pos(position[0], position[1], position[2], soundInstance);
        }
        
        // Calculate stereo panning for positional effect
        const direction = new THREE.Vector3().subVectors(soundPos, playerPos);
        const angle = Math.atan2(direction.x, direction.z);
        const stereoPan = Math.sin(angle);
        
        // Apply stereo panning if supported
        if (sound.stereo) {
          sound.stereo(stereoPan, soundInstance);
        }
      } catch (error) {
        console.warn(`Error playing positional sound ${name}:`, error);
      }
    }
  },
  
  // Legacy methods for compatibility
  playHit: () => {
    const { sounds, isMuted } = get();
    const hitSound = sounds.hit;
    
    if (hitSound && !isMuted) {
      hitSound.volume(0.3);
      hitSound.play();
    } else if (isMuted) {
      console.log("Hit sound skipped (muted)");
    }
  },
  
  playSuccess: () => {
    const { sounds, isMuted } = get();
    const successSound = sounds.success;
    
    if (successSound && !isMuted) {
      successSound.play();
    } else if (isMuted) {
      console.log("Success sound skipped (muted)");
    }
  }
}));
