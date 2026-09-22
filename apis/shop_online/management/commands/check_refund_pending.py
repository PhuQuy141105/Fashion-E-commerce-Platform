from django.core.management.base import BaseCommand
from shop_online.models import Payment, PaymentStatus
from shop_online import utils

class Command(BaseCommand):
    help = "Kiểm tra các Payment đang REFUND_PENDING đã có payout_id, xác nhận tự động khi payOS báo SUCCEEDED"
    def handle(self, *args, **options):
        payments = Payment.objects.filter( status=PaymentStatus.REFUND_PENDING, active=True).exclude(gateway_response__isnull=True)
        for payment in payments:
            utils.check_and_confirm_payout(payment)
        self.stdout.write(self.style.SUCCESS(f"Checked {payments.count()} pending refund payments"))