import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBTc7GfJdj1MICh4Rh14AeEj6BEHsWQ10M';
    this.ai = new GoogleGenAI({ apiKey });
  }

  async getFishingAdvice(
    message: string, 
    context?: { 
      weather?: any; 
      location?: string; 
      userHistory?: any[];
      fishingZones?: any[];
      currentLocation?: { latitude: number; longitude: number };
      weatherService?: any;
    }
  ): Promise<string> {
    try {
      // Check if user is asking for weather for a specific location
      const weatherLocationMatch = message.match(/weather\s+(?:in|for|at)\s+([a-zA-Z\s]+)/i);
      const isWeatherRequest = message.toLowerCase().includes('weather') && weatherLocationMatch;

      if (isWeatherRequest && context?.weatherService) {
        const requestedLocation = weatherLocationMatch[1].trim();
        try {
          const weatherData = await context.weatherService.getWeatherByLocation(requestedLocation);
          
          return `🌤️ **Weather Update for ${weatherData.location}** 

**Current Conditions:**
• **Temperature:** ${weatherData.temperature.toFixed(1)}°C
• **Weather:** ${weatherData.conditions}
• **Wind:** ${weatherData.windSpeed.toFixed(1)} km/h
• **Humidity:** ${weatherData.humidity}%
• **Visibility:** ${weatherData.visibility.toFixed(1)} km

**Fishing Conditions for ${weatherData.location}:**
${this.getFishingConditionsFromWeather(weatherData)}

**⚠️ Safety Recommendations:**
• Monitor weather changes regularly
• Check local tide schedules
• Inform someone of your fishing plans
• Carry emergency communication devices

Stay safe and happy fishing! 🎣`;

        } catch (error) {
          return `I couldn't find weather data for "${requestedLocation}". Please check the spelling or try a nearby major city. For accurate fishing conditions, I recommend checking with local authorities or weather services for coastal areas near ${requestedLocation}. 🌊`;
        }
      }

      // Check if this is a route optimization request
      const isRouteRequest = message.toLowerCase().includes('route') || 
                           message.toLowerCase().includes('navigate') || 
                           message.toLowerCase().includes('direction') ||
                           message.toLowerCase().includes('optimize') ||
                           message.toLowerCase().includes('best path');

      if (isRouteRequest && context?.fishingZones && context?.currentLocation) {
        const routeOptimization = await this.optimizeFishingRoute(
          context.currentLocation,
          context.fishingZones,
          context.weather || {},
          { maxDistance: 50 }
        );

        return `🗺️ **Optimized Fishing Route**

**Recommended Route:**
${routeOptimization.optimizedRoute}

**Time Estimate:** ${routeOptimization.estimatedTime}
**Fuel Estimate:** ${routeOptimization.fuelEstimate}

**⚠️ Safety Notes:**
${routeOptimization.safetyNotes.map(note => `• ${note}`).join('\n')}

**🔄 Alternative Routes:**
${routeOptimization.alternativeRoutes.map((route, i) => `${i + 1}. ${route}`).join('\n')}

**📱 Pro Tips:**
• Use GPS navigation for precise tracking
• Keep emergency contacts handy
• Check weather updates every 30 minutes
• Maintain radio contact with shore`;
      }

      const systemPrompt = `You are a helpful fishing assistant for Indian coastal fishermen. 
      You provide practical advice about fishing techniques, safety, weather conditions, and sustainable practices.
      Always prioritize safety and environmental conservation.
      Provide responses in simple, clear language that can be easily understood.
      If asked about specific locations, focus on Indian coastal waters.
      Use emojis to make responses engaging and easy to read.
      Format your responses with proper markdown for bold text, lists, and emphasis.`;

      let contextInfo = '';
      if (context?.weather) {
        contextInfo += `Current weather: ${context.weather.conditions}, temperature ${context.weather.temperature}°C, wind ${context.weather.windSpeed} km/h. `;
      }
      if (context?.location) {
        contextInfo += `Location: ${context.location}. `;
      }

      const fullPrompt = `${systemPrompt}\n\nContext: ${contextInfo}\n\nUser question: ${message}`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
      });

      return response.text || "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      throw new Error('Failed to get fishing advice');
    }
  }

  private getFishingConditionsFromWeather(weather: any): string {
    const windCondition = weather.windSpeed < 15 ? "🟢 Good" : weather.windSpeed < 25 ? "🟡 Moderate" : "🔴 Poor";
    const visibilityCondition = weather.visibility > 5 ? "🟢 Good" : weather.visibility > 2 ? "🟡 Moderate" : "🔴 Poor";
    
    return `• **Wind Conditions:** ${windCondition} (${weather.windSpeed.toFixed(1)} km/h)
• **Visibility:** ${visibilityCondition} (${weather.visibility.toFixed(1)} km)
• **Overall Rating:** ${windCondition === "🟢 Good" && visibilityCondition === "🟢 Good" ? "🟢 Excellent for fishing" : 
      windCondition === "🔴 Poor" || visibilityCondition === "🔴 Poor" ? "🔴 Not recommended" : "🟡 Proceed with caution"}`;
  }

  async analyzeFishingConditions(weatherData: any, location: string): Promise<{
    recommendation: string;
    bestTimes: string[];
    fishTypes: string[];
    safetyTips: string[];
  }> {
    try {
      const prompt = `Analyze these fishing conditions and provide specific recommendations:
      Location: ${location}
      Weather: ${weatherData.conditions}
      Temperature: ${weatherData.temperature}°C
      Wind: ${weatherData.windSpeed} km/h
      Visibility: ${weatherData.visibility} km
      
      Provide a JSON response with:
      - recommendation: overall fishing recommendation
      - bestTimes: array of best fishing times today
      - fishTypes: array of fish likely to be caught
      - safetyTips: array of safety recommendations`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              recommendation: { type: "string" },
              bestTimes: { type: "array", items: { type: "string" } },
              fishTypes: { type: "array", items: { type: "string" } },
              safetyTips: { type: "array", items: { type: "string" } }
            },
            required: ["recommendation", "bestTimes", "fishTypes", "safetyTips"]
          }
        },
        contents: prompt,
      });

      const result = JSON.parse(response.text || '{}');
      return result;
    } catch (error) {
      console.error('Error analyzing fishing conditions:', error);
      // Return fallback response
      return {
        recommendation: "Conditions are moderate. Exercise caution.",
        bestTimes: ["Early morning (6-9 AM)", "Late evening (6-8 PM)"],
        fishTypes: ["Mackerel", "Sardines"],
        safetyTips: ["Check weather regularly", "Inform someone of your plans"]
      };
    }
  }

  async translateMessage(message: string, targetLanguage: string): Promise<string> {
    try {
      const prompt = `Translate this fishing-related message to ${targetLanguage}: "${message}"
      Keep fishing terminology accurate and use simple language.`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text || message;
    } catch (error) {
      console.error('Error translating message:', error);
      return message; // Return original message if translation fails
    }
  }

  async optimizeFishingRoute(
    currentLocation: { latitude: number; longitude: number },
    fishingZones: any[],
    weatherData: any,
    preferences?: { maxDistance?: number; preferredFishTypes?: string[] }
  ): Promise<{
    optimizedRoute: string;
    estimatedTime: string;
    fuelEstimate: string;
    safetyNotes: string[];
    alternativeRoutes: string[];
  }> {
    try {
      const zonesData = fishingZones.map(zone => 
        `${zone.name} (Safety: ${zone.safetyRating}/10, Fish: ${zone.fishTypes?.join(', ') || 'Mixed'})`
      ).join(', ');

      const prompt = `As a marine navigation expert for Indian fishermen, optimize a fishing route with these details:

      Current Location: ${currentLocation.latitude}, ${currentLocation.longitude}
      Available Zones: ${zonesData}
      Weather: ${weatherData.conditions}, Wind: ${weatherData.windSpeed}km/h, Visibility: ${weatherData.visibility}km
      Max Distance: ${preferences?.maxDistance || 50}km
      Preferred Fish: ${preferences?.preferredFishTypes?.join(', ') || 'Any'}

      Provide JSON response with:
      - optimizedRoute: detailed step-by-step route instructions
      - estimatedTime: total travel time estimate
      - fuelEstimate: approximate fuel consumption
      - safetyNotes: important safety considerations for this route
      - alternativeRoutes: 2 backup route options`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              optimizedRoute: { type: "string" },
              estimatedTime: { type: "string" },
              fuelEstimate: { type: "string" },
              safetyNotes: { type: "array", items: { type: "string" } },
              alternativeRoutes: { type: "array", items: { type: "string" } }
            },
            required: ["optimizedRoute", "estimatedTime", "fuelEstimate", "safetyNotes", "alternativeRoutes"]
          }
        },
        contents: prompt,
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error('Error optimizing route:', error);
      return {
        optimizedRoute: "Head northeast to nearest fishing zone, maintain safe distance from shore, check weather every 30 minutes",
        estimatedTime: "2-3 hours",
        fuelEstimate: "15-20 liters",
        safetyNotes: ["Check weather conditions regularly", "Maintain radio contact", "Carry emergency supplies"],
        alternativeRoutes: ["Route via protected bay area", "Coastal route with multiple shelter points"]
      };
    }
  }
}

export const geminiService = new GeminiService();
