# utils/email_utils.py

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

def send_transfer_email(subject, template_name, context, recipient_email):
    try:
        html_content = render_to_string(template_name, context)
        text_content = f"{subject}\n\n{context.get('message', '')}"  

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
    except Exception as e:
        print(f"Email send error: {e}")
