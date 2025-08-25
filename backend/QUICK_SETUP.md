# Quick Setup Guide - OTP Email Service

## 🚀 Ready to Use - OTP System is Implemented!

Your OTP email verification system is now fully implemented and ready to use.

## ✅ What's Been Added:

1. **Email Service** (`utils/email_service.py`)
   - Professional HTML email templates
   - SMTP configuration support
   - OTP and welcome email sending

2. **OTP CRUD Operations** (`crud/user_otp.py`)
   - Create, verify, resend OTPs
   - Automatic expiration handling
   - Security features (attempt limits)

3. **OTP API Endpoints** (`routes/otp.py`)
   - `POST /api/v1/otp/send` - Send OTP
   - `POST /api/v1/otp/verify` - Verify OTP
   - `POST /api/v1/otp/resend` - Resend OTP
   - `GET /api/v1/otp/status/{user_id}` - Check OTP status

4. **Updated Registration** (`routes/auth.py`)
   - Automatically sends OTP after user signup
   - Returns user_id for OTP verification

5. **Database Migration**
   - `user_otps` table created and migrated

## 🔧 Setup SMTP (Required for Email Sending)

### Option 1: Gmail (Recommended)

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Configure Email Settings**:

The system now uses database-based email configuration instead of environment variables. You can configure email settings through the admin interface:

- Navigate to Admin → Email Configuration
- Enter your SMTP settings:
  - SMTP Server: `smtp.gmail.com`
  - SMTP Port: `587`
  - SMTP Username: `your-email@gmail.com`
  - SMTP Password: `your-16-char-app-password`
  - From Email: `your-email@gmail.com`
  - From Name: `Report Rage`

**Note**: Only Super Administrators can modify email configuration.

### Option 2: Without SMTP (Development)

The system works without SMTP configuration:
- OTP codes are logged to console
- API returns `email_sent: false`
- All functionality works except actual email sending
- **Note**: You can still configure email settings through the admin interface, and the system will automatically use them when available

## 🎯 How to Test

### 1. Register a New User
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fname": "John",
    "lname": "Doe"
  }'
```

Response includes:
- `user_id` - Use this for OTP verification
- `otp_sent` - Whether email was sent
- `email_sent_to` - Email address

### 2. Verify OTP
```bash
curl -X POST "http://localhost:8000/api/v1/otp/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "otp_code": "123456"
  }'
```

### 3. Check OTP Status
```bash
curl "http://localhost:8000/api/v1/otp/status/123"
```

## 🔄 Integration with Frontend

Your existing `verifyOTP.tsx` component can now connect to:

```typescript
// Send OTP
const sendOTP = async (userId: number) => {
  const response = await fetch('/api/v1/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return response.json();
};

// Verify OTP
const verifyOTP = async (userId: number, otpCode: string) => {
  const response = await fetch('/api/v1/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      user_id: userId, 
      otp_code: otpCode 
    })
  });
  return response.json();
};

// Resend OTP
const resendOTP = async (userId: number) => {
  const response = await fetch('/api/v1/otp/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return response.json();
};
```

## 🛡️ Security Features

- **6-digit OTPs** with 10-minute expiration
- **Max 5 attempts** per OTP
- **Automatic invalidation** of old OTPs when new ones are created
- **Secure random generation** using Python's `secrets` module
- **Rate limiting ready** (can be added to endpoints)

## 📧 Email Features

- **Professional HTML templates** with fallback text
- **Responsive design** for all devices
- **Security warnings** and best practices
- **Welcome emails** after successful verification
- **Branded emails** with your app name

## 🚀 Next Steps

1. **Configure SMTP** using the guide above
2. **Test the full flow** from signup to verification
3. **Update your frontend** to use the new API endpoints
4. **Customize email templates** if needed (in `email_service.py`)

## 📝 Environment Variables Needed

```env
# Required for email sending
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Report Rage

# Database (already configured)
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/reportrage
```

That's it! Your OTP email verification system is ready to go! 🎉
