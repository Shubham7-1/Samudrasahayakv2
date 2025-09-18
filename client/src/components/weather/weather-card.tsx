import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface WeatherCardProps {
  weather: any;
  isLoading: boolean;
  error: string | null;
}

export function WeatherCard({ weather, isLoading, error }: WeatherCardProps) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6 border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-destructive">
            <i className="fas fa-exclamation-triangle" />
            <span>Unable to load weather data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white overflow-hidden">
      <CardContent className="p-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/80 to-purple-600/80 animate-pulse" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold" data-testid="text-location">
                {weather.weather?.location || 'Current Location'}
              </h2>
              <p className="opacity-90 text-sm">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold" data-testid="text-temperature">
                {Math.round(weather.weather?.temperature || 0)}°C
              </div>
              <div className="text-sm opacity-90 capitalize" data-testid="text-conditions">
                {weather.weather?.conditions || 'Unknown'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-semibold">Wind</div>
              <div className="text-sm" data-testid="text-wind">
                {Math.round(weather.weather?.windSpeed || 0)} km/h
              </div>
            </div>
            <div>
              <div className="font-semibold">Tide</div>
              <div className="text-sm capitalize" data-testid="text-tide">
                {weather.weather?.tideLevel || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="font-semibold">Visibility</div>
              <div className="text-sm" data-testid="text-visibility">
                {Math.round(weather.weather?.visibility || 0)} km
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
