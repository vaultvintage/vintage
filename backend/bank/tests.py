from decimal import Decimal

from django.contrib import admin
from django.test import override_settings
from django.test import TestCase
from django.test.client import RequestFactory
from django.urls import resolve, reverse
from rest_framework.test import APIClient

from .models import CreditTransaction, CustomUser, DebitTransaction, VirtualCard, Wallet


class CreditTransactionApprovalTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="depositor@example.com",
            password="safe-test-password",
            phone_number="+15551234567",
        )
        self.wallet = Wallet.objects.get(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_user_created_deposit_stays_pending_even_if_status_is_submitted(self):
        response = self.client.post(
            "/api/v1/credits/",
            {
                "user": str(self.user.id),
                "amount": "125.00",
                "description": "Crypto deposit",
                "status": "COMPLETED",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        transaction = CreditTransaction.objects.get(pk=response.data["id"])
        self.assertEqual(transaction.status, "PENDING")
        self.assertFalse(transaction.is_credited)

        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal("0.00"))

    def test_user_cannot_mark_pending_deposit_completed_through_api(self):
        transaction = CreditTransaction.objects.create(
            user=self.user,
            amount=Decimal("75.00"),
            description="Awaiting payment",
        )

        response = self.client.put(
            f"/api/v1/credits/{transaction.id}/",
            {"status": "COMPLETED"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        transaction.refresh_from_db()
        self.assertEqual(transaction.status, "PENDING")
        self.assertFalse(transaction.is_credited)

        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal("0.00"))

    def test_admin_approval_credits_wallet_once(self):
        transaction = CreditTransaction.objects.create(
            user=self.user,
            amount=Decimal("250.00"),
            description="Confirmed payment",
        )

        transaction.status = "COMPLETED"
        transaction.save()
        transaction.refresh_from_db()
        self.wallet.refresh_from_db()

        self.assertTrue(transaction.is_credited)
        self.assertEqual(self.wallet.balance, Decimal("250.00"))

        transaction.save()
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal("250.00"))


class ReceiptAdminTests(TestCase):
    def setUp(self):
        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@example.com",
            password="safe-test-password",
            username="admin",
        )
        self.user = CustomUser.objects.create_user(
            email="customer@example.com",
            password="safe-test-password",
            username="customer",
            first_name="Ada",
            last_name="Lovelace",
            phone_number="+15557654321",
        )
        self.wallet = Wallet.objects.get(user=self.user)
        self.wallet.balance = Decimal("500.00")
        self.wallet.save(update_fields=["balance"])
        self.credit = CreditTransaction.objects.create(
            user=self.user,
            amount=Decimal("300.00"),
            description="Crypto deposit",
            status="COMPLETED",
        )
        self.debit = DebitTransaction.objects.create(
            user=self.user,
            amount=Decimal("45.00"),
            description="Wallet debit",
        )
        self.client.force_login(self.admin_user)
        self.factory = RequestFactory()

    def admin_receipt_response(self, model, view_name, obj):
        request = self.factory.get(
            reverse(f"admin:bank_{model._meta.model_name}_{view_name}", args=[obj.pk])
        )
        request.user = self.admin_user
        model_admin = admin.site._registry[model]
        if view_name.endswith("download"):
            return model_admin.receipt_download_view(request, str(obj.pk))
        return model_admin.receipt_view(request, str(obj.pk))

    def test_credit_receipt_view_renders_mobile_template(self):
        url = reverse("admin:bank_credittransaction_receipt", args=[self.credit.pk])

        response = self.admin_receipt_response(CreditTransaction, "receipt", self.credit)

        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        self.assertIn("Vintage Bank", content)
        self.assertIn("VB-DEP-", content)
        self.assertIn("Crypto deposit", content)
        self.assertIn("width: 390px", content)
        self.assertIn("Print / PDF", content)

    def test_debit_receipt_download_uses_attachment_response(self):
        url = reverse("admin:bank_debittransaction_receipt_download", args=[self.debit.pk])

        response = self.admin_receipt_response(
            DebitTransaction, "receipt_download", self.debit
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("attachment;", response["Content-Disposition"])
        self.assertIn(".html", response["Content-Disposition"])
        content = response.content.decode()
        self.assertIn("Debit", content)
        self.assertIn("Wallet debit", content)
        self.assertIn("Mobile PDF-ready", content)

    def test_receipt_urls_resolve_for_credit_and_debit_admins(self):
        urls = [
            reverse("admin:bank_credittransaction_receipt", args=[self.credit.pk]),
            reverse("admin:bank_credittransaction_receipt_download", args=[self.credit.pk]),
            reverse("admin:bank_debittransaction_receipt", args=[self.debit.pk]),
            reverse("admin:bank_debittransaction_receipt_download", args=[self.debit.pk]),
        ]

        for url in urls:
            with self.subTest(url=url):
                match = resolve(url)
                self.assertIsNotNone(match.func)

    def test_debit_admin_changelist_renders(self):
        response = self.client.get(reverse("admin:bank_debittransaction_changelist"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Receipt")


@override_settings(ALLOWED_HOSTS=["testserver"])
class VirtualCardApiTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="cardholder@example.com",
            password="safe-test-password",
            username="cardholder",
        )
        self.wallet = Wallet.objects.get(user=self.user)
        self.wallet.balance = Decimal("25.00")
        self.wallet.save(update_fields=["balance"])
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_user_can_create_virtual_card_with_decimal_fee(self):
        response = self.client.post(
            "/api/v1/virtual-cards/",
            {"card_provider": "VISA"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(VirtualCard.objects.filter(user=self.user).count(), 1)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal("20.00"))

    def test_virtual_card_creation_requires_fee_balance(self):
        self.wallet.balance = Decimal("4.99")
        self.wallet.save(update_fields=["balance"])

        response = self.client.post(
            "/api/v1/virtual-cards/",
            {"card_provider": "VISA"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(VirtualCard.objects.filter(user=self.user).count(), 0)
