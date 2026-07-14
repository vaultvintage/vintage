# utils.py
from bank.models import TransferOTP
from bank.utils.email_utils import send_transfer_email


def send_otp_to_user(user):
    otp = TransferOTP.generate_otp()
    TransferOTP.objects.create(user=user, otp_code=otp)

    # You could use an email, SMS, etc.
    send_transfer_email(
        subject="Your OTP Code",
        template_name="emails/transfer_otp.html",
        context={'otp': otp},
        recipient_email=user.email,
    )
