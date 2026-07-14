from bank.models import CreditTransaction, CustomUser, DebitTransaction, Wallet
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=CustomUser)
def create_wallet(sender, instance, created, **kwargs):
    """
    Signal to automatically create a wallet when a user is created.
    """
    if created:  
        Wallet.objects.create(user=instance)


@receiver(post_save, sender=CreditTransaction)
def handle_credit_transaction(sender, instance, created, **kwargs):
    """
    Deposits are NOT credited automatically. They stay PENDING until an admin
    marks them COMPLETED, at which point the amount is added to the wallet — once.
    """
    if instance.status == "COMPLETED" and not instance.is_credited:
        wallet, _ = Wallet.objects.get_or_create(user=instance.user)
        wallet.deposit(instance.amount)
        # Use .update() to flip the flag without re-triggering this signal.
        CreditTransaction.objects.filter(pk=instance.pk).update(is_credited=True)


@receiver(post_save, sender=DebitTransaction)
def handle_debit_transaction(sender, instance, created, **kwargs):
    if created and instance.status == "PENDING":
        wallet, _ = Wallet.objects.get_or_create(user=instance.user)
        success = wallet.withdraw(instance.amount)
        instance.status = "COMPLETED" if success else "FAILED"
        instance.save(update_fields=["status"])