import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { weatherService } from "./services/weather";
import { geminiService } from "./services/gemini";
import { 
  insertWeatherDataSchema, 
  insertCatchLogSchema, 
  insertChatMessageSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Weather endpoints
  app.get("/api/weather/current", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      const weatherData = await weatherService.getCurrentWeather(
        parseFloat(lat as string), 
        parseFloat(lon as string)
      );

      // Save to storage
      const savedWeather = await storage.saveWeatherData(weatherData);
      
      // Get fishing conditions
      const fishingConditions = weatherService.getFishingConditions(weatherData);

      res.json({
        weather: savedWeather,
        fishingConditions
      });
    } catch (error) {
      console.error('Weather API error:', error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  app.get("/api/weather/forecast", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      const forecast = await weatherService.getWeatherForecast(
        parseFloat(lat as string), 
        parseFloat(lon as string)
      );

      res.json(forecast);
    } catch (error) {
      console.error('Weather forecast error:', error);
      res.status(500).json({ error: "Failed to fetch weather forecast" });
    }
  });

  // Fishing zones endpoints
  app.get("/api/fishing-zones", async (req, res) => {
    try {
      const zones = await storage.getFishingZones();
      res.json(zones);
    } catch (error) {
      console.error('Fishing zones error:', error);
      res.status(500).json({ error: "Failed to fetch fishing zones" });
    }
  });

  app.get("/api/fishing-zones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const zone = await storage.getFishingZoneById(id);
      
      if (!zone) {
        return res.status(404).json({ error: "Fishing zone not found" });
      }

      res.json(zone);
    } catch (error) {
      console.error('Fishing zone error:', error);
      res.status(500).json({ error: "Failed to fetch fishing zone" });
    }
  });

  // Catch logs endpoints
  app.get("/api/catch-logs", async (req, res) => {
    try {
      const { userId } = req.query;
      const logs = await storage.getCatchLogs(userId as string);
      res.json(logs);
    } catch (error) {
      console.error('Catch logs error:', error);
      res.status(500).json({ error: "Failed to fetch catch logs" });
    }
  });

  app.post("/api/catch-logs", async (req, res) => {
    try {
      const validatedData = insertCatchLogSchema.parse(req.body);
      const log = await storage.createCatchLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      console.error('Create catch log error:', error);
      res.status(400).json({ error: "Failed to create catch log" });
    }
  });

  app.delete("/api/catch-logs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCatchLog(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Catch log not found" });
      }

      res.json({ success: true, message: "Catch log deleted successfully" });
    } catch (error) {
      console.error('Delete catch log error:', error);
      res.status(500).json({ error: "Failed to delete catch log" });
    }
  });

  // Chat endpoints
  app.get("/api/chat/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error('Chat messages error:', error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userId, context } = req.body;
      
      if (!message || !userId) {
        return res.status(400).json({ error: "Message and userId are required" });
      }

      // Enhance context with fishing zones and location data for route optimization
      const enhancedContext = { ...context };
      
      // Add fishing zones to context
      try {
        const fishingZones = await storage.getFishingZones();
        enhancedContext.fishingZones = fishingZones;
      } catch (error) {
        console.error('Failed to fetch fishing zones for chat context:', error);
      }

      // Extract current location from context if available
      if (context?.weather?.latitude && context?.weather?.longitude) {
        enhancedContext.currentLocation = {
          latitude: context.weather.latitude,
          longitude: context.weather.longitude
        };
      }

      // Add weather service to context for location-based weather requests
      enhancedContext.weatherService = weatherService;

      // Get AI response with enhanced context
      const aiResponse = await geminiService.getFishingAdvice(message, enhancedContext);

      // Save chat message
      const chatMessage = await storage.createChatMessage({
        userId,
        message,
        response: aiResponse
      });

      res.json({
        id: chatMessage.id,
        message: chatMessage.message,
        response: chatMessage.response,
        timestamp: chatMessage.timestamp
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Fishing conditions analysis endpoint
  app.post("/api/fishing-analysis", async (req, res) => {
    try {
      const { lat, lon, location } = req.body;
      
      if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      // Get current weather
      const weatherData = await weatherService.getCurrentWeather(lat, lon);
      
      // Get AI analysis
      const analysis = await geminiService.analyzeFishingConditions(
        weatherData, 
        location || weatherData.location
      );

      res.json({
        weather: weatherData,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Fishing analysis error:', error);
      res.status(500).json({ error: "Failed to analyze fishing conditions" });
    }
  });

  // Translation endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { message, language } = req.body;
      
      if (!message || !language) {
        return res.status(400).json({ error: "Message and language are required" });
      }

      const translatedMessage = await geminiService.translateMessage(message, language);
      res.json({ translatedMessage });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ error: "Failed to translate message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
