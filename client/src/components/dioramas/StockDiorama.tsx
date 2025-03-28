import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Box, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useDataStore } from "../../lib/stores/useDataStore";
import { DataParticles } from "../effects/DataParticles";
import { DataTooltip } from "../ui/DataTooltip";
import { useProximityEffect } from "../../hooks/useProximityEffect";
import { useAudio } from "../../lib/stores/useAudio";

type StockDioramaProps = {
  position?: [number, number, number];
};

// Sci-fi themed stock price diorama
export default function StockDiorama({ position = [0, 0, 0] }: StockDioramaProps) {
  const { stockData } = useDataStore();
  const audio = useAudio();
  const groupRef = useRef<THREE.Group>(null);
  
  // Refs for animated objects
  const buildingsRef = useRef<THREE.Group>(null);
  const holoDisplayRef = useRef<THREE.Group>(null);
  
  // UI state
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Animation parameters based on stock price
  const activityLevel = useRef(0);
  const baseColor = useRef(new THREE.Color(0x00ff77));
  
  // Initialize audio when component loads
  useEffect(() => {
    if (!audio.sounds.hit) {
      audio.initializeAudio();
    }
  }, []);
  
  // Handle proximity effects when player approaches
  const { isNear } = useProximityEffect({
    position: position as [number, number, number],
    triggerDistance: 8,
    exitDistance: 12,
    onEnter: () => {
      setShowTooltip(true);
      if (stockData?.percentChange && stockData.percentChange > 0) {
        audio.playPositionalSound('stockUp', position as [number, number, number], 
          Math.min(Math.abs((stockData.percentChange || 0) / 5), 1));
      } else if (stockData?.percentChange) {
        audio.playPositionalSound('stockDown', position as [number, number, number], 
          Math.min(Math.abs((stockData.percentChange || 0) / 5), 1));
      }
    },
    onExit: () => {
      setShowTooltip(false);
    }
  });
  
  // Update activity level based on stock data
  useEffect(() => {
    if (!stockData) return;
    
    // Calculate activity level (0-1) based on daily percent change
    // Higher absolute change means more activity
    const percentChange = stockData.percentChange || 0;
    const absChange = Math.abs(percentChange);
    activityLevel.current = Math.min(Math.max(absChange / 5, 0.1), 1);
    
    // Change color based on stock movement (green for up, red for down)
    if (percentChange >= 0) {
      baseColor.current.setHex(0x00ff77); // Green for positive
    } else {
      baseColor.current.setHex(0xff3333); // Red for negative
    }
    
  }, [stockData]);
  
  // Animate the diorama
  useFrame((state, delta) => {
    if (!groupRef.current || !buildingsRef.current || !holoDisplayRef.current) return;
    
    // Rotate the entire diorama slowly
    groupRef.current.rotation.y += 0.002;
    
    // Animate buildings based on activity level
    if (buildingsRef.current.children.length > 0) {
      buildingsRef.current.children.forEach((building, i) => {
        // Make buildings pulse/scale based on activity
        const pulseFactor = Math.sin(state.clock.elapsedTime * (1 + i * 0.1) * activityLevel.current) * 0.1 + 1;
        building.scale.y = pulseFactor * (0.5 + i * 0.25);
        
        // Update building material color if it's a mesh with standard material
        if (building instanceof THREE.Mesh && building.material instanceof THREE.MeshStandardMaterial) {
          building.material.color = baseColor.current.clone();
          building.material.emissive = baseColor.current.clone().multiplyScalar(0.3);
        }
      });
    }
    
    // Rotate hologram faster when activity is high
    holoDisplayRef.current.rotation.y += 0.01 * activityLevel.current;
    
    // Add subtle oscillation to the entire diorama when player is near
    if (isNear && stockData) {
      const oscillateAmount = Math.sin(state.clock.elapsedTime * 3) * 0.01 * activityLevel.current;
      groupRef.current.position.y = position[1] + oscillateAmount;
    } else {
      groupRef.current.position.y = position[1];
    }
  });
  
  // If no data available yet
  if (!stockData) {
    return (
      <group position={position}>
        <Text position={[0, 2, 0]} fontSize={0.5} color="white">
          Loading Stock Data...
        </Text>
        <Box args={[4, 0.2, 4]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#333" />
        </Box>
      </group>
    );
  }

  // Safely access percentChange with fallback
  const percentChange = stockData.percentChange || 0;

  return (
    <group ref={groupRef} position={position}>
      {/* Base platform */}
      <RoundedBox args={[6, 0.5, 6]} radius={0.2} position={[0, -0.25, 0]}>
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </RoundedBox>
      
      {/* Title with different color based on stock value */}
      <Text 
        position={[0, 3, 0]} 
        fontSize={0.5} 
        color={baseColor.current.getHex()}
        anchorY="top"
      >
        {stockData.symbol} - ${stockData.price?.toFixed(2)}
      </Text>
      
      {/* Percentage change */}
      <Text 
        position={[0, 2.4, 0]} 
        fontSize={0.3} 
        color={percentChange >= 0 ? "#00ff77" : "#ff3333"}
        anchorY="top"
      >
        {percentChange >= 0 ? "+" : ""}{percentChange.toFixed(2)}%
      </Text>
      
      {/* Futuristic buildings group - height based on stock price */}
      <group ref={buildingsRef} position={[0, 0, 0]}>
        {/* Generate sci-fi buildings with heights proportional to stock value */}
        {Array.from({ length: 5 }).map((_, index) => {
          // Scale building heights based on stock price 
          const heightFactor = stockData.price ? 
            Math.min(Math.max(stockData.price / 300, 0.3), 3) : 1;
            
          return (
            <mesh 
              key={`building-${index}`} 
              position={[
                (index % 3 - 1) * 1.2, 
                0.5, 
                Math.floor(index / 3) * 1.2 - 0.5
              ]}
            >
              <boxGeometry args={[0.5, (1 + index * 0.5) * heightFactor, 0.5]} />
              <meshStandardMaterial 
                color={baseColor.current.getHex()} 
                emissive={baseColor.current.getHex()} 
                emissiveIntensity={0.3}
                metalness={0.8} 
                roughness={0.2} 
              />
            </mesh>
          );
        })}
      </group>
      
      {/* Holographic display in the center */}
      <group ref={holoDisplayRef} position={[0, 1.5, 0]}>
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial 
            color={baseColor.current.getHex()} 
            emissive={baseColor.current.getHex()} 
            emissiveIntensity={0.5}
            transparent={true} 
            opacity={0.7} 
          />
        </mesh>
        
        {/* Data visualization lines */}
        <group rotation={[0, 0, 0]}>
          {Array.from({ length: 8 }).map((_, i) => {
            const height = 0.3 + (Math.sin(i * 0.4) * 0.2) + Math.abs(percentChange * 0.03);
            
            return (
              <mesh key={`line-${i}`} position={[0, 0, 0]} rotation={[0, i * Math.PI / 4, 0]}>
                <boxGeometry args={[0.02, height, 0.02]} />
                <meshStandardMaterial 
                  color={baseColor.current.getHex()} 
                  emissive={baseColor.current.getHex()} 
                  emissiveIntensity={0.8}
                  transparent={true} 
                  opacity={0.8} 
                />
              </mesh>
            );
          })}
        </group>
      </group>
      
      {/* Enhanced particle system based on stock activity */}
      <DataParticles 
        position={[0, 0, 0]}
        color={baseColor.current.getHex()}
        count={200}
        spread={3}
        intensity={activityLevel.current}
        speed={0.2 * (activityLevel.current || 0.5)}
      />
      
      {/* Data tooltip that appears when player is near */}
      {showTooltip && (
        <DataTooltip 
          position={[0, 4, 0]} 
          dataType="stock" 
          data={stockData}
          visible={isNear}
        />
      )}
    </group>
  );
}
