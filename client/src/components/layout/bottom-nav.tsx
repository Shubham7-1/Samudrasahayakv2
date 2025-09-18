import { Button } from '@/components/ui/button';
import { TRANSLATIONS } from '@/lib/constants';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  language?: string;
}

export function BottomNav({ currentPage, onNavigate, language = 'en' }: BottomNavProps) {
  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
  
  const navItems = [
    { id: 'home', icon: 'fa-home', label: t.home },
    { id: 'map', icon: 'fa-map', label: t.map },
    { id: 'weather', icon: 'fa-cloud-sun', label: t.weather },
    { id: 'catch', icon: 'fa-fish', label: t.catch },
    { id: 'profile', icon: 'fa-user', label: t.profile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white border-t border-blue-700 shadow-lg z-30 safe-area-inset-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`relative flex flex-col items-center justify-center h-full rounded-none transition-all duration-200 ${
              currentPage === item.id 
                ? 'text-yellow-300 bg-blue-700 scale-105'   // Highlighted tab
                : 'text-white hover:text-yellow-200 hover:bg-blue-500'
            }`}
            onClick={() => onNavigate(item.id)}
            data-testid={`button-nav-${item.id}`}
          >
            {currentPage === item.id && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-yellow-300 rounded-full" />
            )}
            <i className={`fas ${item.icon} ${currentPage === item.id ? 'text-xl' : 'text-lg'} mb-1 transition-all duration-200`} />
            <span className={`text-xs font-medium`}>
              {item.label}
            </span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
