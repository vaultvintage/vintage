from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CreditTransactionAPIView, CustomUserCreationAPIView, DebitTransactionAPIView, DomesticTransferAPIView, DomesticTransferListView, FundVirtualCardAPIView, InitiateTransferOTPAPIView, LoanAPIView, LoginAPIView, PasswordResetConfirmView, PasswordResetRequestView, PaymentMethodAPIView, SuperUserCreationAPIView, UserAPIView, UserReceiptAPIView, UserSecurityInfoCreationAPIView, VerifyPinView, VirtualCardAPIView, WalletAPIView, WireTransferAPIView, WireTransferListView, WithdrawalAPIView

urlpatterns = [
    path('auth/register/', CustomUserCreationAPIView.as_view()),
    path('auth/login/', LoginAPIView.as_view()),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('users/', UserAPIView.as_view()),  
    path('users/<uuid:id>/', UserAPIView.as_view()),  
    
    path('register/security-info/', UserSecurityInfoCreationAPIView.as_view()),

    path('payment-methods/', PaymentMethodAPIView.as_view()),
    path('payment-methods/<int:pk>/', PaymentMethodAPIView.as_view()),

    path('domestic-transfers/', DomesticTransferAPIView.as_view()),
    path('domestic-transfers/<int:pk>/', DomesticTransferAPIView.as_view()),
    
    path('wire/transfers/', WireTransferAPIView.as_view()),

    path('wallet/', WalletAPIView.as_view()),

    path('my/domestic-transfers/', DomesticTransferListView.as_view()),
    path('my/wire-transfers/', WireTransferListView.as_view()),

    path('virtual-cards/', VirtualCardAPIView.as_view()),
    path('virtual-cards/<int:pk>/', VirtualCardAPIView.as_view()),
    path('virtual-cards/fund/', FundVirtualCardAPIView.as_view()),

    path('loans/', LoanAPIView.as_view()),
    path('loans/<int:pk>/', LoanAPIView.as_view()),

    path('verify-pin/', VerifyPinView.as_view()),

    path('withdrawals/', WithdrawalAPIView.as_view()),
    path('withdraw/<int:pk>/', WithdrawalAPIView.as_view()),


    path('create-superuser/', SuperUserCreationAPIView.as_view(), name='create-superuser'),

    path('password-reset/', PasswordResetRequestView.as_view()),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view()),

    path('transfers/initiate-otp/', InitiateTransferOTPAPIView.as_view(), name='initiate-transfer-otp'),

    path('receipts/<str:receipt_type>/<int:pk>/', UserReceiptAPIView.as_view(), name='user-receipt'),

    path('credits/', CreditTransactionAPIView.as_view(), name='credit-list-create'),
    path('credits/<int:pk>/', CreditTransactionAPIView.as_view(), name='credit-detail'),

    path('debits/', DebitTransactionAPIView.as_view(), name='credit-list-create'),
    path('debits/<int:pk>/', DebitTransactionAPIView.as_view(), name='credit-detail'),
]
