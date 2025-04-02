"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
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
import { Fingerprint, Shield, CheckCircle2, ExternalLink } from "lucide-react";
import { usePasskey } from "~/hooks/usePasskey";
import toast from "react-hot-toast";

export default function SetupPasskey() {
  const router = useRouter();
  const { userId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  
  const { data: user } = api.users.getUserById.useQuery(
    { userId: Number(userId) },
    { enabled: !!userId }
  );
  
  const identifier = user?.email || user?.phone || "";
  const { create } = usePasskey(identifier);

  const handleCreatePasskey = async () => {
    setIsLoading(true);
    try {
      const contractId = await create();
      if (contractId) {
        toast.success("Passkey created successfully!");
        setSetupComplete(true);
      }
    } catch (error) {
      toast.error((error as Error)?.message || "Failed to create passkey");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  if (!user) {
    return (
      <div className="container flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Secure Your Account
          </CardTitle>
          <CardDescription className="text-center">
            Set up a passkey for passwordless authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {setupComplete ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-2">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h3 className="text-xl font-semibold text-green-600">
                  Passkey Setup Complete!
                </h3>
              </div>
              <Alert className="bg-green-50 border-green-200">
                <AlertTitle className="flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  Your account is now secured
                </AlertTitle>
                <AlertDescription>
                  You can now use your biometrics or device PIN to sign in to your account securely.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Fingerprint className="h-16 w-16 text-blue-600" />
              </div>
              <Alert>
                <AlertTitle className="flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  Enhanced Security with Passkeys
                </AlertTitle>
                <AlertDescription>
                  Passkeys use your device's biometric features (fingerprint, face recognition) 
                  or PIN for superior protection. They eliminate the need for passwords 
                  and are more secure against phishing attacks.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <h3 className="font-semibold">How it works:</h3>
                <ol className="list-inside list-decimal space-y-2 text-gray-600">
                  <li>Tap the button below</li>
                  <li>Use your device's biometrics or PIN</li>
                  <li>Follow on-screen instructions</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {setupComplete ? (
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={goToDashboard}
            >
              Continue to Dashboard
            </Button>
          ) : (
            <Button 
              className="w-full"
              onClick={handleCreatePasskey}
              disabled={isLoading}
            >
              {isLoading ? "Setting Up..." : "Create Passkey"}
              <Fingerprint className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 