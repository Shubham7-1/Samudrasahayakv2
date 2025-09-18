import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { EMERGENCY_CONTACTS } from '@/lib/constants';

interface EmergencyPanelProps {
  currentLocation?: { latitude: number; longitude: number };
  distanceFromBorder?: number;
}

export function EmergencyPanel({ currentLocation, distanceFromBorder = 15 }: EmergencyPanelProps) {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyTimer, setEmergencyTimer] = useState(0);
  const [sosCount, setSosCount] = useState(0);
  const { toast } = useToast();

  const handleSOS = () => {
    setIsEmergencyActive(true);
    setSosCount(prev => prev + 1);
    setEmergencyTimer(30);
    
    // Start countdown timer
    const interval = setInterval(() => {
      setEmergencyTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsEmergencyActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const emergencyMessage = `🆘 EMERGENCY SOS #${sosCount + 1} 🆘\n` +
      `Fisherman in distress!\n` +
      `Location: ${currentLocation ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` : 'Unknown'}\n` +
      `Distance from border: ${distanceFromBorder.toFixed(1)}km\n` +
      `Time: ${new Date().toLocaleString()}\n` +
      `Please send immediate assistance!`;

    // Share location via Web Share API if available
    if (navigator.share && currentLocation) {
      navigator.share({
        title: '🆘 EMERGENCY - Fisherman in Distress',
        text: emergencyMessage,
        url: `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
      }).then(() => {
        toast({
          title: "🆘 Emergency SOS Sent",
          description: "Your distress signal has been broadcast with location data.",
          variant: "destructive"
        });
      }).catch((error) => {
        console.error('Error sharing location:', error);
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(emergencyMessage);
        toast({
          title: "🆘 Emergency SOS Activated",
          description: "Emergency details copied to clipboard. Contact Coast Guard 1554 immediately!",
          variant: "destructive"
        });
      });
    } else {
      navigator.clipboard.writeText(emergencyMessage);
      toast({
        title: "🆘 Emergency SOS Activated",
        description: "Emergency mode activated. Contact Coast Guard 1554 immediately!",
        variant: "destructive"
      });
    }

    // Auto-alert for danger zones
    if (distanceFromBorder <= 5) {
      setTimeout(() => {
        toast({
          title: "⚠️ BORDER ALERT",
          description: `DANGER: You are only ${distanceFromBorder.toFixed(1)}km from international waters!`,
          variant: "destructive"
        });
      }, 2000);
    }
  };

  const handleShareLocation = () => {
    if (!currentLocation) {
      toast({
        title: "Location Unavailable",
        description: "Unable to get current location. Please enable GPS.",
        variant: "destructive"
      });
      return;
    }

    const locationText = `My current fishing location: ${currentLocation.latitude}, ${currentLocation.longitude}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Fishing Location',
        text: locationText,
        url: `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
      });
    } else {
      navigator.clipboard.writeText(locationText);
      toast({
        title: "Location Copied",
        description: "Your location has been copied to clipboard.",
      });
    }
  };

  const getBorderAlertStatus = () => {
    if (distanceFromBorder > 20) return { 
      color: 'text-green-600', 
      text: 'Safe Waters',
      bgColor: 'bg-green-100 dark:bg-green-900',
      icon: 'fa-check-circle'
    };
    if (distanceFromBorder > 10) return { 
      color: 'text-yellow-600', 
      text: 'Caution Zone',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      icon: 'fa-exclamation-circle'
    };
    if (distanceFromBorder > 5) return { 
      color: 'text-orange-600', 
      text: 'Warning Zone',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      icon: 'fa-exclamation-triangle'
    };
    return { 
      color: 'text-red-600', 
      text: 'DANGER - Near Border',
      bgColor: 'bg-red-100 dark:bg-red-900',
      icon: 'fa-skull-crossbones'
    };
  };

  const borderStatus = getBorderAlertStatus();

  return (
    <Card className={`mb-6 ${distanceFromBorder <= 10 ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-destructive text-destructive-foreground'}`} data-testid="card-emergency">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-life-ring mr-2" />
            Emergency & Safety
          </div>
          {isEmergencyActive && (
            <div className="flex items-center space-x-2 text-sm">
              <i className="fas fa-clock animate-spin" />
              <span>SOS Active: {emergencyTimer}s</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            onClick={handleSOS}
            className={`bg-white bg-opacity-20 backdrop-blur hover:bg-opacity-30 transition-all h-auto p-3 flex flex-col items-center ${
              isEmergencyActive ? 'animate-pulse' : ''
            }`}
            data-testid="button-sos"
          >
            <i className="fas fa-phone text-2xl mb-2" />
            <div className="text-sm font-medium">
              {isEmergencyActive ? 'SOS Active!' : 'SOS Call'}
            </div>
          </Button>
          
          <Button
            onClick={handleShareLocation}
            className="bg-white bg-opacity-20 backdrop-blur hover:bg-opacity-30 transition-all h-auto p-3 flex flex-col items-center"
            data-testid="button-share-location"
          >
            <i className="fas fa-map-marker-alt text-2xl mb-2" />
            <div className="text-sm font-medium">Share Location</div>
          </Button>
        </div>

        {/* Emergency Contacts */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Emergency Contacts:</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {EMERGENCY_CONTACTS.map((contact, index) => (
              <a
                key={index}
                href={`tel:${contact.number}`}
                className="bg-white bg-opacity-10 rounded px-2 py-1 text-center hover:bg-opacity-20 transition-all"
                data-testid={`link-emergency-${index}`}
              >
                {contact.name}: {contact.number}
              </a>
            ))}
          </div>
        </div>

        {/* Enhanced Border Alert */}
        <div className={`p-4 ${borderStatus.bgColor} rounded-lg border-2 ${distanceFromBorder <= 5 ? 'border-red-500 animate-pulse' : 'border-transparent'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <i className={`fas ${borderStatus.icon} text-lg ${borderStatus.color}`} />
              <div>
                <div className={`text-sm font-bold ${borderStatus.color}`}>
                  {borderStatus.text}
                </div>
                <div className={`text-xs ${borderStatus.color} opacity-80`}>
                  {distanceFromBorder.toFixed(1)}km from maritime boundary
                </div>
              </div>
            </div>
            {distanceFromBorder <= 5 && (
              <div className={`text-xs ${borderStatus.color} font-bold animate-bounce`}>
                ⚠️ IMMEDIATE ACTION REQUIRED
              </div>
            )}
          </div>
          
          {distanceFromBorder <= 10 && (
            <div className={`mt-3 p-2 bg-white bg-opacity-20 rounded text-xs ${borderStatus.color}`}>
              <strong>Safety Protocol:</strong> 
              {distanceFromBorder <= 5 
                ? ' TURN BACK IMMEDIATELY! You are approaching international waters.'
                : ' Exercise caution. Consider turning back to safer waters.'
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
