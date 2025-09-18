import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { LANGUAGES, EMERGENCY_CONTACTS, TRANSLATIONS } from '@/lib/constants';

interface ProfileProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  isDarkMode: boolean;
  onDarkModeToggle: () => void;
}

export function Profile({ language, onLanguageChange, isDarkMode, onDarkModeToggle }: ProfileProps) {
  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
  const [profileData, setProfileData] = useState({
    name: localStorage.getItem('userName') || '',
    phone: localStorage.getItem('userPhone') || '',
    boat: localStorage.getItem('userBoat') || '',
    experience: localStorage.getItem('userExperience') || '',
  });
  
  const [profilePhoto, setProfilePhoto] = useState<string>(localStorage.getItem('profilePhoto') || '');
  
  const [notifications, setNotifications] = useState({
    weather: localStorage.getItem('notifications-weather') !== 'false',
    fishing: localStorage.getItem('notifications-fishing') !== 'false',
    emergency: localStorage.getItem('notifications-emergency') !== 'false',
  });

  const { toast } = useToast();

  const handleSaveProfile = () => {
    localStorage.setItem('userName', profileData.name);
    localStorage.setItem('userPhone', profileData.phone);
    localStorage.setItem('userBoat', profileData.boat);
    localStorage.setItem('userExperience', profileData.experience);
    if (profilePhoto) {
      localStorage.setItem('profilePhoto', profilePhoto);
    }
    
    toast({
      title: "Profile Saved",
      description: "Your profile information has been updated.",
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePhoto(result);
        localStorage.setItem('profilePhoto', result);
        toast({
          title: "Photo Updated",
          description: "Your profile photo has been updated successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfilePhoto('');
    localStorage.removeItem('profilePhoto');
    toast({
      title: "Photo Removed",
      description: "Your profile photo has been removed.",
    });
  };

  const handleNotificationChange = (type: keyof typeof notifications, value: boolean) => {
    const newNotifications = { ...notifications, [type]: value };
    setNotifications(newNotifications);
    localStorage.setItem(`notifications-${type}`, value.toString());
    
    toast({
      title: "Settings Updated",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${value ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all app data? This action cannot be undone.')) {
      localStorage.clear();
      toast({
        title: "Data Cleared",
        description: "All app data has been cleared.",
        variant: "destructive"
      });
      
      // Reset form
      setProfileData({
        name: '',
        phone: '',
        boat: '',
        experience: '',
      });
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userPhone');
      localStorage.removeItem('loginPhoneNumber');
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to login page  
      window.location.replace('/');
    }
  };

  const handleExportData = () => {
    const data = {
      profile: profileData,
      settings: {
        language,
        isDarkMode,
        notifications
      },
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `samudra-sahayak-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    toast({
      title: "Data Exported",
      description: "Your data has been downloaded as a JSON file.",
    });
  };

  return (
    <div className="p-4 pb-20 space-y-6 overflow-auto ios-scroll">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-user mr-2 text-primary" />
            {t.user_profile}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center mb-4">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-primary-foreground text-2xl" />
                  </div>
                )}
              </div>
              
              {/* Camera Button */}
              <button
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                title="Upload photo"
                data-testid="button-upload-photo"
              >
                <i className="fas fa-camera text-sm" />
              </button>
              
              {/* Remove Photo Button */}
              {profilePhoto && (
                <button
                  onClick={removePhoto}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                  title="Remove photo"
                  data-testid="button-remove-photo"
                >
                  <i className="fas fa-times text-xs" />
                </button>
              )}
              
              {/* Hidden File Input */}
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                data-testid="input-photo-upload"
              />
            </div>
            
            <h3 className="font-semibold text-lg">
              {profileData.name || 'Fisherman'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {profileData.experience ? `${profileData.experience} years experience` : 'Professional Fisherman'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">{t.full_name}</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                data-testid="input-name"
              />
            </div>

            <div>
              <Label htmlFor="phone">{t.phone_number}</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                data-testid="input-phone"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="boat">{t.boat_name}</Label>
                <Input
                  id="boat"
                  value={profileData.boat}
                  onChange={(e) => setProfileData(prev => ({ ...prev, boat: e.target.value }))}
                  placeholder="Boat identifier"
                  data-testid="input-boat"
                />
              </div>

              <div>
                <Label htmlFor="experience">{t.experience_years}</Label>
                <Input
                  id="experience"
                  type="number"
                  value={profileData.experience}
                  onChange={(e) => setProfileData(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="0"
                  data-testid="input-experience"
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} className="w-full" data-testid="button-save-profile">
              <i className="fas fa-save mr-2" />
              {t.save_profile}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-cog mr-2 text-secondary" />
            {t.app_settings}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t.language}</Label>
              <p className="text-sm text-muted-foreground">{t.app_display_language}</p>
            </div>
            <Select 
              value={language} 
              onValueChange={(newLanguage) => {
                onLanguageChange(newLanguage);
                toast({
                  title: "Language Updated",
                  description: `Language changed to ${LANGUAGES[newLanguage as keyof typeof LANGUAGES] || newLanguage}`,
                });
              }}
            >
              <SelectTrigger className="w-32" data-testid="select-profile-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>{t.dark_mode}</Label>
              <p className="text-sm text-muted-foreground">{t.use_dark_theme}</p>
            </div>
            <Switch
              checked={isDarkMode}
              onCheckedChange={onDarkModeToggle}
              data-testid="switch-dark-mode"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-bell mr-2 text-accent" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Weather Alerts</Label>
              <p className="text-sm text-muted-foreground">Receive weather warnings</p>
            </div>
            <Switch
              checked={notifications.weather}
              onCheckedChange={(value) => handleNotificationChange('weather', value)}
              data-testid="switch-weather-notifications"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Fishing Conditions</Label>
              <p className="text-sm text-muted-foreground">Daily fishing condition updates</p>
            </div>
            <Switch
              checked={notifications.fishing}
              onCheckedChange={(value) => handleNotificationChange('fishing', value)}
              data-testid="switch-fishing-notifications"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Emergency Alerts</Label>
              <p className="text-sm text-muted-foreground">Border and safety warnings</p>
            </div>
            <Switch
              checked={notifications.emergency}
              onCheckedChange={(value) => handleNotificationChange('emergency', value)}
              data-testid="switch-emergency-notifications"
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-phone mr-2 text-destructive" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {EMERGENCY_CONTACTS.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-muted-foreground">Emergency Service</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">{contact.number}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid={`button-call-${index}`}
                  >
                    <a href={`tel:${contact.number}`}>
                      <i className="fas fa-phone text-sm" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-database mr-2 text-orange-500" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleExportData}
            variant="outline"
            className="w-full"
            data-testid="button-export-data"
          >
            <i className="fas fa-download mr-2" />
            Export My Data
          </Button>

          <Button
            onClick={handleClearData}
            variant="destructive"
            className="w-full"
            data-testid="button-clear-data"
          >
            <i className="fas fa-trash mr-2" />
            Clear All Data
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            data-testid="button-logout"
          >
            <i className="fas fa-sign-out-alt mr-2" />
            Logout
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            <p>Export includes profile, catch logs, and settings.</p>
            <p>Clear data will remove all local information permanently.</p>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-info-circle mr-2 text-muted-foreground" />
            App Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Build</span>
              <span>2025.01.28</span>
            </div>
            <div className="flex justify-between">
              <span>Developer</span>
              <span>Samudra Tech</span>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-center text-xs text-muted-foreground">
            <p>Samudra Sahayak - Smart Fishing Assistant</p>
            <p>Helping coastal fishermen fish smarter and safer</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
