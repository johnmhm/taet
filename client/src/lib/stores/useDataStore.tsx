import { create } from "zustand";
import { useDataFetching } from "../../hooks/useDataFetching";
import { useEffect } from "react";

// Define types for the data we'll be fetching
export interface StockData {
  symbol: string;
  price?: number;
  percentChange?: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  weatherCondition: string;
  cloudCover: number;
  isDay?: boolean;
}

export interface CryptoData {
  symbol: string;
  price?: number;
  percentChange?: number;
}

interface DataState {
  stockData: StockData | null;
  weatherData: WeatherData | null;
  cryptoData: CryptoData[] | null;
  isLoading: {
    stock: boolean;
    weather: boolean;
    crypto: boolean;
  };
  error: string | null;
  setStockData: (data: StockData) => void;
  setWeatherData: (data: WeatherData) => void;
  setCryptoData: (data: CryptoData[]) => void;
  fetchAllData: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  stockData: null,
  weatherData: null,
  cryptoData: null,
  isLoading: {
    stock: false,
    weather: false,
    crypto: false
  },
  error: null,
  setStockData: (data) => set({ stockData: data }),
  setWeatherData: (data) => set({ weatherData: data }),
  setCryptoData: (data) => set({ cryptoData: data }),
  fetchAllData: async () => {
    // This will be implemented through the DataFetcher component
    // which uses the useDataFetching hook
  }
}));

// Component to synchronize the data fetching hook with the store
export function DataFetcher() {
  const {
    stockData, weatherData, cryptoData,
    isLoading, error, fetchAllData
  } = useDataFetching();
  
  const {
    setStockData, setWeatherData, setCryptoData
  } = useDataStore();
  
  // Set up periodic data fetching
  useEffect(() => {
    console.log("Setting up periodic data fetching");
    
    // Fetch data immediately
    fetchAllData();
    
    // Then fetch data every few seconds
    const interval = setInterval(() => {
      fetchAllData();
    }, 3000); // Fetch every 3 seconds
    
    return () => clearInterval(interval);
  }, [fetchAllData]);
  
  // Update the Zustand store when data changes
  useEffect(() => {
    if (stockData) {
      setStockData(stockData);
    }
  }, [stockData, setStockData]);
  
  useEffect(() => {
    if (weatherData) {
      setWeatherData(weatherData);
    }
  }, [weatherData, setWeatherData]);
  
  useEffect(() => {
    if (cryptoData) {
      setCryptoData(cryptoData);
    }
  }, [cryptoData, setCryptoData]);
  
  // Update the fetchAllData function in the store
  useEffect(() => {
    useDataStore.setState({ fetchAllData });
  }, [fetchAllData]);
  
  // Update loading and error states
  useEffect(() => {
    useDataStore.setState({ isLoading, error });
  }, [isLoading, error]);
  
  return null;
}
