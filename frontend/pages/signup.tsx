import Head from "next/head";
import { SignupForm } from "../auth/Signup";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const router = useRouter();
  const { register, user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  
  // Check if user is already verified and redirect them
  useEffect(() => {
    if (isAuthenticated && user && user.is_email_verified) {
      toast({
        title: "Already signed up!",
        description: "You are already registered and verified. Redirecting to dashboard...",
      });
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router, toast]);
  
  const handleBackClick = () => {
    router.push("/");
  };
  
  const handleLoginClick = () => {
    router.push("/login");
  };

  const handleSubmit = async (formData: any) => {
    // Reset error state
    setError("");
    
    // Check for password validation error from the form component
    if (formData.validationError) {
      setError(formData.validationError);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      
      // Call the register function from AuthContext
      const registrationResult = await register({
        email: formData.studentEmail,
        password: formData.password,
        fname: formData.firstName,
        lname: formData.lastName,
        phone_number: formData.phoneNumber
      });
      
      // Show success message
      toast({
        title: "Account created successfully",
        description: registrationResult.email_sent 
          ? "Please check your email for verification code" 
          : "Verification code generated. Check console if email not configured.",
        variant: "success",
      });
      
      // Store verification data in localStorage as backup
      localStorage.setItem('pendingVerificationUserId', registrationResult.user_id.toString())
      localStorage.setItem('pendingVerificationEmail', formData.studentEmail)
      
      // Clear any existing countdown and start fresh
      localStorage.removeItem('otpCountdown')
      localStorage.removeItem('otpStartTime')
      
      // Redirect to OTP verification page with user info
      router.push({
        pathname: "/verify-otp",
        query: {
          userId: registrationResult.user_id,
          email: formData.studentEmail
        }
      });
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render the signup form if user is already verified
  if (isAuthenticated && user && user.is_email_verified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
          <p className="text-gray-600">You are already registered and verified.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Sign Up - DWIT Academia</title>
        <meta name="description" content="Create your DWIT Academia account to get started" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <SignupForm 
        onSubmit={handleSubmit}
        onBackClick={handleBackClick} 
        onLoginClick={handleLoginClick}
        error={error}
        isSubmitting={isSubmitting}
      />
    </>
  );
}