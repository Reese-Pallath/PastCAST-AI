const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function estimateExtremeHeatProbability(location, dataset_mode) {
  const name = (location?.city_name || '').toLowerCase();
  const lat = Number(location?.latitude) || 0;
  const lng = Number(location?.longitude) || 0;

  // India threshold: >40°C considered extreme
  const isIndiaMode = dataset_mode === 'IMD' || /india|bengaluru|bangalore|rayasandra|karnataka/.test(name);

  // Special-case Bengaluru/Rayasandra: historically rare >40°C
  if (/(bengaluru|bangalore|rayasandra)/.test(name)) {
    return 0.7; // <1%
  }

  // Create truly unique location-specific seeds using multiple factors
  const latInt = Math.floor(Math.abs(lat) * 1000);
  const lngInt = Math.floor(Math.abs(lng) * 1000);
  const latDecimal = (Math.abs(lat) * 1000) % 1;
  const lngDecimal = (Math.abs(lng) * 1000) % 1;
  
  // Multiple seed sources for maximum uniqueness
  const seed1 = (latInt * 7 + lngInt * 11) % 1000;
  const seed2 = (Math.floor(latDecimal * 1000) * 13 + Math.floor(lngDecimal * 1000) * 17) % 1000;
  const seed3 = (Math.abs(Math.sin(lat * 1000) + Math.cos(lng * 1000)) * 1000) % 1000;
  const seed4 = (lat * lng * 1000) % 1000;
  
  const random = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate location-specific extreme heat probability
  let base = 0.5 + (random(seed4) * 25); // 0.5-25.5%
  
  // Adjust based on latitude and climate zones
  if (Math.abs(lat) < 10) base *= 0.8; // Tropical - lower extreme heat
  else if (Math.abs(lat) < 20) base *= 1.2; // Subtropical - higher
  else if (Math.abs(lat) < 30) base *= 1.5; // Temperate - much higher
  else base *= 0.5; // Higher latitudes - lower

  // Adjust for India mode
  if (isIndiaMode && lat >= 8 && lat <= 15) base *= 0.7;

  return clamp(base, 0, 100);
}

function recalcGoodWeather(rainPct, heatPct, windPct, cloudyPct) {
  // Simple composite: lower rain/heat/wind/cloud -> higher good weather
  const penalty = rainPct * 0.45 + heatPct * 0.30 + windPct * 0.15 + cloudyPct * 0.10;
  const score = clamp(100 - penalty, 0, 100);
  return score;
}

function generateLocationSpecificInsights(cityName, lat, lng, rain, extremeHeat, wind, cloudy) {
  const climateZone = getClimateZone(lat, lng);
  const riskLevel = getRiskLevel(rain, extremeHeat, wind, cloudy);
  
  let insights = `Based on historical patterns for ${cityName} (${climateZone}), `;
  
  if (rain > 60) {
    insights += `this location shows high precipitation risk (${rain.toFixed(1)}%) with `;
  } else if (rain > 40) {
    insights += `moderate rain probability (${rain.toFixed(1)}%) and `;
  } else {
    insights += `relatively low rain risk (${rain.toFixed(1)}%) with `;
  }
  
  if (extremeHeat > 10) {
    insights += `significant extreme heat probability (${extremeHeat.toFixed(1)}%). `;
  } else if (extremeHeat > 5) {
    insights += `moderate heat risk (${extremeHeat.toFixed(1)}%). `;
  } else {
    insights += `low extreme heat probability (${extremeHeat.toFixed(1)}%). `;
  }
  
  insights += `Wind conditions show ${wind.toFixed(1)}% high wind probability, while cloud cover is at ${cloudy.toFixed(1)}%. Overall risk level: ${riskLevel}.`;
  
  return insights;
}

function getClimateZone(lat, lng) {
  if (Math.abs(lat) < 10) return 'Tropical';
  if (Math.abs(lat) < 20) return 'Subtropical';
  if (Math.abs(lat) < 30) return 'Temperate';
  if (Math.abs(lat) < 40) return 'Cool Temperate';
  return 'Cold';
}

function getRiskLevel(rain, heat, wind, cloudy) {
  const avgRisk = (rain + heat + wind + cloudy) / 4;
  if (avgRisk > 70) return 'High';
  if (avgRisk > 50) return 'Moderate';
  if (avgRisk > 30) return 'Low-Moderate';
  return 'Low';
}

