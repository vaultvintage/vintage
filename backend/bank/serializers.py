from datetime import date, timedelta
from decimal import Decimal
import random
from rest_framework import serializers

from core import settings
from .models import CreditTransaction, CustomUser, DebitTransaction, DomesticTransfer, Loan, PaymentMethod, UserSecurityInfo, VirtualCard, VirtualCardFunding, Wallet, WireTransfer, WithdrawalTransaction
from rest_framework.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.contrib.auth import get_user_model
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.mail import EmailMultiAlternatives


class CreditTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditTransaction
        fields = ['id', 'user', 'amount', 'description', 'status', 'transaction_date']
        read_only_fields = ['id', 'status', 'transaction_date']


class DebitTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebitTransaction
        fields = ['id', 'user', 'amount', 'description','status', 'transaction_date']
        read_only_fields = ['id', 'transaction_date']


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'middle_name', 'last_name', 'occupation',
            'gender', 'residential_address', 'city', 'state', 'zip_code', 'country',
            'phone_number', 'profile_image', 'pin_verified', 'is_active', 'is_staff'
        ]
        read_only_fields = ['id', 'email', 'is_active', 'is_staff']

        

class CustomUserCreationSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a CustomUser instance with proper error handling.
    """
    class Meta:
        model = CustomUser
        fields = [
            'id',  
            'email', 'password', 'first_name', 'middle_name', 'last_name', 'phone_number', 'occupation', 'gender',
            'residential_address', 'city', 'state', 'zip_code',
            'country', 'profile_image'
        ]

        extra_kwargs = {
            'password': {'write_only': True},
            'profile_image': {'required': False} 
        }

    def create(self, validated_data):
        try:
            password = validated_data.pop('password', None)

            if 'username' not in validated_data:
                validated_data['username'] = validated_data['email'].split('@')[0]

            user = CustomUser(**validated_data)

            if password:
                user.set_password(password)
            user.save()
            user.generate_pin()
            return user
        except IntegrityError as e:
            if 'username' in str(e):
                raise ValidationError({"username": "A user with this username already exists."})
            if 'email' in str(e):
                raise ValidationError({"email": "A user with this email already exists."})
            if 'phone_number' in str(e):
                raise ValidationError({"phone_number": "A user with this phone number already exists."})
            raise ValidationError({"detail": "A database error occurred. Please try again."})




class UserSecurityInfoCreationSerializer(serializers.ModelSerializer):
    """
    Serializer for creating UserSecurityInfo for a given user.
    """

    id_card_front = serializers.FileField(required=False)
    id_card_back = serializers.FileField(required=False)

    class Meta:
        model = UserSecurityInfo
        fields = ['user', 'social_security_number', 'date_of_birth', 'id_card_front', 'id_card_back']
        extra_kwargs = {
            'user': {'write_only': True}
        }

    def create(self, validated_data):
        return UserSecurityInfo.objects.create(**validated_data)


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = '__all__'


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = '__all__'
        

class DomesticTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = DomesticTransfer
        fields = '__all__'
        read_only_fields = ['user'] 

class WireTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = WireTransfer
        fields = '__all__'
        read_only_fields = ['user']  

class VirtualCardSerializer(serializers.ModelSerializer):
    user_full_name = serializers.SerializerMethodField()
    user_address = serializers.SerializerMethodField()
    user_zipcode = serializers.SerializerMethodField()
    user_city = serializers.SerializerMethodField()
    user_state = serializers.SerializerMethodField()
    user_country = serializers.SerializerMethodField()
    user_phone_number = serializers.SerializerMethodField()

    class Meta:
        model = VirtualCard
        fields = [
            'card_number',
            'expiry_date',
            'cvv',
            'card_provider',
            'user_full_name',
            'user_address',
            'user_zipcode',
            'user_city',
            'user_state',
            'user_country',
            'user_phone_number',
        ]
        read_only_fields = [
            'card_number',
            'cvv',
            'expiry_date',
            'user_full_name',
            'user_address',
            'user_zipcode',
            'user_city',
            'user_state',
            'user_country',
            'user_phone_number',
        ]

    def get_user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.middle_name} {obj.user.last_name}".strip()

    def get_user_address(self, obj):
        return obj.user.residential_address or "No Address Provided"

    def get_user_zipcode(self, obj):
        return obj.user.zip_code or "No Zipcode Provided"

    def get_user_city(self, obj):
        return obj.user.city or "No City Provided"

    def get_user_state(self, obj):
        return obj.user.state or "No State Provided"

    def get_user_country(self, obj):
        return obj.user.country or "No Country Provided"

    def get_user_phone_number(self, obj):
        return obj.user.phone_number or "No Phone Number Provided"

    def create(self, validated_data):
        user = self.context['request'].user
        try:
            wallet = Wallet.objects.get(user=user)
        except Wallet.DoesNotExist:
            raise ValidationError("User does not have a wallet.")

        if not wallet.withdraw(Decimal("5.00")):
            raise ValidationError("Insufficient funds in wallet to create virtual card.")

        # Generate card details
        validated_data['card_number'] = ''.join([str(random.randint(0, 9)) for _ in range(16)])
        validated_data['cvv'] = ''.join([str(random.randint(0, 9)) for _ in range(3)])
        validated_data['expiry_date'] = date.today() + timedelta(days=5 * 365)
        validated_data['user'] = user

        return super().create(validated_data)




class VirtualCardFundingSerializer(serializers.ModelSerializer):
    class Meta:
        model = VirtualCardFunding
        fields = ['wallet', 'virtual_card', 'amount', 'funded_at']
        read_only_fields = ['funded_at']

    def validate(self, attrs):
        wallet = attrs['wallet']
        amount = attrs['amount']

        if wallet.balance < amount:
            raise serializers.ValidationError("Insufficient wallet balance to fund this card.")
        return attrs

    def create(self, validated_data):
        wallet = validated_data['wallet']
        amount = validated_data['amount']

        wallet.balance -= Decimal(amount)
        wallet.save()

        funding = VirtualCardFunding.objects.create(**validated_data)

        return funding
    
    

class LoanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = ['borrower_name', 'loan_amount', 'interest_rate', 'loan_term_years', 'purpose', 'loan_date', 'due_date']
        read_only_fields = ['loan_date', 'due_date']

    def validate(self, data):
        """
        Custom validation to ensure that the user has sufficient balance
        to apply for a loan.
        """
        user = self.context['request'].user  
        wallet = Wallet.objects.get(user=user) 


        if wallet.balance < 1000:
            raise ValidationError("You must have at least $1000 in your wallet to apply for a loan.")

        return data

    def create(self, validated_data):
        loan_date = validated_data.get('loan_date', date.today())
        loan_term_years = validated_data['loan_term_years']
        due_date = loan_date.replace(year=loan_date.year + loan_term_years)
        validated_data['due_date'] = due_date

        return super().create(validated_data)

    def update(self, instance, validated_data):
        loan_term_years = validated_data.get('loan_term_years', instance.loan_term_years)
        loan_date = instance.loan_date
        
        due_date = loan_date.replace(year=loan_date.year + loan_term_years)
        validated_data['due_date'] = due_date

        return super().update(instance, validated_data)


class PinVerificationSerializer(serializers.Serializer):
    pin = serializers.CharField(
        max_length=4, 
        min_length=4, 
        write_only=True, 
        error_messages={
            'max_length': 'PIN must be 4 digits.',
            'min_length': 'PIN must be 4 digits.'
        }
    )



class WithdrawalSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0.00000001'))
    crypto_type = serializers.ChoiceField(choices=WithdrawalTransaction.CRYPTO_CHOICES)
    wallet_address = serializers.CharField(max_length=255)
    
    def validate_amount(self, value):
        """
        Ensure that the withdrawal amount is not more than the wallet balance.
        """
        user_wallet = self.context['request'].user.wallet  
        if value > user_wallet.balance:
            raise serializers.ValidationError("Insufficient balance for withdrawal.")
        return value

    def create(self, validated_data):
        """
        Creates a WithdrawalTransaction instance and performs the withdrawal.
        """
        user_wallet = self.context['request'].user.wallet  
        amount = validated_data['amount']
        crypto_type = validated_data['crypto_type']
        wallet_address = validated_data['wallet_address']
        

        if not user_wallet.withdraw(amount):
            raise serializers.ValidationError("Failed to withdraw funds.")
        

        transaction = WithdrawalTransaction.objects.create(
            user=self.context['request'].user,
            amount=amount,
            crypto_type=crypto_type,
            wallet_address=wallet_address,
            status='PENDING'  
        )
        
        return transaction
    
User = get_user_model()

class SuperUserCreationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        return User.objects.create_superuser(**validated_data)
    

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        return value

    def save(self):
        email = self.validated_data['email']
        user = User.objects.get(email=email)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"https://vintagebank.com/password-reset/{uid}/{token}/"

        # Context for the template
        context = {
            'user': user,
            'reset_url': reset_url,
            'support_email': 'support@firstrevoluteinc.com',
            'company_name': 'Vintage Bank'
        }

        # Render HTML content
        html_content = render_to_string('emails/password_reset.html', context)
        text_content = strip_tags(html_content)  # Fallback text version

        # Create email
        msg = EmailMultiAlternatives(
            subject="Password Reset Request",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        return reset_url
    

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, data):
        try:
            uid = urlsafe_base64_decode(data['uid']).decode()
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError):
            raise serializers.ValidationError("Invalid user.")

        if not default_token_generator.check_token(user, data['token']):
            raise serializers.ValidationError("Invalid or expired token.")

        return {'user': user, 'new_password': data['new_password']}

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
