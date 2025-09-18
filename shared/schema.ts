import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  language: text("language").default("en"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weatherData = pgTable("weather_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  location: text("location").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  temperature: real("temperature").notNull(),
  humidity: integer("humidity").notNull(),
  windSpeed: real("wind_speed").notNull(),
  windDirection: integer("wind_direction").notNull(),
  pressure: real("pressure").notNull(),
  visibility: real("visibility").notNull(),
  conditions: text("conditions").notNull(),
  tideLevel: text("tide_level"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const fishingZones = pgTable("fishing_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  fishTypes: jsonb("fish_types").default([]),
  optimalConditions: jsonb("optimal_conditions").default({}),
  safetyRating: integer("safety_rating").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const catchLogs = pgTable("catch_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  fishType: text("fish_type").notNull(),
  quantity: real("quantity").notNull(),
  weight: real("weight").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  price: real("price"),
  notes: text("notes"),
  weatherConditions: jsonb("weather_conditions").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  language: true,
  preferences: true,
});

export const insertWeatherDataSchema = createInsertSchema(weatherData).omit({
  id: true,
  timestamp: true,
});

export const insertFishingZoneSchema = createInsertSchema(fishingZones).omit({
  id: true,
  createdAt: true,
});

export const insertCatchLogSchema = createInsertSchema(catchLogs).omit({
  id: true,
  timestamp: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type WeatherData = typeof weatherData.$inferSelect;
export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;
export type FishingZone = typeof fishingZones.$inferSelect;
export type InsertFishingZone = z.infer<typeof insertFishingZoneSchema>;
export type CatchLog = typeof catchLogs.$inferSelect;
export type InsertCatchLog = z.infer<typeof insertCatchLogSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
