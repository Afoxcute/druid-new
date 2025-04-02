"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Fingerprint, Key, Lock } from "lucide-react";
import { useAuth } from "~/providers/auth-provider";
import { toast } from "react-hot-toast";

export default function PasskeySetup() {
  const router = useRouter();
  const { userId } = useParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Verify this is the correct user
    if (user && user.id !== Number(userId)) {
      console.error("User ID mismatch");
      router.replace("/auth/signin");
    }
  }, [user, userId, router]);

  const handleCreatePasskey = async () => {
    setIsLoading(true);
    try {
      // Simulate passkey creation
      console.log("Creating passkey for user:", userId);
      
      // Generate a placeholder passkey address
      const passkeyCAddress = "stellar:" + Math.random().toString(36).substring(2, 15);
      
      // Update localStorage
      const userData = localStorage.getItem("auth_user");
      if (userData) {
        const updatedUser = JSON.parse(userData);
        updatedUser.passkeyCAddress = passkeyCAddress;
        localStorage.setItem("auth_user", JSON.stringify(updatedUser));
        
        // In a real app, you would also save this to the server
        
        toast.success("Passkey setup complete!");
        // Navigate to dashboard with pin verified
        setTimeout(() => {
          router.replace("/dashboard?pinVerified=true");
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating passkey:", error);
      toast.error("Failed to create passkey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipSetup = () => {
    try {
      // Mark user as having skipped passkey setup
      const userData = localStorage.getItem("auth_user");
      if (userData) {
        const user = JSON.parse(userData);
        user.passkeyCAddress = "skipped_setup";
        localStorage.setItem("auth_user", JSON.stringify(user));
        console.log("Updated user data: passkey setup skipped");
        toast.success("Passkey setup skipped. You can set up later.");
      }
    } catch (err) {
      console.error("Failed to update local user data:", err);
    }
    
    // Navigate to dashboard
    router.replace("/dashboard?pinVerified=true");
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-6 w-6 border-t-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto p-4 flex flex-col min-h-screen justify-center">
      <Card>
        <CardHeader className="space-y-1 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Fingerprint className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Set Up Passkey</CardTitle>
          <p className="text-gray-500 text-sm">
            Enhance your security with a passkey for faster and more secure logins
        </p>
      </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                <Key className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium">Enhanced Security</h3>
                <p className="text-sm text-gray-500">Protect your account with biometric authentication</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                <Lock className="h-5 w-5 text-blue-500" />
        </div>
            <div>
                <h3 className="font-medium">Faster Login</h3>
                <p className="text-sm text-gray-500">Sign in quickly without typing passwords</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 pt-4">
            <Button 
              className="w-full" 
              onClick={handleCreatePasskey}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                  Setting up...
                </>
              ) : (
                "Set Up Passkey"
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSkipSetup}
              disabled={isLoading}
            >
              Skip for now
            </Button>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}
