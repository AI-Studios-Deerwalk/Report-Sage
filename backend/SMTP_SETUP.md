# SMTP Email Setup for Report Rage

This document explains how to configure SMTP email service for sending OTP verification emails.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# SMTP Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Report Rage
```

## Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. In Google Account settings, go to Security
2. Under "2-Step Verification", click on "App passwords"
3. Select "Mail" and your device
4. Copy the generated 16-character password
5. Use this password as `SMTP_PASSWORD` (not your regular Gmail password)

### Step 3: Configure Environment Variables
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-gmail@gmail.com
SMTP_PASSWORD=generated-app-password-here
FROM_EMAIL=your-gmail@gmail.com
FROM_NAME=Report Rage
```

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo Mail
```env
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Custom SMTP Server
```env
SMTP_SERVER=your-smtp-server.com
SMTP_PORT=587
```

## Testing Email Service

After configuration, test the email service by:

1. Registering a new user - an OTP should be sent automatically
2. Using the `/api/v1/otp/send` endpoint to send OTPs manually
3. Check the backend logs for email sending status

## Development Mode

If SMTP is not configured, the system will:
- Log the OTP code to the console
- Return `email_sent: false` in API responses
- Continue working without sending actual emails

## Email Templates

The system sends two types of emails:

1. **OTP Verification Email**: Sent during registration and manual OTP requests
2. **Welcome Email**: Sent after successful email verification

Both emails are responsive and include:
- Professional HTML design
- Plain text fallback
- Security warnings
- Company branding

## API Endpoints

### Send OTP
```
POST /api/v1/otp/send
{
  "user_id": 123,
  "purpose": "verification"
}
```

### Verify OTP
```
POST /api/v1/otp/verify
{
  "user_id": 123,
  "otp_code": "123456"
}
```

### Resend OTP
```
POST /api/v1/otp/resend
{
  "user_id": 123
}
```

### Check OTP Status
```
GET /api/v1/otp/status/123
```

## Security Features

- OTPs expire after 10 minutes
- Maximum 5 verification attempts per OTP
- Old OTPs are invalidated when new ones are generated
- Email addresses are validated before sending
- Secure random OTP generation using Python's `secrets` module

## Troubleshooting

### Common Issues

1. **"Authentication failed"**: Check username/password, ensure app password is used for Gmail
2. **"Connection refused"**: Check SMTP server and port settings
3. **"Emails not received"**: Check spam folder, verify email address
4. **"SSL errors"**: Ensure TLS/SSL settings are correct

### Debug Mode

Set logging level to DEBUG to see detailed email sending information:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Production Considerations

1. Use environment variables, never hardcode credentials
2. Consider using dedicated email services (SendGrid, AWS SES) for production
3. Implement rate limiting for OTP requests
4. Monitor email delivery rates
5. Set up bounce and complaint handling
6. Use proper DNS records (SPF, DKIM) for better deliverability
