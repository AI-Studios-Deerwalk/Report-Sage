# 📧 Email OTP Setup Guide

## ✅ What's Ready
- OTP system integrated into registration
- Email service with Gmail support
- 6-digit OTPs with 10-minute expiration
- Verification and resend endpoints

## 🔧 Environment Setup

### Step 1: Create `.env` file
Create a `.env` file in the `backend` folder with these settings:

```env
# Database Configuration (update with your details)
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/reportrage

# SMTP Configuration for Gmail
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=DWIT Academia

# Other settings
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Step 2: Gmail App Password Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account → Security
   - Click "2-Step Verification"
   - Scroll down to "App passwords"
   - Select "Mail" and your device
   - Copy the 16-character password
3. **Replace placeholder values**:
   - `your-email@gmail.com` → Your actual Gmail
   - `your-gmail-app-password` → The 16-character app password

## 🚀 API Endpoints

### Registration (Auto sends OTP)
```
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "Password123!",
  "fname": "John",
  "lname": "Doe"
}
```

Response includes:
- `user_id` - Use this for verification
- `email_sent` - Whether email was sent
- `otp_expires_in` - Expiration time (600 seconds)

### Verify OTP
```
POST /api/v1/auth/verify-otp?user_id=123&otp_code=123456
```

### Resend OTP
```
POST /api/v1/auth/resend-otp?user_id=123
```

## 🧪 Testing

### Without SMTP (Development)
- System works without email configuration
- OTP codes are logged to console
- Look for: `"SMTP not configured. OTP for user@example.com: 123456"`

### With SMTP (Production)
1. Configure Gmail app password
2. Register a new user
3. Check email for OTP
4. Use OTP to verify

## 📱 Frontend Integration

Your existing `verifyOTP.tsx` can connect like this:

```typescript
// After registration, get user_id from response
const registerResponse = await register(userData);
const userId = registerResponse.user_id;

// Verify OTP
const verifyOTP = async (otpCode: string) => {
  const response = await fetch(
    `/api/v1/auth/verify-otp?user_id=${userId}&otp_code=${otpCode}`,
    { method: 'POST' }
  );
  return response.json();
};

// Resend OTP
const resendOTP = async () => {
  const response = await fetch(
    `/api/v1/auth/resend-otp?user_id=${userId}`,
    { method: 'POST' }
  );
  return response.json();
};
```

## 🛡️ Security Features
- 6-digit random OTPs
- 10-minute expiration
- Max 5 verification attempts
- Old OTPs invalidated on resend
- Secure email templates

## ⚡ Quick Start
1. Paste SMTP config into `.env` file
2. Replace placeholder values with real Gmail credentials
3. Test registration → should send OTP email
4. Use OTP to verify → should mark email as verified

That's it! Your OTP email system is ready! 🎉
