import { useEffect, useState } from "react";
import { useGame } from "../../lib/stores/useGame";
import { useAudio } from "../../lib/stores/useAudio";
import { Button } from "./button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { VolumeX, Volume2, RotateCw, Trophy, BarChart2 } from "lucide-react";
import { AudioControls } from "./AudioControls";
import { DataPanel } from "./DataPanel";

export function Interface() {
  const restart = useGame((state) => state.restart);
  const phase = useGame((state) => state.phase);
  const { isMuted, toggleMute, initializeAudio } = useAudio();
  const [showDataPanel, setShowDataPanel] = useState(false);

  // Initialize audio when component mounts
  useEffect(() => {
    initializeAudio();
  }, []);

  // Handle clicks on the interface in the ready phase to start the game
  useEffect(() => {
    if (phase === "ready") {
      const handleClick = () => {
        // Safely handle blur by checking element type
        const activeElement = document.activeElement;
        if (activeElement && 'blur' in activeElement) {
          (activeElement as HTMLElement).blur();
        }
        const event = new KeyboardEvent("keydown", { code: "Space" });
        window.dispatchEvent(event);
      };

      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [phase]);

  return (
    <>
      {/* Top-right corner UI controls */}
      <div className="fixed top-4 right-4 flex gap-2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={restart}
          title="Restart Experience"
        >
          <RotateCw size={18} />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowDataPanel(!showDataPanel)}
          title={showDataPanel ? "Hide Data Panel" : "Show Data Panel"}
          className={showDataPanel ? "bg-primary/20" : ""}
        >
          <BarChart2 size={18} />
        </Button>

      </div>
      
      {/* Data Panel */}
      {showDataPanel && (
        <div className="fixed top-16 right-4 z-10 w-72">
          <DataPanel />
        </div>
      )}
      
      {/* Game completion overlay */}
      {phase === "ended" && (
        <div className="fixed inset-0 flex items-center justify-center z-20 bg-black/30">
          <Card className="w-full max-w-md mx-4 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Trophy className="text-yellow-500" />
                Experience Complete!
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <p className="text-center text-muted-foreground">
                Congratulations! You've explored all the data visualizations.
              </p>
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <Button onClick={restart} className="w-full">
                Explore Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* Instructions panel */}
      <div className="fixed bottom-4 left-4 z-10">
        <Card className="w-auto max-w-xs bg-background/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Controls:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>WASD or Arrow Keys: Move around</li>
              <li>Space: Jump</li>
              <li>Mouse: Look around</li>
              <li>Approach dioramas to see data details</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Enhanced audio controls with volume slider */}
      <div className="fixed bottom-4 right-4 z-10">
        <AudioControls />
      </div>
    </>
  );
}
