import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMap, MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface BorderZone {
  id: string;
  name: string;
  distance: number;
  alertLevel: 'safe' | 'warning' | 'danger';
  color: string;
}

const INDIAN_MARITIME_BOUNDARY = {
  latitude: 20.5937,
  longitude: 78.9629,
};

// Smooth flyTo + fit circles
function FlyToLocation({ lat, lon }: { lat?: number; lon?: number }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lon) {
      const radius = 20000; // largest circle radius in meters
      const deltaDeg = radius / 111000; // approximate conversion to degrees

      const bounds = L.latLngBounds([
        [lat - deltaDeg, lon - deltaDeg],
        [lat + deltaDeg, lon + deltaDeg],
      ]);

      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    }
  }, [lat, lon, map]);

  return null;
}

interface EnhancedMapProps {
  selectedZone?: any;
  onClearZone?: () => void;
}

export function EnhancedMap({ selectedZone: selectedFishingZone, onClearZone }: EnhancedMapProps = {}) {
  const { latitude, longitude, error } = useGeolocation();
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [borderAlert, setBorderAlert] = useState<BorderZone | null>(null);

  // Fishing zones query
  const { data: fishingZones } = useQuery<any[]>({
    queryKey: ['/api/fishing-zones'],
  });

  // Distance + Alert
  useEffect(() => {
    if (latitude && longitude) {
      const distanceToBorder = calculateDistance(
        latitude,
        longitude,
        INDIAN_MARITIME_BOUNDARY.latitude,
        INDIAN_MARITIME_BOUNDARY.longitude
      );

      let alertLevel: 'safe' | 'warning' | 'danger' = 'safe';
      let alertColor = '#22c55e';

      if (distanceToBorder <= 5) {
        alertLevel = 'danger';
        alertColor = '#ef4444';
      } else if (distanceToBorder <= 10) {
        alertLevel = 'warning';
        alertColor = '#f97316';
      } else {
        alertLevel = 'safe';
        alertColor = '#22c55e';
      }

      setBorderAlert({
        id: 'border-alert',
        name: 'Maritime Boundary',
        distance: distanceToBorder,
        alertLevel,
        color: alertColor
      });
    }
  }, [latitude, longitude]);

  // Auto-center map on selected PFZ
  useEffect(() => {
    if (selectedFishingZone && selectedFishingZone.coordinates) {
      setSelectedZone(selectedFishingZone);
    }
  }, [selectedFishingZone]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getAlertMessage = (alert: BorderZone) => {
    switch (alert.alertLevel) {
      case 'danger':
        return `🚨 DANGER: You are ${alert.distance.toFixed(1)}km from maritime boundary!`;
      case 'warning':
        return `⚠️ WARNING: Approaching boundary - ${alert.distance.toFixed(1)}km remaining`;
      default:
        return `✅ SAFE: ${alert.distance.toFixed(1)}km from boundary`;
    }
  };

  return (
    <div className="p-4 pb-20 space-y-4 overflow-auto ios-scroll min-h-screen">
      {/* Border Alert */}
      {borderAlert && (
        <Alert className={`border-2 ${
          borderAlert.alertLevel === 'danger'
            ? 'border-red-500 bg-red-50 dark:bg-red-950'
            : borderAlert.alertLevel === 'warning'
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
            : 'border-green-500 bg-green-50 dark:bg-green-950'
        }`}>
          <AlertDescription className="font-semibold">
            {getAlertMessage(borderAlert)}
          </AlertDescription>
        </Alert>
      )}

      {/* Live Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-map-marked-alt text-blue-600" />
            <span>Live Navigation Map</span>
            <Badge variant="secondary" className="ml-auto">
              <i className="fas fa-circle text-green-500 mr-1 animate-pulse" />
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8 text-red-500">
              <i className="fas fa-exclamation-triangle text-2xl mb-2" />
              <p>Location access required</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <MapContainer
            center={[latitude || 20.5937, longitude || 78.9629]}
            zoom={13}
            className="h-80 md:h-96 rounded-lg z-0"
            scrollWheelZoom
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {latitude && longitude && (
              <>
                <Marker position={[latitude, longitude]}>
                  <Popup>You are here</Popup>
                </Marker>

                {/* Smooth flyTo + fit circles */}
                <FlyToLocation lat={latitude} lon={longitude} />

                {/* Alert circles */}
                <Circle center={[latitude, longitude]} radius={20000} pathOptions={{ color: "green", fillOpacity: 0.05 }} />
                <Circle center={[latitude, longitude]} radius={10000} pathOptions={{ color: "orange", fillOpacity: 0.05 }} />
                <Circle center={[latitude, longitude]} radius={5000} pathOptions={{ color: "red", fillOpacity: 0.05 }} />
              </>
            )}

            {fishingZones && Array.isArray(fishingZones) &&
              fishingZones.map((zone: any, index: number) => (
                <Marker
        key={zone.id}
        position={[zone.latitude, zone.longitude]}
        eventHandlers={{ click: () => setSelectedZone(zone) }}
      >
        <Popup>
          <strong>{zone.name}</strong><br />
          Safety: {zone.safetyRating}/10
        </Popup>
      </Marker>

              ))
            }

            {/* Selected Fishing Zone from PFZ Feature */}
            {selectedFishingZone && (
              <Marker
                position={[selectedFishingZone.coordinates.lat, selectedFishingZone.coordinates.lon]}
                eventHandlers={{ click: () => setSelectedZone(selectedFishingZone) }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{selectedFishingZone.name}</strong><br />
                    <span className="text-blue-600">🐟 PFZ: {selectedFishingZone.suitabilityScore}%</span><br />
                    <span className="text-green-600">🌡️ {selectedFishingZone.temperature?.toFixed(1) || '—'}°C</span><br />
                    <span className="text-orange-600">🎯 {selectedFishingZone.conditions}</span>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </CardContent>
      </Card>

      {/* Zone Info */}
      {selectedZone && (
        <Card>
          <CardHeader>
            <CardTitle>Zone Details: {selectedZone.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedZone.safetyRating ? (
              // Regular fishing zone
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Safety Rating</p>
                  <p className="font-semibold">{selectedZone.safetyRating}/10</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fish Types</p>
                  <p className="font-semibold">{selectedZone.fishTypes?.length || 0} available</p>
                </div>
              </div>
            ) : (
              // PFZ zone
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Suitability Score</p>
                    <p className="font-semibold text-blue-600">{selectedZone.suitabilityScore}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="font-semibold text-green-600">{selectedZone.temperature?.toFixed(1) || '—'}°C</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fish Species</p>
                  <p className="font-semibold">{selectedZone.fishSpecies?.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Fishing Times</p>
                  <p className="font-semibold">{selectedZone.bestFishingTimes?.[0]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conditions</p>
                  <Badge className="mt-1">{selectedZone.conditions}</Badge>
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button className="flex-1" onClick={() => setSelectedZone(null)}>
                <i className="fas fa-route mr-2" />
                Navigate to Zone
              </Button>
              {selectedFishingZone && onClearZone && (
                <Button variant="outline" onClick={() => { setSelectedZone(null); onClearZone(); }}>
                  Clear PFZ
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Border Alert Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Border Alert System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm">Safe Zone (&gt;20km from border)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span className="text-sm">Warning Zone (10-20km from border)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm">Danger Zone (&lt;10km from border)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
