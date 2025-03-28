import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Box } from "@react-three/drei";
import * as THREE from "three";
import { useDataStore } from "../../lib/stores/useDataStore";
import { DataParticles } from "../effects/DataParticles";
import { DataTooltip } from "../ui/DataTooltip";
import { useProximityEffect } from "../../hooks/useProximityEffect";
import { useAudio } from "../../lib/stores/useAudio";

type WeatherDioramaProps = {
  position?: [number, number, number];
};

// Fantasy-themed weather diorama with minimalistic styling
export default function WeatherDiorama({ position = [0, 0, 0] }: WeatherDioramaProps) {
  const { weatherData } = useDataStore();
  const audio = useAudio();
  const groupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Group>(null);
  const rainRef = useRef<THREE.Points>(null);
  const terrainRef = useRef<THREE.Mesh>(null);
  const sunMoonRef = useRef<THREE.Mesh>(null);
  
  // UI state
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Use standard material for the minimalistic monochrome look
  const [terrainColor, setTerrainColor] = useState(new THREE.Color(0x777777));
  
  // Weather conditions
  const isRaining = useRef(false);
  const cloudiness = useRef(0);
  const temperature = useRef(0);
  const timeOfDay = useRef(0.5); // 0 = night, 1 = day
  const activityLevel = useRef(0.5);
  const particleColor = useRef(new THREE.Color(0x99ccff));

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
      if (weatherData) {
        if (weatherData.weatherCondition === 'Clear') {
          audio.playPositionalSound('weatherCalm', position as [number, number, number], 0.7);
        } else {
          audio.playPositionalSound('weatherStorm', position as [number, number, number], 
            Math.min((weatherData?.cloudCover || 0) / 100, 1));
        }
      }
    },
    onExit: () => {
      setShowTooltip(false);
    }
  });

  // Update weather visualization based on data
  useEffect(() => {
    if (!weatherData) return;
    
    // Update weather conditions
    isRaining.current = weatherData.weatherCondition?.toLowerCase().includes("rain") || false;
    cloudiness.current = (weatherData.cloudCover || 0) / 100; // 0 to 1
    
    // Normalize temperature (0-1 scale, where 0 is cold and 1 is hot)
    const minTemp = -10;
    const maxTemp = 40;
    temperature.current = Math.min(Math.max((weatherData.temperature - minTemp) / (maxTemp - minTemp), 0), 1);
    
    // Time of day could be based on sunrise/sunset data if available
    if (weatherData.isDay !== undefined) {
      timeOfDay.current = weatherData.isDay ? 0.8 : 0.2;
    }
    
    // Calculate overall activity level based on cloud cover and temperature extremes
    activityLevel.current = Math.max(
      cloudiness.current, 
      Math.abs(temperature.current - 0.5) * 2
    ) * 0.8;
    
    // Set particle color based on weather and temperature
    if (isRaining.current) {
      particleColor.current.setHex(0x99ccff); // Blue for rain
    } else if (temperature.current > 0.7) {
      particleColor.current.setHex(0xffcc66); // Warm for hot
    } else if (temperature.current < 0.3) {
      particleColor.current.setHex(0xaaccff); // Cool for cold
    } else {
      particleColor.current.setHex(0xdddddd); // Neutral
    }
    
  }, [weatherData]);

  // Animate the diorama
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Rotation speed based on activity level
    groupRef.current.rotation.y += 0.001 * (1 + activityLevel.current);
    
    // Animate clouds based on cloudiness
    if (cloudsRef.current) {
      cloudsRef.current.children.forEach((cloud, i) => {
        // Clouds move in a circular pattern at different speeds
        const angle = state.clock.elapsedTime * 0.2 * (i * 0.1 + 0.5) * (1 + cloudiness.current * 0.5);
        const radius = 1 + i * 0.2;
        cloud.position.x = Math.cos(angle) * radius;
        cloud.position.z = Math.sin(angle) * radius;
        
        // Scale clouds based on cloudiness
        const baseScale = 0.2 + cloudiness.current * 0.3;
        cloud.scale.set(baseScale, baseScale, baseScale);
        
        // Cloud opacity also affected by cloudiness
        if (cloud.material) {
          (cloud.material as THREE.MeshStandardMaterial).opacity = 0.5 + cloudiness.current * 0.5;
        }
      });
    }
    
    // Animate rain if it's raining
    if (rainRef.current && rainRef.current.material) {
      // Only show rain when it's raining
      (rainRef.current.material as THREE.PointsMaterial).opacity = isRaining.current ? 0.7 : 0;
      
      // Make rain particles fall and reset position when below ground
      // Speed based on activity level
      const fallSpeed = 0.1 * (1 + activityLevel.current * 2);
      const positions = rainRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= fallSpeed; // Move down
        
        // Reset rain drop if it's below ground
        if (positions[i + 1] < 0) {
          positions[i] = (Math.random() - 0.5) * 3; // Random x
          positions[i + 1] = 3; // Start above
          positions[i + 2] = (Math.random() - 0.5) * 3; // Random z
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Animate sun/moon position and color based on time of day
    if (sunMoonRef.current) {
      // Move in a semicircle from left to right
      const angle = Math.PI * timeOfDay.current;
      const radius = 2;
      sunMoonRef.current.position.x = Math.cos(angle) * radius;
      sunMoonRef.current.position.y = Math.sin(angle) * radius + 1;
      
      // Adjust color based on time of day
      if (sunMoonRef.current.material) {
        if (timeOfDay.current > 0.5) {
          // Day - yellow sun
          (sunMoonRef.current.material as THREE.MeshStandardMaterial).color.setHex(0xffdd00);
          (sunMoonRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(0xffdd00);
          // Make sun brighter when player is near
          (sunMoonRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
            isNear ? 0.8 : 0.5;
        } else {
          // Night - blue/white moon
          (sunMoonRef.current.material as THREE.MeshStandardMaterial).color.setHex(0xccddff);
          (sunMoonRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(0x334455);
          // Make moon brighter when player is near
          (sunMoonRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
            isNear ? 0.5 : 0.3;
        }
      }
    }
    
    // Adjust terrain color based on temperature
    if (terrainRef.current && terrainRef.current.material) {
      // Determine color based on temperature
      let newColor = new THREE.Color();
      
      if (temperature.current < 0.33) {
        // Cold: cool blue/gray
        newColor.setHSL(0.6, 0.15, 0.3);  // Cool gray-blue
      } else if (temperature.current < 0.66) {
        // Mild: neutral gray
        newColor.setHSL(0, 0.05, 0.5);    // Medium gray
      } else {
        // Hot: warm gray
        newColor.setHSL(0.05, 0.12, 0.5); // Warm gray
      }
      
      // Update the material color
      setTerrainColor(newColor);
      (terrainRef.current.material as THREE.MeshStandardMaterial).color = newColor;
    }
    
    // Add subtle oscillation to the entire diorama when player is near
    if (isNear && weatherData) {
      const oscillateAmount = Math.sin(state.clock.elapsedTime * 2) * 0.01 * activityLevel.current;
      groupRef.current.position.y = position[1] + oscillateAmount;
    } else {
      groupRef.current.position.y = position[1];
    }
  });

  // If no data available yet
  if (!weatherData) {
    return (
      <group position={position}>
        <Text position={[0, 2, 0]} fontSize={0.5} color="white">
          Loading Weather Data...
        </Text>
        <Box args={[4, 0.2, 4]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#333" />
        </Box>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position}>
      {/* Base platform */}
      <Box args={[6, 0.5, 6]} position={[0, -0.25, 0]}>
        <meshStandardMaterial color="#553311" />
      </Box>
      
      {/* Title and info */}
      <Text 
        position={[0, 3, 0]} 
        fontSize={0.4} 
        color="white"
        anchorY="top"
      >
        {weatherData.location || "Weather"}
      </Text>
      
      <Text 
        position={[0, 2.5, 0]} 
        fontSize={0.3} 
        color={
          weatherData.temperature > 25 ? "#ff9800" : 
          weatherData.temperature > 15 ? "#4caf50" : "#2196f3"
        }
        anchorY="top"
      >
        {weatherData.temperature}°C - {weatherData.weatherCondition}
      </Text>
      
      {/* Fantasy terrain with minimalistic monochrome style */}
      <mesh ref={terrainRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial 
          color={terrainColor}
          metalness={0.1}
          roughness={0.7}
          flatShading={true}
        />
      </mesh>
      
      {/* Clouds group */}
      <group ref={cloudsRef} position={[0, 2, 0]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh 
            key={`cloud-${i}`}
            position={[
              Math.cos(i / 6 * Math.PI * 2) * (1 + i * 0.2),
              0.5 + i * 0.1,
              Math.sin(i / 6 * Math.PI * 2) * (1 + i * 0.2)
            ]}
          >
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color={0xffffff} 
              transparent={true} 
              opacity={0.7}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>
      
      {/* Rain particles */}
      <points ref={rainRef}>
        <bufferGeometry>
          {(() => {
            const particleCount = 200;
            const positions = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount; i++) {
              positions[i * 3] = (Math.random() - 0.5) * 3;      // x
              positions[i * 3 + 1] = Math.random() * 3;          // y
              positions[i * 3 + 2] = (Math.random() - 0.5) * 3;  // z
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
          size={0.05} 
          color={0x99ccff} 
          transparent={true}
          opacity={0.7}
        />
      </points>
      
      {/* Sun/Moon */}
      <mesh ref={sunMoonRef} position={[2, 2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={0xffdd00} 
          emissive={0xffdd00}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Add minimalist decorative elements */}
      {Array.from({ length: 5 }).map((_, i) => (
        <group key={`element-${i}`} position={[
          Math.cos(i / 5 * Math.PI * 2) * 1.2,
          0,
          Math.sin(i / 5 * Math.PI * 2) * 1.2
        ]}>
          {/* Monolith */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.1, 0.6, 0.1]} />
            <meshStandardMaterial 
              color={0x888888} 
              metalness={0.2} 
              roughness={0.6} 
            />
          </mesh>
        </group>
      ))}
      
      {/* Additional particle effects based on weather conditions */}
      {weatherData.cloudCover > 50 ? (
        // Misty particles for cloudy or stormy weather
        <DataParticles 
          position={[0, 1, 0]}
          color={particleColor.current.getHex()}
          count={150}
          spread={4}
          intensity={cloudiness.current}
          speed={0.1}
          size={0.08}
        />
      ) : (
        // Light particles for clear weather
        <DataParticles 
          position={[0, 1, 0]}
          color={weatherData.isDay ? 0xffffaa : 0x6699cc}
          count={80}
          spread={3}
          intensity={0.3}
          speed={0.05}
          size={0.05}
        />
      )}
      
      {/* Data tooltip that appears when player is near */}
      {showTooltip && (
        <DataTooltip 
          position={[0, 4, 0]} 
          dataType="weather" 
          data={weatherData}
          visible={isNear}
        />
      )}
    </group>
  );
}
