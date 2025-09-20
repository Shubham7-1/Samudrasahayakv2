import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { weatherService } from "./services/weather";
import { geminiService } from "./services/gemini";
import { OceanographicService } from "./services/oceanographic";

const oceanographicService = new OceanographicService();
import { 
  insertWeatherDataSchema, 
  insertCatchLogSchema, 
  insertChatMessageSchema,
  insertUserLocationSchema,
  insertActiveAlertSchema,
  insertEmergencyContactSchema
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

  // Potential Fishing Zones endpoint (must come before :id route)
  app.get("/api/fishing-zones/potential", async (req, res) => {
    try {
      const { lat, lon, radius } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      const fishingZones = await oceanographicService.calculatePotentialFishingZones(
        parseFloat(lat as string),
        parseFloat(lon as string),
        radius ? parseFloat(radius as string) : 50
      );

      res.json(fishingZones);
    } catch (error) {
      console.error('Potential fishing zones error:', error);
      res.status(500).json({ error: "Failed to calculate potential fishing zones" });
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

  // Oceanographic data endpoint
  app.get("/api/oceanographic/data", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      const oceanData = await oceanographicService.getOceanographicData(
        parseFloat(lat as string),
        parseFloat(lon as string)
      );

      res.json(oceanData);
    } catch (error) {
      console.error('Oceanographic data error:', error);
      res.status(500).json({ error: "Failed to fetch oceanographic data" });
    }
  });

  // Smart SOS System Endpoints

  // Location update endpoint
  app.post("/api/location/update", async (req, res) => {
    try {
      const validatedData = insertUserLocationSchema.parse(req.body);
      const location = await storage.updateUserLocation(validatedData);
      res.json(location);
    } catch (error) {
      console.error('Location update error:', error);
      res.status(400).json({ error: "Failed to update location" });
    }
  });

  // Get user location
  app.get("/api/location/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const location = await storage.getUserLocation(userId);
      
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }

      res.json(location);
    } catch (error) {
      console.error('Get location error:', error);
      res.status(500).json({ error: "Failed to get location" });
    }
  });

  // Get nearby users
  app.get("/api/location/nearby", async (req, res) => {
    try {
      const { lat, lon, radius } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      const nearbyUsers = await storage.getNearbyUsers(
        parseFloat(lat as string),
        parseFloat(lon as string),
        radius ? parseFloat(radius as string) : 15
      );

      res.json(nearbyUsers);
    } catch (error) {
      console.error('Nearby users error:', error);
      res.status(500).json({ error: "Failed to get nearby users" });
    }
  });

  // Smart SOS trigger endpoint
  app.post("/api/sos/trigger", async (req, res) => {
    try {
      const { userId, latitude, longitude, emergencyMessage, distanceFromBorder } = req.body;
      
      if (!userId || !latitude || !longitude) {
        return res.status(400).json({ error: "UserId, latitude, and longitude are required" });
      }

      // Check if user already has an active alert
      const existingAlert = await storage.getActiveAlert(userId);
      if (existingAlert) {
        return res.status(409).json({ error: "User already has an active SOS alert" });
      }

      // Create the SOS alert
      const alertData = {
        userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        status: 'pending',
        emergencyMessage: emergencyMessage || `🆘 EMERGENCY SOS - Fisherman in distress at ${latitude}, ${longitude}`,
        distanceFromBorder: distanceFromBorder ? parseFloat(distanceFromBorder) : null,
        nearbyPeersNotified: []
      };

      const alert = await storage.createSOSAlert(alertData);

      // Find nearby peers and notify them (P2P Logic)
      const nearbyPeers = await storage.getNearbyUsers(
        parseFloat(latitude),
        parseFloat(longitude),
        15 // 15km radius
      );

      const notifiedPeers = nearbyPeers
        .filter(peer => peer.userId !== userId) // Exclude the person sending the SOS
        .map(peer => ({
          userId: peer.userId,
          distance: calculateDistance(latitude, longitude, peer.latitude, peer.longitude),
          notifiedAt: new Date().toISOString()
        }));

      // Log P2P notifications (in a real app, this would send push notifications)
      notifiedPeers.forEach(peer => {
        console.log(`🚨 P2P ALERT: Notifying peer ${peer.userId} about emergency from ${userId} at distance ${peer.distance.toFixed(2)}km`);
      });

      // Update alert with notified peers
      const updatedAlert = await storage.updateAlertStatus(alert.id, 'p2p-alerted');
      if (updatedAlert) {
        updatedAlert.nearbyPeersNotified = notifiedPeers;
      }

      // Start escalation timer (90 seconds)
      setTimeout(async () => {
        try {
          const currentAlert = await storage.getActiveAlertById(alert.id);
          if (currentAlert && currentAlert.status !== 'canceled' && currentAlert.status !== 'resolved') {
            // Escalate to authorities
            await storage.updateAlertStatus(alert.id, 'escalated', new Date());
            
            console.log(`🚨 ESCALATING ALERT: Contacting Coast Guard for user ${userId} at location [${latitude}, ${longitude}]`);
            console.log(`📧 EMERGENCY ESCALATION: Sending alert to authorities for SOS ID: ${alert.id}`);
            
            // In a real app, this would:
            // 1. Send email to Coast Guard
            // 2. Send SMS to emergency contacts
            // 3. Trigger automated emergency response
          }
        } catch (escalationError) {
          console.error('Escalation error:', escalationError);
        }
      }, 90000); // 90 seconds

      res.json({
        alertId: alert.id,
        status: 'p2p-alerted',
        nearbyPeersNotified: notifiedPeers.length,
        escalationIn: 90,
        message: "SOS alert sent to nearby fishermen. Authorities will be contacted in 90 seconds if not canceled."
      });

    } catch (error) {
      console.error('SOS trigger error:', error);
      res.status(500).json({ error: "Failed to trigger SOS alert" });
    }
  });

  // Cancel SOS alert endpoint
  app.post("/api/sos/cancel", async (req, res) => {
    try {
      const { userId, alertId } = req.body;
      
      if (!userId && !alertId) {
        return res.status(400).json({ error: "Either userId or alertId is required" });
      }

      let alert;
      if (alertId) {
        alert = await storage.getActiveAlertById(alertId);
      } else {
        alert = await storage.getActiveAlert(userId);
      }

      if (!alert) {
        return res.status(404).json({ error: "No active SOS alert found" });
      }

      const canceled = await storage.cancelAlert(alert.id);
      
      if (canceled) {
        console.log(`✅ SOS ALERT CANCELED: Alert ${alert.id} for user ${alert.userId} has been canceled`);
        res.json({ 
          success: true, 
          message: "SOS alert has been canceled successfully",
          alertId: alert.id
        });
      } else {
        res.status(500).json({ error: "Failed to cancel SOS alert" });
      }

    } catch (error) {
      console.error('SOS cancel error:', error);
      res.status(500).json({ error: "Failed to cancel SOS alert" });
    }
  });

  // Get active SOS alerts for a user
  app.get("/api/sos/status/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const alert = await storage.getActiveAlert(userId);
      
      if (!alert) {
        return res.json({ hasActiveAlert: false });
      }

      res.json({
        hasActiveAlert: true,
        alert: {
          id: alert.id,
          status: alert.status,
          createdAt: alert.createdAt,
          escalationTimestamp: alert.escalationTimestamp,
          emergencyMessage: alert.emergencyMessage,
          nearbyPeersNotified: Array.isArray(alert.nearbyPeersNotified) ? alert.nearbyPeersNotified.length : 0
        }
      });

    } catch (error) {
      console.error('SOS status error:', error);
      res.status(500).json({ error: "Failed to get SOS status" });
    }
  });

  // Emergency contacts endpoints
  app.get("/api/emergency-contacts/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const contacts = await storage.getEmergencyContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error('Emergency contacts error:', error);
      res.status(500).json({ error: "Failed to get emergency contacts" });
    }
  });

  app.post("/api/emergency-contacts", async (req, res) => {
    try {
      const validatedData = insertEmergencyContactSchema.parse(req.body);
      const contact = await storage.createEmergencyContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error('Create emergency contact error:', error);
      res.status(400).json({ error: "Failed to create emergency contact" });
    }
  });

  app.delete("/api/emergency-contacts/:contactId", async (req, res) => {
    try {
      const { contactId } = req.params;
      const deleted = await storage.deleteEmergencyContact(contactId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Emergency contact not found" });
      }

      res.json({ success: true, message: "Emergency contact deleted successfully" });
    } catch (error) {
      console.error('Delete emergency contact error:', error);
      res.status(500).json({ error: "Failed to delete emergency contact" });
    }
  });

  // Helper function for distance calculation
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const httpServer = createServer(app);
  return httpServer;
}
