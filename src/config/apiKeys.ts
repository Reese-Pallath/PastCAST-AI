// API Configuration for PastCast Weather Application
// Copy this file to apiKeys.ts and add your actual API keys

export const API_KEYS = {
  // OpenWeatherMap API Key - Required for global weather data
  // Get your free API key from: https://openweathermap.org/api
  OPENWEATHER_API_KEY: process.env.REACT_APP_OPENWEATHER_API_KEY || 'df47507122c11a81f8627207208463ac',
  OPENWEATHERMAP: process.env.REACT_APP_OPENWEATHER_API_KEY || 'df47507122c11a81f8627207208463ac',
  
  // Gemini AI API Key
  GEMINI: process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyA2jvc1fPF0E-fSUHtrwrCPOWz57nNwCqA',
  
  // Weather API Key - Using OpenWeatherMap key as fallback
  WEATHERAPI: process.env.REACT_APP_WEATHER_API_KEY || 'df47507122c11a81f8627207208463ac',
  
  // Optional API keys for enhanced features
  NEWS_API_KEY: process.env.REACT_APP_NEWS_API_KEY || 'YOUR_NEWS_API_KEY_HERE',
  ALPHA_VANTAGE_API_KEY: process.env.REACT_APP_ALPHA_VANTAGE_API_KEY || 'YOUR_ALPHA_VANTAGE_API_KEY_HERE',
};

// API Endpoints
export const API_ENDPOINTS = {
  OPENWEATHER_BASE: 'https://api.openweathermap.org/data/2.5',
  OPENWEATHERMAP: {
    CURRENT: 'https://api.openweathermap.org/data/2.5/weather',
    FORECAST: 'https://api.openweathermap.org/data/2.5/forecast',
  },
  WEATHERAPI: {
    CURRENT: 'https://api.openweathermap.org/data/2.5/weather',
    FORECAST: 'https://api.openweathermap.org/data/2.5/forecast',
  },
  GEMINI: {
    CHAT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  },
  NEWS_API_BASE: 'https://newsapi.org/v2',
  ALPHA_VANTAGE_BASE: 'https://www.alphavantage.co/query',
};

// Default configuration
export const DEFAULT_CONFIG = {
  DEFAULT_CITY: 'Mumbai',
  DEFAULT_COUNTRY: 'IN',
  FORECAST_DAYS: 5,
  SEARCH_LIMIT: 5,
};