from datetime import timedelta
import random
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError

from .managers import CustomUserManager


class CustomUser(AbstractUser):
    """
    Extends Django's AbstractUser to include additional user details,
    with email as the username field.
    """
    OCCUPATION_CHOICES = [
        ('Employed', 'Employed'),
        ('Unemployed', 'Unemployed'),
        ('Student', 'Student'),
        ('Other', 'Other'),
    ]
    
    id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False
    )

    first_name = models.CharField(max_length=255, blank=True)
    middle_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    occupation = models.CharField(max_length=255, blank=True, choices=OCCUPATION_CHOICES, default='Other')
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female')], default='Other')
    residential_address = models.TextField(blank=True)
    city = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=255, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True, help_text="Designates whether this user should be treated as active. Unselect this instead of deleting accounts.")
    country = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            )
        ],
        blank=True,
        null=True
    )
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    pin = models.CharField(max_length=4, blank=True, null=True)
    pin_verified = models.BooleanField(default=False)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(default=timezone.now)


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  
    
    objects = CustomUserManager()
    
    def generate_pin(self):
        """
        Generate a 4-digit PIN for the user.
        """
        self.pin = str(random.randint(1000, 9999))
        self.save()

    def __str__(self):
        return self.email


class UserSecurityInfo(models.Model):
    """
    Stores sensitive security information for a user.
    """
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='security_info')
    social_security_number = models.CharField(
        max_length=11,
        unique=True,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r'^\d{3}-\d{2}-\d{4}$',
                message="SSN must be entered in the format: '123-45-6789'."
            )
        ]
    )
    date_of_birth = models.DateField(blank=True, null=True)
    id_card_front = models.FileField(upload_to='id_card_images/', blank=True, null=True)
    id_card_back = models.FileField(upload_to='id_card_images/', blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Security Info for {self.user.username}"


class PaymentMethod(models.Model):
    CRYPTO_CHOICES = [
        ('BTC', 'Bitcoin'),
        ('ETH', 'Ethereum'),
        ('BNB', 'Binance Coin'),
        ('USDT', 'Tether'),
    ]

    NETWORK_CHOICES = [
        ('BTC', 'Bitcoin Network'),
        ('ETH', 'Ethereum Mainnet'),
        ('BSC', 'Binance Smart Chain'),
        ('TRC', 'Tron Network'),
    ]

    currency = models.CharField(max_length=10, choices=CRYPTO_CHOICES)
    network = models.CharField(max_length=20, choices=NETWORK_CHOICES)
    qr_image = models.ImageField(upload_to='payment_qr_codes/', blank=True, null=True)
    wallet_address = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('currency', 'network', 'wallet_address')

    def save(self, *args, **kwargs):
        valid_combinations = {
            'BTC': ['BTC'],
            'ETH': ['ETH'],
            'BNB': ['BSC'],
            'USDT': ['ETH', 'TRC'],
        }
        if self.network not in valid_combinations.get(self.currency, []):
            raise ValueError(f"Invalid network '{self.network}' for currency '{self.currency}'.")
        super().save(*args, **kwargs)


    def __str__(self):
        return f"{self.get_currency_display()} on {self.get_network_display()}"



class CreditTransaction(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='credit_transactions')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=[('PENDING', 'Pending'), ('COMPLETED', 'Completed'), ('FAILED', 'Failed')], default='PENDING')
    # Guards against crediting the wallet more than once when an admin approves.
    is_credited = models.BooleanField(default=False)
    transaction_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.email} - {self.amount} on {self.transaction_date.strftime('%Y-%m-%d %H:%M:%S')}"


class DebitTransaction(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='debit_transactions')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=[('PENDING', 'Pending'), ('COMPLETED', 'Completed'), ('FAILED', 'Failed')], default='PENDING')
    transaction_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.email} - {self.amount} on {self.transaction_date.strftime('%Y-%m-%d %H:%M:%S')}"

    def clean(self):
        if not self.pk:  # Only validate on creation
            wallet, _ = Wallet.objects.get_or_create(user=self.user)
            if self.amount <= 0:
                raise ValidationError("Amount must be greater than zero.")
            if self.amount > wallet.balance:
                raise ValidationError("Insufficient wallet balance.")

    def save(self, *args, **kwargs):
        if not self.pk:
            self.full_clean()  # Validate before saving
        super().save(*args, **kwargs)
        

class Wallet(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="wallet")
    account_number = models.CharField(max_length=10, unique=True, blank=True)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, default="GBP")

    def __str__(self):
        return f"{self.user.email}'s Wallet - Balance: {self.balance} {self.currency}"

    def save(self, *args, **kwargs):
        if not self.account_number:
            self.account_number = self.generate_account_number()
        super().save(*args, **kwargs)

    def generate_account_number(self):
        if self.user.phone_number:
            phone_digits = ''.join(filter(str.isdigit, self.user.phone_number))
            if len(phone_digits) >= 10:
                return phone_digits[-10:]
        return str(random.randint(10**9, 10**10 - 1))

    def deposit(self, amount):
        if amount > 0:
            self.balance += amount
            self.save()
            return True
        return False

    def withdraw(self, amount):
        if 0 < amount <= self.balance:
            self.balance -= amount
            self.save()
            return True
        return False





