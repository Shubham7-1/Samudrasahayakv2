import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const CORRECT_OTP = '123456';

export function OTPVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const phoneNumber = localStorage.getItem('loginPhoneNumber') || '';

  useEffect(() => {
    // Focus first input on mount with safety check and delay for HMR
    const focusFirstInput = () => {
      if (inputRefs.current && inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    };
    
    // Small delay to ensure component is fully mounted
    const timeoutId = setTimeout(focusFirstInput, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input with safety check
    if (value && index < 5 && inputRefs.current && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (newOtp.every(digit => digit !== '') && index === 5) {
      setTimeout(() => handleVerifyOTP(newOtp), 500);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpToVerify = otp) => {
    const otpString = otpToVerify.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    if (otpString !== CORRECT_OTP) {
      setError('Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      // Safe focus with delay to ensure state update is complete
      setTimeout(() => {
        if (inputRefs.current && inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
      return;
    }

    setIsLoading(true);
    
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      
      // Save authentication state
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userPhone', phoneNumber);
      
      // Navigate to main app after success animation
      setTimeout(() => {
        setLocation('/dashboard');
      }, 2000);
    }, 1500);
  };

  const handleResendOTP = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
    // In real app, would trigger OTP resend API
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Login Successful!</h2>
            <p className="text-muted-foreground">Welcome to Samudra Sahayak</p>
            <div className="mt-4">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shield-alt text-white text-2xl" />
          </div>
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
          <p className="text-muted-foreground">
            Enter the 6-digit code sent to<br />
            <span className="font-semibold">+91 {phoneNumber}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center space-x-3">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-bold border-2 focus:border-blue-500"
                data-testid={`input-otp-${index}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center" data-testid="error-message">
              {error}
            </p>
          )}

          <Button 
            onClick={() => handleVerifyOTP()}
            className="w-full"
            size="lg"
            disabled={isLoading || otp.join('').length !== 6}
            data-testid="button-verify-otp"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              <>
                Verify OTP
                <i className="fas fa-check ml-2" />
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <Button 
              variant="ghost" 
              onClick={handleResendOTP}
              className="text-blue-600 hover:text-blue-700"
              data-testid="button-resend-otp"
            >
              Resend OTP
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Demo OTP: <span className="font-mono font-bold">123456</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}