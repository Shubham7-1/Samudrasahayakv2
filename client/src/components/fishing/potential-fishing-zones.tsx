import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/use-geolocation';
import { AlertCircle, Fish, MapPin, Thermometer, Clock, TrendingUp } from 'lucide-react';

interface FishingZone {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  temperature: number;
  suitabilityScore: number;
  fishSpecies: string[];
  bestFishingTimes: string[];
  conditions: string;
}

interface PFZProps {
  onZoneSelect?: (zone: FishingZone) => void;
}

export function PotentialFishingZones({ onZoneSelect }: PFZProps) {
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { latitude, longitude } = useGeolocation();
  
  // Use custom location if provided, otherwise use geolocation
  const queryLat = useCustomLocation && customLat ? parseFloat(customLat) : latitude;
  const queryLon = useCustomLocation && customLon ? parseFloat(customLon) : longitude;

  const { data: fishingZones, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/fishing-zones/potential', queryLat, queryLon],
    enabled: !!(queryLat && queryLon),
  });

  const handleLocationSubmit = () => {
    if (customLat && customLon) {
      setUseCustomLocation(true);
      refetch();
    }
  };

  const handleUseCurrentLocation = () => {
    setUseCustomLocation(false);
    setCustomLat('');
    setCustomLon('');
    refetch();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConditionIcon = (conditions: string) => {
    switch (conditions.toLowerCase()) {
      case 'excellent':
        return '🌟';
      case 'good':
        return '✅';
      case 'fair':
        return '⚠️';
      default:
        return '❌';
    }
  };

  if (!queryLat || !queryLon) {
    return (
      <Card className="fixed bottom-32 right-6 w-80 shadow-lg z-30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Fish className="w-4 h-4 text-blue-600" />
            <span>Potential Fishing Zones</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4 text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Location access required</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`fixed bottom-32 right-6 shadow-lg z-30 transition-all duration-300 ${
      isExpanded ? 'w-96 max-h-[600px]' : 'w-80 h-auto'
    }`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Fish className="w-4 h-4 text-blue-600" />
            <span>Potential Fishing Zones</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'up'} text-xs`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className={`pt-0 ${isExpanded ? 'max-h-[520px] overflow-y-auto' : ''}`}>
        {isExpanded && (
          <div className="space-y-4">
            {/* Location Input */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Location Input</div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Latitude"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="text-xs h-8"
                />
                <Input
                  placeholder="Longitude"
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleLocationSubmit}
                  disabled={!customLat || !customLon}
                  size="sm"
                  className="h-7 text-xs"
                >
                  Search Here
                </Button>
                <Button 
                  onClick={handleUseCurrentLocation}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  Use Current
                </Button>
              </div>
            </div>

            {/* Current Location Display */}
            <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
              📍 {queryLat.toFixed(4)}, {queryLon.toFixed(4)}
              {useCustomLocation && <span className="ml-1">(Custom)</span>}
            </div>
          </div>
        )}

        {/* Loading/Error States */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-xs text-muted-foreground">Analyzing fishing zones...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4 text-red-500">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs">Failed to load zones</p>
          </div>
        )}

        {/* Fishing Zones */}
        {fishingZones && Array.isArray(fishingZones) && fishingZones.length > 0 && (
          <div className="space-y-2">
            {isExpanded ? (
              (fishingZones as FishingZone[]).slice(0, 5).map((zone: FishingZone) => (
                <Card key={zone.id} className="border cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onZoneSelect?.(zone)}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{zone.name}</span>
                      <Badge className={`text-xs px-2 py-1 ${getScoreColor(zone.suitabilityScore)}`}>
                        {zone.suitabilityScore}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-3 h-3" />
                        <span>{zone.temperature.toFixed(1)}°C</span>
                        <span className="ml-auto">{getConditionIcon(zone.conditions)} {zone.conditions}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Fish className="w-3 h-3" />
                        <span className="truncate">{zone.fishSpecies.slice(0, 2).join(', ')}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span className="truncate">{zone.bestFishingTimes[0]}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Collapsed view - show top zone only
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Best Zone Found:</div>
                {(fishingZones as FishingZone[])[0] && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <div>
                      <div className="font-medium text-sm">{((fishingZones as FishingZone[])[0]).name}</div>
                      <div className="text-xs text-muted-foreground">
                        {((fishingZones as FishingZone[])[0]).temperature.toFixed(1)}°C • {((fishingZones as FishingZone[])[0]).conditions}
                      </div>
                    </div>
                    <Badge className={`text-xs ${getScoreColor(((fishingZones as FishingZone[])[0]).suitabilityScore)}`}>
                      {((fishingZones as FishingZone[])[0]).suitabilityScore}%
                    </Badge>
                  </div>
                )}
                <div className="text-xs text-center text-muted-foreground">
                  Click to expand and see more zones
                </div>
              </div>
            )}
          </div>
        )}

        {fishingZones && Array.isArray(fishingZones) && fishingZones.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Fish className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No suitable zones found in this area</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}