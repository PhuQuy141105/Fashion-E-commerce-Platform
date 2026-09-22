from celery import shared_task
from shop_online.models import *
from shop_online import utils
@shared_task
def check_pending_refunds():
    payments = Payment.objects.filter(status=PaymentStatus.REFUND_PENDING, active=True).exclude(gateway_response__isnull=True)
    for payment in payments:
        utils.check_and_confirm_payout(payment)
    return f"Checked {payments.count()} pending refund payments"
# @shared_task
# def check_low_stock():
#     variants = ProductVariant.objects.filter(active = True, stock_qty__lte=10)
#     for variant in variants:
#         utils.notify_low_stock(variant)
#     return f"Checked {variants.count()} product of variants have low stock quantity"