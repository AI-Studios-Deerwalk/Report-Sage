"use client";

import Head from "next/head";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { OTPVerification } from "../components/verifyOTP";
import { useToast } from "@/hooks/use-toast";
import { OTPPurpose } from "@/lib/api";
import { authAPI } from "@/lib/api";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOTP, resendOTP, user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Get user data from URL query parameters
  const [userId, setUserId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [otpExpiresIn, setOtpExpiresIn] = useState(120); // 120 seconds countdown
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  useEffect(() => {
    // Get user data from URL query parameters
    const userIdParam = searchParams.get("userId");
    const emailParam = searchParams.get("email");

    if (userIdParam && emailParam) {
      setUserId(parseInt(userIdParam));
      setUserEmail(emailParam);
    } else {
      // Fallback: try to get from localStorage if available
      const storedUserId = localStorage.getItem("pendingVerificationUserId");
      const storedEmail = localStorage.getItem("pendingVerificationEmail");

      if (storedUserId && storedEmail) {
        setUserId(parseInt(storedUserId));
        setUserEmail(storedEmail);
      } else {
        // If no data available, redirect to signup
        toast({
          title: "Verification data not found",
          description: "Please complete the registration process first.",
          variant: "destructive",
        });
        router.push("/signup");
        return;
      }
    }
  }, [searchParams, router, toast]);

  // Check if user is already verified
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!userId) return;

      try {
        // If user is authenticated, check their verification status
        if (isAuthenticated && user) {
          if (user.is_email_verified) {
            // Check if user came from settings page
            const fromSettings =
              localStorage.getItem("verificationFromSettings") === "true";

            // User is already verified, redirect based on where they came from
            toast({
              title: "Already verified!",
              description: fromSettings
                ? "Your email is already verified. Returning to settings..."
                : "Your email is already verified. Redirecting to dashboard...",
            });

            // Clear the flag before redirecting
            if (fromSettings) {
              localStorage.removeItem("verificationFromSettings");
              router.push("/settings");
            } else {
              router.push("/dashboard");
            }
            return;
          }
        } else {
          // If not authenticated, try to get user info directly
          try {
            const response = await authAPI.getCurrentUser();
            if (response.data.is_email_verified) {
              // Check if user came from settings page
              const fromSettings =
                localStorage.getItem("verificationFromSettings") === "true";

              // User is already verified, redirect based on where they came from
              toast({
                title: "Already verified!",
                description: fromSettings
                  ? "Your email is already verified. Returning to settings..."
                  : "Your email is already verified. Redirecting to dashboard...",
              });

              // Clear the flag before redirecting
              if (fromSettings) {
                localStorage.removeItem("verificationFromSettings");
                router.push("/settings");
              } else {
                router.push("/dashboard");
              }
              return;
            }
          } catch (error) {
            // User not authenticated, continue with OTP verification
            console.log(
              "User not authenticated, proceeding with OTP verification"
            );
          }
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      } finally {
        setIsCheckingVerification(false);
      }
    };

    checkVerificationStatus();
  }, [userId, isAuthenticated, user, router, toast]);

  // Initialize countdown timer from localStorage or start new one
  useEffect(() => {
    const storedCountdown = localStorage.getItem("otpCountdown");
    const storedStartTime = localStorage.getItem("otpStartTime");

    if (storedCountdown && storedStartTime) {
      const startTime = parseInt(storedStartTime);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 120 - elapsed);

      setOtpExpiresIn(remaining);

      // If countdown has already expired, clear localStorage
      if (remaining <= 0) {
        localStorage.removeItem("otpCountdown");
        localStorage.removeItem("otpStartTime");
      }
    } else {
      // Start new countdown
      localStorage.setItem("otpCountdown", "120");
      localStorage.setItem("otpStartTime", Date.now().toString());
    }
  }, []);

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (otpExpiresIn > 0) {
      const timer = setTimeout(() => {
        setOtpExpiresIn((prev) => {
          const newValue = prev - 1;
          // Update localStorage with new countdown value
          localStorage.setItem("otpCountdown", newValue.toString());
          return newValue;
        });
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // Clear localStorage when countdown reaches 0
      localStorage.removeItem("otpCountdown");
      localStorage.removeItem("otpStartTime");
    }
  }, [otpExpiresIn]);

  const handleOTPSubmit = async (otpCode: string) => {
    if (!userId) {
      setError("User ID not found. Please try registering again.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await verifyOTP(userId, otpCode, OTPPurpose.VERIFICATION);

      // Check if user came from settings page BEFORE clearing localStorage
      const fromSettings =
        localStorage.getItem("verificationFromSettings") === "true";

      console.log("Verification redirect check:", {
        isAuthenticated,
        hasUserId: !!localStorage.getItem("pendingVerificationUserId"),
        hasEmail: !!localStorage.getItem("pendingVerificationEmail"),
        fromSettings: fromSettings,
        rawFlag: localStorage.getItem("verificationFromSettings"),
      });

      // Clear verification data from localStorage AFTER checking
      localStorage.removeItem("pendingVerificationUserId");
      localStorage.removeItem("pendingVerificationEmail");
      localStorage.removeItem("verificationFromSettings");
      localStorage.removeItem("otpCountdown");
      localStorage.removeItem("otpStartTime");

      toast({
        title: "Email verified successfully!",
        description: fromSettings
          ? "Your email has been verified. Returning to settings..."
          : "Your account is now active. You can now upload and analyze PDF files.",
      });

      // Redirect based on where user came from
      console.log("About to redirect:", {
        fromSettings,
        redirectTo: fromSettings ? "/settings" : "/dashboard",
      });

      // Add a small delay to ensure toast is visible
      setTimeout(() => {
        if (fromSettings) {
          console.log("Redirecting to settings page");
          router.push("/settings");
        } else {
          console.log("Redirecting to dashboard");
          router.push("/dashboard");
        }
      }, 1500);
    } catch (err: any) {
      console.error("OTP verification error:", err);
      setError(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (!userId) {
      setError("User ID not found. Please try registering again.");
      return;
    }

    // Reset countdown timer when resending OTP
    setOtpExpiresIn(120);
    localStorage.setItem("otpCountdown", "120");
    localStorage.setItem("otpStartTime", Date.now().toString());

    try {
      await resendOTP(userId, OTPPurpose.VERIFICATION);

      toast({
        title: "OTP resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (err: any) {
      console.error("Resend OTP error:", err);
      setError(err.message || "Failed to resend OTP. Please try again.");
    }
  };

  const handleBack = () => {
    // Check if user came from settings page
    const fromSettings =
      localStorage.getItem("verificationFromSettings") === "true";

    console.log("Back button clicked:", {
      fromSettings,
      redirectTo: fromSettings ? "/settings" : "/",
    });

    if (fromSettings) {
      router.push("/settings");
    } else {
      router.push("/");
    }
  };

  // Show loading while checking verification status
  if (isCheckingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Checking verification status...
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your account status
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Preparing verification page</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Verify Email</title>
        <meta
          name="description"
          content="Verify your email address to complete registration"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <OTPVerification
        email={userEmail}
        onSubmit={handleOTPSubmit}
        onBack={handleBack}
        onResend={handleResendOTP}
        showBackButton={true}
        isSubmitting={isSubmitting}
        error={error}
        resendCooldown={otpExpiresIn}
        forPurpose={OTPPurpose.VERIFICATION}
      />
    </>
  );
}
