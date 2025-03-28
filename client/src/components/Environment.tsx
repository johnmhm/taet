import { Environment as EnvironmentImpl, PerspectiveCamera } from "@react-three/drei";
import { useThree, useFrame, useLoader } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import Ground from "./Ground";
import Lighting from "./Lighting";
import StockDiorama from "./dioramas/StockDiorama";
import WeatherDiorama from "./dioramas/WeatherDiorama";
import CryptoTrendsDiorama from "./dioramas/CryptoTrendsDiorama";
import Avatar from "./Avatar";
import { useDataStore } from "../lib/stores/useDataStore";
import { usePlayerStore } from "../lib/stores/usePlayerStore";
import { usePlayerControls } from "../hooks/usePlayerControls";
import { ModelUploader } from './ui/ModelUploader';

const MOVEMENT_SPEED = 0.1;
const ROTATION_SPEED = 0.05;
const CAMERA_HEIGHT = 2;

export default function Environment() {
  const { camera } = useThree();
  const playerRef = useRef();
  const [customModel, setCustomModel] = useState<THREE.Group | null>(null);

  const handleCustomModelSelect = (model: THREE.Group) => {
    if (model) {
      model.position.set(0, 0, -5);
      model.scale.set(1, 1, 1);
      setCustomModel(model);
    }
  };

  return (
    <>
      <EnvironmentImpl preset="city" />
      <Lighting />
      <Ground />
      <Avatar ref={playerRef} />

      {/* Dioramas */}
      <StockDiorama position={[-10, 0, -10]} />
      <WeatherDiorama position={[10, 0, -10]} />
      <CryptoTrendsDiorama position={[0, 0, -15]} />

      {/* Model upload section */}
      <ModelUploader onModelSelect={handleCustomModelSelect} />
      {customModel && <primitive object={customModel} />}
    </>
  );
}