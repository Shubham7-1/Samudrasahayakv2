interface OpenWeatherMapResponse {
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  visibility: number;
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || 'f79e348ae2f4d7e4c15eaddeb534f33f';
  }

  async getCurrentWeather(lat: number, lon: number): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data: OpenWeatherMapResponse = await response.json();

      return this.formatWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  async getWeatherByLocation(location: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data: OpenWeatherMapResponse = await response.json();

      return this.formatWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data by location:', error);
      throw error;
    }
  }

  private formatWeatherData(data: OpenWeatherMapResponse): any {
    return {
      location: data.name,
      latitude: data.coord.lat,
      longitude: data.coord.lon,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
      windDirection: data.wind.deg,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // Convert m to km
      conditions: data.weather[0].description,
      tideLevel: this.estimateTideLevel(data.main.pressure) // Simple estimation
    };
  }

  async getWeatherForecast(lat: number, lon: number): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather forecast API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.list.slice(0, 24); // Next 24 hours
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw error;
    }
  }

  getFishingConditions(weather: any): {
    rating: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous';
    score: number;
    reasons: string[];
  } {
    let score = 100;
    const reasons: string[] = [];

    // Wind speed assessment
    if (weather.windSpeed > 25) {
      score -= 30;
      reasons.push('High wind speed');
    } else if (weather.windSpeed > 15) {
      score -= 15;
      reasons.push('Moderate wind');
    } else if (weather.windSpeed < 5) {
      score -= 10;
      reasons.push('Very low wind');
    }

    // Visibility assessment
    if (weather.visibility < 2) {
      score -= 25;
      reasons.push('Poor visibility');
    } else if (weather.visibility < 5) {
      score -= 10;
      reasons.push('Reduced visibility');
    }

    // Weather conditions assessment
    const condition = weather.conditions.toLowerCase();
    if (condition.includes('storm') || condition.includes('thunder')) {
      score -= 40;
      reasons.push('Stormy weather');
    } else if (condition.includes('rain')) {
      score -= 20;
      reasons.push('Rainy conditions');
    } else if (condition.includes('clear') || condition.includes('sunny')) {
      score += 10;
      reasons.push('Clear weather');
    }

    // Temperature assessment
    if (weather.temperature < 15 || weather.temperature > 35) {
      score -= 10;
      reasons.push('Extreme temperature');
    }

    // Determine rating
    let rating: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous';
    if (score >= 90) rating = 'excellent';
    else if (score >= 75) rating = 'good';
    else if (score >= 60) rating = 'moderate';
    else if (score >= 40) rating = 'poor';
    else rating = 'dangerous';

    return { rating, score: Math.max(0, score), reasons };
  }

  private estimateTideLevel(pressure: number): string {
    // Simple tide estimation based on atmospheric pressure
    if (pressure > 1020) return 'high';
    if (pressure < 1010) return 'low';
    return 'medium';
  }
}

export const weatherService = new WeatherService();
