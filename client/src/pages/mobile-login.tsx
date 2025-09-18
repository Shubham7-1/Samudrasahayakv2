import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const validPhoneNumbers = [
  '9920407495',
  '8591556205', 
  '7400106498',
  '9044877789',
  '9321846854'
];

export function MobileLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSendOTP = async () => {
    setError('');
    
    if (!phoneNumber) {
      setError('Please enter your mobile number');
      return;
    }

    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!validPhoneNumbers.includes(phoneNumber)) {
      setError('This mobile number is not registered. Please contact support.');
      return;
    }

    setIsLoading(true);
    
    // Simulate OTP sending
    setTimeout(() => {
      localStorage.setItem('loginPhoneNumber', phoneNumber);
      setIsLoading(false);
      setLocation('/otp-verification');
    }, 2000);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(value);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-mobile-alt text-white text-2xl" />
          </div>
          <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          <p className="text-muted-foreground">Enter your mobile number to continue</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="pl-12"
                data-testid="input-phone-number"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm" data-testid="error-message">
                {error}
              </p>
            )}
          </div>

          <Button 
            onClick={handleSendOTP}
            className="w-full"
            size="lg"
            disabled={isLoading || phoneNumber.length !== 10}
            data-testid="button-send-otp"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner animate-spin mr-2" />
                Sending OTP...
              </>
            ) : (
              <>
                Send OTP
                <i className="fas fa-paper-plane ml-2" />
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Demo Phone Numbers:</p>
            <div className="text-xs mt-1 space-y-1">
              {validPhoneNumbers.map((num) => (
                <div key={num} className="font-mono">{num}</div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}