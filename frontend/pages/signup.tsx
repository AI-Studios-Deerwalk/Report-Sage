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
      await register({
        email: formData.studentEmail,
        password: formData.password,
        fname: formData.firstName,
        lname: formData.lastName,
        phone_number: formData.phoneNumber
      });
      
      // Show success message
      toast({
        title: "Account created successfully",
        description: "Please log in with your new account",
        variant: "success",
      });
      
      // Redirect to login page
      router.push("/login");
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
        <title>Sign Up - Report Rage</title>
        <meta name="description" content="Create your Report Rage account to get started" />
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