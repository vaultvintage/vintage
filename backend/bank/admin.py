from django.contrib import admin
from django.contrib.admin.templatetags.admin_urls import admin_urlquote
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponse
from django.template.loader import render_to_string
from django.urls import path, reverse
from django.utils.html import format_html
from django.utils.text import slugify

from .models import (
    CreditTransaction,
    CustomUser,
    DebitTransaction,
    UserSecurityInfo,
    PaymentMethod,
    Wallet,
    DomesticTransfer,
    WireTransfer,
    VirtualCard,
    VirtualCardFunding,
    Loan,
    WithdrawalTransaction,
)


class ReceiptAdminMixin:
    receipt_kind = "Transaction"
    receipt_amount_label = "Amount"
    receipt_amount_prefix = ""

    def get_urls(self):
        opts = self.model._meta
        custom_urls = [
            path(
                "<path:object_id>/receipt/",
                self.admin_site.admin_view(self.receipt_view),
                name=f"{opts.app_label}_{opts.model_name}_receipt",
            ),
            path(
                "<path:object_id>/receipt/download/",
                self.admin_site.admin_view(self.receipt_download_view),
                name=f"{opts.app_label}_{opts.model_name}_receipt_download",
            ),
        ]
        return custom_urls + super().get_urls()

    @admin.display(description="Receipt")
    def receipt_link(self, obj):
        opts = self.model._meta
        view_url = reverse(
            f"admin:{opts.app_label}_{opts.model_name}_receipt",
            args=[admin_urlquote(obj.pk)],
        )
        download_url = reverse(
            f"admin:{opts.app_label}_{opts.model_name}_receipt_download",
            args=[admin_urlquote(obj.pk)],
        )
        return format_html(
            '<a href="{}" target="_blank">View</a> &nbsp; '
            '<a href="{}">Download</a>',
            view_url,
            download_url,
        )

    def receipt_view(self, request, object_id):
        return self._render_receipt(request, object_id, download=False)

    def receipt_download_view(self, request, object_id):
        return self._render_receipt(request, object_id, download=True)

    def _render_receipt(self, request, object_id, download):
        obj = self.get_object(request, object_id)
        if obj is None:
            raise Http404(f"{self.model._meta.verbose_name.title()} not found")
        if not self.has_view_or_change_permission(request, obj):
            raise PermissionDenied

        user = obj.user
        wallet = getattr(user, "wallet", None)
        receipt_id = f"VB-{self.receipt_kind[:3].upper()}-{obj.pk:06d}"
        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": f"{self.receipt_kind} receipt",
            "transaction": obj,
            "receipt_kind": self.receipt_kind,
            "receipt_id": receipt_id,
            "amount_label": self.receipt_amount_label,
            "amount_prefix": self.receipt_amount_prefix,
            "customer": user,
            "wallet": wallet,
            "is_download": download,
            "receipt_status": obj.status,
            "receipt_date": obj.transaction_date,
            "receipt_description": obj.description or "Not provided",
            "receipt_extra_rows": [],
            "processed_by": "Vintage Bank Admin",
            "generated_from": "Generated from Vintage Bank Admin.",
        }
        response = HttpResponse(render_to_string("admin/bank/receipt.html", context))
        if download:
            filename = slugify(f"{receipt_id}-{user.email}") or receipt_id.lower()
            response["Content-Disposition"] = f'attachment; filename="{filename}.html"'
        return response


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'phone_number', 'occupation', 'gender')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    list_filter = ('occupation', 'gender', 'is_active', 'is_staff')
    ordering = ('email',)


@admin.register(UserSecurityInfo)
class UserSecurityInfoAdmin(admin.ModelAdmin):
    list_display = ('user', 'social_security_number', 'date_of_birth')
    search_fields = ('user__email', 'social_security_number')


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('currency', 'network', 'wallet_address')
    search_fields = ('currency', 'wallet_address')
    list_filter = ('currency', 'network')


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'account_number', 'balance', 'currency')
    search_fields = ('user__email', 'account_number')
    list_filter = ('currency',)


@admin.register(DomesticTransfer)
class DomesticTransferAdmin(admin.ModelAdmin):
    list_display = ('user', 'beneficiary_account_name', 'amount', 'bank_name')
    search_fields = ('user__email', 'beneficiary_account_name', 'bank_name')
    list_filter = ('account_type',)


@admin.register(WireTransfer)
class WireTransferAdmin(admin.ModelAdmin):
    list_display = ('user', 'beneficiary_account_name', 'amount', 'bank_name', 'select_country', 'account_type')
    search_fields = ('user__email', 'beneficiary_account_name', 'bank_name')
    list_filter = ('account_type', 'select_country')


@admin.register(VirtualCard)
class VirtualCardAdmin(admin.ModelAdmin):
    list_display = ('user', 'card_number', 'expiry_date', 'card_provider')
    search_fields = ('user__email', 'card_number')
    list_filter = ('card_provider',)


@admin.register(VirtualCardFunding)
class VirtualCardFundingAdmin(admin.ModelAdmin):
    list_display = ('wallet', 'virtual_card', 'amount', 'funded_at')
    search_fields = ('wallet__user__email', 'virtual_card__card_number')
    list_filter = ('funded_at',)


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ('borrower_name', 'loan_amount', 'interest_rate', 'loan_term_years', 'purpose', 'loan_date', 'due_date')
    search_fields = ('borrower_name', 'purpose')
    list_filter = ('purpose', 'loan_date', 'due_date')


@admin.register(WithdrawalTransaction)
class WithdrawalTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'crypto_type', 'amount', 'wallet_address', 'transaction_date', 'status')
    search_fields = ('user__email', 'wallet_address')
    list_filter = ('crypto_type', 'status', 'transaction_date')



@admin.register(CreditTransaction)
class CreditTransactionAdmin(ReceiptAdminMixin, admin.ModelAdmin):
    receipt_kind = "Deposit"
    receipt_amount_label = "Deposit amount"
    receipt_amount_prefix = "+"
    list_display = ('user', 'amount', 'status', 'is_credited', 'description', 'transaction_date', 'receipt_link')
    list_filter = ('status', 'is_credited', 'transaction_date')
    search_fields = ('user__email', 'description')
    list_editable = ('status',)
    readonly_fields = ('is_credited',)
    actions = ('approve_deposits', 'mark_failed')

    @admin.action(description="Approve selected deposits (credit wallet)")
    def approve_deposits(self, request, queryset):
        approved = 0
        for tx in queryset.exclude(status="COMPLETED"):
            tx.status = "COMPLETED"
            tx.save()  # triggers the signal, which credits the wallet once
            approved += 1
        self.message_user(request, f"{approved} deposit(s) approved and credited.")

    @admin.action(description="Mark selected deposits as failed")
    def mark_failed(self, request, queryset):
        updated = queryset.exclude(status="COMPLETED").update(status="FAILED")
        self.message_user(request, f"{updated} deposit(s) marked as failed.")


@admin.register(DebitTransaction)
class DebitTransactionAdmin(ReceiptAdminMixin, admin.ModelAdmin):
    receipt_kind = "Debit"
    receipt_amount_label = "Debit amount"
    receipt_amount_prefix = "-"
    list_display = ['user', 'amount', 'status', 'transaction_date', 'receipt_link']
    list_filter = ('status', 'transaction_date')
    search_fields = ('user__email', 'description')
