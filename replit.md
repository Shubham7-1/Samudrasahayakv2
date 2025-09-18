# Overview

Samudra Sahayak is a web-based fishing assistant application designed to help coastal fishermen in India make informed decisions about fishing activities. The application provides real-time weather data, fishing zone recommendations, catch logging capabilities, GPS navigation, and AI-powered assistance through a chatbot interface. Built as a Progressive Web App (PWA), it offers offline functionality and mobile-optimized user experience with support for multiple Indian languages.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Responsive layout optimized for mobile devices with bottom navigation

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints for weather, fishing zones, catch logs, and chat functionality
- **Development Setup**: Hot module replacement via Vite integration in development mode

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Includes tables for users, weather data, fishing zones, catch logs, and chat messages
- **In-Memory Fallback**: MemStorage class provides in-memory data storage for development/testing
- **Migrations**: Drizzle Kit for database schema migrations and management

## Authentication and Authorization
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple
- **User System**: Basic username/password authentication with user preferences storage
- **No Complex Auth**: Simple authentication suitable for the target demographic

## PWA Features
- **Offline Support**: Service worker implementation for offline functionality
- **Mobile Optimization**: Viewport meta tags and mobile-specific CSS
- **App-like Experience**: Manifest file for installable web app behavior

## Multi-language Support
- **Internationalization**: Support for multiple Indian languages (English, Hindi, Tamil, Telugu, Marathi)
- **Voice Features**: Speech synthesis and recognition for accessibility
- **Local Storage**: Language preferences persisted locally

## Real-time Features
- **Weather Updates**: Periodic weather data fetching with caching
- **Location Services**: Geolocation API integration for position-based services
- **AI Assistant**: Real-time chat interface with context-aware responses

# External Dependencies

## Weather Services
- **OpenWeatherMap API**: Primary weather data provider for current conditions and forecasts
- **API Integration**: RESTful weather service with automatic data transformation and caching

## AI Services
- **Google Gemini API**: AI-powered chatbot for fishing advice and assistance
- **Context-Aware Responses**: Integrates current weather and location data into AI responses
- **Multi-language Support**: AI responses adapted for different language preferences

## Database Provider
- **Neon Database**: PostgreSQL hosting service for production database
- **Connection Pooling**: @neondatabase/serverless for optimized database connections

## UI and Design
- **Radix UI**: Comprehensive component library for accessible UI primitives
- **Lucide Icons**: Icon library for consistent iconography
- **FontAwesome**: Additional icon support for specialized fishing and maritime icons
- **Google Fonts**: Inter font family for typography

## Development Tools
- **Replit Integration**: Cartographer plugin for Replit development environment
- **Error Handling**: Runtime error overlay for development debugging
- **TypeScript**: Full type safety across client and server code

## Geographic Services
- **Browser Geolocation API**: Built-in location services for position tracking
- **Google Maps Integration**: Potential integration for route planning and mapping features
- **Coordinate System**: Standard GPS coordinates for location-based features