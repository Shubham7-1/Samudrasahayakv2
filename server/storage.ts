import { 
  type User, 
  type InsertUser, 
  type WeatherData, 
  type InsertWeatherData,
  type FishingZone,
  type InsertFishingZone,
  type CatchLog,
  type InsertCatchLog,
  type ChatMessage,
  type InsertChatMessage,
  type UserLocation,
  type InsertUserLocation,
  type ActiveAlert,
  type InsertActiveAlert,
  type EmergencyContact,
  type InsertEmergencyContact
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Weather operations
  getWeatherData(location: string): Promise<WeatherData | undefined>;
  saveWeatherData(weather: InsertWeatherData): Promise<WeatherData>;
  getRecentWeatherData(limit?: number): Promise<WeatherData[]>;

  // Fishing zones
  getFishingZones(): Promise<FishingZone[]>;
  getFishingZoneById(id: string): Promise<FishingZone | undefined>;
  createFishingZone(zone: InsertFishingZone): Promise<FishingZone>;

  // Catch logs
  getCatchLogs(userId?: string): Promise<CatchLog[]>;
  getCatchLogById(id: string): Promise<CatchLog | undefined>;
  createCatchLog(log: InsertCatchLog): Promise<CatchLog>;
  deleteCatchLog(id: string): Promise<boolean>;

  // Chat messages
  getChatMessages(userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Smart SOS System operations
  // Location tracking
  updateUserLocation(location: InsertUserLocation): Promise<UserLocation>;
  getUserLocation(userId: string): Promise<UserLocation | undefined>;
  getNearbyUsers(latitude: number, longitude: number, radiusKm?: number): Promise<UserLocation[]>;
  
  // SOS Alerts
  createSOSAlert(alert: InsertActiveAlert): Promise<ActiveAlert>;
  getActiveAlert(userId: string): Promise<ActiveAlert | undefined>;
  getActiveAlertById(alertId: string): Promise<ActiveAlert | undefined>;
  updateAlertStatus(alertId: string, status: string, escalationTimestamp?: Date): Promise<ActiveAlert | undefined>;
  cancelAlert(alertId: string): Promise<boolean>;
  
  // Emergency Contacts
  getEmergencyContacts(userId: string): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  deleteEmergencyContact(contactId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private weatherData: Map<string, WeatherData>;
  private fishingZones: Map<string, FishingZone>;
  private catchLogs: Map<string, CatchLog>;
  private chatMessages: Map<string, ChatMessage>;
  private userLocations: Map<string, UserLocation>;
  private activeAlerts: Map<string, ActiveAlert>;
  private emergencyContacts: Map<string, EmergencyContact>;

  constructor() {
    this.users = new Map();
    this.weatherData = new Map();
    this.fishingZones = new Map();
    this.catchLogs = new Map();
    this.chatMessages = new Map();
    this.userLocations = new Map();
    this.activeAlerts = new Map();
    this.emergencyContacts = new Map();

    // Initialize with some default fishing zones
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    const defaultZones: InsertFishingZone[] = [
      {
        name: "Chennai Coast North",
        latitude: 13.0827,
        longitude: 80.2707,
        fishTypes: ["Mackerel", "Sardines", "Pomfret"],
        optimalConditions: { windSpeed: "5-15 km/h", tideLevel: "medium" },
        safetyRating: 8
      },
      {
        name: "Marina Beach Zone",
        latitude: 13.0524,
        longitude: 80.2824,
        fishTypes: ["Kingfish", "Tuna", "Barracuda"],
        optimalConditions: { windSpeed: "10-20 km/h", tideLevel: "high" },
        safetyRating: 9
      },
      {
        name: "Pulicat Lake",
        latitude: 13.4167,
        longitude: 80.3167,
        fishTypes: ["Crab", "Prawns", "Mullet"],
        optimalConditions: { windSpeed: "5-12 km/h", tideLevel: "low" },
        safetyRating: 7
      }
    ];

    // Sample catch log entries for demonstration
    const sampleCatchLogs: InsertCatchLog[] = [
      {
        fishType: "Mackerel",
        quantity: 15,
        weight: 3.2,
        location: "Chennai Coast North",
        latitude: 13.0827,
        longitude: 80.2707,
        price: 480,
        notes: "Good morning catch, favorable tide conditions",
        userId: "demo-user",
        weatherConditions: {
          temperature: 28,
          windSpeed: 12,
          conditions: "partly cloudy",
          tideLevel: "medium"
        }
      },
      {
        fishType: "Kingfish",
        quantity: 2,
        weight: 4.8,
        location: "Marina Beach Zone",
        latitude: 13.0524,
        longitude: 80.2824,
        price: 960,
        notes: "Caught during high tide, excellent quality fish",
        userId: "demo-user",
        weatherConditions: {
          temperature: 30,
          windSpeed: 18,
          conditions: "clear",
          tideLevel: "high"
        }
      },
      {
        fishType: "Pomfret",
        quantity: 8,
        weight: 2.1,
        location: "Chennai Coast North",
        latitude: 13.0827,
        longitude: 80.2707,
        price: 630,
        notes: "Evening catch, calm waters",
        userId: "demo-user",
        weatherConditions: {
          temperature: 26,
          windSpeed: 8,
          conditions: "clear",
          tideLevel: "low"
        }
      },
      {
        fishType: "Sardines",
        quantity: 25,
        weight: 1.5,
        location: "Pulicat Lake",
        latitude: 13.4167,
        longitude: 80.3167,
        price: 150,
        notes: "Large school spotted, quick catch session",
        userId: "demo-user",
        weatherConditions: {
          temperature: 27,
          windSpeed: 10,
          conditions: "partly cloudy",
          tideLevel: "medium"
        }
      }
    ];

    for (const zone of defaultZones) {
      await this.createFishingZone(zone);
    }

    // Add sample catch logs with different timestamps to show variety
    for (let i = 0; i < sampleCatchLogs.length; i++) {
      const log = sampleCatchLogs[i];
      // Create logs with timestamps from the past few days
      const daysAgo = i + 1;
      const sampleTimestamp = new Date();
      sampleTimestamp.setDate(sampleTimestamp.getDate() - daysAgo);
      sampleTimestamp.setHours(6 + (i * 3), 30, 0, 0); // Vary the times
      
      const catchLog: CatchLog = {
        ...log,
        id: randomUUID(),
        userId: log.userId || null,
        latitude: log.latitude || null,
        longitude: log.longitude || null,
        price: log.price || null,
        notes: log.notes || null,
        weatherConditions: log.weatherConditions || {},
        timestamp: sampleTimestamp
      };
      
      this.catchLogs.set(catchLog.id, catchLog);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      language: insertUser.language || "en",
      preferences: insertUser.preferences || {},
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getWeatherData(location: string): Promise<WeatherData | undefined> {
    return Array.from(this.weatherData.values()).find(
      (weather) => weather.location === location
    );
  }

  async saveWeatherData(insertWeather: InsertWeatherData): Promise<WeatherData> {
    const id = randomUUID();
    const weather: WeatherData = {
      ...insertWeather,
      id,
      tideLevel: insertWeather.tideLevel || null,
      timestamp: new Date()
    };
    this.weatherData.set(id, weather);
    return weather;
  }

  async getRecentWeatherData(limit = 10): Promise<WeatherData[]> {
    return Array.from(this.weatherData.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async getFishingZones(): Promise<FishingZone[]> {
    return Array.from(this.fishingZones.values());
  }

  async getFishingZoneById(id: string): Promise<FishingZone | undefined> {
    return this.fishingZones.get(id);
  }

  async createFishingZone(insertZone: InsertFishingZone): Promise<FishingZone> {
    const id = randomUUID();
    const zone: FishingZone = {
      ...insertZone,
      id,
      fishTypes: insertZone.fishTypes || [],
      optimalConditions: insertZone.optimalConditions || {},
      createdAt: new Date()
    };
    this.fishingZones.set(id, zone);
    return zone;
  }

  async getCatchLogs(userId?: string): Promise<CatchLog[]> {
    const logs = Array.from(this.catchLogs.values());
    if (userId) {
      return logs.filter(log => log.userId === userId);
    }
    return logs.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async getCatchLogById(id: string): Promise<CatchLog | undefined> {
    return this.catchLogs.get(id);
  }

  async createCatchLog(insertLog: InsertCatchLog): Promise<CatchLog> {
    const id = randomUUID();
    const log: CatchLog = {
      ...insertLog,
      id,
      userId: insertLog.userId || null,
      latitude: insertLog.latitude || null,
      longitude: insertLog.longitude || null,
      price: insertLog.price || null,
      notes: insertLog.notes || null,
      weatherConditions: insertLog.weatherConditions || {},
      timestamp: new Date()
    };
    this.catchLogs.set(id, log);
    return log;
  }

  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(msg => msg.userId === userId)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async deleteCatchLog(id: string): Promise<boolean> {
    const exists = this.catchLogs.has(id);
    if (exists) {
      this.catchLogs.delete(id);
      return true;
    }
    return false;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      userId: insertMessage.userId || null,
      timestamp: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }

  // Smart SOS System Methods

  async updateUserLocation(insertLocation: InsertUserLocation): Promise<UserLocation> {
    const existingLocation = Array.from(this.userLocations.values())
      .find(loc => loc.userId === insertLocation.userId);
    
    let location: UserLocation;
    if (existingLocation) {
      location = {
        ...existingLocation,
        latitude: insertLocation.latitude,
        longitude: insertLocation.longitude,
        isOnline: insertLocation.isOnline ?? 1,
        lastUpdated: new Date()
      };
      this.userLocations.set(existingLocation.id, location);
    } else {
      const id = randomUUID();
      location = {
        ...insertLocation,
        id,
        lastUpdated: new Date(),
        isOnline: insertLocation.isOnline ?? 1
      };
      this.userLocations.set(id, location);
    }
    return location;
  }

  async getUserLocation(userId: string): Promise<UserLocation | undefined> {
    return Array.from(this.userLocations.values())
      .find(location => location.userId === userId);
  }

  async getNearbyUsers(latitude: number, longitude: number, radiusKm = 15): Promise<UserLocation[]> {
    return Array.from(this.userLocations.values()).filter(location => {
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in kilometers
      const dLat = (location.latitude - latitude) * Math.PI / 180;
      const dLon = (location.longitude - longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(latitude * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance <= radiusKm && location.isOnline === 1;
    });
  }

  async createSOSAlert(insertAlert: InsertActiveAlert): Promise<ActiveAlert> {
    const id = randomUUID();
    const alert: ActiveAlert = {
      ...insertAlert,
      id,
      nearbyPeersNotified: insertAlert.nearbyPeersNotified || [],
      emergencyMessage: insertAlert.emergencyMessage || null,
      distanceFromBorder: insertAlert.distanceFromBorder || null,
      escalationTimestamp: insertAlert.escalationTimestamp || null,
      resolvedTimestamp: insertAlert.resolvedTimestamp || null,
      createdAt: new Date()
    };
    this.activeAlerts.set(id, alert);
    return alert;
  }

  async getActiveAlert(userId: string): Promise<ActiveAlert | undefined> {
    return Array.from(this.activeAlerts.values())
      .find(alert => alert.userId === userId && 
        ['pending', 'p2p-alerted', 'escalated'].includes(alert.status));
  }

  async getActiveAlertById(alertId: string): Promise<ActiveAlert | undefined> {
    return this.activeAlerts.get(alertId);
  }

  async updateAlertStatus(alertId: string, status: string, escalationTimestamp?: Date): Promise<ActiveAlert | undefined> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return undefined;

    const updatedAlert: ActiveAlert = {
      ...alert,
      status,
      escalationTimestamp: escalationTimestamp || alert.escalationTimestamp,
      resolvedTimestamp: status === 'resolved' || status === 'canceled' ? new Date() : alert.resolvedTimestamp
    };
    
    this.activeAlerts.set(alertId, updatedAlert);
    return updatedAlert;
  }

  async cancelAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    const updatedAlert: ActiveAlert = {
      ...alert,
      status: 'canceled',
      resolvedTimestamp: new Date()
    };
    
    this.activeAlerts.set(alertId, updatedAlert);
    return true;
  }

  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    return Array.from(this.emergencyContacts.values())
      .filter(contact => contact.userId === userId)
      .sort((a, b) => (a.priority || 1) - (b.priority || 1));
  }

  async createEmergencyContact(insertContact: InsertEmergencyContact): Promise<EmergencyContact> {
    const id = randomUUID();
    const contact: EmergencyContact = {
      ...insertContact,
      id,
      relationship: insertContact.relationship || null,
      priority: insertContact.priority || 1,
      createdAt: new Date()
    };
    this.emergencyContacts.set(id, contact);
    return contact;
  }

  async deleteEmergencyContact(contactId: string): Promise<boolean> {
    const exists = this.emergencyContacts.has(contactId);
    if (exists) {
      this.emergencyContacts.delete(contactId);
      return true;
    }
    return false;
  }
}

export const storage = new MemStorage();
