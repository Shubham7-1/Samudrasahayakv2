import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useCurrentWeather(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ['/api/weather/current', lat, lon],
    queryFn: async () => {
      if (!lat || !lon) {
        throw new Error('Location coordinates are required');
      }
      
      const response = await apiRequest('GET', `/api/weather/current?lat=${lat}&lon=${lon}`);
      return response.json();
    },
    enabled: !!(lat && lon),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

export function useWeatherForecast(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ['/api/weather/forecast', lat, lon],
    queryFn: async () => {
      if (!lat || !lon) {
        throw new Error('Location coordinates are required');
      }
      
      const response = await apiRequest('GET', `/api/weather/forecast?lat=${lat}&lon=${lon}`);
      return response.json();
    },
    enabled: !!(lat && lon),
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
  });
}

export function useFishingAnalysis(lat?: number, lon?: number, location?: string) {
  return useQuery({
    queryKey: ['/api/fishing-analysis', lat, lon, location],
    queryFn: async () => {
      if (!lat || !lon) {
        throw new Error('Location coordinates are required');
      }
      
      const response = await apiRequest('POST', '/api/fishing-analysis', {
        lat,
        lon,
        location
      });
      return response.json();
    },
    enabled: !!(lat && lon),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });
}
