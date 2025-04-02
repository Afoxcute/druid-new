"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Eye, EyeOff, Receipt } from "lucide-react";
import { useAuth } from "~/providers/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { shortStellarAddress } from "~/lib/utils";
import { toast } from "react-hot-toast";

interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: number;
  recipient: string;
  date: string;
}

// Mock transactions for demonstration
const mockTransactions: Transaction[] = [
  {
    id: "tx1",
    type: "send",
    amount: 20,
    recipient: "John Doe",
    date: "2023-06-15",
  },
  {
    id: "tx2",
    type: "receive",
    amount: 50,
    recipient: "Alice Smith",
    date: "2023-06-10",
  },
  {
    id: "tx3",
    type: "send",
    amount: 15,
    recipient: "Bob Johnson",
    date: "2023-06-05",
  },
];

// Create a separate component that uses useSearchParams
function DashboardContent() {
  const { user, logout } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [balance] = useState("8,000.56"); // Mock balance
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [redirected, setRedirected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Check if user is coming from bank connection flow
  const bankConnected = searchParams.get("bankConnected") === "true";
  
  // Check if the pin was already verified in this session
  const pinVerified = searchParams.get("pinVerified") === "true";
  
  useEffect(() => {
    // If coming from the PIN verification page with success
    if (pinVerified) {
      setIsPinVerified(true);
      setIsVerifying(false);
      return;
    }
    
    // Check if user has a PIN set
    const timer = setTimeout(async () => {
      if (user) {
        console.log("Checking if user has PIN set:", user);
        
        // Force reload user data from localStorage to get the latest changes
        try {
          const userData = localStorage.getItem("auth_user");
          if (userData) {
            const refreshedUser = JSON.parse(userData);
            console.log("Refreshed user data:", refreshedUser);
            
            // Check if hashedPin is null (no PIN set)
            if (refreshedUser.hashedPin === null) {
              console.log("User has no PIN set, redirecting to PIN setup");
              router.replace("/wallet/onboarding/" + user.id);
              return;
            }
            
            // If redirected from PIN page, check for passkey setup
            // Allow "skipped_setup" as a valid passkey state
            if (pinVerified && 
                (!refreshedUser.passkeyCAddress || 
                refreshedUser.passkeyCAddress === null) && 
                refreshedUser.passkeyCAddress !== "skipped_setup") {
              console.log("User has no passkey set, redirecting to passkey setup");
              router.replace(`/wallet/onboarding/${user.id}/passkey`);
              return;
            }

            // Check if user has a wallet address
            if (!refreshedUser.walletAddress) {
              // Generate a unique wallet address for the user
              const newAddress = `stellar:${Math.random().toString(36).substring(2, 15)}`;
              refreshedUser.walletAddress = newAddress;
              localStorage.setItem("auth_user", JSON.stringify(refreshedUser));
              setWalletAddress(newAddress);
            } else {
              setWalletAddress(refreshedUser.walletAddress);
            }
            
            // PIN and passkey verification passed
            setIsPinVerified(true);
            setIsVerifying(false);
          }
        } catch (err) {
          console.error("Error refreshing user data:", err);
          // PIN is set, proceed with verification
          setIsPinVerified(true);
          setIsVerifying(false);
        }
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [pinVerified, user, router]);
  
  // If the user isn't loaded yet, show a loading state
  if (!user) {
    return <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mb-4"></div>
      <p>Loading user data...</p>
    </div>;
  }
  
  // Show verifying message while checking
  if (isVerifying) {
    return <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mb-4"></div>
      <p>Verifying security...</p>
    </div>;
  }
  
  // If PIN isn't verified and we haven't already redirected, redirect to PIN page
  if (!isPinVerified && !pinVerified && !redirected) {
    console.log("Redirecting to PIN verification page");
    setRedirected(true); // Set flag to prevent multiple redirects
    
    // Use a setTimeout to allow the state update to complete before redirecting
    setTimeout(() => {
      router.replace("/auth/pin?redirectTo=/dashboard?pinVerified=true");
    }, 100);
    
    return <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mb-4"></div>
      <p>Redirecting to PIN verification...</p>
    </div>;
  }

  return (
    <div className="container mx-auto max-w-md space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Welcome, {user.firstName || "User"}
        </h1>
        <Button variant="ghost" onClick={() => {
          // Clear any session/verification data
          setIsPinVerified(false);
          // Log the user out
          logout();
          // Redirect to sign in
          router.push("/auth/signin");
        }}>
          Logout
        </Button>
      </div>

      {bankConnected && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">
          Bank account successfully connected! You can now make transfers.
        </div>
      )}

      <Card className="overflow-hidden bg-blue-600 text-white">
        <CardContent className="p-6">
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-blue-100">Current Balance</h2>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">
                ${showBalance ? balance : "••••••"}
              </p>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="rounded-full p-1 hover:bg-blue-500"
              >
                {showBalance ? (
                  <EyeOff className="h-4 w-4 text-blue-100" />
                ) : (
                  <Eye className="h-4 w-4 text-blue-100" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="bg-blue-500 text-white hover:bg-blue-400 border-blue-400"
              onClick={() => {
                if (walletAddress) {
                  router.push(`/dashboard/${walletAddress}/send`);
                } else {
                  toast.error("Please wait while we set up your wallet address");
                }
              }}
              disabled={!walletAddress}
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Send
            </Button>
            <Button 
              variant="outline" 
              className="bg-blue-500 text-white hover:bg-blue-400 border-blue-400"
              onClick={() => router.push(`/wallet/${walletAddress}/receive`)}
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Receive
            </Button>
          </div>
          {walletAddress && (
            <div className="mt-4 text-center text-sm text-blue-100">
              Wallet Address: {shortStellarAddress(walletAddress)}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="cursor-pointer transition-colors hover:bg-gray-50" onClick={() => router.push(`/dashboard/${walletAddress}/send`)}>
          <CardContent className="flex items-center space-x-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <ArrowUpRight className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Send Money</h3>
              <p className="text-sm text-gray-500">Transfer money to other users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-gray-50" onClick={() => router.push(`/dashboard/${walletAddress}/bills`)}>
          <CardContent className="flex items-center space-x-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Receipt className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Pay Bills</h3>
              <p className="text-sm text-gray-500">Pay your utility bills and more</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-gray-50" onClick={() => router.push(`/dashboard/${walletAddress}/receive`)}>
          <CardContent className="flex items-center space-x-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <ArrowDownToLine className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Receive Money</h3>
              <p className="text-sm text-gray-500">Get paid by other users</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4 pt-4">
          {mockTransactions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockTransactions.map((tx) => (
                <Card key={tx.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.type === "receive" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                          {tx.type === "receive" ? (
                            <ArrowDownToLine className="h-5 w-5" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.recipient}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${tx.type === "receive" ? "text-green-600" : "text-red-600"}`}>
                          {tx.type === "receive" ? "+" : "-"}${tx.amount}
                        </p>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="banking" className="space-y-4 pt-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <p className="text-lg font-medium">Connect your bank account</p>
                <p className="text-sm text-gray-500">
                  Link your bank for faster transfers and withdrawals
                </p>
              </div>
              <Button 
                className="w-full"
                onClick={() => router.push("/banking/connect")}
              >
                Connect Bank
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main component with Suspense boundary
export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
} 