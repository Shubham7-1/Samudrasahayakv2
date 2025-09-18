import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/use-geolocation';
import { FISH_TYPES, TRANSLATIONS } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { db } from '@/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

export function CatchLog() {
  const language = localStorage.getItem('language') || localStorage.getItem('selectedLanguage') || 'en';
  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
  const [isAddingCatch, setIsAddingCatch] = useState(false);
  const [formData, setFormData] = useState({
    fishType: '',
    quantity: '',
    weight: '',
    price: '',
    notes: ''
  });
  
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const { latitude, longitude } = useGeolocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch catches from Firestore
  const { data: catches, isLoading } = useQuery({
    queryKey: ['catchLogs'],
    queryFn: async () => {
      try {
        if (!db) {
          throw new Error("Firestore not initialized");
        }
        const q = query(collection(db, 'catch-logs'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Error fetching catch logs:", error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Add new catch to Firestore
  const addCatchMutation = useMutation({
    mutationFn: async (catchData: any) => {
      if (!db) {
        throw new Error("Firestore not initialized");
      }
      const docRef = await addDoc(collection(db, 'catch-logs'), {
        ...catchData,
        timestamp: Date.now()
      });
      return docRef;
    },
    onSuccess: () => {
      toast({
        title: t.catch_log + " Saved",
        description: "Your catch has been recorded successfully.",
      });
      setIsAddingCatch(false);
      setFormData({
        fishType: '',
        quantity: '',
        weight: '',
        price: '',
        notes: ''
      });
      queryClient.invalidateQueries({ queryKey: ['catchLogs'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log catch. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete catch from Firestore
  const deleteCatchMutation = useMutation({
    mutationFn: async (catchId: string) => {
      if (!db) {
        throw new Error("Firestore not initialized");
      }
      await deleteDoc(doc(db, 'catch-logs', catchId));
    },
    onSuccess: () => {
      toast({
        title: "Catch Deleted",
        description: "The catch entry has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['catchLogs'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete catch entry. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fishType || !formData.weight) {
      toast({
        title: "Missing Information",
        description: "Please fill in fish type and weight.",
        variant: "destructive"
      });
      return;
    }

    const userPhone = localStorage.getItem('userPhone') || localStorage.getItem('loginPhoneNumber') || 'guest';
    
    addCatchMutation.mutate({
      fishType: formData.fishType,
      quantity: parseFloat(formData.quantity) || 1,
      weight: parseFloat(formData.weight),
      price: parseFloat(formData.price) || 0,
      notes: formData.notes,
      location: latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'Current Location',
      latitude: latitude || 0,
      longitude: longitude || 0,
      userId: userPhone,
      weatherConditions: {} // Could include current weather
    });
  };

  const filterCatchesByDate = () => {
    if (!catches || !Array.isArray(catches)) return [];
    
    if (!selectedDate) return catches;
    
    return catches.filter((catchItem: any) => {
      const catchDate = new Date(catchItem.timestamp);
      const filterDate = new Date(selectedDate);
      
      // Compare dates without time
      return (
        catchDate.getFullYear() === filterDate.getFullYear() &&
        catchDate.getMonth() === filterDate.getMonth() &&
        catchDate.getDate() === filterDate.getDate()
      );
    });
  };

  const filteredCatches = filterCatchesByDate();

  const calculateTotalValue = () => {
    if (!filteredCatches || !Array.isArray(filteredCatches)) return { totalWeight: 0, totalValue: 0, totalCatches: 0 };
    
    return filteredCatches.reduce((acc: any, catchItem: any) => ({
      totalWeight: acc.totalWeight + (catchItem.weight || 0),
      totalValue: acc.totalValue + (catchItem.price || 0),
      totalCatches: acc.totalCatches + 1
    }), { totalWeight: 0, totalValue: 0, totalCatches: 0 });
  };

  const stats = calculateTotalValue();

  if (isLoading) {
    return (
      <div className="p-4 pb-20 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-6 overflow-auto ios-scroll">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <i className="fas fa-fish mr-2 text-primary" />
              {t.catch_log}
            </CardTitle>
            <Button
              onClick={() => setIsAddingCatch(!isAddingCatch)}
              data-testid="button-add-catch"
            >
              <i className="fas fa-plus mr-2" />
              {isAddingCatch ? 'Cancel' : t.add_catch}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary" data-testid="text-total-catches">
                {stats.totalCatches}
              </div>
              <div className="text-sm text-muted-foreground">Total Catches</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-secondary" data-testid="text-total-weight">
                {stats.totalWeight.toFixed(1)}kg
              </div>
              <div className="text-sm text-muted-foreground">Total Weight</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600" data-testid="text-total-value">
                ₹{stats.totalValue.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center">
                <i className="fas fa-calendar-alt text-primary mr-2" />
                Filter by Date
              </h3>
              {selectedDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(undefined)}
                  data-testid="button-clear-date-filter"
                >
                  <i className="fas fa-times mr-1" />
                  Clear Filter
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2"
                    data-testid="button-date-picker"
                  >
                    <i className="fas fa-calendar text-primary" />
                    <span>
                      {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select Date'}
                    </span>
                    <i className="fas fa-chevron-down text-xs" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setIsDatePickerOpen(false);
                    }}
                    disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <div className="text-sm text-muted-foreground">
                {selectedDate 
                  ? `Showing catches from ${format(selectedDate, 'MMMM dd, yyyy')} (${filteredCatches.length} entries)`
                  : `Showing all catches (${Array.isArray(catches) ? catches.length : 0} entries)`
                }
              </div>
            </div>
          </div>

          {/* Add Catch Form */}
          {isAddingCatch && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Log New Catch</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fishType">Fish Type *</Label>
                      <Select
                        value={formData.fishType}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, fishType: value }))}
                      >
                        <SelectTrigger data-testid="select-fish-type">
                          <SelectValue placeholder="Select fish type" />
                        </SelectTrigger>
                        <SelectContent>
                          {FISH_TYPES.map((fish) => (
                            <SelectItem key={fish} value={fish}>
                              {fish}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="weight">Weight (kg) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="0.0"
                        data-testid="input-weight"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity (pieces)</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="1"
                        data-testid="input-quantity"
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                        data-testid="input-price"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any additional notes..."
                      rows={3}
                      data-testid="textarea-notes"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={addCatchMutation.isPending}
                    data-testid="button-save-catch"
                  >
                    {addCatchMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2" />
                        Save Catch
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Catch History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Catches</CardTitle>
        </CardHeader>
        <CardContent>
          {!filteredCatches || !Array.isArray(filteredCatches) || filteredCatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <i className="fas fa-fish text-4xl mb-4 opacity-50" />
              <p>{selectedDate ? 'No catches found for selected date' : 'No catches recorded yet'}</p>
              <p className="text-sm mt-2">{selectedDate ? 'Try selecting a different date or clear the filter' : 'Start logging your catches to track your progress!'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(filteredCatches && Array.isArray(filteredCatches)) ? filteredCatches.map((catchItem: any, index: number) => (
                <Card key={catchItem.id || index} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                          <i className="fas fa-fish text-primary-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold" data-testid={`catch-fish-type-${index}`}>
                            {catchItem.fishType}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {catchItem.timestamp 
                              ? new Date(catchItem.timestamp).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Recent'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-semibold" data-testid={`catch-weight-${index}`}>
                            {catchItem.weight}kg
                          </div>
                          {catchItem.price > 0 && (
                            <div className="text-sm text-green-600" data-testid={`catch-price-${index}`}>
                              ₹{catchItem.price}
                            </div>
                          )}
                          {catchItem.quantity && catchItem.quantity !== 1 && (
                            <div className="text-xs text-muted-foreground">
                              {catchItem.quantity} pieces
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this catch entry?')) {
                              deleteCatchMutation.mutate(catchItem.id);
                            }
                          }}
                          disabled={deleteCatchMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          data-testid={`button-delete-catch-${index}`}
                        >
                          {deleteCatchMutation.isPending ? (
                            <i className="fas fa-spinner fa-spin text-xs" />
                          ) : (
                            <i className="fas fa-trash text-xs" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {catchItem.notes && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <i className="fas fa-sticky-note mr-2 text-muted-foreground" />
                        {catchItem.notes}
                      </div>
                    )}

                    {catchItem.location && (
                      <div className="mt-2 text-xs text-muted-foreground flex items-center">
                        <i className="fas fa-map-marker-alt mr-1" />
                        {catchItem.location}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}