import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ChatbotSidebar } from "@/components/layout/chatbot-sidebar";
import { Button } from "@/components/ui/button";
import { PotentialFishingZones } from "@/components/fishing/potential-fishing-zones";
import { Home } from "@/pages/home";
import { Map } from "@/pages/map";
import { Weather } from "@/pages/weather";
import { CatchLog } from "@/pages/catch-log";
import { Profile } from "@/pages/profile";
import { Splash } from "@/pages/splash";
import { LanguageSelection } from "@/pages/language-selection";
import { MobileLogin } from "@/pages/mobile-login";
import { OTPVerification } from "@/pages/otp-verification";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useCurrentWeather } from "@/hooks/use-weather";
import { DEFAULT_LOCATION } from "@/lib/constants";
import NotFound from "@/pages/not-found";

function Router() {
  const [currentPage, setCurrentPage] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userId] = useState("user-" + Date.now()); // Simple user ID for demo
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [location, setLocation] = useLocation();

  const { latitude, longitude, requestPermission } = useGeolocation();
  const lat = latitude || DEFAULT_LOCATION.lat;
  const lon = longitude || DEFAULT_LOCATION.lon;
  
  const { data: weatherData } = useCurrentWeather(lat, lon);

  // Load preferences and check authentication
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedLanguage = localStorage.getItem('selectedLanguage') || localStorage.getItem('language') || 'en';
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    
    setIsDarkMode(savedDarkMode);
    setLanguage(savedLanguage);
    setIsAuthenticated(authStatus);
    
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Redirect to appropriate page based on auth status
    if (!authStatus && location !== '/' && !location.startsWith('/language') && !location.startsWith('/login') && !location.startsWith('/otp')) {
      setLocation('/');
    } else if (authStatus && (location === '/' || location.startsWith('/language') || location.startsWith('/login') || location.startsWith('/otp'))) {
      // Request location permission after authentication
      requestPermission();
      setLocation('/dashboard');
    }
  }, [location, setLocation, requestPermission]);

  const handleDarkModeToggle = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };


  const currentLocation = weatherData?.weather?.location || DEFAULT_LOCATION.name;

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'map':
        return <Map />;
      case 'weather':
        return <Weather />;
      case 'catch':
        return <CatchLog />;
      case 'profile':
        return <Profile 
          language={language}
          onLanguageChange={handleLanguageChange}
          isDarkMode={isDarkMode}
          onDarkModeToggle={handleDarkModeToggle}
        />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <Switch>
      {/* Authentication Routes */}
      <Route path="/" component={Splash} />
      <Route path="/language-selection" component={LanguageSelection} />
      <Route path="/login" component={MobileLogin} />
      <Route path="/otp-verification" component={OTPVerification} />
      
      {/* Main App Routes */}
      <Route path="/dashboard">
        {isAuthenticated ? (
          <div className="min-h-screen bg-background text-foreground">
            <Header 
              isDarkMode={isDarkMode}
              onDarkModeToggle={handleDarkModeToggle}
              language={language}
              onLanguageChange={handleLanguageChange}
            />
            
            <main className={`min-h-screen transition-all duration-300 page-container ${isChatOpen && window.innerWidth > 768 ? 'mr-80' : ''}`}>
              <div className="relative w-full overflow-x-hidden ios-scroll">
                {renderCurrentPage()}
              </div>
            </main>

            <BottomNav 
              currentPage={currentPage}
              onNavigate={handleNavigate}
              language={language}
            />

            {/* Potential Fishing Zones Feature */}
            <PotentialFishingZones />

            {/* Floating Chat Button */}
            <Button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-40"
              data-testid="button-chat-toggle"
            >
              <i className="fas fa-comments text-lg" />
            </Button>


            <ChatbotSidebar 
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              userId={userId}
              currentWeather={weatherData}
              currentLocation={currentLocation}
              language={language}
            />
          </div>
        ) : (
          <Splash />
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
