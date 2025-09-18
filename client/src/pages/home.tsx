import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WeatherCard } from '@/components/weather/weather-card';
import { FishingConditions } from '@/components/fishing/fishing-conditions';
import { RecentCatches } from '@/components/fishing/recent-catches';
import { EmergencyPanel } from '@/components/emergency/emergency-panel';
import { useCurrentWeather } from '@/hooks/use-weather';
import { useGeolocation } from '@/hooks/use-geolocation';
import { DEFAULT_LOCATION, TRANSLATIONS } from '@/lib/constants';
import { useState, useEffect } from 'react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const language = localStorage.getItem('language') || localStorage.getItem('selectedLanguage') || 'en';
  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
  
  // 1. Get raw, frequent location updates from the geolocation hook
  const { latitude, longitude, error: locationError } = useGeolocation();
  
  // 2. Create new state to hold the "stable" or debounced location
  const [debouncedLat, setDebouncedLat] = useState(latitude || DEFAULT_LOCATION.lat);
  const [debouncedLon, setDebouncedLon] = useState(longitude || DEFAULT_LOCATION.lon);

  const [distanceFromBorder, setDistanceFromBorder] = useState(15);
  const [showEmergencyButton, setShowEmergencyButton] = useState(false);

  // 3. This useEffect will watch for changes in the raw latitude/longitude
  useEffect(() => {
    // Set a timer for 5 seconds
    const handler = setTimeout(() => {
      if (latitude && longitude) {
        // After 5 seconds of no new updates, update our stable location state
        setDebouncedLat(latitude);
        setDebouncedLon(longitude);
      }
    }, 5000); // 5-second delay

    // If a new location update comes in, cancel the previous timer
    return () => {
      clearTimeout(handler);
    };
  }, [latitude, longitude]); // This effect runs whenever the raw location changes


  // 4. Use the STABLE debounced coordinates for the weather query
  const { 
    data: weatherData, 
    isLoading: weatherLoading, 
    error: weatherError 
  } = useCurrentWeather(debouncedLat, debouncedLon);

  // Maritime boundary (approximate center of Indian waters)
  const INDIAN_MARITIME_BOUNDARY = {
    latitude: 20.5937,
    longitude: 78.9629
  };

  // Calculate distance to maritime boundary
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Update border distance when location changes
  useEffect(() => {
    if (latitude && longitude) {
      const distance = calculateDistance(
        latitude,
        longitude,
        INDIAN_MARITIME_BOUNDARY.latitude,
        INDIAN_MARITIME_BOUNDARY.longitude
      );
      setDistanceFromBorder(distance);
      
      // Show floating emergency button if in danger zone (< 10km from border)
      setShowEmergencyButton(distance <= 10);
    }
  }, [latitude, longitude]);

  const quickActions = [
    {
      id: 'fishing-zones',
      title: 'Fishing Zones',
      description: 'Find hotspots',
      icon: 'fa-fish',
      color: 'bg-primary',
      page: 'map'
    },
    {
      id: 'weather-alerts',
      title: 'Weather Alerts',
      description: weatherData?.fishingConditions?.reasons?.length 
        ? `${weatherData.fishingConditions.reasons.length} warnings`
        : 'Check conditions',
      icon: 'fa-exclamation-triangle',
      color: weatherData?.fishingConditions?.rating === 'dangerous' ? 'bg-destructive' : 'bg-orange-500',
      page: 'weather'
    },
    {
      id: 'route-planning',
      title: 'Safe Routes',
      description: 'Plan journey',
      icon: 'fa-route',
      color: 'bg-secondary',
      page: 'map'
    },
    {
      id: 'catch-log',
      title: 'Catch Log',
      description: 'Record catch',
      icon: 'fa-clipboard-list',
      color: 'bg-accent text-accent-foreground',
      page: 'catch'
    }
  ];

  return (
    <div className="p-4 pb-20 space-y-6 overflow-auto ios-scroll">
      {/* Location Error Banner */}
      {locationError && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
              <i className="fas fa-exclamation-triangle" />
              <span className="text-sm">
                Location access denied. Using Chennai as default location.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather Summary */}
      <WeatherCard 
        weather={weatherData} 
        isLoading={weatherLoading} 
        error={weatherError?.message || null} 
      />

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action) => (
          <Card
            key={action.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate(action.page)}
            data-testid={`card-${action.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center`}>
                  <i className={`fas ${action.icon} text-white text-lg`} />
                </div>
                <div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fishing Conditions */}
      <FishingConditions 
        conditions={weatherData} 
        isLoading={weatherLoading} 
      />

      {/* Recent Catches */}
      <RecentCatches 
        onViewAll={() => onNavigate('catch')} 
      />

      {/* Emergency Panel */}
      <EmergencyPanel 
        currentLocation={latitude && longitude ? { latitude, longitude } : undefined}
        distanceFromBorder={distanceFromBorder}
      />

      {/* Floating Emergency Button - appears when near border */}
      {showEmergencyButton && (
        <div className="fixed bottom-24 right-4 z-50">
          <Button
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg animate-pulse"
            onClick={() => {
              // Scroll to emergency panel
              document.querySelector('[data-testid="card-emergency"]')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}
            data-testid="button-floating-emergency"
          >
            <i className="fas fa-exclamation-triangle text-2xl" />
          </Button>
        </div>
      )}
    </div>
  );
}