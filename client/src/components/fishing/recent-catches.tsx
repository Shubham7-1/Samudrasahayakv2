import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface RecentCatchesProps {
  userId?: string;
  onViewAll: () => void;
}

export function RecentCatches({ userId, onViewAll }: RecentCatchesProps) {
  const { data: catches, isLoading } = useQuery({
    queryKey: ['/api/catch-logs'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <i className="fas fa-history mr-2 text-secondary" />
              Recent Catches
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentCatches = (catches && Array.isArray(catches)) ? catches.slice(0, 2) : [];

  // Mock fish images mapping
  const fishImages: { [key: string]: string } = {
    'Mackerel': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64',
    'Sardines': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64',
    'Pomfret': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64',
  };

  return (
    <Card className="mb-6" data-testid="card-recent-catches">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <i className="fas fa-history mr-2 text-secondary" />
            Recent Catches
          </CardTitle>
          <Button 
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-primary"
            data-testid="button-view-all-catches"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentCatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <i className="fas fa-fish text-4xl mb-4 opacity-50" />
            <p>No catches recorded yet</p>
            <p className="text-sm mt-2">Start logging your catches to track your progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCatches.map((catchItem: any, index: number) => (
              <div 
                key={catchItem.id || index}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                data-testid={`catch-item-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <img 
                    src={fishImages[catchItem.fishType] || fishImages['Mackerel']}
                    alt={`${catchItem.fishType} fish`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium" data-testid={`text-fish-type-${index}`}>
                      {catchItem.fishType}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {catchItem.timestamp ? 
                        new Date(catchItem.timestamp).toLocaleDateString() : 
                        'Recent'
                      }
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold" data-testid={`text-weight-${index}`}>
                    {catchItem.weight || catchItem.quantity || 0} kg
                  </div>
                  {catchItem.price && (
                    <div className="text-sm text-green-600" data-testid={`text-price-${index}`}>
                      ₹{catchItem.price}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
