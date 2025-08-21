import Head from "next/head";
import { SignupForm } from "../auth/Signup";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const router = useRouter();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  
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