import { useState, useEffect, useCallback } from "react";
import { StockData, WeatherData, CryptoData } from "../lib/stores/useDataStore";
import { apiRequest } from "../lib/queryClient";

// Hook for fetching various data types
export function useDataFetching() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [cryptoData, setCryptoData] = useState<CryptoData[] | null>(null);
  const [isLoading, setIsLoading] = useState({
    stock: false,
    weather: false,
    crypto: false
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch stock data (Tesla)
  const fetchStockData = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, stock: true }));
      
      const response = await apiRequest("GET", "/api/stock/TSLA");
      const data = await response.json();
      
      setStockData(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch stock data:", err);
      setError("Failed to fetch stock data");
      
      // Fallback data for development
      setStockData({
        symbol: "TSLA",
        price: 250.22,
        percentChange: 2.35,
      });
    } finally {
      setIsLoading(prev => ({ ...prev, stock: false }));
    }
  }, []);

  // Fetch weather data for a location
  const fetchWeatherData = useCallback(async (location = "New York") => {
    try {
      setIsLoading(prev => ({ ...prev, weather: true }));
      
      const response = await apiRequest("GET", `/api/weather?location=${encodeURIComponent(location)}`);
      const data = await response.json();
      
      setWeatherData(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch weather data:", err);
      setError("Failed to fetch weather data");
      
      // Fallback data for development
      setWeatherData({
        location: "New York",
        temperature: 22,
        weatherCondition: "Partly Cloudy",
        cloudCover: 40,
        isDay: true
      });
    } finally {
      setIsLoading(prev => ({ ...prev, weather: false }));
    }
  }, []);

  // Fetch crypto data
  const fetchCryptoData = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, crypto: true }));
      
      const response = await apiRequest("GET", "/api/crypto");
      const data = await response.json();
      
      setCryptoData(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch crypto data:", err);
      setError("Failed to fetch crypto data");
      
      // Fallback data for development
      setCryptoData([
        { symbol: "BTC", price: 42000, percentChange: 1.2 },
        { symbol: "ETH", price: 2300, percentChange: -0.5 },
        { symbol: "SOL", price: 105, percentChange: 3.1 },
        { symbol: "DOGE", price: 0.12, percentChange: -2.3 },
        { symbol: "ADA", price: 0.45, percentChange: 0.8 }
      ]);
    } finally {
      setIsLoading(prev => ({ ...prev, crypto: false }));
    }
  }, []);

  // Fetch all data sources
  const fetchAllData = useCallback(() => {
    fetchStockData();
    fetchWeatherData();
    fetchCryptoData();
  }, [fetchStockData, fetchWeatherData, fetchCryptoData]);

  return {
    stockData,
    weatherData,
    cryptoData,
    isLoading,
    error,
    fetchStockData,
    fetchWeatherData,
    fetchCryptoData,
    fetchAllData
  };
}
