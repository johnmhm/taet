import { useEffect } from 'react';
import { useDataStore } from '../../lib/stores/useDataStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Skeleton } from './skeleton';
import { TrendingUp, TrendingDown, Cloud, CloudRain, Bitcoin } from 'lucide-react';

export function DataPanel() {
  const { stockData, weatherData, cryptoData, fetchAllData } = useDataStore();

  // Fetch data when panel is opened
  useEffect(() => {
    fetchAllData();
    
    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      fetchAllData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchAllData]);

  return (
    <div className="space-y-4 p-1 max-h-[70vh] overflow-y-auto rounded-lg">
      {/* Stock data section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {stockData?.percentChange && stockData.percentChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            Stock Data
          </CardTitle>
          <CardDescription className="text-xs">
            Live market information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stockData ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{stockData.symbol}</span>
                <span className="text-sm">${stockData.price?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Daily Change</span>
                <span 
                  className={`text-xs ${
                    stockData.percentChange && stockData.percentChange >= 0 
                      ? 'text-green-500' 
                      : 'text-red-500'
                  }`}
                >
                  {stockData.percentChange && stockData.percentChange >= 0 ? '+' : ''}
                  {stockData.percentChange?.toFixed(2)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weather data section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {weatherData?.weatherCondition === 'Clear' ? (
              <Cloud className="h-4 w-4 text-blue-500" />
            ) : (
              <CloudRain className="h-4 w-4 text-blue-700" />
            )}
            Weather Data
          </CardTitle>
          <CardDescription className="text-xs">
            Current conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weatherData ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{weatherData.location}</span>
                <span className="text-sm">{weatherData.temperature}°C</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Conditions</span>
                <span className="text-xs">{weatherData.weatherCondition}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Cloud Cover</span>
                <span className="text-xs">{weatherData.cloudCover}%</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crypto data section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bitcoin className="h-4 w-4 text-orange-500" />
            Crypto Market
          </CardTitle>
          <CardDescription className="text-xs">
            Digital currency prices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cryptoData ? (
            <div className="space-y-3">
              {cryptoData.map((crypto) => (
                <div key={crypto.symbol} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{crypto.symbol}</span>
                    <span className="text-sm">${crypto.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">24h Change</span>
                    <span 
                      className={`text-xs ${
                        crypto.percentChange && crypto.percentChange >= 0 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}
                    >
                      {crypto.percentChange && crypto.percentChange >= 0 ? '+' : ''}
                      {crypto.percentChange?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}