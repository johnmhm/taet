import { useState } from 'react';
import { Volume2, VolumeX, Volume } from 'lucide-react';
import { useAudio } from '../../lib/stores/useAudio';

export function AudioControls() {
  const audio = useAudio();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const handleMuteToggle = () => {
    audio.toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    audio.setVolume(volume);
  };

  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
      <button
        onClick={() => setShowVolumeSlider(!showVolumeSlider)}
        className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
        aria-label={audio.isMuted ? "Unmute" : "Mute"}
      >
        {audio.isMuted ? (
          <VolumeX className="h-5 w-5 text-white" />
        ) : audio.volume > 0.5 ? (
          <Volume2 className="h-5 w-5 text-white" />
        ) : (
          <Volume className="h-5 w-5 text-white" />
        )}
      </button>

      {showVolumeSlider && (
        <div className="flex items-center gap-2 bg-black/60 rounded-full p-1 pl-3 pr-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={audio.volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 rounded-full appearance-none bg-gray-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <button
            onClick={handleMuteToggle}
            className="text-xs text-white hover:text-gray-300 transition-colors"
          >
            {audio.isMuted ? "Unmute" : "Mute"}
          </button>
        </div>
      )}
    </div>
  );
}