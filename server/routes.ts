import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for data sources
  
  // Stock Data API endpoint (using Alpha Vantage or similar)
  app.get('/api/stock/:symbol', async (req, res) => {
    try {
      const symbol = req.params.symbol;
      
      // Example using Alpha Vantage (would need API key in production)
      // In a real implementation, we would use process.env.ALPHA_VANTAGE_API_KEY
      // For now, we'll return mock data
      
      // Mock response for development
      const mockStockData = {
        symbol: symbol,
        price: 250 + Math.random() * 50,  // Random price between 250-300
        percentChange: (Math.random() * 10) - 5  // Random change between -5% and 5%
      };
      
      res.json(mockStockData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      res.status(500).json({ error: 'Failed to fetch stock data' });
    }
  });
  
  // Weather API endpoint
  app.get('/api/weather', async (req, res) => {
    try {
      const location = req.query.location || 'New York';
      
      // Example using OpenWeatherMap (would need API key in production)
      // In a real implementation, we would use process.env.OPENWEATHER_API_KEY
      // For now, we'll return mock data
      
      // Mock response for development
      const weatherConditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Thunderstorm'];
      const randomCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
      
      const mockWeatherData = {
        location: location,
        temperature: Math.floor(10 + Math.random() * 25), // Random temp between 10-35°C
        weatherCondition: randomCondition,
        cloudCover: Math.floor(Math.random() * 100), // Random cloud coverage 0-100%
        isDay: true
      };
      
      res.json(mockWeatherData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  });
  
  // Cryptocurrency API endpoint
  app.get('/api/crypto', async (req, res) => {
    try {
      // Example using CoinGecko or similar
      // In a real implementation, we would use their API
      // For now, we'll return mock data
      
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'XRP', 'DOT'];
      
      const mockCryptoData = cryptoSymbols.map(symbol => {
        return {
          symbol: symbol,
          price: symbol === 'BTC' ? 40000 + Math.random() * 5000 : 
                 symbol === 'ETH' ? 2000 + Math.random() * 500 :
                 10 + Math.random() * 100,
          percentChange: (Math.random() * 12) - 6 // Random change between -6% and 6%
        };
      });
      
      res.json(mockCryptoData);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      res.status(500).json({ error: 'Failed to fetch crypto data' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
