import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { StockData, WeatherData, CryptoData } from '../../lib/stores/useDataStore';
import { Badge } from './badge';
import { Card } from './card';
import { AnimatePresence, motion } from 'framer-motion';

export type DataType = 'stock' | 'weather' | 'crypto';

type DataTooltipProps = {
  position: [number, number, number];
  dataType: DataType;
  data: StockData | WeatherData | CryptoData | null;
  visible?: boolean;
};

export function DataTooltip({ position, dataType, data, visible = true }: DataTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Auto-hide details after a period of time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showDetails) {
      timer = setTimeout(() => {
        setShowDetails(false);
      }, 8000); // Hide after 8 seconds
    }
    
    return () => clearTimeout(timer);
  }, [showDetails]);
  
  if (!data || !visible) return null;
  
  // Render different content based on data type
  const renderContent = () => {
    switch (dataType) {
      case 'stock':
        const stockData = data as StockData;
        return (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{stockData.symbol}</h3>
              <Badge variant={stockData.percentChange && stockData.percentChange > 0 ? "success" : "destructive"}>
                {stockData.percentChange ? (stockData.percentChange > 0 ? '+' : '') + stockData.percentChange.toFixed(2) + '%' : ''}
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">
              ${stockData.price?.toFixed(2)}
            </div>
            {showDetails && (
              <div className="text-sm text-gray-500 mt-2">
                <div className="h-20 bg-gradient-to-r from-slate-800 to-slate-900 rounded-md flex items-end px-1">
                  {/* Simple chart visualization */}
                  {Array.from({length: 10}).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 mx-[1px] ${stockData.percentChange && stockData.percentChange > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{
                        height: `${20 + Math.random() * 50}%`,
                        opacity: 0.7 + (i / 20)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        );
        
      case 'weather':
        const weatherData = data as WeatherData;
        return (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{weatherData.location}</h3>
              <Badge variant="secondary">
                {weatherData.weatherCondition}
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">
              {weatherData.temperature}°C
            </div>
            {showDetails && (
              <div className="text-sm text-gray-500 mt-2">
                <p>Cloud Cover: {weatherData.cloudCover}%</p>
                <p>Time: {weatherData.isDay ? 'Day' : 'Night'}</p>
                <div className="h-2 w-full bg-gray-200 rounded-full mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      weatherData.temperature > 25 ? 'bg-red-500' : 
                      weatherData.temperature > 15 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, (weatherData.temperature / 40) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        );
        
      case 'crypto':
        const cryptoData = data as CryptoData;
        return (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{cryptoData.symbol}</h3>
              <Badge variant={cryptoData.percentChange && cryptoData.percentChange > 0 ? "success" : "destructive"}>
                {cryptoData.percentChange ? (cryptoData.percentChange > 0 ? '+' : '') + cryptoData.percentChange.toFixed(2) + '%' : ''}
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">
              ${cryptoData.price?.toFixed(2)}
            </div>
            {showDetails && (
              <div className="text-sm text-gray-500 mt-2">
                <div className="h-20 bg-gradient-to-r from-slate-800 to-slate-900 rounded-md flex items-end px-1">
                  {/* Simple crypto price chart */}
                  {Array.from({length: 12}).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 mx-[1px] ${cryptoData.percentChange && cryptoData.percentChange > 0 ? 'bg-green-400' : 'bg-red-400'}`}
                      style={{
                        height: `${30 + Math.sin(i/2) * 30 + Math.random() * 20}%`,
                        opacity: 0.7 + (i / 24)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        );
        
      default:
        return <p>No data available</p>;
    }
  };
  
  return (
    <Html position={position} distanceFactor={15} zIndexRange={[100, 0]} occlude>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setShowDetails(!showDetails)}
          className="cursor-pointer"
        >
          <Card className="backdrop-blur-md bg-black/60 text-white border-none shadow-xl w-48 p-3">
            {renderContent()}
            {isHovered && !showDetails && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-1 right-2 text-xs text-gray-400"
              >
                Click for details
              </motion.div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </Html>
  );
}