class DomesticTransfer(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('Savings', 'Savings'),
        ('Current', 'Current'),
        ('Business', 'Business'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='domestic_transfers') 
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    beneficiary_account_name = models.CharField(max_length=255)
    beneficiary_account_no = models.CharField(max_length=20)
    bank_name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=50, choices=ACCOUNT_TYPE_CHOICES)
    narration = models.TextField()
    created_date_time = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.beneficiary_account_name} - {self.amount}"


class WireTransfer(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('SAVINGS', 'Savings Account'),
        ('CURRENT', 'Current Account'),
        ('CHECKING', 'Checking Account'),
        ('FIXED', 'Fixed Deposit'),
        ('NON_RESIDENT', 'Non Resident Account'),
        ('ONLINE', 'Online Banking'),
        ('DOMICILIARY', 'Domiciliary Account'),
        ('JOINT', 'Joint Account'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='wire_transfers')  
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    beneficiary_account_name = models.CharField(max_length=255)
    beneficiary_account_no = models.CharField(max_length=50)
    bank_name = models.CharField(max_length=255)
    select_country = models.CharField(max_length=100)
    swift_code = models.CharField(max_length=11)
    routing_number = models.CharField(max_length=9, blank=True, null=True)
    account_type = models.CharField(max_length=50, choices=ACCOUNT_TYPE_CHOICES)
    narration_purpose = models.TextField(blank=True, null=True)
    created_date_time = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.beneficiary_account_name} - {self.amount} ({self.bank_name})"
    


class TransferOTP(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(default=timezone.now)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))
    
    

class VirtualCard(models.Model):

    CARD_PROVIDER_CHOICES = [
        ('VISA', 'Visa'),
        ('MASTERCARD', 'MasterCard'),
        ('AMEX', 'American Express'),
        ('DISCOVER', 'Discover'),
        ('JCB', 'JCB'),
    ]
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    card_number = models.CharField(max_length=16, unique=True)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00, help_text="Balance available on the card.", null=True, blank=True)
    expiry_date = models.DateField()
    cvv = models.CharField(max_length=3)
    card_provider = models.CharField(max_length=50, choices=CARD_PROVIDER_CHOICES, default='VISA')
    created_date_time = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Card ending in {self.card_number[-4:]} - {self.card_provider}"


class VirtualCardFunding(models.Model):
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="fundings")
    virtual_card = models.ForeignKey(VirtualCard, on_delete=models.CASCADE, related_name="fundings")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    funded_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Funding of ${self.amount} to {self.virtual_card}"
    

class Loan(models.Model):

    LOAN_PURPOSE_CHOICES = [
        ('PERSONAL', 'Personal'),
        ('MORTGAGE', 'Mortgage'),
        ('CAR', 'Car'),
        ('EDUCATION', 'Education'),
        ('BUSINESS', 'Business'),
        ('OTHER', 'Other'),
    ]
    
    
    borrower_name = models.CharField(max_length=255)
    loan_amount = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, blank=True)  
    loan_term_years = models.PositiveIntegerField()  
    purpose = models.CharField(max_length=50, choices=LOAN_PURPOSE_CHOICES)
    loan_date = models.DateField(default=timezone.now)  
    due_date = models.DateField()  

    def __str__(self):
        return f"Loan for {self.borrower_name} - {self.loan_amount} for {self.purpose}"

    def save(self, *args, **kwargs):

        if self.loan_amount <= 5000:
            self.interest_rate = 5.0  
        elif self.loan_amount <= 20000:
            self.interest_rate = 3.5  
        elif self.loan_amount <= 50000:
            self.interest_rate = 2.5  
        else:
            self.interest_rate = 1.5 


        if not self.due_date:
            self.due_date = self.loan_date.replace(year=self.loan_date.year + self.loan_term_years)
        
        super().save(*args, **kwargs)



class WithdrawalTransaction(models.Model):
    CRYPTO_CHOICES = [
        ('BTC', 'Bitcoin'),
        ('ETH', 'Ethereum'),
        ('BNB', 'Binance Coin'),
        ('USDT', 'Tether'),
    ]
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="withdrawals")

    amount = models.DecimalField( max_digits=20, decimal_places=8, help_text="Amount of cryptocurrency to transact.")
    crypto_type = models.CharField( max_length=10, choices=CRYPTO_CHOICES, help_text="Select the type of cryptocurrency." )
    wallet_address = models.CharField(max_length=255, help_text="The recipient's wallet address.", verbose_name="Wallet Address" )
    file_upload = models.FileField(upload_to='uploads/', blank=True,  null=True, )
    transaction_date = models.DateTimeField(default=timezone.now, help_text="The date and time when the transaction was created.")
    status = models.CharField(max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('COMPLETED', 'Completed'),
            ('FAILED', 'Failed'),
        ],
        default='PENDING',
        help_text="Status of the transaction."
    )
    created_date_time = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-transaction_date']  
        verbose_name = "Crypto Transaction"
        verbose_name_plural = "Withdrawal Transaction"

    def __str__(self):
        return f"{self.get_crypto_type_display()} - {self.amount} ({self.status})"
