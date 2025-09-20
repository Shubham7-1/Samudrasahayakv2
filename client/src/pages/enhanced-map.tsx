"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useMap,
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  Tooltip,
  GeoJSON,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface BorderZone {
  id: string;
  name: string;
  distance: number;
  alertLevel: "safe" | "warning" | "danger";
  color: string;
}

// --- constants ---
const PORT_LOCATIONS = [
  { id: "mumbai", name: "Mumbai Port", latitude: 18.94, longitude: 72.84 },
  {
    id: "sassoon",
    name: "Sassoon Docks (Fishing Hub, Mumbai)",
    latitude: 18.92,
    longitude: 72.83,
  },
  {
    id: "jnpt",
    name: "Jawaharlal Nehru Port (Cargo, Navi Mumbai)",
    latitude: 18.95,
    longitude: 72.95,
  },
  { id: "mandwa", name: "Mandwa Port", latitude: 18.8, longitude: 72.92 },
  { id: "rewas", name: "Rewas Port", latitude: 18.77, longitude: 72.93 },
  { id: "dharamtar", name: "Dharamtar Port", latitude: 18.73, longitude: 72.92 },
  { id: "mora", name: "Mora Jetty", latitude: 18.98, longitude: 72.95 },
  {
    id: "visakhapatnam",
    name: "Visakhapatnam Fishing Harbour",
    latitude: 17.7,
    longitude: 83.29,
  },
  {
    id: "munambam",
    name: "Munambam Fishing Harbour (Kerala)",
    latitude: 10.18,
    longitude: 76.15,
  },
  {
    id: "neendakara",
    name: "Neendakara Fishing Harbour (Kerala)",
    latitude: 8.93,
    longitude: 76.55,
  },
  {
    id: "petuaghat",
    name: "Petuaghat Fishing Harbour (West Bengal)",
    latitude: 21.81,
    longitude: 87.65,
  },
  { id: "kandla", name: "Kandla Port", latitude: 23.03, longitude: 70.22 },
  { id: "tuticorin", name: "Tuticorin Port", latitude: 8.76, longitude: 78.13 },
];

const DANGER_KM = 10;
const WARNING_KM = 20;
const PORT_NEAR_KM = 5;

const formatDistance = (km: number | null) =>
  km === null || km === undefined
    ? "N/A"
    : km < 1
    ? `${Math.round(km * 1000)} m`
    : `${km.toFixed(1)} km`;

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Smooth flyTo function
function FlyToLocation({
  lat,
  lon,
  radiusMeters,
}: {
  lat?: number;
  lon?: number;
  radiusMeters?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!lat || !lon) return;
    if (radiusMeters && radiusMeters > 0) {
      const deltaDeg = radiusMeters / 111000;
      const bounds = L.latLngBounds([
        [lat - deltaDeg, lon - deltaDeg],
        [lat + deltaDeg, lon + deltaDeg],
      ]);
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    } else {
      map.flyTo([lat, lon], 12, { duration: 1.2 });
    }
  }, [lat, lon, radiusMeters, map]);
  return null;
}

interface EnhancedMapProps {
  selectedZone?: any; // PFZ zone passed from outside
  onClearZone?: () => void;
}

