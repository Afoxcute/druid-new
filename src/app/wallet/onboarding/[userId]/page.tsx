"use client";

import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Shield, Key, ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { useHapticFeedback } from "~/hooks/useHapticFeedback";
import { ClientTRPCErrorHandler, cn } from "~/lib/utils";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";

type Step = "create-pin" | "confirm-pin" | "passkey";

export default function OnboardingMobile() {
  const params = useParams();
  const userId = params.userId as string;
  const { clickFeedback } = useHapticFeedback();
  const [isExpanded, setIsExpanded] = useState(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<Step>("create-pin");
  const [shake, setShake] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // tRPC procedures
  const persistPin = api.users.setPin.useMutation({
    onSuccess: (data) => {
      if (!data.success) {
        setIsLoading(false);
        setError(data.message || "Failed to save PIN. Please try again.");
        setShake(true);
        clickFeedback("error");
        return;
      }
      
      // Update the local user data
      try {
        const userData = localStorage.getItem("auth_user");
        if (userData) {
          const user = JSON.parse(userData);
          user.hasPin = true; // Just flag that user has a pin now
          localStorage.setItem("auth_user", JSON.stringify(user));
          console.log("Updated local user data with hasPin flag");
        }
      } catch (err) {
        console.error("Failed to update local user data:", err);
      }
      
      // Show success toast
      toast.success(data.message || "PIN set successfully!");
      setIsLoading(false);
      setStep("passkey");
    },
    onError: (error) => {
      console.error("Error setting PIN:", error);
      setIsLoading(false);
      setError(error.message || "Failed to save PIN. Please try again.");
      setShake(true);
      clickFeedback("error");
    }
  });

  useEffect(() => {
    setIsExpanded(true);
  }, []);

  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  useEffect(() => {
    if (pin.length === 6 && step === "create-pin") {
      // Automatically proceed to confirm PIN after short delay
      setTimeout(() => {
        setStep("confirm-pin");
      }, 300);
    } else if (confirmPin.length === 6 && step === "confirm-pin") {
      // Compare pins
      if (pin === confirmPin) {
        // Use the actual persistPin API
        setIsLoading(true);
        console.log("Setting PIN for user:", userId);
        
        try {
          persistPin.mutate({
            userId: Number(userId),
            pin: pin,
          });
        } catch (err) {
          console.error("Failed to trigger PIN mutation:", err);
          setIsLoading(false);
          setError("An unexpected error occurred. Please try again.");
          setShake(true);
          clickFeedback("error");
        }
      } else {
        // PINs don't match
        setShake(true);
        clickFeedback("error");
        setConfirmPin("");
        setError("PINs don't match. Please try again.");
      }
    }
  }, [pin, confirmPin, step, userId, clickFeedback, persistPin]);

  const handlePinInput = (value: string) => {
    if (step === "create-pin") {
      if (pin.length < 6) {
        clickFeedback("medium");
        setPin((prev) => prev + value);
      } else {
        clickFeedback("warning");
      }
      return;
    }

    if (step === "confirm-pin") {
      if (confirmPin.length < 6) {
        clickFeedback("medium");
        setConfirmPin((prev) => prev + value);
      } else {
        clickFeedback("warning");
      }
    }
  };

  const handleDelete = () => {
    if (step === "create-pin") {
      if (pin.length === 0) {
        clickFeedback("warning");
        return;
      }
      clickFeedback("medium");
      setPin((prev) => prev.slice(0, -1));
    } else if (step === "confirm-pin") {
      if (pin.length === 0) {
        clickFeedback("warning");
        return;
      }
      clickFeedback("medium");
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const renderPinInput = (currentPin: string) => (
    <div className="mb-8 flex justify-center space-x-4">
      {[1, 2, 3, 4, 5, 6].map((_, index) => (
        <div
          key={index}
          className={`h-3.5 w-3.5 rounded-full border-2 transition-all duration-200 ${shake ? "animate-shake" : ""} ${
            currentPin.length > index
              ? "border-blue-500 bg-blue-500"
              : "border-blue-300"
          }`}
        />
      ))}
    </div>
  );

  const renderNumpad = () => (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
        <Button
          key={number}
          variant="outline"
          className="h-14 text-xl font-semibold"
          onClick={() => handlePinInput(number.toString())}
          disabled={isLoading}
        >
          {number}
        </Button>
      ))}
      <div className="h-14 text-xl font-semibold"></div>{" "}
      <Button
        variant="outline"
        className="h-14 text-xl font-semibold"
        onClick={() => handlePinInput("0")}
        disabled={isLoading}
      >
        0
      </Button>
      <Button variant="outline" className="h-14" onClick={handleDelete} disabled={isLoading}>
        Delete
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <Card className="flex flex-grow flex-col">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Welcome to Druid
          </CardTitle>
          <CardDescription className="text-center">
            Let&#39;s secure your account
          </CardDescription>
        </CardHeader>
        <CardContent
          className={cn(
            "flex flex-col justify-center",
            isExpanded && "flex-grow",
          )}
        >
          {step === "create-pin" && (
            <>
              <h2 className="mb-4 text-center text-xl font-semibold">
                Create your 6-digit PIN
              </h2>
              {error && (
                <p className="mb-4 text-center text-sm text-red-500">{error}</p>
              )}
              {renderPinInput(pin)}
              {renderNumpad()}
            </>
          )}
          {step === "confirm-pin" && (
            <>
              <h2 className="mb-4 text-center text-xl font-semibold">
                Confirm your PIN
              </h2>
              {error && (
                <p className="mb-4 text-center text-sm text-red-500">{error}</p>
              )}
              {renderPinInput(confirmPin)}
              {renderNumpad()}
            </>
          )}
          {step === "passkey" && (
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="h-6 w-6 text-green-500" />
                <span className="font-medium text-green-500">
                  PIN set successfully
                </span>
              </div>
              <Alert>
                <AlertTitle className="flex items-center">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Complete Your Passkey Setup
                </AlertTitle>
                <AlertDescription>
                  To enhance the security of your account, you&#39;ll be
                  redirected to a secure browser where you can set up your
                  passkey. This method uses biometrics for every action,
                  ensuring that all movements require confirmation for added
                  protection
                </AlertDescription>
              </Alert>
              <p className="text-center">
                When you&#39;re ready, click the button below to continue
                setting up your passkey.
              </p>

              <Link
                className="w-full"
                href={`/wallet/onboarding/${String(userId)}/passkey`}
                target="_blank"
              >
                <Button className="w-full">
                  <Key className="mr-2 h-5 w-5" />
                  Set up Passkey in Secure Browser
                </Button>
              </Link>
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Mark that user consciously skipped passkey setup
                    try {
                      const userData = localStorage.getItem("auth_user");
                      if (userData) {
                        const user = JSON.parse(userData);
                        // Add a temporary placeholder value to avoid future redirects
                        user.passkeyCAddress = "skipped_setup"; 
                        localStorage.setItem("auth_user", JSON.stringify(user));
                        console.log("Updated user data: passkey setup skipped");
                        toast.success("PIN setup complete. You can set up passkey later.");
                      }
                    } catch (err) {
                      console.error("Failed to update local user data:", err);
                    }
                    
                    // Navigate to dashboard
                    window.location.href = "/dashboard?pinVerified=true";
                  }}
                >
                  Skip for now and go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-center text-xs text-gray-500">
            By continuing, you agree to Druid&#39;s Terms of Service and
            Privacy Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
