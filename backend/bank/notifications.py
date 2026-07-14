import logging
import threading
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from core import settings

logger = logging.getLogger(__name__)


class Notification:
    """
    A central notification handler for sending user-related notifications.
    Email sending is done asynchronously to prevent blocking the main request.
    """

    @staticmethod
    def _send_email_async(subject, recipient_email, template_name, context):
        """
        Internal method to send email in a separate thread.
        """
        try:
            from_email = settings.DEFAULT_FROM_EMAIL
            html_message = render_to_string(template_name, context)

            email = EmailMessage(subject, html_message, from_email, [recipient_email])
            email.content_subtype = "html"
            email.send(fail_silently=True)
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email}: {str(e)}")

    @classmethod
    def send_email(cls, subject, recipient_email, template_name, context):
        """
        Sends an email using the specified template and context.
        Runs asynchronously to prevent blocking the main request.
        """
        # Run email sending in a separate thread
        thread = threading.Thread(
            target=cls._send_email_async,
            args=(subject, recipient_email, template_name, context)
        )
        thread.daemon = True
        thread.start()

    @classmethod
    def send_welcome_email(cls, user):
        """
        Sends a welcome email to the user.
        """
        subject = "Welcome to Our Platform!"
        template_name = "emails/welcome_email.html"
        full_name = f"{user.first_name} {user.last_name}"  
        context = {
            "full_name": full_name,  
        }
        cls.send_email(subject, user.email, template_name, context)

    @classmethod
    def send_login_notification(cls, user, ip_address):
        """
        Sends a login notification email to the user with the login IP address.
        """
        from datetime import datetime
        subject = "Login Notification"
        template_name = "emails/login_notification.html"
        context = {
            "user": user,
            "ip_address": ip_address,
            "current_year": datetime.now().year,
        }
        cls.send_email(subject, user.email, template_name, context)

