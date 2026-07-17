from django.db import migrations, models


def usd_to_gbp(apps, schema_editor):
    Wallet = apps.get_model("bank", "Wallet")
    Wallet.objects.filter(currency="USD").update(currency="GBP")


def gbp_to_usd(apps, schema_editor):
    Wallet = apps.get_model("bank", "Wallet")
    Wallet.objects.filter(currency="GBP").update(currency="USD")


class Migration(migrations.Migration):

    dependencies = [
        ("bank", "0014_credittransaction_is_credited"),
    ]

    operations = [
        migrations.AlterField(
            model_name="wallet",
            name="currency",
            field=models.CharField(default="GBP", max_length=3),
        ),
        migrations.RunPython(usd_to_gbp, gbp_to_usd),
    ]
