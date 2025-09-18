import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WEATHER_CONDITIONS } from '@/lib/constants';

interface FishingConditionsProps {
  conditions: any;
  isLoading: boolean;
}

export function FishingConditions({ conditions, isLoading }: FishingConditionsProps) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-water mr-2 text-primary" />
            Loading Fishing Conditions...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!conditions?.fishingConditions) {
    return null;
  }

  const { rating, score, reasons } = conditions.fishingConditions;
  const conditionConfig = WEATHER_CONDITIONS[rating as keyof typeof WEATHER_CONDITIONS] || WEATHER_CONDITIONS.moderate;

  // Generate time-based conditions
  const timeConditions = [
    {
      time: 'Morning (6-10 AM)',
      rating: score > 80 ? 'excellent' : score > 60 ? 'good' : 'moderate',
      description: score > 80 ? 'Excellent' : score > 60 ? 'Good' : 'Moderate'
    },
    {
      time: 'Afternoon (12-4 PM)', 
      rating: score > 70 ? 'good' : score > 50 ? 'moderate' : 'poor',
      description: score > 70 ? 'Good' : score > 50 ? 'Moderate' : 'Poor'
    },
    {
      time: 'Evening (6-8 PM)',
      rating: score > 60 ? 'moderate' : 'poor',
      description: score > 60 ? 'Moderate' : 'Avoid'
    }
  ];

  return (
    <Card className="mb-6" data-testid="card-fishing-conditions">
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-water mr-2 text-primary" />
          Today's Fishing Conditions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 rounded-lg bg-muted">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Overall Conditions</h4>
              <p className="text-sm text-muted-foreground">
                Score: {score}/100
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-white ${conditionConfig.color}`}>
              <i className={`fas ${conditionConfig.icon} mr-2`} />
              {conditionConfig.text}
            </div>
          </div>
          {reasons.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Factors:</p>
              <ul className="text-sm text-muted-foreground">
                {reasons.map((reason: string, index: number) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {timeConditions.map((condition, index) => {
            const timeConfig = WEATHER_CONDITIONS[condition.rating as keyof typeof WEATHER_CONDITIONS];
            return (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg text-white bg-gradient-to-r ${timeConfig.gradient}`}
                data-testid={`condition-time-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <i className={`fas ${timeConfig.icon}`} />
                  <span className="font-medium">{condition.time}</span>
                </div>
                <span className="text-sm">{condition.description}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
