import React, { useState, useRef, useEffect } from 'react';
import { enhancedApiService, GeminiResponse, WeatherApiData } from '../services/enhancedApiService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
  weatherAnalysis?: WeatherApiData;
}

interface EnhancedAIChatProps {
  location?: string;
  onLocationChange?: (location: string) => void;
}

const EnhancedAIChat: React.FC<EnhancedAIChatProps> = ({ 
  location = 'Mumbai, India',
  onLocationChange 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm your AI weather assistant powered by Gemini AI, OpenWeatherMap, and WeatherAPI. I can help you with real-time weather data, forecasts, and climate insights for ${location}. What would you like to know?`,
      isUser: false,
      timestamp: new Date(),
      confidence: 1.0,
      sources: ['Gemini AI', 'OpenWeatherMap', 'WeatherAPI']
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Extract location from user query - SMOOTH AND SIMPLE
  const extractLocationFromQuery = (query: string): string | null => {
    // Clean the query
    const cleanQuery = query.trim();
    
    // If it's just a single word (likely a city name), return it
    if (/^[A-Z][a-z]+$/.test(cleanQuery)) {
      return cleanQuery;
    }
    
    // Enhanced location patterns for better detection
    const locationPatterns = [
      // Pattern: "weather in [location]"
      /(?:weather|temperature|rain|sunny|cloudy|forecast|climate|humidity|wind)\s+(?:in|at|for|of)\s+([A-Za-z\s,.-]+?)(?:\s|$|\.|,|\?)/i,
      // Pattern: "[location] weather"
      /([A-Za-z\s,.-]+?)(?:\s+(?:weather|temperature|rain|sunny|cloudy|forecast|climate|humidity|wind))/i,
      // Pattern: "what's weather in [location]"
      /(?:what's|whats|what is)\s+(?:the\s+)?(?:weather|temperature|rain|sunny|cloudy|forecast|climate|humidity|wind)\s+(?:in|at|for|of)\s+([A-Za-z\s,.-]+?)(?:\s|$|\.|,|\?)/i,
      // Pattern: "how is weather in [location]"
      /(?:how is|how's)\s+(?:the\s+)?(?:weather|temperature|rain|sunny|cloudy|forecast|climate|humidity|wind)\s+(?:in|at|for|of)\s+([A-Za-z\s,.-]+?)(?:\s|$|\.|,|\?)/i,
      // Pattern: "tell me weather in [location]"
      /(?:tell me|show me)\s+(?:the\s+)?(?:weather|temperature|rain|sunny|cloudy|forecast|climate|humidity|wind)\s+(?:in|at|for|of)\s+([A-Za-z\s,.-]+?)(?:\s|$|\.|,|\?)/i
    ];

    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        let location = match[1].trim();
        // Clean up the location string
        location = location.replace(/[^\w\s,.-]/g, '').trim();
        // Remove common words that might be captured
        location = location.replace(/\b(weather|temperature|rain|sunny|cloudy|forecast|climate|humidity|wind|like|today|tomorrow|now)\b/gi, '').trim();
        if (location.length > 1) {
          return location;
        }
      }
    }

    // Enhanced city names list for worldwide coverage
    const cityNames = [
      // Indian cities
      'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi', 'Srinagar', 'Aurangabad', 'Navi Mumbai', 'Solapur', 'Vijayawada', 'Kolhapur', 'Amritsar', 'Nashik', 'Sangli', 'Malegaon', 'Ulhasnagar', 'Jalgaon', 'Akola', 'Latur', 'Ahmadnagar', 'Dhule', 'Ichalkaranji', 'Parbhani', 'Jalgaon', 'Bhusawal', 'Panvel', 'Satara', 'Beed', 'Yavatmal', 'Kamptee', 'Gondia', 'Barshi', 'Achalpur', 'Osmanabad', 'Nanded', 'Wardha', 'Udgir', 'Aurangabad', 'Amalner', 'Akot', 'Pandharpur', 'Shrirampur', 'Parli', 'Pachora', 'Jalna', 'Bhadravati', 'Achalpur', 'Osmanabad', 'Nanded', 'Wardha', 'Udgir', 'Aurangabad', 'Amalner', 'Akot', 'Pandharpur', 'Shrirampur', 'Parli', 'Pachora', 'Jalna', 'Bhadravati',
      // International cities
      'Tokyo', 'New York', 'London', 'Paris', 'Sydney', 'Dubai', 'Singapore', 'Hong Kong', 'Beijing', 'Shanghai', 'Los Angeles', 'Chicago', 'Toronto', 'Vancouver', 'Berlin', 'Madrid', 'Rome', 'Amsterdam', 'Vienna', 'Zurich', 'Stockholm', 'Oslo', 'Copenhagen', 'Helsinki', 'Warsaw', 'Prague', 'Budapest', 'Bucharest', 'Sofia', 'Zagreb', 'Ljubljana', 'Bratislava', 'Vilnius', 'Riga', 'Tallinn', 'Dublin', 'Edinburgh', 'Glasgow', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Newcastle', 'Nottingham', 'Leicester', 'Coventry', 'Bradford', 'Cardiff', 'Belfast', 'Derby', 'Plymouth', 'Wolverhampton', 'Southampton', 'Swansea', 'Salford', 'Aberdeen', 'Westminster', 'Portsmouth', 'York', 'Peterborough', 'Dundee', 'Sunderland', 'Norwich', 'Preston', 'Stoke', 'Newport', 'Swindon', 'Southend', 'Middlesbrough', 'Huddersfield', 'Oxford', 'Ipswich', 'Blackpool', 'Bolton', 'Bournemouth', 'Brighton', 'Stockport', 'West Bromwich', 'Reading', 'Oldham', 'Aldershot', 'Walsall', 'Maidstone', 'Bexley', 'Sutton', 'Blackburn', 'Colchester', 'Chester', 'Cheltenham', 'Burnley', 'Grimsby', 'Shrewsbury', 'Lowestoft', 'Hartlepool', 'Hastings', 'Harlow', 'Torquay', 'Basingstoke', 'Exeter', 'Eastbourne', 'Guildford', 'Gloucester', 'Mansfield', 'Watford', 'Runcorn', 'Scunthorpe', 'Woking', 'Maidstone', 'Bexley', 'Sutton', 'Blackburn', 'Colchester', 'Chester', 'Cheltenham', 'Burnley', 'Grimsby', 'Shrewsbury', 'Lowestoft', 'Hartlepool', 'Hastings', 'Harlow', 'Torquay', 'Basingstoke', 'Exeter', 'Eastbourne', 'Guildford', 'Gloucester', 'Mansfield', 'Watford', 'Runcorn', 'Scunthorpe', 'Woking',
      // US cities
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Mesa', 'Kansas City', 'Atlanta', 'Long Beach', 'Colorado Springs', 'Raleigh', 'Miami', 'Virginia Beach', 'Omaha', 'Oakland', 'Minneapolis', 'Tulsa', 'Arlington', 'Tampa', 'New Orleans', 'Wichita', 'Cleveland', 'Bakersfield', 'Aurora', 'Anaheim', 'Honolulu', 'Santa Ana', 'Corpus Christi', 'Riverside', 'Lexington', 'Stockton', 'St. Paul', 'Newark', 'Buffalo', 'Plano', 'Cincinnati', 'St. Petersburg', 'Toledo', 'Greensboro', 'Newark', 'Plano', 'Henderson', 'Lincoln', 'Buffalo', 'Jersey City', 'Chula Vista', 'Fort Wayne', 'Orlando', 'St. Petersburg', 'Chandler', 'Laredo', 'Norfolk', 'Durham', 'Madison', 'Lubbock', 'Irvine', 'Winston-Salem', 'Glendale', 'Garland', 'Hialeah', 'Reno', 'Chesapeake', 'Gilbert', 'Baton Rouge', 'Irving', 'Scottsdale', 'North Las Vegas', 'Fremont', 'Boise', 'Richmond', 'San Bernardino', 'Birmingham', 'Spokane', 'Rochester', 'Des Moines', 'Modesto', 'Fayetteville', 'Tacoma', 'Oxnard', 'Fontana', 'Columbus', 'Montgomery', 'Moreno Valley', 'Shreveport', 'Aurora', 'Yonkers', 'Akron', 'Huntington Beach', 'Little Rock', 'Augusta', 'Amarillo', 'Glendale', 'Mobile', 'Grand Rapids', 'Salt Lake City', 'Huntsville', 'Grand Prairie', 'Knoxville', 'Worcester', 'Newport News', 'Brownsville', 'Overland Park', 'Santa Clarita', 'Providence', 'Garden Grove', 'Chattanooga', 'Oceanside', 'Jackson', 'Fort Lauderdale', 'Santa Rosa', 'Rancho Cucamonga', 'Port St. Lucie', 'Tempe', 'Ontario', 'Vancouver', 'Sioux Falls', 'Springfield', 'Peoria', 'Pembroke Pines', 'Elk Grove', 'Salem', 'Lancaster', 'Corona', 'Eugene', 'Palmdale', 'Salinas', 'Springfield', 'Pasadena', 'Rockford', 'Pomona', 'Joliet', 'Paterson', 'Kansas City', 'Torrance', 'Syracuse', 'Bridgeport', 'Hayward', 'Fort Collins', 'Escondido', 'Sunnyvale', 'Lakewood', 'Hollywood', 'Naperville', 'Dayton', 'Cary', 'Hampton', 'Alexandria', 'Hartford', 'Vallejo', 'Boulder', 'New Haven', 'Waco', 'Topeka', 'Thousand Oaks', 'El Monte', 'McKinney', 'Concord', 'Visalia', 'Simi Valley', 'Lafayette', 'Lansing', 'Beaumont', 'Odessa', 'Downey', 'West Covina', 'Costa Mesa', 'Round Rock', 'Carlsbad', 'Fairfield', 'Evansville', 'Richmond', 'Murfreesboro', 'Burbank', 'Antioch', 'Temecula', 'Abilene', 'Athens', 'Clarksville', 'Allentown', 'Westminster', 'Midland', 'Norman', 'Berkeley', 'Arvada', 'Palm Bay', 'Provo', 'Elgin', 'Lakeland', 'Odessa', 'Pompano Beach', 'West Palm Beach', 'Renton', 'Centennial', 'Richmond', 'Boulder', 'New Haven', 'Waco', 'Topeka', 'Thousand Oaks', 'El Monte', 'McKinney', 'Concord', 'Visalia', 'Simi Valley', 'Lafayette', 'Lansing', 'Beaumont', 'Odessa', 'Downey', 'West Covina', 'Costa Mesa', 'Round Rock', 'Carlsbad', 'Fairfield', 'Evansville', 'Richmond', 'Murfreesboro', 'Burbank', 'Antioch', 'Temecula', 'Abilene', 'Athens', 'Clarksville', 'Allentown', 'Westminster', 'Midland', 'Norman', 'Berkeley', 'Arvada', 'Palm Bay', 'Provo', 'Elgin', 'Lakeland', 'Odessa', 'Pompano Beach', 'West Palm Beach', 'Renton', 'Centennial', 'Richmond', 'Boulder', 'New Haven', 'Waco', 'Topeka', 'Thousand Oaks', 'El Monte', 'McKinney', 'Concord', 'Visalia', 'Simi Valley', 'Lafayette', 'Lansing', 'Beaumont', 'Odessa', 'Downey', 'West Covina', 'Costa Mesa', 'Round Rock', 'Carlsbad', 'Fairfield', 'Evansville', 'Richmond', 'Murfreesboro', 'Burbank', 'Antioch', 'Temecula', 'Abilene', 'Athens', 'Clarksville', 'Allentown', 'Westminster', 'Midland', 'Norman', 'Berkeley', 'Arvada', 'Palm Bay', 'Provo', 'Elgin', 'Lakeland', 'Odessa', 'Pompano Beach', 'West Palm Beach', 'Renton', 'Centennial'
    ];

    for (const city of cityNames) {
      if (query.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }

    // Try to extract any capitalized words that might be city names
    const words = query.split(/\s+/);
    for (const word of words) {
      if (word.length > 2 && /^[A-Z][a-z]+$/.test(word)) {
        // Check if it's not a common word
        const commonWords = ['weather', 'temperature', 'rain', 'sunny', 'cloudy', 'forecast', 'climate', 'humidity', 'wind', 'like', 'today', 'tomorrow', 'now', 'what', 'how', 'tell', 'show', 'me', 'the', 'is', 'in', 'at', 'for', 'of', 'and', 'or', 'but', 'so', 'yet', 'nor', 'for', 'and', 'or', 'but', 'so', 'yet', 'nor'];
        if (!commonWords.includes(word.toLowerCase())) {
          return word;
        }
      }

    }

    return null;
  };

  // Generate intelligent weather response based on query and weather data
  const generateWeatherResponse = (query: string, weatherData: WeatherApiData, location: string): string => {
    const queryLower = query.toLowerCase();
    const temp = weatherData.current.temp_c;
    const humidity = weatherData.current.humidity;
    const condition = weatherData.current.condition.text;
    
    // Generate response based on query type
    if (queryLower.includes('temperature') || queryLower.includes('hot') || queryLower.includes('cold')) {
      let tempDescription = '';
      if (temp > 30) tempDescription = 'quite warm';
      else if (temp > 25) tempDescription = 'pleasant and warm';
      else if (temp > 20) tempDescription = 'mild and comfortable';
      else if (temp > 15) tempDescription = 'cool';
      else tempDescription = 'cold';
      
      return `The current temperature in ${location} is ${temp}°C, which is ${tempDescription}. The humidity is ${humidity}% and the weather condition is ${condition}.`;
    }
    
    if (queryLower.includes('rain') || queryLower.includes('precipitation')) {
      const rainInfo = condition.toLowerCase().includes('rain') ? 'It is currently raining' : 'It is not raining right now';
      return `In ${location}: ${rainInfo}. Current conditions are ${condition} with a temperature of ${temp}°C and humidity at ${humidity}%.`;
    }
    
    if (queryLower.includes('weather') || queryLower.includes('like')) {
      return `Current weather in ${location}: ${condition}, ${temp}°C, with ${humidity}% humidity. The conditions are ${getWeatherDescription(temp, humidity, condition)}.`;
    }
    
    if (queryLower.includes('forecast') || queryLower.includes('tomorrow')) {
      return `Current weather in ${location}: ${condition}, ${temp}°C, humidity ${humidity}%. For detailed forecasts, please use the Global Weather tab to get 5-day weather predictions.`;
    }
    
    // Default response
    return `Here's the current weather in ${location}: ${condition}, ${temp}°C, with ${humidity}% humidity. The weather is ${getWeatherDescription(temp, humidity, condition)}.`;
  };

  // Helper function to describe weather conditions
  const getWeatherDescription = (temp: number, humidity: number, condition: string): string => {
    let description = '';
    
    if (temp > 30) description += 'hot and ';
    else if (temp < 15) description += 'cool and ';
    else description += 'pleasant and ';
    
    if (humidity > 70) description += 'humid';
    else if (humidity < 30) description += 'dry';
    else description += 'comfortable';
    
    if (condition.toLowerCase().includes('clear')) description += ' with clear skies';
    else if (condition.toLowerCase().includes('cloud')) description += ' with cloudy skies';
    else if (condition.toLowerCase().includes('rain')) description += ' with rain';
    
    return description;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const query = inputText;
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      // Check if the query is weather-related OR just a location name
      const isWeatherQuery = /weather|temperature|rain|sunny|cloudy|forecast|climate|temperature|humidity|wind/i.test(query) || 
                            // Check if it's just a location name (capitalized word)
                            /^[A-Z][a-z]+$/.test(query.trim()) ||
                            // Check if it contains known city names
                            /Bangalore|Mumbai|Delhi|Chennai|Kolkata|Hyderabad|Pune|Ahmedabad|Jaipur|Tokyo|New York|London|Paris|Sydney|Dubai|Singapore|Hong Kong|Beijing|Shanghai|Los Angeles|Chicago|Toronto|Vancouver|Berlin|Madrid|Rome|Amsterdam|Vienna|Zurich|Stockholm|Oslo|Copenhagen|Helsinki|Warsaw|Prague|Budapest|Bucharest|Sofia|Zagreb|Ljubljana|Bratislava|Vilnius|Riga|Tallinn|Dublin|Edinburgh|Glasgow|Manchester|Birmingham|Liverpool|Leeds|Sheffield|Bristol|Newcastle|Nottingham|Leicester|Coventry|Bradford|Cardiff|Belfast|Derby|Plymouth|Wolverhampton|Southampton|Swansea|Salford|Aberdeen|Westminster|Portsmouth|York|Peterborough|Dundee|Sunderland|Norwich|Preston|Stoke|Newport|Swindon|Southend|Middlesbrough|Huddersfield|Oxford|Ipswich|Blackpool|Bolton|Bournemouth|Brighton|Stockport|West Bromwich|Reading|Oldham|Aldershot|Walsall|Maidstone|Bexley|Sutton|Blackburn|Colchester|Chester|Cheltenham|Burnley|Grimsby|Shrewsbury|Lowestoft|Hartlepool|Hastings|Harlow|Torquay|Basingstoke|Exeter|Eastbourne|Guildford|Gloucester|Mansfield|Watford|Runcorn|Scunthorpe|Woking/i.test(query);
      
      let weatherData: WeatherApiData | undefined;
      let weatherAnalysis: WeatherApiData | undefined;
      let response: GeminiResponse;
      let actualLocation = location; // Default to current location

      if (isWeatherQuery) {
        try {
          // Extract location from user query
          const extractedLocation = extractLocationFromQuery(query);
          if (extractedLocation) {
            actualLocation = extractedLocation;
            if (onLocationChange) {
              onLocationChange(actualLocation);
            }
          }

          // Get current weather data from WeatherAPI for the actual location
          try {
            weatherData = await enhancedApiService.getWeatherApiData(actualLocation);
            
            // Create a direct weather response instead of relying on Gemini
            const weatherResponse = generateWeatherResponse(query, weatherData, actualLocation);
            response = {
              text: weatherResponse,
              confidence: 0.9,
              sources: ['OpenWeatherMap', 'Real-time Data']
            };
          } catch (weatherError) {
            console.log('Weather API failed:', weatherError);
            // Fallback to basic response
            response = {
              text: `I'm having trouble getting weather data for ${actualLocation}. Please try using the Global Weather tab to get real-time weather information.`,
              confidence: 0.5,
              sources: ['Fallback Response']
            };
          }
        } catch (error) {
          console.log('Weather query failed:', error);
          response = {
            text: `I'm having trouble processing your weather query. Please try using the Global Weather tab for real-time weather data.`,
            confidence: 0.5,
            sources: ['Fallback Response']
          };
        }
      } else {
        // For non-weather queries, provide helpful response
        response = {
          text: `I'm a weather assistant! I can help you with weather information for any location. Try asking about weather in a specific city, or use the Global Weather tab to search for weather data worldwide.`,
          confidence: 0.8,
          sources: ['Weather Assistant']
        };
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
        weatherAnalysis
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error while processing your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
        confidence: 0
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceText = (confidence?: number) => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl blur-xl"></div>
      <div className="relative flex flex-col h-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">AI Weather Assistant</h3>
                <p className="text-white/70 text-sm font-medium">Powered by Gemini AI • {location}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white/5 rounded-full px-4 py-2 border border-white/10">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Online</span>
            </div>
          </div>
        </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in fade-in-50 duration-300`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.isUser
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/5 backdrop-blur-sm text-white border border-white/10 shadow-lg'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
              
              
              {!message.isUser && (
                <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                  <div className="flex items-center space-x-2">
                    <span className={getConfidenceColor(message.confidence)}>
                      Confidence: {getConfidenceText(message.confidence)}
                    </span>
                    {message.sources && (
                      <span>• {message.sources.join(', ')}</span>
                    )}
                  </div>
                  <span>{formatTime(message.timestamp)}</span>
                </div>
              )}
              
              {message.isUser && (
                <div className="mt-1 text-xs text-blue-100 text-right">
                  {formatTime(message.timestamp)}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                </div>
                <span className="text-white/70 font-medium">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-white/10">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about weather, climate, or anything else..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-blue-500/50 disabled:to-cyan-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
        
      </div>
      </div>
    </div>
  );
};

export default EnhancedAIChat;

