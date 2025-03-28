import { Environment as EnvironmentImpl, PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState, useCallback } from "react";
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

// Movement constants
const MOVEMENT_SPEED = 0.1;
const ROTATION_SPEED = 0.05;
const CAMERA_HEIGHT = 2;
const CAMERA_DISTANCE = 8;

export function Environment() {
  const fetchAllData = useDataStore(state => state.fetchAllData);
  const { playerPosition, updatePlayerPosition } = usePlayerStore();
  const { forward, backward, leftward, rightward } = usePlayerControls();

  // Camera and avatar refs
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const avatarRef = useRef<THREE.Group>(null);

  // Access the default camera and set target dynamically
  const { camera } = useThree();

  // Camera directions
  const [initialized, setInitialized] = useState(false);
  const cameraDirection = useRef(new THREE.Vector3());
  const cameraForward = useRef(new THREE.Vector3());
  const cameraRight = useRef(new THREE.Vector3());

  // Fetch data when component mounts
  useEffect(() => {
    fetchAllData();

    // Set up refresh interval (every 5 minutes)
    const intervalId = setInterval(() => {
      fetchAllData();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchAllData]);

  // Memoized movement calculation
  const calculateMovement = useCallback(() => {
    if (!avatarRef.current) return null;

    camera.getWorldDirection(cameraDirection.current);

    cameraForward.current.set(
      cameraDirection.current.x,
      0,
      cameraDirection.current.z
    ).normalize();

    cameraRight.current.crossVectors(
      UP_VECTOR,
      cameraForward.current
    ).normalize();

    const moveVector = new THREE.Vector3(0, 0, 0);

    // Batch movement calculations
    const movements = [
      [forward, cameraForward.current, MOVEMENT_SPEED],
      [backward, cameraForward.current, -MOVEMENT_SPEED],
      [leftward, cameraRight.current, MOVEMENT_SPEED],
      [rightward, cameraRight.current, -MOVEMENT_SPEED]
    ];

    movements.forEach(([active, direction, speed]) => {
      if (active) {
        moveVector.addScaledVector(direction as THREE.Vector3, speed as number);
      }
    });

    // Normalize diagonal movement to maintain consistent speed
    if (moveVector.lengthSq() > 0) {
      if (moveVector.lengthSq() > MOVEMENT_SPEED * MOVEMENT_SPEED) {
        moveVector.normalize().multiplyScalar(MOVEMENT_SPEED);
      }

      // Move avatar
      avatarRef.current.position.add(moveVector);

      // Update global state
      updatePlayerPosition({
        x: avatarRef.current.position.x,
        y: avatarRef.current.position.y, 
        z: avatarRef.current.position.z
      });
    }
  });

  // Initialize avatar position
  useEffect(() => {
    if (avatarRef.current) {
      // Position avatar at initial position
      avatarRef.current.position.set(
        playerPosition.x,
        playerPosition.y,
        playerPosition.z
      );
    }
  }, []);

  // Add camera controls via mouse for rotation (replaces OrbitControls)
  const [cameraAngle, setCameraAngle] = useState(0);
  const [mouseDown, setMouseDown] = useState(false);
  const lastMouseX = useRef(0);

  // Set up mouse controls for camera rotation
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // left mouse button
        setMouseDown(true);
        lastMouseX.current = e.clientX;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) { // left mouse button
        setMouseDown(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (mouseDown) {
        const deltaX = e.clientX - lastMouseX.current;
        setCameraAngle(prevAngle => prevAngle + deltaX * 0.01);
        lastMouseX.current = e.clientX;
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseDown]);

  // Custom camera positioning
  useFrame(() => {
    if (cameraRef.current && avatarRef.current) {
      // Calculate camera position based on angle and distance
      const x = Math.sin(cameraAngle) * CAMERA_DISTANCE;
      const z = Math.cos(cameraAngle) * CAMERA_DISTANCE;

      // Position camera relative to avatar
      cameraRef.current.position.x = avatarRef.current.position.x + x;
      cameraRef.current.position.y = avatarRef.current.position.y + CAMERA_HEIGHT;
      cameraRef.current.position.z = avatarRef.current.position.z + z;

      // Make camera look at avatar
      cameraRef.current.lookAt(
        avatarRef.current.position.x,
        avatarRef.current.position.y + 1, // Look at upper body/head
        avatarRef.current.position.z
      );
    }
  });

  // Calculate movement direction vector for animation
  const getMoveDirection = () => {
    const moveDir = new THREE.Vector3(0, 0, 0);

    if (forward) moveDir.addScaledVector(cameraForward.current, 1);
    if (backward) moveDir.addScaledVector(cameraForward.current, -1);
    if (leftward) moveDir.addScaledVector(cameraRight.current, -1);
    if (rightward) moveDir.addScaledVector(cameraRight.current, 1);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    return moveDir;
  };

  return (
    <>
      {/* Camera with custom controls */}
      <PerspectiveCamera 
        ref={cameraRef}
        makeDefault 
        position={[playerPosition.x, playerPosition.y + CAMERA_HEIGHT, playerPosition.z + CAMERA_DISTANCE]} 
        fov={75}
      />

      {/* Environment lighting */}
      <Lighting />

      {/* Skybox */}
      <EnvironmentImpl preset="sunset" />

      {/* Ground plane */}
      <Ground />

      {/* Animated avatar with effects */}
      <Avatar 
        ref={avatarRef} 
        position={[playerPosition.x, playerPosition.y, playerPosition.z]}
        isMoving={Boolean(forward || backward || leftward || rightward)}
        moveDirection={getMoveDirection()}
        cameraDirection={cameraDirection.current}
      />

      {/* Dioramas positioned around the environment */}
      <StockDiorama position={[-10, 0, -10]} />
      <WeatherDiorama position={[10, 0, -10]} />
      <CryptoTrendsDiorama position={[0, 0, -15]} />
    </>
  );
}