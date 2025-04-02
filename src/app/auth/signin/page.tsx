"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Fingerprint, Key, Mail, Phone } from "lucide-react";
import { usePasskey } from "~/hooks/usePasskey";
import toast from "react-hot-toast";
import { useAuth } from "~/providers/auth-provider";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const phoneSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export default function SignIn() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { connect } = usePasskey(identifier);
  const { login } = useAuth();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      let identifier;
      if (authMethod === "email") {
        const result = await emailForm.trigger();
        if (!result) {
          setIsLoading(false);
          return;
        }
        identifier = emailForm.getValues().email;
        console.log('Using email identifier:', identifier);
      } else {
        const result = await phoneForm.trigger();
        if (!result) {
          setIsLoading(false);
          return;
        }
        identifier = phoneForm.getValues().phone;
        console.log('Using phone identifier:', identifier);
      }

      setIdentifier(identifier);

      try {
        console.log('Attempting passkey connection');
        // Connect with passkey
        const contractId = await connect();
        console.log('Passkey connection result:', contractId);
        
        if (!contractId) {
          toast.error("Failed to connect with passkey. Please try again.");
          return;
        }
        
        console.log('Attempting login with identifier and contractId:', { identifier, contractId });
        // If contractId is returned, call the login function from AuthProvider
        await login(identifier, contractId);
        
        // Authentication successful, redirect to dashboard
        console.log('Login successful, redirecting to dashboard');
        toast.success("Authentication successful");
        router.push("/dashboard");
      } catch (error: any) {
        console.error("Authentication error:", error);
        // Show more specific error message if available
        toast.error(error.message || "Authentication failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Form validation error:", error);
      toast.error(error.message || "Please check your input and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Sign in to your account using your passkey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" onValueChange={(value) => setAuthMethod(value as "email" | "phone")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Phone className="mr-2 h-4 w-4" />
                Phone
              </TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleContinue)} className="space-y-4 pt-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="phone">
              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(handleContinue)} className="space-y-4 pt-4">
                  <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            onClick={handleContinue} 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Authenticating..." : "Continue with Passkey"}
            <Fingerprint className="ml-2 h-4 w-4" />
          </Button>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account?</span>{" "}
            <Button 
              variant="link" 
              className="p-0" 
              onClick={() => router.push("/auth/signup")}
            >
              Sign up
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 