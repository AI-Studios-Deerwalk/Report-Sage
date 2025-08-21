"""
Email service for sending OTPs via SMTP
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
import secrets
import string

logger = logging.getLogger(__name__)


class EmailService:
    """Simple email service for sending OTPs"""
    
    def __init__(self):
        """Initialize with environment variables"""
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        self.from_name = os.getenv("FROM_NAME", "DWIT Academia")
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP code"""
        return ''.join(secrets.choice(string.digits) for _ in range(length))
    
    def send_otp_email(self, recipient_email: str, recipient_name: str, otp_code: str) -> bool:
        """Send OTP email"""
        if not self.smtp_username or not self.smtp_password:
            logger.warning(f"SMTP not configured. OTP for {recipient_email}: {otp_code}")
            return False
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"Your DWIT Academia Verification Code: {otp_code}"
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = recipient_email
            
            # HTML content
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4F46E5;">DWIT Academia - Email Verification</h2>
                    <p>Hello {recipient_name},</p>
                    <p>Your verification code is:</p>
                    <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #4F46E5; letter-spacing: 5px; margin: 0;">{otp_code}</h1>
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p>Best regards,<br>AI Studios Team</p>
                </div>
            </body>
            </html>
            """
            
            # Text content
            text_content = f"""
            DWIT Academia - Email Verification
            
            Hello {recipient_name},
            
            Your verification code is: {otp_code}
            
            This code will expire in 10 minutes.
            
            Best regards,
            AI Studios Team
            """
            
            # Create MIME parts
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")
            
            message.attach(text_part)
            message.attach(html_part)
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls(context=ssl.create_default_context())
            server.login(self.smtp_username, self.smtp_password)
            server.sendmail(self.from_email, recipient_email, message.as_string())
            server.quit()
            
            logger.info(f"OTP email sent to {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email}: {e}")
            return False


# Global instance
email_service = EmailService()
