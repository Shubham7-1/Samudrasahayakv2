import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function Splash() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation('/language-selection');
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center">
      <div className="text-center text-white">
        {/* App Logo */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <i className="fas fa-anchor text-blue-600 text-3xl" />
        </div>
        
        {/* App Name */}
        <h1 className="text-4xl font-bold mb-2">Samudra Sahayak</h1>
        <p className="text-xl opacity-90 mb-8">Your Fishing Companion</p>
        
        {/* Loading Animation */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
        </div>
        
        {/* Tagline */}
        <p className="text-sm opacity-75 mt-8">Powered by AI • Weather Alerts • GPS Navigation</p>
      </div>
    </div>
  );
}