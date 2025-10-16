export default function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    // Parse request body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    // Log incoming request for debugging
    console.log('[weather/probability] request body:', JSON.stringify(body));

    const { location, date_range, include_ai_insights, dataset_mode } = body || {};

    // Enhanced validation - support both coordinate and name-based location
    if (!location) {
      res.status(400).json({
        error: 'Missing required parameters: location is required.'
      });
      return;
    }

    // If location has name but no coordinates, try to geocode
    let finalLocation = location;
    if (location.name && (!location.latitude || !location.longitude)) {
      // Simple geocoding for major Indian cities
      const cityCoordinates = {
        'mumbai': { lat: 19.0760, lng: 72.8777 },
        'delhi': { lat: 28.7041, lng: 77.1025 },
        'bangalore': { lat: 12.9716, lng: 77.5946 },
        'bengaluru': { lat: 12.9716, lng: 77.5946 },
        'chennai': { lat: 13.0827, lng: 80.2707 },
        'kolkata': { lat: 22.5726, lng: 88.3639 },
        'hyderabad': { lat: 17.3850, lng: 78.4867 },
        'pune': { lat: 18.5204, lng: 73.8567 },
        'ahmedabad': { lat: 23.0225, lng: 72.5714 },
        'jaipur': { lat: 26.9124, lng: 75.7873 },
        'lucknow': { lat: 26.8467, lng: 80.9462 },
        'kanpur': { lat: 26.4499, lng: 80.3319 },
        'nagpur': { lat: 21.1458, lng: 79.0882 },
        'indore': { lat: 22.7196, lng: 75.8577 },
        'thane': { lat: 19.2183, lng: 72.9781 },
        'bhopal': { lat: 23.2599, lng: 77.4126 },
        'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
        'pimpri': { lat: 18.6298, lng: 73.7997 },
        'patna': { lat: 25.5941, lng: 85.1376 },
        'vadodara': { lat: 22.3072, lng: 73.1812 },
        'ludhiana': { lat: 30.9010, lng: 75.8573 },
        'agra': { lat: 27.1767, lng: 78.0081 },
        'nashik': { lat: 19.9975, lng: 73.7898 },
        'faridabad': { lat: 28.4089, lng: 77.3178 },
        'meerut': { lat: 28.9845, lng: 77.7064 },
        'rajkot': { lat: 22.3039, lng: 70.8022 },
        'kalyan': { lat: 19.2437, lng: 73.1355 },
        'vasai': { lat: 19.4259, lng: 72.8225 },
        'varanasi': { lat: 25.3176, lng: 82.9739 },
        'srinagar': { lat: 34.0837, lng: 74.7973 },
        'aurangabad': { lat: 19.8762, lng: 75.3433 },
        'noida': { lat: 28.5355, lng: 77.3910 },
        'solapur': { lat: 17.6599, lng: 75.9064 },
        'ranchi': { lat: 23.3441, lng: 85.3096 },
        'kochi': { lat: 9.9312, lng: 76.2673 },
        'coimbatore': { lat: 11.0168, lng: 76.9558 },
        'jabalpur': { lat: 23.1815, lng: 79.9864 },
        'gwalior': { lat: 26.2183, lng: 78.1828 },
        'vijayawada': { lat: 16.5062, lng: 80.6480 },
        'jodhpur': { lat: 26.2389, lng: 73.0243 },
        'madurai': { lat: 9.9252, lng: 78.1198 },
        'raipur': { lat: 21.2514, lng: 81.6296 },
        'chandigarh': { lat: 30.7333, lng: 76.7794 },
        'tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
        'mysore': { lat: 12.2958, lng: 76.6394 },
        'mysuru': { lat: 12.2958, lng: 76.6394 },
        'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
        'amritsar': { lat: 31.6340, lng: 74.8723 },
        'warangal': { lat: 17.9689, lng: 79.5941 },
        'salem': { lat: 11.6643, lng: 78.1460 },
        'mira': { lat: 19.2952, lng: 72.8544 },
        'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
        'bhiwandi': { lat: 19.3002, lng: 73.0582 },
        'saharanpur': { lat: 29.9675, lng: 77.5451 },
        'gorakhpur': { lat: 26.7606, lng: 83.3732 },
        'bikaner': { lat: 28.0229, lng: 73.3119 },
        'amravati': { lat: 20.9374, lng: 77.7796 },
        'noida': { lat: 28.5355, lng: 77.3910 },
        'jalandhar': { lat: 31.3260, lng: 75.5762 },
        'ulhasnagar': { lat: 19.2215, lng: 73.1645 },
        'jammu': { lat: 32.7266, lng: 74.8570 },
        'sangli': { lat: 16.8524, lng: 74.5815 },
        'mangalore': { lat: 12.9141, lng: 74.8560 },
        'erode': { lat: 11.3428, lng: 77.7274 },
        'belgaum': { lat: 15.8497, lng: 74.4977 },
        'ambattur': { lat: 13.1077, lng: 80.1614 },
        'tirunelveli': { lat: 8.7139, lng: 77.7567 },
        'malegaon': { lat: 20.5598, lng: 74.5252 },
        'gaya': { lat: 24.7914, lng: 85.0002 },
        'jalgaon': { lat: 21.0077, lng: 75.5626 },
        'udaipur': { lat: 24.5854, lng: 73.7125 },
        'maheshtala': { lat: 22.5086, lng: 88.2532 }
      };
      
      const cityName = location.name.toLowerCase().trim();
      const coords = cityCoordinates[cityName];
      
      if (coords) {
        finalLocation = {
          ...location,
          latitude: coords.lat,
          longitude: coords.lng,
          city_name: location.name
        };
      } else {
        res.status(400).json({
          error: `Location "${location.name}" not found. Please provide coordinates or use a supported city name.`
        });
        return;
      }
    }

    if (!date_range || !date_range.start_date) {
      res.status(400).json({
        error: 'Missing required parameters: date_range with start_date required.'
      });
      return;
    }

    // Generate more realistic weather probabilities based on season and location
    const getSeasonalBase = (lat, date) => {
      const month = new Date(date).getMonth();
      const isNorthern = lat > 0;
      
      if (isNorthern) {
        // Northern hemisphere seasons
        if (month >= 2 && month <= 4) return { rain: 25, sunny: 60, cloudy: 40, temp: 28 }; // Spring
        if (month >= 5 && month <= 7) return { rain: 70, sunny: 45, cloudy: 60, temp: 32 }; // Summer/Monsoon
        if (month >= 8 && month <= 10) return { rain: 50, sunny: 55, cloudy: 45, temp: 26 }; // Autumn
        return { rain: 15, sunny: 70, cloudy: 30, temp: 20 }; // Winter
      } else {
        // Southern hemisphere (reverse seasons)
        if (month >= 8 && month <= 10) return { rain: 25, sunny: 60, cloudy: 40, temp: 28 };
        if (month >= 11 || month <= 1) return { rain: 70, sunny: 45, cloudy: 60, temp: 32 };
        if (month >= 2 && month <= 4) return { rain: 50, sunny: 55, cloudy: 45, temp: 26 };
        return { rain: 15, sunny: 70, cloudy: 30, temp: 20 };
      }
    };

    const seasonal = getSeasonalBase(finalLocation.latitude, date_range.start_date);
    
    const generateCondition = (baseProb, label, threshold, description) => ({
      probability: parseFloat((Math.max(0, Math.min(100, baseProb + Math.random() * 20 - 10))).toFixed(2)),
      label,
      threshold,
      description
    });

    // Create mock response matching WeatherData interface
    const response = {
      location: {
        latitude: finalLocation.latitude,
        longitude: finalLocation.longitude,
        city_name: finalLocation.city_name || `Location (${finalLocation.latitude}, ${finalLocation.longitude})`
      },
      date_range: {
        start_date: date_range.start_date,
        end_date: date_range.end_date || date_range.start_date
      },
      probabilities: {
        rain: generateCondition(seasonal.rain, 'Moderate', '>5mm', 'Chance of rainfall'),
        extreme_heat: generateCondition(Math.max(5, seasonal.temp - 25), 'Low', '>35°C', 'Risk of extreme heat'),
        high_wind: generateCondition(20, 'Low', '>40km/h', 'Strong wind conditions'),
        cloudy: generateCondition(seasonal.cloudy, 'High', '>70%', 'Cloud coverage'),
        good_weather: generateCondition(100 - seasonal.rain, 'High', 'Clear skies', 'Favorable conditions'),
        sunny: generateCondition(seasonal.sunny, 'High', '>50%', 'Sunny conditions'),
        temperature: generateCondition(seasonal.temp, 'Moderate', '°C', 'Temperature forecast'),
        summary: {
          data_points: Math.floor(Math.random() * 500) + 100,
          date_range: `${date_range.start_date} to ${date_range.end_date || date_range.start_date}`,
          location: location.city_name || `(${location.latitude}, ${location.longitude})`,
          risk_level: 'Moderate',
          data_quality: 'Good'
        }
      },
      data_sources: ['Historical Climate Data', 'Weather Stations', 'Satellite Data'],
      analysis_period: `${date_range.start_date} to ${date_range.end_date || date_range.start_date}`,
      dataset_mode: dataset_mode || 'Global'
    };

    // Add AI insights if requested (guard against missing/invalid numbers)
    if (include_ai_insights) {
      const safeFormat = (v) => (typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : 'N/A');
      const good = safeFormat(response.probabilities?.good_weather?.probability);
      const rain = safeFormat(response.probabilities?.rain?.probability);
      const sunny = safeFormat(response.probabilities?.sunny?.probability);
      const temp = safeFormat(response.probabilities?.temperature?.probability);
      
      let insights = `Based on historical data for ${response.location.city_name}, `;
      
      if (rain > 60) {
        insights += `there's a high ${rain}% chance of rain, so carry an umbrella. `;
      } else if (rain > 30) {
        insights += `there's a moderate ${rain}% chance of rain, keep an umbrella handy. `;
      } else {
        insights += `there's only a ${rain}% chance of rain, so you'll likely stay dry. `;
      }
      
      if (sunny > 70) {
        insights += `With ${sunny}% sunny conditions expected, it's perfect for outdoor activities! `;
      } else if (sunny > 50) {
        insights += `Expect ${sunny}% sunny conditions - good weather for most activities. `;
      } else {
        insights += `Limited sunshine with ${sunny}% sunny conditions - might be cloudy. `;
      }
      
      insights += `Temperature around ${temp}°C is expected.`;
      
      response.ai_insights = insights;
    }

    res.status(200).json(response);
  } catch (err) {
    console.error('[weather/probability] handler error:', err);
    res.status(500).json({ error: 'Internal server error', details: String(err) });
  }
}
