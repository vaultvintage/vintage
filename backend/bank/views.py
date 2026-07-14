from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404
from django.http import Http404, HttpResponse
from django.template.loader import render_to_string
from django.utils.text import slugify
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
from bank.models import CreditTransaction, CustomUser, DebitTransaction, DomesticTransfer, Loan, PaymentMethod, TransferOTP, VirtualCard, Wallet, WireTransfer, WithdrawalTransaction
from bank.notifications import Notification
from bank.utils.email_utils import send_transfer_email
from django.utils.timezone import now

from bank.utils.otp import send_otp_to_user
from .serializers import (
    CreditTransactionSerializer,
    CustomUserCreationSerializer, 
    CustomUserSerializer,
    DebitTransactionSerializer, 
    DomesticTransferSerializer, 
    LoanSerializer, 
    PasswordResetConfirmSerializer, 
    PasswordResetRequestSerializer, 
    PaymentMethodSerializer, 
    PinVerificationSerializer, 
    SuperUserCreationSerializer, 
    UserSecurityInfoCreationSerializer, 
    VirtualCardFundingSerializer, 
    VirtualCardSerializer, 
    WalletSerializer, 
    WireTransferSerializer, 
    WithdrawalSerializer
    )



class BaseTransactionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    model = None
    serializer_class = None

    def get_queryset(self, request):
        return self.model.objects.filter(user=request.user).order_by('-transaction_date')

    def get_object(self, pk, request):
        return get_object_or_404(self.model, pk=pk, user=request.user)

    def get(self, request, pk=None):
        if pk:
            instance = self.get_object(pk, request)
            serializer = self.serializer_class(instance)
            return Response(serializer.data)
        queryset = self.get_queryset(request)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        if not pk:
            return Response({"detail": "Transaction ID is required for update."}, status=status.HTTP_400_BAD_REQUEST)
        instance = self.get_object(pk, request)
        serializer = self.serializer_class(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not pk:
            return Response({"detail": "Transaction ID is required for deletion."}, status=status.HTTP_400_BAD_REQUEST)
        instance = self.get_object(pk, request)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CreditTransactionAPIView(BaseTransactionAPIView):
    from .models import CreditTransaction
    from .serializers import CreditTransactionSerializer

    model = CreditTransaction
    serializer_class = CreditTransactionSerializer


class DebitTransactionAPIView(BaseTransactionAPIView):
    from .models import DebitTransaction
    from .serializers import DebitTransactionSerializer

    model = DebitTransaction
    serializer_class = DebitTransactionSerializer


class UserReceiptAPIView(APIView):
    permission_classes = [IsAuthenticated]

    receipt_config = {
        "credits": {
            "model": CreditTransaction,
            "kind": "Deposit",
            "label": "Deposit amount",
            "prefix": "+",
            "date_field": "transaction_date",
            "description": lambda obj: obj.description or "Account deposit",
            "extra_rows": lambda obj: [],
        },
        "debits": {
            "model": DebitTransaction,
            "kind": "Debit",
            "label": "Debit amount",
            "prefix": "-",
            "date_field": "transaction_date",
            "description": lambda obj: obj.description or "Account debit",
            "extra_rows": lambda obj: [],
        },
        "domestic": {
            "model": DomesticTransfer,
            "kind": "Domestic transfer",
            "label": "Transfer amount",
            "prefix": "-",
            "date_field": "created_date_time",
            "description": lambda obj: obj.narration or "Domestic transfer",
            "extra_rows": lambda obj: [
                ("Beneficiary", obj.beneficiary_account_name),
                ("Beneficiary account", obj.beneficiary_account_no),
                ("Bank", obj.bank_name),
                ("Account type", obj.account_type),
            ],
        },
        "wire": {
            "model": WireTransfer,
            "kind": "Wire transfer",
            "label": "Transfer amount",
            "prefix": "-",
            "date_field": "created_date_time",
            "description": lambda obj: obj.narration_purpose or "Wire transfer",
            "extra_rows": lambda obj: [
                ("Beneficiary", obj.beneficiary_account_name),
                ("Beneficiary account", obj.beneficiary_account_no),
                ("Bank", obj.bank_name),
                ("Country", obj.select_country),
                ("SWIFT", obj.swift_code),
                ("Routing number", obj.routing_number or "Not provided"),
                ("Account type", obj.account_type),
            ],
        },
        "withdrawals": {
            "model": WithdrawalTransaction,
            "kind": "Crypto withdrawal",
            "label": "Withdrawal amount",
            "prefix": "-",
            "date_field": "transaction_date",
            "description": lambda obj: f"{obj.get_crypto_type_display()} withdrawal",
            "extra_rows": lambda obj: [
                ("Crypto", obj.get_crypto_type_display()),
                ("Wallet address", obj.wallet_address),
            ],
        },
    }

    def get(self, request, receipt_type, pk):
        config = self.receipt_config.get(receipt_type)
        if not config:
            raise Http404("Receipt type not found")

        transaction_obj = get_object_or_404(config["model"], pk=pk, user=request.user)
        download = request.query_params.get("download") == "1"
        wallet = getattr(request.user, "wallet", None)
        receipt_id = f"VB-{config['kind'][:3].upper()}-{transaction_obj.pk:06d}"
        receipt_date = getattr(transaction_obj, config["date_field"])
        receipt_status = getattr(transaction_obj, "status", "COMPLETED")

        context = {
            "title": f"{config['kind']} receipt",
            "transaction": transaction_obj,
            "receipt_kind": config["kind"],
            "receipt_id": receipt_id,
            "amount_label": config["label"],
            "amount_prefix": config["prefix"],
            "customer": request.user,
            "wallet": wallet,
            "is_download": download,
            "receipt_status": receipt_status,
            "receipt_date": receipt_date,
            "receipt_description": config["description"](transaction_obj),
            "receipt_extra_rows": config["extra_rows"](transaction_obj),
            "processed_by": "Vintage Bank",
            "generated_from": "Generated from Vintage Bank.",
        }
        response = HttpResponse(render_to_string("admin/bank/receipt.html", context))
        if download:
            filename = slugify(f"{receipt_id}-{request.user.email}") or receipt_id.lower()
            response["Content-Disposition"] = f'attachment; filename="{filename}.html"'
        return response



# views.py
class InitiateTransferOTPAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        send_otp_to_user(request.user)
        return Response({'message': 'OTP has been sent to your email'}, status=status.HTTP_200_OK)




class SuperUserCreationAPIView(APIView):
    """
    API endpoint to create a superuser.
    """
    def post(self, request):
        serializer = SuperUserCreationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Superuser created successfully!'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class CustomUserCreationAPIView(APIView):
    """
    API for creating a CustomUser and sending notifications.
    """
    def post(self, request, *args, **kwargs):
        serializer = CustomUserCreationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            Notification.send_welcome_email(user)

            return Response(
                {
                    "message": "User created successfully.",
                    "user": serializer.data,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserAPIView(APIView):
    """
    API view for handling Retrieve, Update, and Delete operations on CustomUser.
    """

    def get(self, request, id=None):
        """
        Retrieve a single user if ID is provided, otherwise return all users.
        """
        if id:
            # Get specific user by ID
            user = get_object_or_404(CustomUser, id=id)
            serializer = CustomUserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # Get all users
            users = CustomUser.objects.all()
            serializer = CustomUserSerializer(users, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, id):
        """
        Update user information for the given ID.
        """
        user = get_object_or_404(CustomUser, id=id)
        serializer = CustomUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        """
        Delete a user by ID.
        """
        user = get_object_or_404(CustomUser, id=id)
        user.delete()
        return Response({"detail": "User deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class UserSecurityInfoCreationAPIView(APIView):
    """
    API for creating UserSecurityInfo for an existing user.
    """
    authentication_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):

        serializer = UserSecurityInfoCreationSerializer(data=request.data)
        parser_classes = (MultiPartParser, FormParser)
        
        if serializer.is_valid():
            security_info = serializer.save()
            return Response(
                {"message": "User security info created successfully.", "security_info": serializer.data},
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    

class LoginAPIView(APIView):
    """
    API for user login. Generates and returns refresh and access tokens upon successful login.
    """
    def post(self, request, *args, **kwargs):
        identifier = request.data.get("username", "").strip()
        password = request.data.get("password", "").strip()

        if not identifier or not password:
            return Response(
                {"detail": "Email/phone number and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = None
        if '@' in identifier:  
            user = CustomUser.objects.filter(email=identifier).first()
        else:  
            user = CustomUser.objects.filter(phone_number=identifier).first()

        if not user or not user.check_password(password):
            return Response(
                {"detail": "Invalid email/phone number or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)


        ip_address = self.get_client_ip(request)


        Notification.send_login_notification(user, ip_address)

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "is_active": user.is_active,
                    "is_staff": user.is_staff,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "occupation": user.occupation,
                    "gender": user.gender,
                    "residential_address": user.residential_address,
                    "city": user.city,
                    "state": user.state,
                    "zip_code": user.zip_code,
                    "country": user.country,
                }
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def get_client_ip(request):
        """
        Extracts the client's IP address from the request.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR', '')
        return ip



class PaymentMethodAPIView(APIView):
    """
    APIView for managing PaymentMethod instances.
    Supports CRUD operations: Create, Retrieve, Update, and Delete.
    """
    def get(self, request, pk=None):
        """
        Retrieve a list of all PaymentMethods or a specific PaymentMethod by ID.
        """
        if pk:
            try:
                payment_method = PaymentMethod.objects.get(pk=pk)
                serializer = PaymentMethodSerializer(payment_method)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except PaymentMethod.DoesNotExist:
                return Response({'error': 'PaymentMethod not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            payment_methods = PaymentMethod.objects.all()
            serializer = PaymentMethodSerializer(payment_methods, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Create a new PaymentMethod and return success or error messages.
        """
        serializer = PaymentMethodSerializer(data=request.data)
        if serializer.is_valid():
            try:

                serializer.save()
                return Response({
                    'message': 'PaymentMethod created successfully',
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
            except ValueError as e:

                return Response({
                    'error': 'Validation Error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        else:

            return Response({
                'error': 'Validation Error',
                'message': 'Invalid data provided',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


    def put(self, request, pk):
        """
        Update an existing PaymentMethod by ID.
        """
        try:
            payment_method = PaymentMethod.objects.get(pk=pk)
        except PaymentMethod.DoesNotExist:
            return Response({'error': 'PaymentMethod not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PaymentMethodSerializer(payment_method, data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Delete a PaymentMethod by ID.
        """
        try:
            payment_method = PaymentMethod.objects.get(pk=pk)
            payment_method.delete()
            return Response({'message': 'PaymentMethod deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except PaymentMethod.DoesNotExist:
            return Response({'error': 'PaymentMethod not found'}, status=status.HTTP_404_NOT_FOUND)
        

class WalletAPIView(APIView):
    """
    APIView for managing Wallets.
    Supports Create, Retrieve, Update, and Delete operations.
    """

    permission_classes = [IsAuthenticated]  # Ensure only authenticated users can access this view

    def get(self, request, pk=None):
        """
        Retrieve wallet for the authenticated user or a specific wallet by ID (if provided).
        """

        if pk:
            wallet = get_object_or_404(Wallet, pk=pk, user=request.user)
            serializer = WalletSerializer(wallet)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:

            wallet = Wallet.objects.filter(user=request.user).first()
            if wallet:
                serializer = WalletSerializer(wallet)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response({"message": "Wallet not found."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        """
        Create a new wallet for the authenticated user (if one does not exist).
        """
        if Wallet.objects.filter(user=request.user).exists():
            return Response({"message": "Wallet already exists."}, status=status.HTTP_400_BAD_REQUEST)

        data = {
            'user': request.user.id,  # Automatically associate wallet with the authenticated user
            'balance': 0.00,
            'currency': 'USD',
        }
        serializer = WalletSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        """
        Update an existing wallet by ID for the authenticated user.
        """
        wallet = get_object_or_404(Wallet, pk=pk, user=request.user)
        serializer = WalletSerializer(wallet, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Delete a wallet by ID for the authenticated user.
        """
        wallet = get_object_or_404(Wallet, pk=pk, user=request.user)
        wallet.delete()
        return Response({"message": "Wallet deleted successfully"}, status=status.HTTP_204_NO_CONTENT)



class FundVirtualCardAPIView(generics.CreateAPIView):
    serializer_class = VirtualCardFundingSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):

        wallet = self.request.user.wallet
        return {'wallet': wallet}

    def perform_create(self, serializer):
        wallet = self.request.user.wallet
        virtual_card_id = self.request.data.get('virtual_card')

        try:
            virtual_card = VirtualCard.objects.get(id=virtual_card_id)
        except VirtualCard.DoesNotExist:
            return Response({"error": "Invalid virtual card."}, status=status.HTTP_404_NOT_FOUND)

        serializer.save(wallet=wallet, virtual_card=virtual_card)


        
class DomesticTransferAPIView(APIView):
    """
    APIView for managing Domestic Transfers.
    Supports Create, Retrieve, Update, and Delete operations.
    """

    def get(self, request, pk=None):
        """
        Retrieve all DomesticTransfers or a specific DomesticTransfer by ID.
        """
        if pk:
            try:
                transfer = DomesticTransfer.objects.get(pk=pk, user=request.user)
                serializer = DomesticTransferSerializer(transfer)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except DomesticTransfer.DoesNotExist:
                return Response({'error': 'Domestic Transfer not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            transfers = DomesticTransfer.objects.filter(user=request.user)
            serializer = DomesticTransferSerializer(transfers, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)


    # Inside DomesticTransferAPIView.post()
    def post(self, request):
        otp_code = request.data.get('otp')
        if not otp_code:
            return Response({'error': 'OTP is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_record = TransferOTP.objects.filter(user=request.user, otp_code=otp_code, is_used=False).latest('created_at')
            if otp_record.is_expired():
                return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
        except TransferOTP.DoesNotExist:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = DomesticTransferSerializer(data=request.data)
        if serializer.is_valid():
            user_wallet = Wallet.objects.get(user=request.user)
            transfer_amount = serializer.validated_data['amount']

            if user_wallet.balance >= transfer_amount:
                user_wallet.withdraw(transfer_amount)
                serializer.save(user=request.user)

                otp_record.is_used = True
                otp_record.save()

                send_transfer_email(...)  # as before

                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Insufficient funds in wallet'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



    def put(self, request, pk):
        """
        Update an existing Domestic Transfer by ID.
        """
        try:
            transfer = DomesticTransfer.objects.get(pk=pk, user=request.user)
        except DomesticTransfer.DoesNotExist:
            return Response({'error': 'Domestic Transfer not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DomesticTransferSerializer(transfer, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(user=request.user)  
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Delete a Domestic Transfer by ID.
        """
        try:
            transfer = DomesticTransfer.objects.get(pk=pk, user=request.user)
            transfer.delete()
            return Response({'message': 'Domestic Transfer deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except DomesticTransfer.DoesNotExist:
            return Response({'error': 'Domestic Transfer not found'}, status=status.HTTP_404_NOT_FOUND)


        

class WireTransferAPIView(APIView):
    """
    APIView for managing WireTransfer instances with authentication.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """
        Retrieve wire transfers for the authenticated user
        """
        if pk:
            try:
                # Only allow access to transfers owned by the user
                wire_transfer = WireTransfer.objects.get(pk=pk, user=request.user)
                serializer = WireTransferSerializer(wire_transfer)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except WireTransfer.DoesNotExist:
                return Response(
                    {'error': 'WireTransfer not found or not authorized'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Return all transfers for the current user
            wire_transfers = WireTransfer.objects.filter(user=request.user)
            serializer = WireTransferSerializer(wire_transfers, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        otp_code = request.data.get('otp')
        if not otp_code:
            return Response({'error': 'OTP is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_record = TransferOTP.objects.filter(user=request.user, otp_code=otp_code, is_used=False).latest('created_at')
            if otp_record.is_expired():
                return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
        except TransferOTP.DoesNotExist:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = WireTransferSerializer(data=request.data)
        if serializer.is_valid():
            amount = serializer.validated_data.get('amount', 0)

            wallet = getattr(request.user, 'wallet', None)
            if not wallet:
                return Response({'error': 'Wallet not found for user'}, status=status.HTTP_400_BAD_REQUEST)

            if wallet.balance < amount:
                return Response({'error': 'Insufficient funds in wallet'}, status=status.HTTP_400_BAD_REQUEST)

            # Withdraw amount atomically - use the withdraw method you defined
            if not wallet.withdraw(amount):
                return Response({'error': 'Failed to withdraw amount from wallet'}, status=status.HTTP_400_BAD_REQUEST)

            wire_transfer = serializer.save(user=request.user)

            # Mark OTP as used after successful transfer (optional but recommended)
            otp_record.is_used = True
            otp_record.save()

            send_transfer_email(
                subject="Wire Transfer Confirmation",
                template_name="emails/wire_transfer_success.html",
                context={
                    'user': request.user,
                    'amount': amount,
                    'beneficiary_account_name': serializer.validated_data['beneficiary_account_name'],
                    'beneficiary_account_no': serializer.validated_data['beneficiary_account_no'],
                    'bank_name': serializer.validated_data['bank_name'],
                    'select_country': serializer.validated_data['select_country'],
                    'swift_code': serializer.validated_data['swift_code'],
                    'routing_number': serializer.validated_data.get('routing_number', ''),
                    'account_type': serializer.validated_data['account_type'],
                    'narration_purpose': serializer.validated_data.get('narration_purpose', ''),
                    'date': now().strftime("%Y-%m-%d %H:%M:%S"),
                },
                recipient_email=request.user.email
            )

            return Response({
                'message': 'WireTransfer created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'error': 'Validation Error',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)




    def put(self, request, pk):
        """
        Update an existing WireTransfer (only if owned by user)
        """
        try:
            wire_transfer = WireTransfer.objects.get(pk=pk, user=request.user)
        except WireTransfer.DoesNotExist:
            return Response(
                {'error': 'WireTransfer not found or not authorized'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = WireTransferSerializer(wire_transfer, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'WireTransfer updated successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        return Response({
            'error': 'Validation Error',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Delete a WireTransfer (only if owned by user)
        """
        try:
            wire_transfer = WireTransfer.objects.get(pk=pk, user=request.user)
            wire_transfer.delete()
            return Response(
                {'message': 'WireTransfer deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
        except WireTransfer.DoesNotExist:
            return Response(
                {'error': 'WireTransfer not found or not authorized'},
                status=status.HTTP_404_NOT_FOUND
            )



class DomesticTransferListView(generics.ListAPIView):
    serializer_class = DomesticTransferSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DomesticTransfer.objects.filter(user=self.request.user)



class WireTransferListView(generics.ListAPIView):
    serializer_class = WireTransferSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WireTransfer.objects.filter(user=self.request.user)
    


class VirtualCardAPIView(APIView):
    """
    API for managing Virtual Cards.
    Supports Create, Retrieve, and List operations.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            try:
                card = VirtualCard.objects.get(pk=pk, user=request.user) 
                serializer = VirtualCardSerializer(card)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except VirtualCard.DoesNotExist:
                return Response({'error': 'Card not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            cards = VirtualCard.objects.filter(user=request.user) 
            serializer = VirtualCardSerializer(cards, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        card_provider = request.data.get('card_provider', None)

        if card_provider not in ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER', 'JCB']:
            return Response({'error': 'Invalid card provider'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VirtualCardSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Virtual card created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            card = VirtualCard.objects.get(pk=pk, user=request.user)  
            card.delete()
            return Response({'message': 'Card deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except VirtualCard.DoesNotExist:
            return Response({'error': 'Card not found'}, status=status.HTTP_404_NOT_FOUND)

        

class LoanAPIView(APIView):
    """
    API for managing Loans.
    Supports Create, Retrieve, and List operations.
    """
    def get(self, request, pk=None):
        """
        Retrieve a list of all loans or a specific loan by ID.
        """
        if pk:
            try:
                loan = Loan.objects.get(pk=pk)
                serializer = LoanSerializer(loan)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Loan.DoesNotExist:
                return Response({'error': 'Loan not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            loans = Loan.objects.all()
            serializer = LoanSerializer(loans, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Create a new loan with all necessary fields.
        """
        serializer = LoanSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Delete a loan by ID.
        """
        try:
            loan = Loan.objects.get(pk=pk)
            loan.delete()
            return Response({'message': 'Loan deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Loan.DoesNotExist:
            return Response({'error': 'Loan not found'}, status=status.HTTP_404_NOT_FOUND)
        



class VerifyPinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user 
        serializer = PinVerificationSerializer(data=request.data)

        if serializer.is_valid():
            pin = serializer.validated_data['pin']
            if user.pin == pin:  
                user.pin_verified = True 
                user.save()
                return Response({"message": "PIN verified successfully."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid PIN."}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class WithdrawalAPIView(APIView):
    """
    API view to handle cryptocurrency withdrawal requests.
    """

    def post(self, request):
        """
        Handles the POST request for a withdrawal transaction.
        It performs validation and then processes the withdrawal.
        """
        serializer = WithdrawalSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():

            transaction = serializer.create(serializer.validated_data)
            return Response(
                {"message": "Withdrawal request submitted successfully.", "transaction_id": transaction.id},
                status=status.HTTP_201_CREATED
            )
        else:

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """
        Retrieves all withdrawal transactions for the authenticated user.
        """

        transactions = WithdrawalTransaction.objects.filter(user=request.user)
        data = [
            {
                "id": transaction.id,
                "amount": transaction.amount,
                "crypto_type": transaction.get_crypto_type_display(),
                "wallet_address": transaction.wallet_address,
                "status": transaction.status,
                "transaction_date": transaction.transaction_date,
            }
            for transaction in transactions
        ]
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """
        Handles the PUT request to update the status of a withdrawal transaction.
        Only an admin or the user who created the transaction can update it.
        """
        try:
            transaction = WithdrawalTransaction.objects.get(pk=pk)
        except WithdrawalTransaction.DoesNotExist:
            return Response({"error": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)


        if request.user != transaction.user and not request.user.is_staff:
            return Response({"error": "You cannot update this transaction."}, status=status.HTTP_403_FORBIDDEN)


        transaction.status = request.data.get("status", transaction.status)
        transaction.save()

        return Response({"message": "Transaction updated successfully."}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """
        Handles the DELETE request to cancel a withdrawal transaction.
        Only an admin or the user who created the transaction can delete it.
        """
        try:
            transaction = WithdrawalTransaction.objects.get(pk=pk)
        except WithdrawalTransaction.DoesNotExist:
            return Response({"error": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)


        if request.user != transaction.user and not request.user.is_staff:
            return Response({"error": "You cannot delete this transaction."}, status=status.HTTP_403_FORBIDDEN)


        transaction.delete()

        return Response({"message": "Transaction canceled successfully."}, status=status.HTTP_204_NO_CONTENT)



class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password reset email sent."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class PasswordResetConfirmView(APIView):
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
