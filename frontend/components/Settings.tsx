"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authAPI, userAPI, OTPPurpose, getProfileImageUrl } from "@/lib/api";
import {
  Camera,
  Edit3,
  Mail,
  Lock,
  Phone,
  Bell,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SettingsProps {
  className?: string;
}

export default function Settings({ className }: SettingsProps) {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notifications_enabled ?? true
  );

  // Name change states
  const [firstName, setFirstName] = useState(user?.fname || "");
  const [lastName, setLastName] = useState(user?.lname || "");
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation error states
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    general: "",
  });

  // Phone change states
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  // Profile picture states
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync notification state with user data
  useEffect(() => {
    if (user?.notifications_enabled !== undefined) {
      setNotificationsEnabled(user.notifications_enabled);
    }
  }, [user?.notifications_enabled]);

  // Handle name change
  const handleNameChange = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Error",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await userAPI.updateProfile({
        fname: firstName.trim(),
        lname: lastName.trim(),
      });

      await refreshUser();
      setIsNameModalOpen(false);
      toast({
        title: "Success",
        description: "Name updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update name.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password modal cancel
  const handlePasswordModalCancel = () => {
    setIsPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    });
  };

  // Handle password change
  const handlePasswordChange = async () => {
    // Clear previous errors
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    });

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordErrors({
        currentPassword: !currentPassword ? "Current password is required" : "",
        newPassword: !newPassword ? "New password is required" : "",
        confirmPassword: !confirmPassword ? "Confirm password is required" : "",
        general: "",
      });
      return;
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "Passwords do not match",
        general: "",
      });
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setPasswordErrors({
        currentPassword: "",
        newPassword: "Password must be at least 8 characters long",
        confirmPassword: "",
        general: "",
      });
      return;
    }

    // Check password complexity requirements
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setPasswordErrors({
        currentPassword: "",
        newPassword:
          "Password must contain at least one uppercase letter, one lowercase letter, and one digit",
        confirmPassword: "",
        general: "",
      });
      return;
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      setPasswordErrors({
        currentPassword: "",
        newPassword: "New password must be different from current password",
        confirmPassword: "",
        general: "",
      });
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setIsPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        general: "",
      });
      toast({
        title: "Success",
        description: "Password changed successfully.",
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to change password.";

      // Check if it's a current password error
      if (
        errorMessage.toLowerCase().includes("current password") ||
        errorMessage.toLowerCase().includes("incorrect")
      ) {
        setPasswordErrors({
          currentPassword: "Current password is incorrect",
          newPassword: "",
          confirmPassword: "",
          general: "",
        });
      } else {
        setPasswordErrors({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          general: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle phone number change
  const handlePhoneChange = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Phone number is required.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format (10 digits)
    if (!/^\d{10}$/.test(phoneNumber.replace(/\D/g, ""))) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update phone number via API
      await userAPI.updateProfile({
        phone_number: phoneNumber.trim(),
      });

      // Refresh user data to get updated phone number
      await refreshUser();

      // Clear the phone number input
      setPhoneNumber("");

      setIsPhoneModalOpen(false);
      toast({
        title: "Success",
        description: "Phone number updated successfully!",
      });
    } catch (error: any) {
      console.error("Phone number update error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to update phone number.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile picture change
  const handleProfileImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description:
            "Invalid file type. Only JPEG, PNG, and GIF images are allowed.",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsLoading(true);

        // Upload the file
        const response = await userAPI.uploadProfilePicture(file);

        // Update the user context with the new profile URL
        await refreshUser();

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        toast({
          title: "Success",
          description: "Profile picture updated successfully!",
        });
      } catch (error: any) {
        console.error("Profile picture upload error:", error);
        toast({
          title: "Error",
          description:
            error.response?.data?.detail || "Failed to upload profile picture.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle profile picture deletion
  const handleDeleteProfilePicture = async () => {
    try {
      setIsLoading(true);

      // Delete the profile picture
      await userAPI.deleteProfilePicture();

      // Update the user context
      await refreshUser();

      // Clear the preview
      setProfileImage(null);

      toast({
        title: "Success",
        description: "Profile picture deleted successfully!",
      });
    } catch (error: any) {
      console.error("Profile picture deletion error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to delete profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email verification
  const handleEmailVerification = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      // Send OTP for email verification
      await authAPI.resendOtp(parseInt(user.uid), OTPPurpose.VERIFICATION);

      // Store verification data for OTP page
      localStorage.setItem("pendingVerificationUserId", user.uid);
      localStorage.setItem("pendingVerificationEmail", user.email);
      localStorage.setItem("verificationFromSettings", "true");

      console.log("Settings: Setting verification flag", {
        userId: user.uid,
        email: user.email,
        flagSet: localStorage.getItem("verificationFromSettings"),
      });

      // Clear any existing countdown and start fresh
      localStorage.removeItem("otpCountdown");
      localStorage.removeItem("otpStartTime");

      toast({
        title: "Verification Email Sent",
        description:
          "Please check your email for verification code. Redirecting to verification page...",
      });

      // Redirect to OTP verification page
      setTimeout(() => {
        router.push(
          `/verify-otp?userId=${user.uid}&email=${encodeURIComponent(
            user.email
          )}`
        );
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to send verification email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification toggle change
  const handleNotificationToggle = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      await userAPI.updateNotificationSettings(enabled);

      // Update local state
      setNotificationsEnabled(enabled);

      // Refresh user data to get updated notification preference
      await refreshUser();

      toast({
        title: "Success",
        description: `Notifications ${
          enabled ? "enabled" : "disabled"
        } successfully.`,
      });
    } catch (error: any) {
      // Revert the toggle on error
      setNotificationsEnabled(!enabled);

      toast({
        title: "Error",
        description:
          error.response?.data?.detail ||
          "Failed to update notification settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4 pb-16">
      {/* Animated floating geometric shapes - same as FAQ page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating hexagons */}
        <div
          className="absolute top-10 left-10 w-32 h-32 border-2 border-emerald-200/30 rotate-12 animate-spin"
          style={{
            clipPath:
              "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            animationDuration: "20s",
            animationDirection: "reverse",
          }}
        ></div>

        <div
          className="absolute top-1/4 right-16 w-24 h-24 border-2 border-teal-300/40 -rotate-45 animate-pulse"
          style={{
            clipPath:
              "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            animationDuration: "3s",
          }}
        ></div>

        {/* Floating orbs with inner glow */}
        <div
          className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-gradient-to-r from-emerald-300/20 to-teal-300/20 animate-bounce"
          style={{ animationDuration: "4s", animationDelay: "0s" }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-emerald-400/30 to-teal-400/30 animate-pulse"></div>
        </div>

        <div
          className="absolute bottom-1/4 right-1/3 w-12 h-12 rounded-full bg-gradient-to-r from-green-300/25 to-emerald-300/25 animate-bounce"
          style={{ animationDuration: "3.5s", animationDelay: "1s" }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-green-400/35 to-emerald-400/35 animate-pulse"></div>
        </div>

        {/* Morphing blob shapes */}
        <div className="absolute top-16 right-1/4 w-40 h-40 opacity-20">
          <div
            className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full animate-pulse"
            style={{
              borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
              animation: "morph 8s ease-in-out infinite",
            }}
          ></div>
        </div>

        <div className="absolute bottom-20 left-1/5 w-32 h-32 opacity-15">
          <div
            className="w-full h-full bg-gradient-to-tr from-teal-400 to-green-400 rounded-full animate-pulse"
            style={{
              borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
              animation: "morph 6s ease-in-out infinite reverse",
            }}
          ></div>
        </div>

        {/* Particle system - floating dots */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/30 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Cosmic rays/lines */}
        <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-emerald-300/50 to-transparent transform rotate-12 animate-pulse"></div>
        <div
          className="absolute top-1/3 right-1/5 w-px h-24 bg-gradient-to-b from-transparent via-teal-300/40 to-transparent transform -rotate-45 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-px h-20 bg-gradient-to-b from-transparent via-green-300/45 to-transparent transform rotate-75 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Energy waves */}
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 opacity-20">
          <div
            className="w-full h-full border-2 border-emerald-300 rounded-full animate-ping"
            style={{ animationDuration: "4s" }}
          ></div>
          <div
            className="absolute inset-2 border border-teal-300 rounded-full animate-ping"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          ></div>
          <div
            className="absolute inset-4 border border-green-300 rounded-full animate-ping"
            style={{ animationDuration: "4s", animationDelay: "2s" }}
          ></div>
        </div>
      </div>

      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes morph {
          0%,
          100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
        }
      `}</style>

      {/* Main Settings container */}
      <div className="w-full max-w-4xl z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4 pt-8">
            <SettingsIcon className="w-8 h-8 text-emerald-600 mt-1" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-snug">
              Settings
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Picture Section */}
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-emerald-200">
              {profileImage || user?.profile_url ? (
                <img
                  src={profileImage || getProfileImageUrl(user?.profile_url)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-4xl font-bold">
                  {user?.fname?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfileImageChange}
            className="hidden"
          />
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-gray-500">
              Click to change profile picture
            </p>
            {(profileImage || user?.profile_url) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteProfilePicture}
                disabled={isLoading}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Picture
              </Button>
            )}
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4 pb-12">
          {/* Name Change */}
          <div className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl overflow-hidden hover:shadow-lg duration-200 hover:shadow-emerald-800/10 hover:scale-[1.02]">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Edit3 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Name
                    </h3>
                    <p className="text-sm text-gray-600">
                      {user?.fname} {user?.lname}
                    </p>
                  </div>
                </div>
                <Dialog
                  open={isNameModalOpen}
                  onOpenChange={setIsNameModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
                    >
                      Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white shadow-2xl border-2 border-gray-300">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold text-gray-900">
                        Change Name
                      </DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Update your first and last name.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="firstName"
                          className="text-gray-700 font-medium"
                        >
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Enter first name"
                          autoFocus={false}
                          className="border-2 border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="lastName"
                          className="text-gray-700 font-medium"
                        >
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Enter last name"
                          autoFocus={false}
                          className="border-2 border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsNameModalOpen(false)}
                        className="hover:bg-gray-300 hover:text-gray-900"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleNameChange}
                        disabled={isLoading}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Email Verification */}
          <div className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl overflow-hidden hover:shadow-lg duration-200 hover:shadow-emerald-800/10 hover:scale-[1.02]">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Email
                    </h3>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                    {!user?.is_email_verified && (
                      <p className="text-sm text-red-500 font-medium">
                        Email not verified
                      </p>
                    )}
                  </div>
                </div>
                {!user?.is_email_verified && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEmailVerification}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
                  >
                    {isLoading ? "Sending..." : "Send Verification Code"}
                  </Button>
                )}
                {user?.is_email_verified && (
                  <span className="text-sm text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl overflow-hidden hover:shadow-lg duration-200 hover:shadow-emerald-800/10 hover:scale-[1.02]">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Password
                    </h3>
                    <p className="text-sm text-gray-600">
                      Change your password
                    </p>
                  </div>
                </div>
                <Dialog
                  open={isPasswordModalOpen}
                  onOpenChange={setIsPasswordModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
                    >
                      Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white shadow-2xl border-2 border-gray-300">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold text-gray-900">
                        Change Password
                      </DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Enter your current password and choose a new one.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="currentPassword"
                          className="text-gray-700 font-medium"
                        >
                          Current Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            autoFocus={false}
                            className="border-2 border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="text-sm text-red-600 mt-1">
                            {passwordErrors.currentPassword}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="newPassword"
                          className="text-gray-700 font-medium"
                        >
                          New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            autoFocus={false}
                            className="border-2 border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="text-sm text-red-600 mt-1">
                            {passwordErrors.newPassword}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-gray-700 font-medium"
                        >
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            autoFocus={false}
                            className="border-2 border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="text-sm text-red-600 mt-1">
                            {passwordErrors.confirmPassword}
                          </p>
                        )}
                      </div>
                      {passwordErrors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <p className="text-sm text-red-600">
                            {passwordErrors.general}
                          </p>
                        </div>
                      )}
                    </div>
                    <DialogFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handlePasswordModalCancel}
                        className="hover:bg-gray-300 hover:text-gray-900"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePasswordChange}
                        disabled={isLoading}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        {isLoading ? "Changing..." : "Change Password"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Phone Number Change */}
          <div className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl overflow-hidden hover:shadow-lg duration-200 hover:shadow-emerald-800/10 hover:scale-[1.02]">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Phone Number
                    </h3>
                    <p className="text-sm text-gray-600">
                      {user?.phone_number || "No phone number set"}
                    </p>
                  </div>
                </div>
                <Dialog
                  open={isPhoneModalOpen}
                  onOpenChange={setIsPhoneModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
                    >
                      {user?.phone_number ? "Change" : "Add"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white shadow-2xl border-2 border-gray-300">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold text-gray-900">
                        Change Phone Number
                      </DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Update your phone number.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="phoneNumber"
                          className="text-gray-700 font-medium flex items-center gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {/* Nepal Flag */}
                            <div className="flex items-center space-x-2">
                              <img
                                src="/nepalflag.png"
                                alt="Nepal Flag"
                                className="w-5 h-4 object-contain border border-gray-300 rounded-sm"
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              <span className="text-sm text-gray-600">
                                +977
                              </span>
                            </div>
                          </div>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => {
                              // Only allow digits for phone number
                              const processedValue = e.target.value.replace(
                                /\D/g,
                                ""
                              );
                              setPhoneNumber(processedValue);
                            }}
                            placeholder="9815076935"
                            autoFocus={false}
                            className="border-2 border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 pl-20"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Enter a valid 10-digit phone number
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsPhoneModalOpen(false)}
                        className="hover:bg-gray-300 hover:text-gray-900"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePhoneChange}
                        disabled={isLoading}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl overflow-hidden hover:shadow-lg duration-200 hover:shadow-emerald-800/10 hover:scale-[1.02]">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Notifications
                    </h3>
                    <p className="text-sm text-gray-600">
                      Get notified when analysis is finished
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
