"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/lib/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const { register, error: authError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const handleLoginSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      console.error("No credential in response");
      return;
    }

    setIdToken(credentialResponse.credential);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idToken) {
      alert("Please sign in with Google first");
      return;
    }

    try {
      setIsSubmitting(true);
      await register(idToken, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber || undefined,
      });

      // Redirect to onboarding
      router.push("/onboarding");
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginError = () => {
    console.error("Google sign in failed");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="w-full space-y-6">
      {authError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      {!idToken ? (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-gray-600">
            Sign up with Google to get started
          </p>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            width="350"
          />
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name (Optional)</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="John"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="lastName">Last Name (Optional)</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Doe"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="+1234567890"
              className="mt-2"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIdToken(null)}
            className="w-full"
          >
            Use Different Google Account
          </Button>
        </form>
      )}

      <div className="text-center text-sm">
        <span className="text-gray-600">Already have an account? </span>
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