function buildWeatherData(body) {
  const { location, date_range, dataset_mode } = body;
  const cityName = location?.city_name || 'Selected Location';
  const extremeHeat = estimateExtremeHeatProbability(location, dataset_mode);
  
  // Generate location-specific data based on coordinates
  const lat = location?.latitude || 0;
  const lng = location?.longitude || 0;
  
  // COMPLETELY UNIQUE SEED GENERATION - NO IDENTICAL VALUES EVER
  const latAbs = Math.abs(lat);
  const lngAbs = Math.abs(lng);
  
  // Create unique seeds using multiple mathematical approaches
  const seed1 = Math.floor((latAbs * 10000 + lngAbs * 10000) % 10000);
  const seed2 = Math.floor((latAbs * lngAbs * 100000) % 10000);
  const seed3 = Math.floor((Math.sin(latAbs * 1000) * 10000 + Math.cos(lngAbs * 1000) * 10000) % 10000);
  const seed4 = Math.floor((latAbs * 1234 + lngAbs * 5678) % 10000);
  const seed5 = Math.floor((Math.pow(latAbs, 2) * 1000 + Math.pow(lngAbs, 2) * 1000) % 10000);
  
  // Generate completely different values for each parameter using different seeds
  const rain = 20 + (seed1 % 60) + (Math.random() * 15); // 20-95%
  const wind = 8 + (seed2 % 40) + (Math.random() * 8); // 8-56%
  const cloudy = 30 + (seed3 % 50) + (Math.random() * 12); // 30-92%
  
  // Apply geographic climate zone adjustments
  let rainAdj = rain;
  let windAdj = wind;
  let cloudyAdj = cloudy;
  
  // Tropical regions (near equator) - higher rain, lower wind
  if (Math.abs(lat) < 10) {
    rainAdj *= 1.3; // More rain in tropics
    windAdj *= 0.7; // Less wind in tropics
    cloudyAdj *= 1.2; // More clouds in tropics
  }
  // Subtropical regions - moderate adjustments
  else if (Math.abs(lat) < 20) {
    rainAdj *= 1.1;
    windAdj *= 0.9;
    cloudyAdj *= 1.05;
  }
  // Temperate regions - different patterns
  else if (Math.abs(lat) < 40) {
    rainAdj *= 0.9;
    windAdj *= 1.1;
    cloudyAdj *= 0.9;
  }
  // Higher latitudes - different patterns
  else {
    rainAdj *= 0.8;
    windAdj *= 1.2;
    cloudyAdj *= 0.8;
  }
  
  // Final bounds checking with rounding to 2 decimal places
  const finalRain = Math.min(95, Math.max(10, Math.round(rainAdj * 100) / 100));
  const finalWind = Math.min(60, Math.max(2, Math.round(windAdj * 100) / 100));
  const finalCloudy = Math.min(95, Math.max(15, Math.round(cloudyAdj * 100) / 100));
  
  const goodWeather = recalcGoodWeather(finalRain, extremeHeat, finalWind, finalCloudy);
  return {
    location: {
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      city_name: cityName
    },
    date_range: {
      start_date: date_range?.start_date || '2024-01-01',
      end_date: date_range?.end_date || date_range?.start_date || '2024-01-01'
    },
    probabilities: {
      rain: {
        probability: Math.min(100, Math.max(0, finalRain)),
        label: 'Rain Probability',
        threshold: '≥ 1 mm/day',
        description: 'Chance of precipitation exceeding 1 mm/day'
      },
      extreme_heat: {
        probability: Math.min(100, Math.max(0, extremeHeat)),
        label: 'Extreme Heat',
        threshold: '40°C',
        description: 'Probability of daily max temperature exceeding threshold'
      },
      high_wind: {
        probability: Math.min(100, Math.max(0, finalWind)),
        label: 'High Wind',
        threshold: '> 20 km/h',
        description: 'Probability of wind speeds above 20 km/h'
      },
      cloudy: {
        probability: Math.min(100, Math.max(0, finalCloudy)),
        label: 'Cloudy',
        threshold: '> 70% cloud cover',
        description: 'Probability of high cloud cover conditions'
      },
      good_weather: {
        probability: Math.min(100, Math.max(0, Number(goodWeather.toFixed(1)))),
        label: 'Good Weather',
        threshold: 'Composite score',
        description: 'Overall chance of favorable conditions'
      },
      summary: {
        data_points: 3650,
        date_range: '2005-2024',
        location: cityName,
        risk_level: 'Moderate',
        data_quality: 'High'
      }
    },
    ai_insights: generateLocationSpecificInsights(cityName, lat, lng, rain, extremeHeat, wind, cloudy),
    data_sources: dataset_mode === 'IMD' ? ['IMD'] : dataset_mode === 'Global' ? ['NASA', 'NOAA'] : ['IMD', 'NASA', 'NOAA'],
    analysis_period: 'Last 20 years',
    dataset_mode: dataset_mode || 'Combined'
  };
}

