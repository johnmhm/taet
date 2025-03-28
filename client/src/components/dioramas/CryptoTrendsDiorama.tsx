import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Box, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { useDataStore } from "../../lib/stores/useDataStore";
import { DataParticles } from "../effects/DataParticles";
import { DataTooltip } from "../ui/DataTooltip";
import { useProximityEffect } from "../../hooks/useProximityEffect";
import { useAudio } from "../../lib/stores/useAudio";

type CryptoTrendsDioramaProps = {
  position?: [number, number, number];
};

// Fantasy-themed crypto trends diorama
export default function CryptoTrendsDiorama({ position = [0, 0, 0] }: CryptoTrendsDioramaProps) {
  const { cryptoData } = useDataStore();
  const audio = useAudio();
  const groupRef = useRef<THREE.Group>(null);
  
  // UI state
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Refs for animated objects
  const crystalsRef = useRef<THREE.Group>(null);
  const runesCircleRef = useRef<THREE.Group>(null);
  const centralOrbRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Magic intensity based on crypto performance
  const magicIntensity = useRef(0);
  const magicColor = useRef(new THREE.Color(0x7755ff));
  const trendDirection = useRef(0); // -1 for down, 0 for neutral, 1 for up
  
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
      // Play sound based on trend direction
      if (trendDirection.current > 0) {
        audio.playPositionalSound('cryptoAlert', position as [number, number, number], 
          Math.min(magicIntensity.current * 1.5, 1));
      } else {
        audio.playPositionalSound('cryptoAlert', position as [number, number, number], 
          Math.min(magicIntensity.current, 0.7));
      }
    },
    onExit: () => {
      setShowTooltip(false);
    }
  });
  
  // Update visualization based on crypto data
  useEffect(() => {
    if (!cryptoData || !cryptoData.length) return;
    
    // Calculate average performance across all tracked cryptos
    const avgPerformance = cryptoData.reduce((sum, crypto) => {
      return sum + (crypto.percentChange || 0);
    }, 0) / cryptoData.length;
    
    // Set trend direction
    trendDirection.current = avgPerformance > 0 ? 1 : (avgPerformance < 0 ? -1 : 0);
    
    // Normalize to 0-1 range (clamped to reasonable values)
    const normalizedPerformance = (Math.min(Math.max(avgPerformance, -20), 20) + 20) / 40;
    magicIntensity.current = normalizedPerformance;
    
    // Color based on overall trend
    if (avgPerformance > 0) {
      // Positive: magical blue/purple
      magicColor.current.setHSL(0.7, 0.8, 0.5 + normalizedPerformance * 0.3);
    } else {
      // Negative: dark red/purple
      magicColor.current.setHSL(0.9, 0.8, 0.3 + normalizedPerformance * 0.3);
    }
    
  }, [cryptoData]);
  
  // Animate the diorama
  useFrame((state, delta) => {
    if (!groupRef.current || !crystalsRef.current || !runesCircleRef.current || !particlesRef.current || !centralOrbRef.current) return;
    
    // Gentle rotation of entire diorama - speed based on magic intensity
    groupRef.current.rotation.y += 0.002 * (1 + magicIntensity.current * 0.5);
    
    // Animate crystals - float and pulse based on magic intensity
    if (crystalsRef.current.children.length > 0) {
      crystalsRef.current.children.forEach((crystal, i) => {
        // Floating effect
        crystal.position.y = 0.5 + Math.sin(state.clock.elapsedTime * (0.5 + i * 0.1)) * 0.2;
        
        // Pulse effect based on magic intensity
        const pulseScale = 0.8 + Math.sin(state.clock.elapsedTime * 2 * (i * 0.1 + 1)) * 0.1 * magicIntensity.current;
        crystal.scale.set(pulseScale, pulseScale * 1.5, pulseScale);
        
        // Update crystal colors
        if (crystal.material) {
          // Slightly different hue for each crystal but based on the main color
          const crystalColor = magicColor.current.clone();
          crystalColor.offsetHSL(i * 0.05, 0, 0);
          
          (crystal.material as THREE.MeshStandardMaterial).color = crystalColor;
          (crystal.material as THREE.MeshStandardMaterial).emissive = crystalColor.clone().multiplyScalar(0.5);
          
          // Increase emissive intensity when player is near
          (crystal.material as THREE.MeshStandardMaterial).emissiveIntensity = 
            0.3 + magicIntensity.current * 0.7 + (isNear ? 0.3 : 0);
        }
      });
    }
    
    // Rotate rune circle faster with higher magic intensity
    runesCircleRef.current.rotation.y += 0.01 + magicIntensity.current * 0.03;
    
    // Add additional rotation axis for more dynamic movement
    runesCircleRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    
    // Animate central orb - pulse and glow based on magic intensity
    if (centralOrbRef.current && centralOrbRef.current.material) {
      // Size pulsing
      const orbPulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1 * magicIntensity.current;
      centralOrbRef.current.scale.set(orbPulse, orbPulse, orbPulse);
      
      // Glow intensity
      (centralOrbRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
        0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3 * magicIntensity.current + (isNear ? 0.3 : 0);
    }
    
    // Animate magic particles
    if (particlesRef.current && particlesRef.current.material) {
      // More particles visible with higher magic intensity
      (particlesRef.current.material as THREE.PointsMaterial).size = 0.05 + magicIntensity.current * 0.1;
      
      // Make particles move in a magical spiral
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const index = i / 3;
        const angle = state.clock.elapsedTime * 0.5 + index * 0.01;
        const radius = 0.5 + index * 0.01;
        const height = ((index % 20) / 20) * 3;
        
        positions[i] = Math.cos(angle) * radius;
        
        // More pronounced movement with higher magic intensity
        positions[i + 1] = height - 1.5 + 
          Math.sin(state.clock.elapsedTime + index) * 0.1 * (1 + magicIntensity.current);
        
        positions[i + 2] = Math.sin(angle) * radius;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Update color based on magic intensity
      (particlesRef.current.material as THREE.PointsMaterial).color = magicColor.current;
      
      // Brighter when player is near
      (particlesRef.current.material as THREE.PointsMaterial).opacity = 
        0.7 + (isNear ? 0.2 : 0);
    }
    
    // Add subtle oscillation to the entire diorama when player is near
    if (isNear && cryptoData) {
      const oscillateAmount = Math.sin(state.clock.elapsedTime * 3) * 0.01 * magicIntensity.current;
      groupRef.current.position.y = position[1] + oscillateAmount;
    } else {
      groupRef.current.position.y = position[1];
    }
  });
  
  // If no data available yet
  if (!cryptoData || !cryptoData.length) {
    return (
      <group position={position}>
        <Text position={[0, 2, 0]} fontSize={0.5} color="white">
          Loading Crypto Data...
        </Text>
        <Box args={[4, 0.2, 4]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#333" />
        </Box>
      </group>
    );
  }

  // Calculate the "most volatile" crypto for special effects
  const mostVolatile = useMemo(() => {
    if (!cryptoData || !cryptoData.length) return null;
    
    return cryptoData.reduce((prev, current) => {
      const prevAbs = Math.abs(prev.percentChange || 0);
      const currentAbs = Math.abs(current.percentChange || 0);
      return currentAbs > prevAbs ? current : prev;
    }, cryptoData[0]);
  }, [cryptoData]);

  return (
    <group ref={groupRef} position={position}>
      {/* Base platform - magical stone circular base */}
      <Sphere args={[2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial 
          color="#554433" 
          roughness={0.7}
          metalness={0.2}
        />
      </Sphere>
      
      {/* Title and info */}
      <Text 
        position={[0, 3, 0]} 
        fontSize={0.4} 
        color={magicColor.current.getHex()}
        anchorY="top"
      >
        Crypto Magic Crystal
      </Text>
      
      {/* List of cryptos with more dynamic styling */}
      <group position={[0, 2.2, 0]}>
        {cryptoData.slice(0, 3).map((crypto, index) => {
          const isVolatile = crypto === mostVolatile;
          const percentChange = crypto.percentChange || 0;
          const isPositive = percentChange >= 0;
          
          return (
            <Text 
              key={crypto.symbol}
              position={[0, -index * 0.3, 0]} 
              fontSize={isVolatile ? 0.3 : 0.25} 
              color={isPositive ? "#66ffaa" : "#ff6666"}
              anchorY="top"
              // Add glowing effect for the most volatile crypto
              fillOpacity={isVolatile ? 0.9 : 0.8}
              strokeWidth={isVolatile ? 0.01 : 0}
              strokeColor={isPositive ? "#00ff77" : "#ff3333"}
            >
              {crypto.symbol}: {isPositive ? "+" : ""}{percentChange.toFixed(2)}%
            </Text>
          );
        })}
      </group>
      
      {/* Magical crystals - now with size based on crypto price */}
      <group ref={crystalsRef} position={[0, 0.5, 0]}>
        {cryptoData.slice(0, 5).map((crypto, index) => {
          const angle = (index / 5) * Math.PI * 2;
          const radius = 1;
          
          // Scale crystal based on crypto price (normalized to reasonable size)
          const priceScale = crypto.price 
            ? Math.min(Math.max(crypto.price / 30000, 0.5), 1.5) 
            : 1;
            
          // Crystal color based on trend
          const isPositive = (crypto.percentChange || 0) >= 0;
          
          return (
            <mesh 
              key={`crystal-${index}`}
              position={[
                Math.cos(angle) * radius,
                0.5,
                Math.sin(angle) * radius
              ]}
              rotation={[
                Math.random() * 0.5,
                Math.random() * Math.PI * 2,
                Math.random() * 0.5
              ]}
              scale={[priceScale, priceScale * 1.5, priceScale]}
            >
              <coneGeometry args={[0.2, 0.5, 6]} />
              <meshStandardMaterial 
                color={magicColor.current.getHex()}
                emissive={magicColor.current.getHex()}
                emissiveIntensity={0.5}
                transparent={true}
                opacity={0.9}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          );
        })}
      </group>
      
      {/* Magical rune circle - enhanced for proximity effect */}
      <group ref={runesCircleRef} position={[0, 0.1, 0]}>
        <Sphere args={[1.3, 32, 4]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial 
            color={magicColor.current.getHex()}
            emissive={magicColor.current.getHex()}
            emissiveIntensity={0.3 + (isNear ? 0.2 : 0)}
            transparent={true}
            opacity={0.3 + (isNear ? 0.1 : 0)}
            wireframe={true}
          />
        </Sphere>
      </group>
      
      {/* Magic particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          {(() => {
            const particleCount = 100;
            const positions = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount; i++) {
              const angle = (i / particleCount) * Math.PI * 2;
              const radius = 0.5 + (i / particleCount) * 0.5;
              const height = (i % 20) / 20 * 3;
              
              positions[i * 3] = Math.cos(angle) * radius;
              positions[i * 3 + 1] = height - 1.5;
              positions[i * 3 + 2] = Math.sin(angle) * radius;
            }
            
            return (
              <bufferAttribute 
                attach="attributes-position" 
                array={positions} 
                count={particleCount} 
                itemSize={3} 
              />
            );
          })()}
        </bufferGeometry>
        <pointsMaterial 
          size={0.1} 
          color={magicColor.current.getHex()} 
          sizeAttenuation={true} 
          transparent={true}
          opacity={0.7}
        />
      </points>
      
      {/* Central magic orb */}
      <Sphere ref={centralOrbRef} args={[0.4, 16, 16]} position={[0, 1, 0]}>
        <meshStandardMaterial 
          color={magicColor.current.getHex()}
          emissive={magicColor.current.getHex()}
          emissiveIntensity={0.8}
          transparent={true}
          opacity={0.7}
        />
      </Sphere>
      
      {/* Enhanced particle system based on crypto trend */}
      <DataParticles 
        position={[0, 0, 0]}
        color={magicColor.current.getHex()}
        count={150}
        spread={3}
        intensity={magicIntensity.current}
        speed={0.3 * (magicIntensity.current || 0.5)}
        size={0.05 + (mostVolatile ? Math.abs(mostVolatile.percentChange || 0) / 100 : 0)}
      />
      
      {/* Data tooltip that appears when player is near */}
      {showTooltip && cryptoData && cryptoData.length > 0 && (
        <DataTooltip 
          position={[0, 4, 0]} 
          dataType="crypto" 
          data={cryptoData[0]} // Show first crypto in tooltip
          visible={isNear}
        />
      )}
    </group>
  );
}
