"use client";

import { type FC, useEffect, useState } from "react";
import { Fingerprint, ScanFaceIcon, Delete, Shield } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useHapticFeedback } from "~/hooks/useHapticFeedback";
import { useAuth } from "~/providers/auth-provider";

interface PinEntryProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const PinEntry: FC<PinEntryProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [shake, setShake] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { clickFeedback } = useHapticFeedback();
  const { user } = useAuth();
  const [biometricSupported] = useState<boolean>(
    typeof window !== "undefined" &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
  );

  // Reset shake animation
  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  // Auto-validate PIN when 6 digits entered
  useEffect(() => {
    if (pin.length === 6 && !loading) {
      validatePin();
    }
  }, [pin, loading]);

  const validatePin = async () => {
    if (loading) return; // Prevent multiple validation attempts
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, you would call an API to validate the PIN
      // For now, just simulate a successful validation after a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulating PIN validation (PIN 123456 is considered valid for demo)
      const isValid = pin === "123456";
      
      if (isValid) {
        clickFeedback("medium");
        // Call success callback after a short delay to ensure UI updates first
        setTimeout(() => {
          onSuccess();
        }, 200);
      } else {
        setShake(true);
        clickFeedback("medium");
        setError("Incorrect PIN. Please try again.");
        setPin("");
      }
    } catch (err) {
      setShake(true);
      clickFeedback("medium");
      setError("An error occurred. Please try again.");
      setPin("");
    } finally {
      // Keep loading true if successful to prevent more validation attempts
      if (pin !== "123456") {
        setLoading(false);
      }
    }
  };

  const handleNumberClick = (number: number) => {
    if (pin.length < 6) {
      clickFeedback("medium");
      setPin((prev) => prev + number);
    } else {
      setShake(true);
      clickFeedback("medium");
    }
  };

  const handleDelete = () => {
    if (pin.length === 0) {
      clickFeedback("medium");
      return;
    }
    clickFeedback("medium");
    setPin((prev) => prev.slice(0, -1));
  };

  const handleBiometric = async () => {
    clickFeedback("medium");
    setLoading(true);
    
    try {
      // Here you would implement actual biometric authentication
      // For now, just simulate success after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
    } catch (err) {
      setError("Biometric authentication failed. Please use your PIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl font-bold">
          Druid
        </CardTitle>
        <p className="text-center text-gray-600">
          {loading ? "Verifying..." : "Enter your PIN"}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}
        
        <div className="mt-6 flex justify-center gap-3">
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <div
              key={index}
              className={`h-3.5 w-3.5 rounded-full border-2 transition-all duration-200 ${
                shake ? "animate-shake" : ""
              } ${
                pin.length > index
                  ? "border-blue-500 bg-blue-500"
                  : "border-blue-300"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <Button
              key={number}
              variant="outline"
              onClick={() => handleNumberClick(number)}
              className="h-14 text-xl font-semibold"
              disabled={loading}
            >
              {number}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={handleBiometric}
            className="flex h-14 items-center justify-center"
            disabled={loading || !biometricSupported}
          >
            <Fingerprint className="h-6 w-6 text-blue-500" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handleNumberClick(0)}
            className="h-14 text-xl font-semibold"
            disabled={loading}
          >
            0
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex h-14 items-center justify-center"
            disabled={loading}
          >
            <Delete className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-center">
          <Button 
            variant="link" 
            className="text-sm text-blue-500"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </div>
  );
};

export default PinEntry;
