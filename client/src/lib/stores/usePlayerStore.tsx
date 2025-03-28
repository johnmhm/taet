import { create } from "zustand";

interface PlayerPosition {
  x: number;
  y: number;
  z: number;
}

interface PlayerState {
  playerPosition: PlayerPosition;
  updatePlayerPosition: (newPosition: PlayerPosition) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  playerPosition: { x: 0, y: 0, z: 0 },
  updatePlayerPosition: (newPosition) => set({ playerPosition: newPosition }),
}));
