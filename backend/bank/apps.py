from django.apps import AppConfig


class BankConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'bank'

    def ready(self):
        from .django_compat import patch_template_context_copy

        patch_template_context_copy()
        import bank.signals
