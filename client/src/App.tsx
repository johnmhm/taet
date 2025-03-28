import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";
import { Environment } from "./components/Environment";
import { DataPanel } from "./components/ui/DataPanel";
import { Interface } from "./components/ui/interface";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { DataFetcher } from "./lib/stores/useDataStore";

// Define control keys for navigation
const controls = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
  { name: "jump", keys: ["Space"] },
];

// Main App component
function App() {
  const [showCanvas, setShowCanvas] = useState(false);
  const { setBackgroundMusic, toggleMute, isMuted } = useAudio();

  // Initialize audio
  useEffect(() => {
    // Set background music using path string instead of Audio object
    setBackgroundMusic("/sounds/background.mp3");

    // Show the canvas once everything is loaded
    setShowCanvas(true);
  }, [setBackgroundMusic]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-screen h-screen relative overflow-hidden">
        {/* Data Fetcher Component to populate the data stores */}
        <DataFetcher />
        
        {/* Sound toggle button */}
        <button 
          className="absolute top-4 right-4 z-50 bg-slate-800 text-white p-2 rounded-full"
          onClick={toggleMute}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>

        {showCanvas && (
          <KeyboardControls map={controls}>
            <Canvas
              shadows
              camera={{
                position: [0, 5, 10],
                fov: 75,
                near: 0.1,
                far: 1000
              }}
              gl={{
                antialias: true,
                powerPreference: "default"
              }}
            >
              <color attach="background" args={["#87CEEB"]} />
              <Suspense fallback={null}>
                <Environment />
              </Suspense>
            </Canvas>
            
            {/* UI Overlay */}
            <DataPanel />
            
            {/* UI Components */}
            <Interface />
          </KeyboardControls>
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;
