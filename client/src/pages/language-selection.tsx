import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TRANSLATIONS } from '@/lib/constants';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  color: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', color: '#0078D4' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', color: '#FF5722' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', color: '#FF9800' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', color: '#F44336' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', color: '#FFEB3B' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', color: '#4CAF50' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', color: '#2196F3' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', color: '#9C27B0' }
];

export function LanguageSelection() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [, setLocation] = useLocation();

  const handleContinue = () => {
    localStorage.setItem('selectedLanguage', selectedLanguage);
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center p-4">
      <Card className="w-full max-w-md mx-auto max-h-[90vh] flex flex-col">
        <CardHeader className="text-center flex-shrink-0">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-language text-white text-2xl" />
          </div>
          <CardTitle className="text-2xl">
            {selectedLanguage !== 'en' && TRANSLATIONS[selectedLanguage as keyof typeof TRANSLATIONS]?.choose_language || 'Choose Your Language'}
          </CardTitle>
          <p className="text-muted-foreground">
            {selectedLanguage !== 'en' && TRANSLATIONS[selectedLanguage as keyof typeof TRANSLATIONS]?.select_preferred || 'Select your preferred language'}
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {languages.map((language) => (
              <Button
                key={language.code}
                variant={selectedLanguage === language.code ? "default" : "outline"}
                className="w-full h-14 justify-start text-left flex-shrink-0"
                onClick={() => setSelectedLanguage(language.code)}
                data-testid={`button-language-${language.code}`}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-6 h-6 rounded-full shadow-sm border border-white/20" 
                    style={{ backgroundColor: language.color }}
                  />
                  <div>
                    <div className="font-medium">{language.name}</div>
                    <div className="text-sm opacity-75">{language.nativeName}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          <Button 
            onClick={handleContinue}
            className="w-full mt-6 flex-shrink-0"
            size="lg"
            data-testid="button-continue-language"
          >
            {selectedLanguage !== 'en' && TRANSLATIONS[selectedLanguage as keyof typeof TRANSLATIONS]?.continue || 'Continue'}
            <i className="fas fa-arrow-right ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}