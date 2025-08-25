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
import secrets
import string
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db_session
from crud.config import config_crud

load_dotenv()

logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending emails via SMTP"""
    
    def __init__(self):
        """Initialize email service with default configuration"""
        # Default values (fallback)
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.smtp_username = None
        self.smtp_password = None
        self.from_email = None
        self.from_name = "DWIT Academia"
        
        # Try to load configuration from database
        self._load_config_from_db()
    
    def _load_config_from_db(self):
        """Load SMTP configuration from database"""
        try:
            # Use synchronous session for initialization
            from database.connection import db_manager
            db_manager.initialize()
            session = db_manager.get_sync_session()
            
            try:
                config = config_crud.get_email_config_sync(session)
                if config:
                    self.smtp_server = config.smtp_server
                    self.smtp_port = int(config.smtp_port)
                    self.smtp_username = config.smtp_username
                    self.smtp_password = config.smtp_password
                    self.from_email = config.from_email
                    self.from_name = config.from_name
                    logger.info("SMTP configuration loaded from database successfully")
                else:
                    logger.warning("No SMTP configuration found in database, using defaults")
            finally:
                session.close()
                
        except Exception as e:
            logger.error(f"Failed to load SMTP configuration from database: {e}")
            logger.warning("Using default SMTP configuration")
    
    async def refresh_config_from_db(self, db: AsyncSession):
        """Refresh SMTP configuration from database (async version)"""
        try:
            config = await config_crud.get_email_config(db)
            if config:
                self.smtp_server = config.smtp_server
                self.smtp_port = int(config.smtp_port)
                self.smtp_username = config.smtp_username
                self.smtp_password = config.smtp_password
                self.from_email = config.from_email
                self.from_name = config.from_name
                logger.info("SMTP configuration refreshed from database successfully")
                return True
            else:
                logger.warning("No SMTP configuration found in database")
                return False
        except Exception as e:
            logger.error(f"Failed to refresh SMTP configuration from database: {e}")
            return False
    
    def _validate_config(self) -> bool:
        """Validate that all required SMTP configuration is present"""
        if not all([self.smtp_server, self.smtp_port, self.smtp_username, self.smtp_password, self.from_email]):
            logger.warning("Incomplete SMTP configuration. Email sending will be disabled.")
            return False
        return True
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP code"""
        return ''.join(secrets.choice(string.digits) for _ in range(length))
    
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
            <title>Email Verification - DWIT Academia</title>
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
                    <h1>DWIT Academia</h1>
                    <p>Email Verification</p>
                </div>
                <div class="content">
                    <h2>Hello {recipient_name}!</h2>
                    <p>Thank you for signing up with DWIT Academia. To complete your registration, please verify your email address using the OTP code below:</p>
                    
                    <div class="otp-box">
                        <p>Your verification code is:</p>
                        <div class="otp-code">{otp_code}</div>
                        <p><small>This code will expire in 120 seconds</small></p>
                    </div>
                    
                    <div class="warning">
                        <strong>Security Note:</strong> Never share this code with anyone. DWIT Academia will never ask for this code via phone or email.
                    </div>
                    
                    <p>If you didn't request this verification, please ignore this email or contact our support team.</p>
                    
                    <p>Best regards,<br>The DWIT Academia Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>&copy; 2024 DWIT Academia. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Text version
        text_content = f"""
        DWIT Academia - Email Verification
        
        Hello {recipient_name}!
        
        Thank you for signing up with DWIT Academia. To complete your registration, please verify your email address using the OTP code below:
        
        Your verification code is: {otp_code}
        
        This code will expire in 10 minutes.
        
        Security Note: Never share this code with anyone. DWIT Academia will never ask for this code via phone or email.
        
        If you didn't request this verification, please ignore this email or contact our support team.
        
        Best regards,
        The DWIT Academia Team
        
        ---
        This is an automated message. Please do not reply to this email.
        © 2024 DWIT Academia. All rights reserved.
        """
        
        return html_content, text_content
    
    def send_otp_email(self, recipient_email: str, recipient_name: str, otp_code: str) -> bool:
        """
        Send OTP verification email (synchronous version for backward compatibility)
        
        Args:
            recipient_email: Email address to send to
            recipient_name: Name of the recipient
            otp_code: OTP code to send
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self._validate_config():
            logger.warning(f"SMTP not configured. OTP for {recipient_email}: {otp_code}")
            return False
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"Your DWIT Academia Verification Code: {otp_code}"
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
    
    async def send_otp_email_async(
        self, 
        recipient_email: str, 
        recipient_name: str, 
        otp_code: str
    ) -> bool:
        """
        Send OTP verification email (async version)
        
        Args:
            recipient_email: Email address to send to
            recipient_name: Name of the recipient
            otp_code: OTP code to send
            
        Returns:
            True if email sent successfully, False otherwise
        """
        return self.send_otp_email(recipient_email, recipient_name, otp_code)
    
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
        if not self._validate_config():
            logger.warning(f"SMTP not configured. Would send welcome email to {recipient_email}")
            return False
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = "Welcome to DWIT Academia!"
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = recipient_email
            
            # Create content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Welcome to DWIT Academia</title>
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
                        <h1>Welcome to DWIT Academia!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello {recipient_name}!</h2>
                        <p>Welcome to DWIT Academia! Your email has been successfully verified and your account is now active.</p>
                        <p>You can now start using our platform to analyze and improve your reports.</p>
                        <p>If you have any questions, feel free to contact our support team.</p>
                        <p>Best regards,<br>The DWIT Academia Team</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
            Welcome to DWIT Academia!
            
            Hello {recipient_name}!
            
            Welcome to DWIT Academia! Your email has been successfully verified and your account is now active.
            
            You can now start using our platform to analyze and improve your reports.
            
            If you have any questions, feel free to contact our support team.
            
            Best regards,
            The DWIT Academia Team
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


async def send_email(
    to_email: str,
    subject: str,
    body: str = "",
    html_content: Optional[str] = None
) -> bool:
    """
    Send a general email (async wrapper for admin email functionality)
    
    Args:
        to_email: Email address to send to
        subject: Email subject
        body: Plain text email body
        html_content: HTML email content (optional)
        
    Returns:
        True if email sent successfully, False otherwise
    """
    if not email_service._validate_config():
        logger.warning(f"SMTP not configured. Would send email to {to_email}: {subject}")
        return False
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{email_service.from_name} <{email_service.from_email}>"
        message["To"] = to_email
        
        # Create MIME parts
        text_part = MIMEText(body, "plain")
        message.attach(text_part)
        
        # Add HTML content if provided
        if html_content:
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
        
        # Send email
        server = email_service._create_smtp_connection()
        if not server:
            return False
        
        text = message.as_string()
        server.sendmail(email_service.from_email, to_email, text)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False
