import { API_KEYS, API_ENDPOINTS } from '../config/apiKeys';

export interface WeatherProbability {
  location: string;
  date: string;
  weatherEvent: string;
  probability: number;
  description: string;
}

export interface WeatherAPIResponse {
  success: boolean;
  data?: WeatherProbability[];
  error?: string;
}

export interface ParsedQuery {
  location: string;
  date: string;
  weatherType: string;
  isRange: boolean;
  endDate?: string;
}

export interface GlobalWeatherData {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    description: string;
    icon: string;
  };
  forecast: Array<{
    date: string;
    temperature: {
      min: number;
      max: number;
    };
    humidity: number;
    windSpeed: number;
    description: string;
    icon: string;
    rainProbability: number;
  }>;
}

export class WeatherAPIHandler {
  private static readonly API_BASE = 'http://localhost:8000';
  private static readonly OPENWEATHER_API_KEY = API_KEYS.OPENWEATHER_API_KEY;
  private static readonly OPENWEATHER_BASE = API_ENDPOINTS.OPENWEATHER_BASE;

  /**
   * Parse natural language weather queries
   */
  static parseWeatherQuery(query: string): ParsedQuery | null {
    const lowerQuery = query.toLowerCase();
    
    // Extract location (common patterns)
    const locationPatterns = [
      /(?:in|at|for)\s+([a-zA-Z\s]+?)(?:\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}))/,
      /(?:weather|rain|sunny|cloudy|snow)\s+(?:in|at|for)\s+([a-zA-Z\s]+?)(?:\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}))/,
      /([a-zA-Z\s]+?)(?:\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}))/,
    ];

    let location = '';
    for (const pattern of locationPatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        location = match[1].trim();
        break;
      }
    }

    // Extract date
    const datePatterns = [
      /(?:tomorrow|today)/,
      /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/,
      /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/,
      /\d{1,2}\/\d{1,2}/,
      /\d{4}-\d{2}-\d{2}/,
    ];

    let date = '';
    for (const pattern of datePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        date = match[0];
        break;
      }
    }

    // Extract weather type
    const weatherTypes = ['rain', 'sunny', 'cloudy', 'snow', 'storm', 'wind', 'temperature', 'humidity'];
    let weatherType = 'rain'; // default
    for (const type of weatherTypes) {
      if (lowerQuery.includes(type)) {
        weatherType = type;
        break;
      }
    }

    // Check for date ranges
    const isRange = lowerQuery.includes('week') || lowerQuery.includes('range') || lowerQuery.includes('to');

    if (!location || !date) {
      return null;
    }

    return {
      location,
      date,
      weatherType,
      isRange
    };
  }

  /**
   * Convert natural language date to API format
   */
  static formatDate(dateStr: string): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === 'today') {
      return today.toISOString().split('T')[0];
    }
    if (dateStr === 'tomorrow') {
      return tomorrow.toISOString().split('T')[0];
    }

    // Handle day names
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = dayNames.indexOf(dateStr.toLowerCase());
    if (dayIndex !== -1) {
      const targetDate = new Date(today);
      const daysUntilTarget = (dayIndex - today.getDay() + 7) % 7;
      targetDate.setDate(today.getDate() + daysUntilTarget);
      return targetDate.toISOString().split('T')[0];
    }

    // Handle month names
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
    const monthMatch = dateStr.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/);
    if (monthMatch) {
      const monthIndex = monthNames.indexOf(monthMatch[1].toLowerCase());
      const day = parseInt(monthMatch[2]);
      const year = today.getFullYear();
      const targetDate = new Date(year, monthIndex, day);
      return targetDate.toISOString().split('T')[0];
    }

    // Handle MM/DD format
    const mmddMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
    if (mmddMatch) {
      const month = parseInt(mmddMatch[1]) - 1;
      const day = parseInt(mmddMatch[2]);
      const year = today.getFullYear();
      const targetDate = new Date(year, month, day);
      return targetDate.toISOString().split('T')[0];
    }

    // Handle YYYY-MM-DD format
    if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
      return dateStr;
    }

    return today.toISOString().split('T')[0];
  }

  /**
   * Fetch weather probability data from API
   */
  static async fetchWeatherProbability(parsedQuery: ParsedQuery): Promise<WeatherAPIResponse> {
    try {
      const formattedDate = this.formatDate(parsedQuery.date);
      const endDate = parsedQuery.isRange ? this.formatDate(parsedQuery.date) : formattedDate;

      const response = await fetch(`${this.API_BASE}/weather/probability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: {
            latitude: 19.0760, // Default Mumbai coordinates
            longitude: 72.8777,
            city_name: parsedQuery.location
          },
          date_range: {
            start_date: formattedDate,
            end_date: endDate
          },
          dataset_mode: 'Combined'
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform API response to our format
      const probabilities: WeatherProbability[] = [];
      
      if (data.probabilities) {
        // Map the weather type to the appropriate probability
        const weatherTypeMap: { [key: string]: string } = {
          'rain': 'rain',
          'temperature': 'extreme_heat',
          'wind': 'high_wind',
          'cloudy': 'cloudy',
          'sunny': 'good_weather'
        };
        
        const targetWeatherType = weatherTypeMap[parsedQuery.weatherType] || 'rain';
        const targetProbability = data.probabilities[targetWeatherType];
        
        if (targetProbability) {
          probabilities.push({
            location: parsedQuery.location,
            date: formattedDate,
            weatherEvent: parsedQuery.weatherType,
            probability: targetProbability.probability || 0,
            description: targetProbability.description || ''
          });
        }
      }

      return {
        success: true,
        data: probabilities
      };

    } catch (error) {
      console.error('Weather API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate probability explanation
   */
  static getProbabilityExplanation(probability: number, weatherType: string): string {
    const explanations = {
      rain: {
        high: "High chance of rain - definitely carry an umbrella!",
        medium: "Moderate chance of rain - keep an umbrella handy.",
        low: "Low chance of rain - you'll likely stay dry."
      },
      sunny: {
        high: "Very sunny day ahead - perfect for outdoor activities!",
        medium: "Partly sunny - good weather for most activities.",
        low: "Limited sunshine - might be cloudy or overcast."
      },
      temperature: {
        high: "Warm temperatures expected - dress lightly.",
        medium: "Moderate temperatures - comfortable weather.",
        low: "Cool temperatures - consider a jacket."
      }
    };

    const type = weatherType as keyof typeof explanations;
    const category = probability >= 70 ? 'high' : probability >= 40 ? 'medium' : 'low';
    
    return explanations[type]?.[category] || `A ${probability}% chance means it's ${category} probability.`;
  }

  /**
   * Generate weather tips based on probability
   */
  static getWeatherTips(probability: number, weatherType: string): string[] {
    const tips: string[] = [];
    
    if (weatherType === 'rain' && probability >= 70) {
      tips.push("🌧️ Carry an umbrella and waterproof gear");
      tips.push("🚗 Drive carefully on wet roads");
    } else if (weatherType === 'rain' && probability >= 40) {
      tips.push("☔ Keep an umbrella handy");
    }

    if (weatherType === 'sunny' && probability >= 70) {
      tips.push("☀️ Apply sunscreen and stay hydrated");
      tips.push("👒 Wear a hat and light clothing");
    }

    if (weatherType === 'temperature' && probability >= 80) {
      tips.push("🌡️ Dress appropriately for the temperature");
    }

    return tips;
  }

  /**
   * Get current weather data for any global location
   */
  static async getCurrentWeatherGlobal(city: string, country?: string): Promise<GlobalWeatherData> {
    try {
      const location = country ? `${city},${country}` : city;
      const url = `${this.OPENWEATHER_BASE}/weather?q=${encodeURIComponent(location)}&units=metric&appid=${this.OPENWEATHER_API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeather API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        location: {
          name: data.name,
          country: data.sys.country,
          lat: data.coord.lat,
          lon: data.coord.lon
        },
        current: {
          temperature: data.main.temp,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          description: data.weather[0].description,
          icon: data.weather[0].icon
        },
        forecast: [] // Will be populated by getForecastGlobal
      };
    } catch (error) {
      console.error('Global Weather API Error:', error);
      throw new Error('Failed to fetch global weather data');
    }
  }

  /**
   * Get weather forecast for any global location
   */
  static async getForecastGlobal(city: string, country?: string, days: number = 5): Promise<GlobalWeatherData> {
    try {
      const location = country ? `${city},${country}` : city;
      const url = `${this.OPENWEATHER_BASE}/forecast?q=${encodeURIComponent(location)}&units=metric&appid=${this.OPENWEATHER_API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeather Forecast API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Group forecast by day and take first forecast of each day
      const dailyForecasts = data.list.slice(0, days * 8).filter((_: any, index: number) => index % 8 === 0);
      
      const forecast = dailyForecasts.map((item: any) => ({
        date: item.dt_txt.split(' ')[0],
        temperature: {
          min: item.main.temp_min,
          max: item.main.temp_max
        },
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        rainProbability: item.pop || 0 // Probability of precipitation
      }));

      return {
        location: {
          name: data.city.name,
          country: data.city.country,
          lat: data.city.coord.lat,
          lon: data.city.coord.lon
        },
        current: {
          temperature: data.list[0].main.temp,
          humidity: data.list[0].main.humidity,
          pressure: data.list[0].main.pressure,
          windSpeed: data.list[0].wind.speed,
          description: data.list[0].weather[0].description,
          icon: data.list[0].weather[0].icon
        },
        forecast
      };
    } catch (error) {
      console.error('Global Forecast API Error:', error);
      throw new Error('Failed to fetch global weather forecast');
    }
  }

  /**
   * Get weather data by coordinates (lat, lon)
   */
  static async getWeatherByCoordinates(lat: number, lon: number): Promise<GlobalWeatherData> {
    try {
      const url = `${this.OPENWEATHER_BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.OPENWEATHER_API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeather API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        location: {
          name: data.name,
          country: data.sys.country,
          lat: data.coord.lat,
          lon: data.coord.lon
        },
        current: {
          temperature: data.main.temp,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          description: data.weather[0].description,
          icon: data.weather[0].icon
        },
        forecast: []
      };
    } catch (error) {
      console.error('Weather by Coordinates API Error:', error);
      throw new Error('Failed to fetch weather data for coordinates');
    }
  }

  /**
   * Search for locations by name (geocoding)
   */
  static async searchLocations(query: string, limit: number = 5): Promise<Array<{name: string, country: string, lat: number, lon: number}>> {
    try {
      const url = `${this.OPENWEATHER_BASE}/find?q=${encodeURIComponent(query)}&type=like&sort=population&cnt=${limit}&appid=${this.OPENWEATHER_API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Location Search API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.list.map((item: any) => ({
        name: item.name,
        country: item.sys.country,
        lat: item.coord.lat,
        lon: item.coord.lon
      }));
    } catch (error) {
      console.error('Location Search API Error:', error);
      throw new Error('Failed to search locations');
    }
  }
}
