interface OceanographicData {
  temperature: number;
  salinity?: number;
  timestamp: string;
  location: {
    lat: number;
    lon: number;
  };
}

interface FishingZoneData {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  temperature: number;
  suitabilityScore: number;
  fishSpecies: string[];
  bestFishingTimes: string[];
  conditions: string;
}

export class OceanographicService {
  private noaaBaseUrl = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
  
  // Get nearest NOAA stations for oceanographic data
  async getNearestStations(lat: number, lon: number): Promise<string[]> {
    // Major NOAA stations around Indian coastline
    const stations = [
      '9414290', // San Francisco (for demo - in real app, use Indian Ocean stations)
      '8518750', // The Battery, NY
      '8557380', // Lewes, DE
    ];
    
    // In a production app, you'd calculate distance to find nearest stations
    // For this demo, we'll use the first station
    return stations.slice(0, 1);
  }

  async getOceanographicData(lat: number, lon: number): Promise<OceanographicData[]> {
    try {
      const stations = await this.getNearestStations(lat, lon);
      const data: OceanographicData[] = [];

      for (const station of stations) {
        try {
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
          
          const params = new URLSearchParams({
            product: 'water_temperature',
            application: 'SamudraSahayak',
            begin_date: this.formatDate(startDate),
            end_date: this.formatDate(endDate),
            station: station,
            time_zone: 'gmt',
            units: 'metric',
            format: 'json'
          });

          const response = await fetch(`${this.noaaBaseUrl}?${params}`);
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.data && result.data.length > 0) {
              const latestReading = result.data[result.data.length - 1];
              data.push({
                temperature: parseFloat(latestReading.v),
                timestamp: latestReading.t,
                location: { lat, lon }
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch data from station ${station}:`, error);
        }
      }

      // If no real data available, provide simulated data based on location
      if (data.length === 0) {
        data.push(this.generateSimulatedData(lat, lon));
      }

      return data;
    } catch (error) {
      console.error('Error fetching oceanographic data:', error);
      // Return simulated data as fallback
      return [this.generateSimulatedData(lat, lon)];
    }
  }

  private generateSimulatedData(lat: number, lon: number): OceanographicData {
    // Generate realistic data based on location and season
    const baseTemp = this.calculateBaseTemperature(lat);
    const variation = (Math.random() - 0.5) * 4; // ±2°C variation
    
    return {
      temperature: baseTemp + variation,
      salinity: 35 + (Math.random() - 0.5) * 2, // Typical ocean salinity ±1 ppt
      timestamp: new Date().toISOString(),
      location: { lat, lon }
    };
  }

  private calculateBaseTemperature(lat: number): number {
    // Simplified temperature calculation based on latitude
    const absLat = Math.abs(lat);
    if (absLat < 10) return 28; // Tropical
    if (absLat < 23.5) return 26; // Subtropical
    if (absLat < 40) return 22; // Temperate
    if (absLat < 60) return 15; // Cold temperate
    return 8; // Polar
  }

  async calculatePotentialFishingZones(lat: number, lon: number, radius: number = 50): Promise<FishingZoneData[]> {
    try {
      const oceanData = await this.getOceanographicData(lat, lon);
      const zones: FishingZoneData[] = [];

      // Generate potential zones in a grid pattern around the user's location
      const gridSize = 5; // 5x5 grid
      const step = (radius * 2) / gridSize / 111; // Convert km to degrees (approx)

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const zoneLat = lat - radius / 111 + (i * step);
          const zoneLon = lon - radius / 111 + (j * step);
          
          // Skip if zone is on land (simplified check)
          if (this.isLikelyLand(zoneLat, zoneLon)) continue;

          const zoneData = await this.getOceanographicData(zoneLat, zoneLon);
          const zone = this.analyzeZoneData(zoneLat, zoneLon, zoneData, i * gridSize + j);
          
          if (zone.suitabilityScore > 40) { // Only include decent zones
            zones.push(zone);
          }
        }
      }

      // Sort by suitability score
      return zones.sort((a, b) => b.suitabilityScore - a.suitabilityScore).slice(0, 10);
    } catch (error) {
      console.error('Error calculating potential fishing zones:', error);
      return [];
    }
  }

  private isLikelyLand(lat: number, lon: number): boolean {
    // Simplified land detection - in production, use a proper coastline database
    // For Indian Ocean context, very basic check
    if (lat > 30 || lat < -40) return true; // Too far north/south
    if (lon < 40 || lon > 120) return true; // Outside Indian Ocean range
    return false;
  }

  private analyzeZoneData(lat: number, lon: number, data: OceanographicData[], zoneId: number): FishingZoneData {
    const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
    let suitabilityScore = 50; // Base score
    let conditions = 'Moderate';
    let fishSpecies: string[] = [];
    let bestTimes: string[] = [];

    // Temperature analysis for fish habitat
    if (avgTemp >= 24 && avgTemp <= 28) {
      suitabilityScore += 30;
      conditions = 'Excellent';
      fishSpecies = ['Tuna', 'Mackerel', 'Snapper', 'Grouper'];
      bestTimes = ['Early morning (5-8 AM)', 'Evening (5-7 PM)'];
    } else if (avgTemp >= 20 && avgTemp <= 32) {
      suitabilityScore += 20;
      conditions = 'Good';
      fishSpecies = ['Kingfish', 'Pomfret', 'Sardines'];
      bestTimes = ['Morning (6-9 AM)', 'Late afternoon (4-6 PM)'];
    } else if (avgTemp >= 18 && avgTemp <= 35) {
      suitabilityScore += 10;
      conditions = 'Fair';
      fishSpecies = ['Local coastal fish'];
      bestTimes = ['Dawn', 'Dusk'];
    } else {
      suitabilityScore -= 20;
      conditions = 'Poor';
      fishSpecies = ['Limited species'];
      bestTimes = ['Weather dependent'];
    }

    // Add some randomness for more realistic zones
    suitabilityScore += (Math.random() - 0.5) * 20;
    suitabilityScore = Math.max(0, Math.min(100, suitabilityScore));

    return {
      id: `pfz-${zoneId}`,
      name: `Zone ${String.fromCharCode(65 + zoneId)}`,
      coordinates: { lat, lon },
      temperature: avgTemp,
      suitabilityScore: Math.round(suitabilityScore),
      fishSpecies,
      bestFishingTimes: bestTimes,
      conditions
    };
  }

  private formatDate(date: Date): string {
    return date.getFullYear().toString() +
           (date.getMonth() + 1).toString().padStart(2, '0') +
           date.getDate().toString().padStart(2, '0');
  }
}