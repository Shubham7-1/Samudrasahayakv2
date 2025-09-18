import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentWeather, useWeatherForecast } from '@/hooks/use-weather';
import { useGeolocation } from '@/hooks/use-geolocation';
import { DEFAULT_LOCATION, WEATHER_CONDITIONS } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

export function Weather() {
  const { latitude, longitude } = useGeolocation();
  
  const lat = latitude || DEFAULT_LOCATION.lat;
  const lon = longitude || DEFAULT_LOCATION.lon;
  
  const { 
    data: currentWeather, 
    isLoading: currentLoading, 
    error: currentError 
  } = useCurrentWeather(lat, lon);
  
  const { 
    data: forecast, 
    isLoading: forecastLoading 
  } = useWeatherForecast(lat, lon);

  if (currentLoading) {
    return (
      <div className="p-4 pb-20 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentError) {
    return (
      <div className="p-4 pb-20">
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <i className="fas fa-exclamation-triangle" />
              <span>Unable to load weather data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weather = currentWeather?.weather;
  const fishingConditions = currentWeather?.fishingConditions;

  const conditionConfig = fishingConditions?.rating 
    ? WEATHER_CONDITIONS[fishingConditions.rating as keyof typeof WEATHER_CONDITIONS]
    : WEATHER_CONDITIONS.moderate;

  return (
    <div className="p-4 pb-20 space-y-6 overflow-auto ios-scroll">
      {/* Current Weather */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-cloud-sun mr-2 text-primary" />
            Current Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold flex items-center" data-testid="text-current-temp">
                  <i className="fas fa-thermometer-half text-orange-500 text-2xl mr-2" />
                  {Math.round(weather?.temperature || 0)}°C
                </div>
                <div className="text-muted-foreground capitalize" data-testid="text-current-conditions">
                  {weather?.conditions || 'Unknown'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <i className="fas fa-droplet text-blue-500 mr-2" />
                    <span>Humidity</span>
                  </div>
                  <span className="font-medium" data-testid="text-humidity">{weather?.humidity || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <i className="fas fa-gauge-high text-purple-500 mr-2" />
                    <span>Pressure</span>
                  </div>
                  <span className="font-medium" data-testid="text-pressure">{weather?.pressure || 0} hPa</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-lg font-semibold flex items-center">
                  <i className="fas fa-wind text-cyan-500 mr-2" />
                  Wind
                </div>
                <div className="font-medium" data-testid="text-wind-speed">
                  {Math.round(weather?.windSpeed || 0)} km/h
                </div>
                <div className="text-sm text-muted-foreground">
                  Direction: {weather?.windDirection || 0}°
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <i className="fas fa-eye text-green-500 mr-2" />
                    <span>Visibility</span>
                  </div>
                  <span className="font-medium" data-testid="text-current-visibility">{Math.round(weather?.visibility || 0)} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <i className="fas fa-water text-teal-500 mr-2" />
                    <span>Tide Level</span>
                  </div>
                  <span className="capitalize font-medium" data-testid="text-current-tide">{weather?.tideLevel || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fishing Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-fish mr-2 text-secondary" />
            Fishing Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Overall Rating</h3>
                <p className="text-sm text-muted-foreground">
                  Score: {fishingConditions?.score || 0}/100
                </p>
              </div>
              <Badge 
                className={`${conditionConfig.color} text-white`}
                data-testid="badge-fishing-rating"
              >
                <i className={`fas ${conditionConfig.icon} mr-2`} />
                {conditionConfig.text}
              </Badge>
            </div>

            {fishingConditions?.reasons && fishingConditions.reasons.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Current Factors:</h4>
                <ul className="space-y-1">
                  {fishingConditions.reasons.map((reason: string, index: number) => (
                    <li key={index} className="text-sm flex items-center" data-testid={`factor-${index}`}>
                      <i className="fas fa-circle text-xs mr-2 text-muted-foreground" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weather Alerts */}
            <div className="grid gap-3">
              {weather?.windSpeed > 25 && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-3">
                  <div className="flex items-center text-red-800 dark:text-red-200">
                    <i className="fas fa-exclamation-triangle mr-2" />
                    <span className="font-semibold">High Wind Warning</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Wind speed is {Math.round(weather.windSpeed)} km/h. Consider postponing fishing.
                  </p>
                </div>
              )}

              {weather?.visibility < 2 && (
                <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
                  <div className="flex items-center text-yellow-800 dark:text-yellow-200">
                    <i className="fas fa-eye-slash mr-2" />
                    <span className="font-semibold">Poor Visibility</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Visibility is only {Math.round(weather.visibility)} km. Exercise extreme caution.
                  </p>
                </div>
              )}

              {fishingConditions?.score > 80 && (
                <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-3">
                  <div className="flex items-center text-green-800 dark:text-green-200">
                    <i className="fas fa-check-circle mr-2" />
                    <span className="font-semibold">Excellent Conditions</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Perfect weather for fishing! Make the most of these conditions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 24-Hour Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-clock mr-2 text-accent" />
            24-Hour Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          {forecastLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Fishing Conditions Legend */}
              <div className="bg-muted/30 rounded-lg p-3 border border-muted">
                <h4 className="text-sm font-semibold mb-2 flex items-center">
                  <i className="fas fa-info-circle text-primary mr-2" />
                  Fishing Condition Indicators
                </h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center">
                    <i className="fas fa-circle text-green-500 mr-2" />
                    <span className="font-medium text-green-700 dark:text-green-400">Good:</span>
                    <span className="ml-1 text-muted-foreground">Optimal conditions for fishing</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-circle text-orange-500 mr-2" />
                    <span className="font-medium text-orange-700 dark:text-orange-400">Moderate:</span>
                    <span className="ml-1 text-muted-foreground">Acceptable conditions with caution</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-circle text-red-500 mr-2" />
                    <span className="font-medium text-red-700 dark:text-red-400">Poor:</span>
                    <span className="ml-1 text-muted-foreground">Not recommended for fishing</span>
                  </div>
                </div>
              </div>
              
              {/* Forecast Items */}
              <div className="space-y-3">
                {forecast?.slice(0, 8).map((item: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                    data-testid={`forecast-item-${index}`}
                  >
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium">
                      {new Date(item.dt * 1000).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {item.weather[0]?.description || 'Unknown'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>{Math.round(item.main.temp)}°C</span>
                    <span>{Math.round(item.wind.speed * 3.6)} km/h</span>
                    <i className={`fas fa-circle ${
                      item.main.temp > 30 || item.wind.speed > 7 ? 'text-orange-500' :
                      item.main.temp < 15 || item.wind.speed > 10 ? 'text-red-500' :
                      'text-green-500'
                    }`} />
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
