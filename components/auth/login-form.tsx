"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/lib/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const { login, error: authError, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      console.error("No credential in response");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(
        credentialResponse.credential,
        undefined,
        `${window.location.origin}/manage`,
      );

      // Redirect to manage
      router.push("/manage");
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginError = () => {
    console.error("Login failed");
  };

  return (
    <div className="w-full space-y-6">
      {authError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center space-y-4">
        {isSubmitting ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            width="350"
          />
        )}
      </div>

      <div className="text-center text-sm">
        <span className="text-gray-600">Don't have an account? </span>
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
