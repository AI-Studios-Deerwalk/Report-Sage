"""
Email service for sending OTPs and other emails via SMTP
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending emails via SMTP"""
    
    def __init__(self):
        """Initialize email service with configuration from environment variables"""
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        self.from_name = os.getenv("FROM_NAME", "Report Rage")
        
        if not self.smtp_username or not self.smtp_password:
            logger.warning("SMTP credentials not configured. Email sending will be disabled.")
    
    def _create_smtp_connection(self) -> Optional[smtplib.SMTP]:
        """
        Create and return SMTP connection
        
        Returns:
            SMTP connection or None if failed
        """
        try:
            # Create SMTP connection
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls(context=ssl.create_default_context())  # Enable security
            server.login(self.smtp_username, self.smtp_password)
            return server
        except Exception as e:
            logger.error(f"Failed to create SMTP connection: {e}")
            return None
    
    def _create_otp_email_content(self, recipient_name: str, otp_code: str) -> tuple[str, str]:
        """
        Create OTP email content (HTML and text versions)
        
        Args:
            recipient_name: Name of the recipient
            otp_code: OTP code to send
            
        Returns:
            Tuple of (html_content, text_content)
        """
        # HTML version
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification - Report Rage</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                .otp-box {{ background-color: white; border: 2px solid #4F46E5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }}
                .otp-code {{ font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; margin: 10px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                .warning {{ background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Report Rage</h1>
                    <p>Email Verification</p>
                </div>
                <div class="content">
                    <h2>Hello {recipient_name}!</h2>
                    <p>Thank you for signing up with Report Rage. To complete your registration, please verify your email address using the OTP code below:</p>
                    
                    <div class="otp-box">
                        <p>Your verification code is:</p>
                        <div class="otp-code">{otp_code}</div>
                        <p><small>This code will expire in 10 minutes</small></p>
                    </div>
                    
                    <div class="warning">
                        <strong>Security Note:</strong> Never share this code with anyone. Report Rage will never ask for this code via phone or email.
                    </div>
                    
                    <p>If you didn't request this verification, please ignore this email or contact our support team.</p>
                    
                    <p>Best regards,<br>The Report Rage Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>&copy; 2024 Report Rage. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Text version
        text_content = f"""
        Report Rage - Email Verification
        
        Hello {recipient_name}!
        
        Thank you for signing up with Report Rage. To complete your registration, please verify your email address using the OTP code below:
        
        Your verification code is: {otp_code}
        
        This code will expire in 10 minutes.
        
        Security Note: Never share this code with anyone. Report Rage will never ask for this code via phone or email.
        
        If you didn't request this verification, please ignore this email or contact our support team.
        
        Best regards,
        The Report Rage Team
        
        ---
        This is an automated message. Please do not reply to this email.
        © 2024 Report Rage. All rights reserved.
        """
        
        return html_content, text_content
    
    async def send_otp_email(
        self, 
        recipient_email: str, 
        recipient_name: str, 
        otp_code: str
    ) -> bool:
        """
        Send OTP verification email
        
        Args:
            recipient_email: Email address to send to
            recipient_name: Name of the recipient
            otp_code: OTP code to send
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.smtp_username or not self.smtp_password:
            logger.warning(f"SMTP not configured. Would send OTP {otp_code} to {recipient_email}")
            return False
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"Your Report Rage Verification Code: {otp_code}"
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = recipient_email
            
            # Get email content
            html_content, text_content = self._create_otp_email_content(recipient_name, otp_code)
            
            # Create MIME parts
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")
            
            # Add parts to message
            message.attach(text_part)
            message.attach(html_part)
            
            # Send email
            server = self._create_smtp_connection()
            if not server:
                return False
            
            text = message.as_string()
            server.sendmail(self.from_email, recipient_email, text)
            server.quit()
            
            logger.info(f"OTP email sent successfully to {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send OTP email to {recipient_email}: {e}")
            return False
    
    async def send_welcome_email(
        self, 
        recipient_email: str, 
        recipient_name: str
    ) -> bool:
        """
        Send welcome email after successful verification
        
        Args:
            recipient_email: Email address to send to
            recipient_name: Name of the recipient
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.smtp_username or not self.smtp_password:
            logger.warning(f"SMTP not configured. Would send welcome email to {recipient_email}")
            return False
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = "Welcome to Report Rage!"
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = recipient_email
            
            # Create content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Welcome to Report Rage</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Report Rage!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello {recipient_name}!</h2>
                        <p>Welcome to Report Rage! Your email has been successfully verified and your account is now active.</p>
                        <p>You can now start using our platform to analyze and improve your reports.</p>
                        <p>If you have any questions, feel free to contact our support team.</p>
                        <p>Best regards,<br>The Report Rage Team</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
            Welcome to Report Rage!
            
            Hello {recipient_name}!
            
            Welcome to Report Rage! Your email has been successfully verified and your account is now active.
            
            You can now start using our platform to analyze and improve your reports.
            
            If you have any questions, feel free to contact our support team.
            
            Best regards,
            The Report Rage Team
            """
            
            # Create MIME parts
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")
            
            # Add parts to message
            message.attach(text_part)
            message.attach(html_part)
            
            # Send email
            server = self._create_smtp_connection()
            if not server:
                return False
            
            text = message.as_string()
            server.sendmail(self.from_email, recipient_email, text)
            server.quit()
            
            logger.info(f"Welcome email sent successfully to {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {recipient_email}: {e}")
            return False


# Create global instance
email_service = EmailService()
