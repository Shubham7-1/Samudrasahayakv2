import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeaderProps {
  isDarkMode: boolean;
  onDarkModeToggle: () => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}

export function Header({ 
  isDarkMode, 
  onDarkModeToggle, 
  language, 
  onLanguageChange 
}: HeaderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 🔊 Play sound for 20s when site loads
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch(() => {
      console.warn("Autoplay blocked by browser — requires user interaction.");
    });

    const stopTimer = setTimeout(() => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }, 20000); // 20 sec

    return () => clearTimeout(stopTimer);
  }, []);

  // Play on hover
  const handleMouseEnter = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  // Stop on leave
  const handleMouseLeave = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <header 
      className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-lg relative overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="container mx-auto px-4 py-3 relative z-10">
        <div className="flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <i className="fas fa-anchor text-sm" />
            </div>
            <h1 className="text-lg font-bold">Samudra Sahayak</h1>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Online/Offline Status */}
            <div 
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}
              data-testid="status-connection"
            >
              <i className={`fas ${isOnline ? 'fa-wifi' : 'fa-wifi-slash'} text-xs`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            {/* Language Selector */}
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger 
                className="bg-secondary text-secondary-foreground w-20 h-8 text-sm border-0 focus:ring-2 focus:ring-primary"
                data-testid="select-language"
              >
                <SelectValue placeholder={`🌐 ${language?.toUpperCase()}`} />
              </SelectTrigger>
              <SelectContent className="min-w-[180px]">
                <SelectItem value="en"> English</SelectItem>
                <SelectItem value="hi"> हिंदी</SelectItem>
                <SelectItem value="mr"> मराठी</SelectItem>
                <SelectItem value="ta"> தமிழ்</SelectItem>
                <SelectItem value="gu"> ગુજરાતી</SelectItem>
                <SelectItem value="ml"> മലയാളം</SelectItem>
                <SelectItem value="te"> తెలుగు</SelectItem>
                <SelectItem value="kn"> ಕನ್ನಡ</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDarkModeToggle}
              className="w-10 h-8 rounded-full bg-secondary hover:bg-secondary/80"
              data-testid="button-darkmode"
            >
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-sm`} />
              <span className="sr-only">{isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Animated Wave GIF at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-16 z-0">
        <img 
          src="/assets/ocen.jpg" 
          alt="Wave animation" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef}>
        <source src="/assets/wave.mp3" type="audio/mpeg" />
      </audio>
    </header>
  );
}
