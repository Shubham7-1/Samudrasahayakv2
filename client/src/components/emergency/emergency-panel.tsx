import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { EMERGENCY_CONTACTS } from '@/lib/constants';
import { apiRequest } from '@/lib/queryClient';

interface EmergencyPanelProps {
  currentLocation?: { latitude: number; longitude: number };
  distanceFromBorder?: number;
  userId?: string;
}

export function EmergencyPanel({ currentLocation, distanceFromBorder = 15, userId = 'demo-user' }: EmergencyPanelProps) {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyTimer, setEmergencyTimer] = useState(0);
  const [sosCount, setSosCount] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [nearbyPeers, setNearbyPeers] = useState<number>(0);
  const [escalationTimer, setEscalationTimer] = useState<number>(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { toast } = useToast();

  // Smart SOS System Functions
  useEffect(() => {
    // Update user location periodically
    const updateLocation = async () => {
      if (currentLocation && !isOfflineMode) {
        try {
          const response = await fetch('/api/location/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              isOnline: 1
            })
          });
          if (!response.ok) throw new Error('Failed to update location');
        } catch (error) {
          console.log('Could not update location - possibly offline');
          setIsOfflineMode(true);
        }
      }
    };

    // Check SOS status on load
    const checkSOSStatus = async () => {
      if (!isOfflineMode) {
        try {
          const response = await fetch(`/api/sos/status/${userId}`);
          const data = await response.json();
          if (data.hasActiveAlert) {
            setActiveAlert(data.alert);
            setIsEmergencyActive(true);
            // Calculate remaining escalation time
            const created = new Date(data.alert.createdAt).getTime();
            const now = new Date().getTime();
            const elapsed = Math.floor((now - created) / 1000);
            const remaining = Math.max(0, 90 - elapsed);
            setEscalationTimer(remaining);
          }
        } catch (error) {
          console.log('Could not check SOS status - possibly offline');
          setIsOfflineMode(true);
        }
      }
    };

    updateLocation();
    checkSOSStatus();

    // Set up periodic location updates
    const locationInterval = setInterval(updateLocation, 30000); // Every 30 seconds
    const statusInterval = setInterval(checkSOSStatus, 10000); // Every 10 seconds

    return () => {
      clearInterval(locationInterval);
      clearInterval(statusInterval);
    };
  }, [currentLocation, userId, isOfflineMode]);

  // Escalation timer effect
  useEffect(() => {
    if (escalationTimer > 0 && isEmergencyActive) {
      const interval = setInterval(() => {
        setEscalationTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [escalationTimer, isEmergencyActive]);

  const handleSOS = () => {
    if (isEmergencyActive && activeAlert) {
      // If there's already an active alert, show option to cancel
      setShowConfirmation(true);
      return;
    }
    // Show confirmation modal for new SOS
    setShowConfirmation(true);
  };

  const handleConfirmSOS = async () => {
    if (!currentLocation) {
      toast({
        title: "Location Required",
        description: "GPS location is required for SOS alerts. Please enable location services.",
        variant: "destructive"
      });
      setShowConfirmation(false);
      return;
    }

    try {
      setShowConfirmation(false);
      setSosCount(prev => prev + 1);

      if (isOfflineMode) {
        // Offline mode fallback
        handleOfflineSOS();
        return;
      }

      const response = await fetch('/api/sos/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          emergencyMessage: `🆘 SMART SOS ALERT #${sosCount + 1} 🆘\nFisherman in distress!\nLocation: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}\nDistance from border: ${distanceFromBorder.toFixed(1)}km\nTime: ${new Date().toLocaleString()}`,
          distanceFromBorder
        })
      });
      const data = await response.json();

      setActiveAlert({
        id: data.alertId,
        status: data.status,
        createdAt: new Date()
      });
      setIsEmergencyActive(true);
      setNearbyPeers(data.nearbyPeersNotified);
      setEscalationTimer(data.escalationIn);

      toast({
        title: "🚨 Smart SOS Activated",
        description: `Alert sent to ${data.nearbyPeersNotified} nearby fishermen. Authorities will be contacted in ${data.escalationIn} seconds if not canceled.`,
        variant: "destructive"
      });

    } catch (error) {
      console.error('SOS trigger error:', error);
      toast({
        title: "SOS Error",
        description: "Failed to send SOS alert. Switching to offline mode.",
        variant: "destructive"
      });
      setIsOfflineMode(true);
      handleOfflineSOS();
    }
  };

  const handleOfflineSOS = () => {
    setIsEmergencyActive(true);
    setEmergencyTimer(30);
    
    const emergencyMessage = `🆘 OFFLINE EMERGENCY SOS #${sosCount + 1} 🆘\n` +
      `Fisherman in distress!\n` +
      `Location: ${currentLocation ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` : 'Unknown'}\n` +
      `Distance from border: ${distanceFromBorder.toFixed(1)}km\n` +
      `Time: ${new Date().toLocaleString()}\n` +
      `OFFLINE MODE - Please manually contact authorities!`;

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

    // Try to share via native sharing or clipboard
    if (navigator.share && currentLocation) {
      navigator.share({
        title: '🆘 OFFLINE EMERGENCY - Fisherman in Distress',
        text: emergencyMessage,
        url: `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
      }).catch(() => {
        navigator.clipboard.writeText(emergencyMessage);
      });
    } else {
      navigator.clipboard.writeText(emergencyMessage);
    }

    toast({
      title: "🆘 Offline SOS Activated",
      description: "Emergency details saved to clipboard. Manually contact Coast Guard 1554!",
      variant: "destructive"
    });
  };

  const handleCancelSOS = async () => {
    try {
      setShowConfirmation(false);
      
      if (!isOfflineMode && activeAlert) {
        const response = await fetch('/api/sos/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            alertId: activeAlert.id
          })
        });
        if (!response.ok) throw new Error('Failed to cancel SOS');
      }

      setIsEmergencyActive(false);
      setActiveAlert(null);
      setEscalationTimer(0);
      setEmergencyTimer(0);
      setNearbyPeers(0);

      toast({
        title: "✅ SOS Canceled",
        description: "Emergency alert has been successfully canceled.",
      });

    } catch (error) {
      console.error('Cancel SOS error:', error);
      toast({
        title: "Cancel Error",
        description: "Failed to cancel SOS alert, but local alert is cleared.",
        variant: "destructive"
      });
      // Force local cancellation even if API fails
      setIsEmergencyActive(false);
      setActiveAlert(null);
      setEscalationTimer(0);
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
              <i className={`fas ${isOfflineMode ? 'fa-wifi-slash' : escalationTimer > 0 ? 'fa-broadcast-tower' : 'fa-clock'} ${escalationTimer > 0 ? 'animate-pulse' : 'animate-spin'}`} />
              <span>
                {isOfflineMode ? `Offline SOS: ${emergencyTimer}s` : 
                 escalationTimer > 0 ? `Smart SOS Active - Escalation: ${escalationTimer}s` : 
                 'Processing SOS...'}
              </span>
              {nearbyPeers > 0 && !isOfflineMode && (
                <span className="bg-blue-600 bg-opacity-50 px-2 py-1 rounded text-xs">
                  {nearbyPeers} peers notified
                </span>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            onClick={handleSOS}
            className={`bg-white bg-opacity-20 backdrop-blur hover:bg-opacity-30 transition-all h-auto p-3 flex flex-col items-center ${
              isEmergencyActive ? 'animate-pulse bg-red-600 bg-opacity-90' : ''
            }`}
            data-testid="button-sos"
          >
            <i className={`${isEmergencyActive ? 'fas fa-exclamation-triangle' : 'fas fa-phone'} text-2xl mb-2`} />
            <div className="text-sm font-medium">
              {isEmergencyActive ? (activeAlert ? 'Cancel SOS' : 'SOS Active!') : 'Smart SOS'}
            </div>
            {escalationTimer > 0 && (
              <div className="text-xs mt-1 bg-red-700 bg-opacity-50 px-2 py-1 rounded">
                Escalation: {escalationTimer}s
              </div>
            )}
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

        {/* Smart SOS Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <i className="fas fa-exclamation-triangle mr-2" />
                {isEmergencyActive && activeAlert ? 'Cancel SOS Alert?' : 'Confirm Emergency SOS'}
              </DialogTitle>
              <DialogDescription>
                {isEmergencyActive && activeAlert ? (
                  <div className="space-y-2">
                    <p>Do you want to cancel your active SOS alert?</p>
                    <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-sm">
                      <strong>Current Alert Status:</strong>
                      <br />• Status: {activeAlert.status}
                      <br />• Peers Notified: {nearbyPeers}
                      {escalationTimer > 0 && <><br />• Escalation in: {escalationTimer} seconds</>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-600 font-semibold">
                      🚨 This will trigger a REAL emergency alert that will:
                    </p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• Immediately notify nearby fishermen within 15km</li>
                      <li>• Escalate to Coast Guard authorities in 90 seconds</li>
                      <li>• Share your GPS location and emergency details</li>
                      <li>• Cannot be undone once escalated</li>
                    </ul>
                    <div className="bg-red-100 dark:bg-red-900 p-3 rounded mt-3">
                      <p className="text-sm font-semibold">
                        Only confirm if this is a REAL EMERGENCY requiring immediate assistance.
                      </p>
                    </div>
                    {isOfflineMode && (
                      <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded">
                        <p className="text-sm">
                          ⚠️ <strong>Offline Mode:</strong> SOS will use fallback methods (clipboard, sharing).
                          You'll need to manually contact authorities.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-2">
              {isEmergencyActive && activeAlert ? (
                <>
                  <Button 
                    onClick={handleCancelSOS} 
                    variant="destructive" 
                    className="w-full"
                    data-testid="button-confirm-cancel-sos"
                  >
                    <i className="fas fa-times mr-2" />
                    Yes, Cancel SOS Alert
                  </Button>
                  <Button 
                    onClick={() => setShowConfirmation(false)} 
                    variant="outline" 
                    className="w-full"
                    data-testid="button-keep-sos-active"
                  >
                    <i className="fas fa-shield-alt mr-2" />
                    Keep SOS Active
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleConfirmSOS} 
                    variant="destructive" 
                    className="w-full animate-pulse"
                    data-testid="button-confirm-sos"
                  >
                    <i className="fas fa-exclamation-triangle mr-2" />
                    🆘 CONFIRM EMERGENCY SOS
                  </Button>
                  <Button 
                    onClick={() => setShowConfirmation(false)} 
                    variant="outline" 
                    className="w-full"
                    data-testid="button-cancel-sos"
                  >
                    <i className="fas fa-times mr-2" />
                    Cancel - False Alarm
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