export function EnhancedMap({
  selectedZone: selectedFishingZone,
  onClearZone,
}: EnhancedMapProps = {}) {
  const { latitude, longitude, error } = useGeolocation();
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [borderAlert, setBorderAlert] = useState<BorderZone | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedPort, setSearchedPort] = useState<any>(null);
  const [eezData, setEezData] = useState<any>(null);

  const { data: fishingZones } = useQuery<any[]>({
    queryKey: ["/api/fishing-zones"],
  });

  // Load EEZ
  useEffect(() => {
    fetch("/india_eez.geojson")
      .then((res) => res.json())
      .then((data) => setEezData(data))
      .catch((err) => console.error("Failed to load EEZ:", err));
  }, []);

  // Distance + Alerts + nearest port
  useEffect(() => {
    if (!latitude || !longitude || !eezData) return;

    // find nearest boundary point from EEZ polygon
    let nearestDist = Infinity;
    const coords = eezData?.features?.[0]?.geometry?.coordinates?.flat(2) || [];
    for (let i = 0; i < coords.length; i += 2) {
      const lonB = coords[i];
      const latB = coords[i + 1];
      const d = calculateDistance(latitude, longitude, latB, lonB);
      if (d < nearestDist) nearestDist = d;
    }

    let alertLevel: "safe" | "warning" | "danger" = "safe";
    let alertColor = "#22c55e";
    if (nearestDist <= DANGER_KM) {
      alertLevel = "danger";
      alertColor = "#ef4444";
    } else if (nearestDist <= WARNING_KM) {
      alertLevel = "warning";
      alertColor = "#f97316";
    }

    setBorderAlert({
      id: "border-alert",
      name: "Maritime Boundary",
      distance: nearestDist,
      alertLevel,
      color: alertColor,
    });

    // nearest port
    let nearestPort: any = null;
    let nearestPortDist = Infinity;
    for (const p of PORT_LOCATIONS) {
      const d = calculateDistance(latitude, longitude, p.latitude, p.longitude);
      if (d < nearestPortDist) {
        nearestPortDist = d;
        nearestPort = p;
      }
    }

    if (nearestPort && nearestPortDist <= PORT_NEAR_KM) {
      setSelectedZone({ ...nearestPort, type: "port", distance: nearestPortDist });
    } else {
      if (!searchedPort) setSelectedZone(null);
    }
  }, [latitude, longitude, searchedPort, eezData]);

  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;
    const found = PORT_LOCATIONS.find((p) =>
      p.name.toLowerCase().includes(term)
    );
    if (found) {
      setSearchedPort(found);
      const dist =
        latitude && longitude
          ? calculateDistance(latitude, longitude, found.latitude, found.longitude)
          : null;
      setSelectedZone({ ...found, type: "port", distance: dist });
    } else {
      alert("Port not found.");
    }
  };

  const distanceToSelectedPort = useMemo(() => {
    if (
      !selectedZone ||
      selectedZone.type !== "port" ||
      !latitude ||
      !longitude
    )
      return null;
    return calculateDistance(
      latitude,
      longitude,
      selectedZone.latitude,
      selectedZone.longitude
    );
  }, [selectedZone, latitude, longitude]);

  const getAlertMessage = (alert: BorderZone) => {
    switch (alert.alertLevel) {
      case "danger":
        return `🚨 DANGER: You are ${alert.distance.toFixed(
          1
        )} km from maritime boundary!`;
      case "warning":
        return `⚠️ WARNING: Approaching boundary - ${alert.distance.toFixed(
          1
        )} km remaining`;
      default:
        return `✅ SAFE: ${alert.distance.toFixed(1)} km from boundary`;
    }
  };

  return (
    <div className="p-4 pb-20 space-y-4 overflow-auto ios-scroll min-h-screen">
      {/* Border Alert */}
      {borderAlert && (
        <Alert
          className={`border-2 ${
            borderAlert.alertLevel === "danger"
              ? "border-red-500 bg-red-50 dark:bg-red-950"
              : borderAlert.alertLevel === "warning"
              ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
              : "border-green-500 bg-green-50 dark:bg-green-950"
          }`}
        >
          <AlertDescription className="font-semibold">
            {getAlertMessage(borderAlert)}
          </AlertDescription>
        </Alert>
      )}

      {/* Port Alert */}
      {selectedZone && selectedZone.type === "port" && (
        <Alert className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
          <AlertDescription className="font-semibold">
            ⚓ {searchedPort ? "Searched Port:" : "Nearby Port:"}{" "}
            <strong>{selectedZone.name}</strong>
            {distanceToSelectedPort !== null && (
              <> — {formatDistance(distanceToSelectedPort)}</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex space-x-2">
        <Input
          placeholder="Search port"
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          list="ports-datalist"
        />
        <datalist id="ports-datalist">
          {PORT_LOCATIONS.map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
        <Button onClick={handleSearch}>Search</Button>
        <Button
          variant="ghost"
          onClick={() => {
            setSearchTerm("");
            setSearchedPort(null);
            if (!(latitude && longitude)) setSelectedZone(null);
          }}
        >
          Clear
        </Button>
      </div>

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
            zoom={6}
            className="h-80 md:h-96 rounded-lg z-0"
            scrollWheelZoom
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Live position */}
            {latitude && longitude && (
              <>
                <Marker position={[latitude, longitude]}>
                  <Popup>You are here</Popup>
                </Marker>
                <FlyToLocation lat={latitude} lon={longitude} radiusMeters={20000} />
              </>
            )}

            {/* EEZ Boundary */}
            {eezData && (
              <GeoJSON
                data={eezData}
                style={() => ({
                  color: "#0000ff",
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.1,
                  fillColor: "#1e40af",
                })}
              />
            )}

            {/* Searched Port */}
            {searchedPort && (
              <>
                <FlyToLocation
                  lat={searchedPort.latitude}
                  lon={searchedPort.longitude}
                  radiusMeters={8000}
                />
                <Marker
                  position={[searchedPort.latitude, searchedPort.longitude]}
                >
                  <Popup>
                    <strong>{searchedPort.name}</strong>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Port markers */}
            {PORT_LOCATIONS.map((port) => (
              <Marker key={port.id} position={[port.latitude, port.longitude]}>
                <Tooltip>{port.name}</Tooltip>
              </Marker>
            ))}

            {/* Fishing Zones */}
            {fishingZones &&
              Array.isArray(fishingZones) &&
              fishingZones.map((zone: any) => (
                <Marker
                  key={zone.id}
                  position={[zone.latitude, zone.longitude]}
                  eventHandlers={{ click: () => setSelectedZone(zone) }}
                >
                  <Popup>
                    <strong>{zone.name}</strong>
                    <br />
                    Safety: {zone.safetyRating}/10
                  </Popup>
                </Marker>
              ))}

            {/* Selected PFZ */}
            {selectedFishingZone && (
              <Marker
                position={[
                  selectedFishingZone.coordinates.lat,
                  selectedFishingZone.coordinates.lon,
                ]}
                eventHandlers={{ click: () => setSelectedZone(selectedFishingZone) }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{selectedFishingZone.name}</strong>
                    <br />
                    <span className="text-blue-600">
                      🐟 PFZ: {selectedFishingZone.suitabilityScore}%
                    </span>
                    <br />
                    <span className="text-green-600">
                      🌡️ {selectedFishingZone.temperature?.toFixed(1) || "—"}°C
                    </span>
                    <br />
                    <span className="text-orange-600">
                      🎯 {selectedFishingZone.conditions}
                    </span>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Safety Rating</p>
                  <p className="font-semibold">{selectedZone.safetyRating}/10</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fish Types</p>
                  <p className="font-semibold">
                    {selectedZone.fishTypes?.length || 0} available
                  </p>
                </div>
              </div>
            ) : selectedZone.type === "port" ? (
              <div>
                <p className="text-sm text-muted-foreground">Port Location</p>
                <p className="font-semibold">{selectedZone.name}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Suitability Score
                    </p>
                    <p className="font-semibold text-blue-600">
                      {selectedZone.suitabilityScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="font-semibold text-green-600">
                      {selectedZone.temperature?.toFixed(1) || "—"}°C
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fish Species</p>
                  <p className="font-semibold">
                    {selectedZone.fishSpecies?.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Best Fishing Times
                  </p>
                  <p className="font-semibold">
                    {selectedZone.bestFishingTimes?.[0]}
                  </p>
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedZone(null);
                    onClearZone();
                  }}
                >
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
