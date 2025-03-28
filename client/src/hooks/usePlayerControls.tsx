import { useKeyboardControls } from "@react-three/drei";

type Controls = {
  forward: boolean;
  backward: boolean;
  leftward: boolean;
  rightward: boolean;
  jump: boolean;
};

// Hook to access player movement controls
export function usePlayerControls() {
  // Reactive approach - returns current state
  const forward = useKeyboardControls<Controls>(state => state.forward);
  const backward = useKeyboardControls<Controls>(state => state.backward);
  const leftward = useKeyboardControls<Controls>(state => state.leftward);
  const rightward = useKeyboardControls<Controls>(state => state.rightward);
  const jump = useKeyboardControls<Controls>(state => state.jump);
  
  return {
    forward,
    backward,
    leftward,
    rightward,
    jump
  };
}