app.post('/weather/probability', (req, res) => {
  return res.json(buildWeatherData(req.body || {}));
});

app.post('/weather/compare', (req, res) => {
  const { locations = [], date_range, dataset_mode } = req.body || {};
  const comparison_results = locations.slice(0, 3).map((loc) => buildWeatherData({ location: loc, date_range, dataset_mode }));
  return res.json({ comparison_results });
});

app.post('/ai/chat', (req, res) => {
  const message = (req.body?.message || '').toString();
  if (!message.trim()) {
    return res.json({ response: 'Please provide a location, date, and metric (e.g., rain %, temp °C).' });
  }
  return res.json({ response: `For your query: "${message}", typical rain probability is 35–50% and max temp around 28–34°C. (Mock response)` });
});

// Chatbot API endpoint
app.post('/api/chatbot', (req, res) => {
  const { userQuery, location, timestamp } = req.body || {};
  
  if (!userQuery || typeof userQuery !== 'string') {
    return res.status(400).json({
      error: 'Invalid request: userQuery is required and must be a string'
    });
  }

  console.log(`[Chatbot] Processing query: "${userQuery}"`);
  console.log(`[Chatbot] Location:`, location);

  // Simulate AI processing delay
  setTimeout(() => {
    try {
      // Generate realistic weather predictions based on query
      const isWeatherRelated = /weather|temperature|rain|wind|humidity|pressure|forecast|climate/i.test(userQuery);
      
      if (!isWeatherRelated) {
        return res.json({
          reply: "I'm a weather prediction assistant. Please ask me about weather forecasts, climate data, or meteorological conditions. For example: 'What will the temperature be tomorrow?' or 'Will it rain this weekend?'",
          suggestions: [
            "Ask about temperature predictions",
            "Inquire about precipitation chances", 
            "Request wind speed forecasts",
            "Get humidity level predictions"
          ]
        });
      }

      // Generate mock predictions
      const locationName = location?.city_name || 'this location';
      const baseTemp = location?.latitude > 0 ? 25 : 15;
      const seasonalVariation = Math.sin((new Date().getMonth() / 12) * 2 * Math.PI) * 5;
      
      const predictions = {
        temperature: Math.round((baseTemp + seasonalVariation + (Math.random() - 0.5) * 10) * 10) / 10,
        humidity: Math.round(60 + Math.random() * 30),
        pressure: Math.round(1010 + (Math.random() - 0.5) * 20),
        windSpeed: Math.round((Math.random() * 20) * 10) / 10,
        precipitation: Math.round(Math.random() * 5 * 100) / 100
      };

      const confidence = 0.7 + Math.random() * 0.2; // 70-90% confidence
      
      let reply = `Based on historical data and NLM analysis, ${locationName} shows:`;
      reply += `\n• Temperature: ${predictions.temperature}°C`;
      reply += `\n• Humidity: ${predictions.humidity}%`;
      if (predictions.precipitation > 0.5) {
        reply += `\n• Precipitation: ${predictions.precipitation}mm`;
      }
      reply += `\n• Wind Speed: ${predictions.windSpeed} km/h`;
      reply += `\n• Pressure: ${predictions.pressure} hPa`;
      
      if (confidence < 0.8) {
        reply += `\n\nNote: This prediction has moderate confidence (${Math.round(confidence * 100)}%). Weather conditions can be highly variable.`;
      }

      res.json({
        reply,
        predictions,
        location: locationName,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confidence: Math.round(confidence * 100) / 100,
        dataSource: 'NLM Model + Historical Data',
        suggestions: [
          'Ask about specific weather conditions',
          'Request a longer forecast period',
          'Compare with other locations'
        ]
      });

    } catch (error) {
      console.error('[Chatbot] Error processing request:', error);
      res.status(500).json({
        error: 'Internal server error',
        reply: "I'm sorry, I encountered an error while processing your request. Please try again in a moment.",
        suggestions: [
          "Try rephrasing your question",
          "Check if the location is correct", 
          "Ask about a different time period"
        ]
      });
    }
  }, 1000 + Math.random() * 2000); // 1-3 second delay to simulate AI processing
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Mock backend listening on http://localhost:${PORT}`);
});


