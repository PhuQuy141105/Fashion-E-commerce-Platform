from django.conf import settings
from decimal import Decimal
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from datetime import timedelta
from shop_online.models import *
from payos import PayOS
import hmac
import hashlib
import json
import requests
from urllib.parse import quote
from firebase_admin import db
from shop_online import stylist
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

def send_order_email(order, subject, template_name, extra_context=None):
    user = order.user
    if not getattr(user, "email", None):
        return

    context = {
        "user": user,
        "display_name": user.first_name or user.username,
        "order": order,
        "items": order.items.filter(active=True).select_related("variant"),
    }

    if extra_context:
        context.update(extra_context)

    try:
        html_content = render_to_string(f"email/{template_name}", context)
        text_content = strip_tags(html_content)

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )

        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=True)

    except Exception as e:
        print(f"Gửi mail thất bại cho đơn {order.code}: {e}")


def notify_new_order(order):
    Notification.objects.create(
        user=order.user,
        type=NotificationType.ORDER,
        title="Bạn đã đặt đơn hàng",
        body=f"Đơn hàng {order.code} đã được đặt thành công",
        ref_id=order.pk,
    )

    if order.shipper:
        Notification.objects.create(
            user=order.shipper,
            type=NotificationType.ORDER,
            title="Đơn hàng mới cần giao",
            body=f"Bạn được phân công giao đơn hàng {order.code}.",
            ref_id=order.pk,
        )

    admins = User.objects.filter(
        is_active=True,
        role=UserRole.ADMIN
    )

    for admin in admins:
        Notification.objects.create(
            user=admin,
            type=NotificationType.ORDER,
            title="Đơn hàng mới",
            body=f"Đơn hàng {order.code} vừa được tạo.",
            ref_id=order.pk,
        )


def notify_payment_success(order):
    Notification.objects.create(
        user=order.user,
        type=NotificationType.ORDER,
        title="Thanh toán thành công",
        body=f"Đơn hàng {order.code} đã thanh toán thành công.",
        ref_id=order.pk,
    )

    send_order_email(
        order,
        subject=f"[Fuwuys Shop] Thanh toán thành công - {order.code}",
        template_name="payment_success.html",
    )


def notify_order_packing(order):
    Notification.objects.create(
        user=order.user,
        type=NotificationType.ORDER,
        title="Đơn hàng đang được đóng gói",
        body=f"Đơn hàng {order.code} đã được xác nhận và đang được đóng gói.",
        ref_id=order.pk,
    )

    send_order_email(
        order,
        subject=f"[Fuwuys Shop] Đơn hàng đang được đóng gói - {order.code}",
        template_name="order_packing.html"
    )

    if order.shipper:
        Notification.objects.create(
            user=order.shipper,
            type=NotificationType.ORDER,
            title="Đơn hàng sẵn sàng giao",
            body=f"Đơn hàng {order.code} đã sẵn sàng để giao.",
            ref_id=order.pk
        )


def notify_order_shipping(order):
    Notification.objects.create(
        user=order.user,
        type=NotificationType.ORDER,
        title="Đơn hàng đang được giao",
        body=f"Đơn hàng {order.code} đang trên đường giao đến bạn",
        ref_id=order.pk,
    )

    send_order_email(
        order,
        subject=f"[Fuwuys Shop] Đơn hàng đang được giao - {order.code}",
        template_name="order_shipping.html"
    )


def notify_order_delivered(order):
    Notification.objects.create(
        user=order.user,
        type=NotificationType.ORDER,
        title="Giao hàng thành công",
        body=f"Đơn hàng {order.code} đã được giao thành công",
        ref_id=order.pk,
    )

    send_order_email(
        order,
        subject=f"[Fuwuys Shop] Giao hàng thành công - {order.code}",
        template_name="order_delivered.html"
    )

    admins = User.objects.filter(
        is_active=True,
        role=UserRole.ADMIN
    )

    for admin in admins:
        Notification.objects.create(
            user=admin,
            type=NotificationType.ORDER,
            title="Đơn hàng đã giao thành công",
            body=f"Đơn hàng {order.code} đã được giao thành công",
            ref_id=order.pk,
        )


def assign_random_shipper():
    shipper = User.objects.filter(
        is_active=True,
        role=UserRole.SHIPPER
    ).order_by('?').first()

    return shipper


def confirm_order_and_assign_shipper(order):
    order.shipper = assign_random_shipper()
    order.save(update_fields=['shipper'])
    notify_new_order(order)


def get_shop_point():
    return Point(
        settings.SHOP_LONGITUDE,
        settings.SHOP_LATITUDE,
        srid=4326
    )

def geocode_address(province, district, ward, detail_address):
    attempts = [
        f"{detail_address}, {ward}, {district}, {province}, Việt Nam",
        f"{ward}, {district}, {province}, Việt Nam",
        f"{district}, {province}, Việt Nam",
    ]
    for query in attempts:
        try:
            response = requests.get(
                NOMINATIM_URL,
                params={"q": query, "format": "json", "limit": 1},
                headers={"User-Agent": "ShopOnlineApp-DoAn/1.0"},
                timeout=5,
            )
            response.raise_for_status()
            results = response.json()
            if results:
                lat = float(results[0]["lat"])
                lon = float(results[0]["lon"])
                return Point(lon, lat, srid=4326)
        except (requests.RequestException, ValueError, KeyError, IndexError):
            continue
    return None

def estimate_delivery_days(distance_km):
    if distance_km <= 10:
        return 1
    elif distance_km <= 50:
        return 2
    elif distance_km <= 300:
        return 3

    return 5


def calculate_shipping_fee(distance_km):
    if distance_km <= 10:
        return Decimal("20000")
    elif distance_km <= 50:
        return Decimal("30000")
    elif distance_km <= 300:
        return Decimal("50000")
    else:
        extra_km = Decimal(str(distance_km)) - 300
        return Decimal("50000") + extra_km * Decimal("2000")


def calculate_shipping_info(order_date, address: Address):
    shop_point = get_shop_point()

    result = Address.objects.filter(
        pk=address.pk
    ).annotate(
        distance=Distance('location', shop_point)
    ).first()

    distance_km = result.distance if result.distance is not None else 0
    fee = calculate_shipping_fee(distance_km)
    days = estimate_delivery_days(distance_km)
    expected_days = (order_date + timedelta(days=days)).date()

    return fee, expected_days


def restore_stock(order):
    for item in order.items.filter(
        active=True
    ).select_related('variant'):
        variant = item.variant
        variant.stock_qty += item.quantity
        variant.save(update_fields=['stock_qty'])


def cancel_order_payment(order):
    payment = getattr(order, 'payment', None)

    admins = User.objects.filter(
        is_active=True,
        role=UserRole.ADMIN
    )

    if order.payment_method == PaymentMethod.COD:
        Notification.objects.create(
            user=order.user,
            type=NotificationType.ORDER,
            title="Hủy đơn hàng thành công",
            body=f"Đơn hàng {order.code} đã được hủy.",
            ref_id=order.pk
        )

        send_order_email(
            order,
            subject=f"[Fuwuys Shop] Đơn hàng đã được hủy - {order.code}",
            template_name="order_cancelled.html",
            extra_context={"refund_pending": False}
        )

        for admin in admins:
            Notification.objects.create(
                user=admin,
                type=NotificationType.ORDER,
                title="Đơn bị hủy",
                body=f"Khách hàng đã hủy đơn hàng {order.code}",
                ref_id=order.pk
            )

        if order.shipper:
            Notification.objects.create(
                user=order.shipper,
                type=NotificationType.ORDER,
                title="Đơn hàng đã bị huỷ",
                body=f"Đơn hàng {order.code} bạn được gán đã bị huỷ.",
                ref_id=order.pk
            )

        return

    if payment.status == PaymentStatus.PENDING:
        if (
            order.payment_method == PaymentMethod.PAYOS
            and payment.transaction_id
        ):
            client = PayOS(
                client_id=settings.PAYOS_CLIENT_ID,
                api_key=settings.PAYOS_API_KEY,
                checksum_key=settings.PAYOS_CHECKSUM_KEY
            )

            client.payment_requests.cancel(
                payment.transaction_id,
                cancellationReason="Khách hàng huỷ đơn hàng"
            )

        payment.status = PaymentStatus.CANCELLED
        payment.save(update_fields=['status'])

        Notification.objects.create(
            user=order.user,
            type=NotificationType.ORDER,
            title="Hủy đơn hàng thành công",
            body=f"Đơn hàng {order.code} đã được hủy.",
            ref_id=order.pk
        )

        send_order_email(
            order,
            subject=f"[Fashion Shop] Đơn hàng đã được hủy - {order.code}",
            template_name="order_cancelled.html",
            extra_context={"refund_pending": False}
        )

        if order.shipper:
            Notification.objects.create(
                user=order.shipper,
                type=NotificationType.ORDER,
                title="Đơn hàng đã bị huỷ",
                body=f"Đơn hàng {order.code} bạn được gán đã bị huỷ.",
                ref_id=order.pk
            )

        return

    if payment.status == PaymentStatus.PAID:
        payment.status = PaymentStatus.REFUND_PENDING
        payment.save(update_fields=['status'])

        for admin in admins:
            Notification.objects.create(
                user=admin,
                type=NotificationType.ORDER,
                title="Yêu cầu hoàn tiền",
                body=(
                    f"Đơn hàng {order.code} đã được hủy "
                    f"nhưng đã thanh toán. "
                    f"Cần thực hiện hoàn tiền "
                    f"{int(payment.amount):,}đ cho khách hàng."
                ),
                ref_id=order.pk,
            )

        Notification.objects.create(
            user=order.user,
            type=NotificationType.ORDER,
            title="Đơn hàng đã được hủy",
            body=(
                f"Đơn hàng {order.code} đã được hủy. "
                f"Khoản tiền {int(payment.amount):,}đ đang chờ được hoàn lại."
            ),
            ref_id=order.pk,
        )

        send_order_email(
            order,
            subject=f"[Fashion Shop] Đơn hàng đã được hủy - {order.code}",
            template_name="order_cancelled.html",
            extra_context={
                "refund_pending": True,
                "refund_amount": payment.amount
            }
        )

        if order.shipper:
            Notification.objects.create(
                user=order.shipper,
                type=NotificationType.ORDER,
                title="Đơn hàng đã bị huỷ",
                body=f"Đơn hàng {order.code} bạn được gán đã bị huỷ.",
                ref_id=order.pk
            )

        create_payos_payout(payment)
        return


def cancel_order(order, reason=""):
    order.status = OrderStatus.CANCELLED
    update_fields = ['status']

    if reason:
        order.cancel_reason = reason
        update_fields.append('cancel_reason')

    order.save(update_fields=update_fields)

    restore_stock(order)
    cancel_order_payment(order)


def build_payout_signature(body):
    sorted_items = sorted(body.items())

    data = "&".join(
        f"{key}={quote(str(value), safe='')}"
        for key, value in sorted_items
    )

    return hmac.new(
        settings.PAYOS_PAYOUT_CHECKSUM_KEY.encode("utf-8"),
        data.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def create_payos_payout(payment):
    order = payment.order
    user = order.user

    if not user.bank_bin or not user.bank_account_number:
        notify_missing_bank_info(order)
        return None

    reference_id = f"REFUND{order.code}"

    body = {
        "referenceId": reference_id,
        "amount": int(payment.amount),
        "description": f"Hoan tien {order.code}"[:25],
        "toBin": user.bank_bin,
        "toAccountNumber": user.bank_account_number,
    }

    headers = {
        "x-client-id": settings.PAYOS_PAYOUT_CLIENT_ID,
        "x-api-key": settings.PAYOS_PAYOUT_API_KEY,
        "x-idempotency-key": reference_id,
        "x-signature": build_payout_signature(body),
        "Content-Type": "application/json",
    }

    try:
        res = requests.post(
            f"{settings.PAYOS_API_BASE}/v1/payouts",
            json=body,
            headers=headers,
            timeout=15
        )

        result = res.json()
        print(result)
    except Exception as e:
        notify_payout_failed(
            order,
            f"Lỗi kết nối tới payOS: {e}"
        )
        print(e)
        return None

    if result["code"] != "00":
        notify_payout_failed(order, result["desc"])
        return None

    payout_id = result["data"]["id"]
    payment.transaction_id = reference_id
    payment.gateway_response = {
        "payout_id": payout_id
    }

    payment.save(
        update_fields=[
            'transaction_id',
            'gateway_response'
        ]
    )

    return payout_id


def notify_missing_bank_info(order):
    admins = User.objects.filter(
        is_active=True,
        role=UserRole.ADMIN
    )

    for admin in admins:
        Notification.objects.create(
            user=admin,
            type=NotificationType.ORDER,
            title="Không thể tự động hoàn tiền",
            body=(
                f"Đơn hàng {order.code} chưa có thông tin ngân hàng "
                f"của khách để hoàn tiền tự động"
            ),
            ref_id=order.pk,
        )


def notify_payout_failed(order, reason):
    admins = User.objects.filter(
        is_active=True,
        role=UserRole.ADMIN
    )

    for admin in admins:
        Notification.objects.create(
            user=admin,
            type=NotificationType.ORDER,
            title="Hoàn tiền tự động thất bại",
            body=f"Đơn hàng {order.code}: {reason}",
            ref_id=order.pk,
        )


def notify_low_stock(variant):
    admins = User.objects.filter(
        is_active=True,
        role=UserRole.ADMIN
    )

    product = variant.product

    for admin in admins:
        Notification.objects.create(
            user=admin,
            type=NotificationType.SYSTEM,
            title="Biến thể sắp hết hàng",
            body=(
                f"Biến thể màu {variant.color} với size {variant.size} "
                f"của sản phẩm {product.name} chỉ còn với số lượng "
                f"{variant.stock_qty}"
            ),
            ref_id=variant.pk
        )


def confirm_refund(payment):
    payment.status = PaymentStatus.REFUNDED
    payment.save(update_fields=['status'])

    order = payment.order

    Notification.objects.create(
        user=order.user,
        type=NotificationType.ORDER,
        title="Hoàn tiền thành công",
        body=(
            f"Đơn hàng {order.code} đã được hoàn tiền thành công "
            f"{int(payment.amount):}đ"
        ),
        ref_id=order.pk,
    )

    send_order_email(
        order,
        subject=f"[Fuwuys Shop] Hoàn tiền thành công - {order.code}",
        template_name="refund_completed.html",
        extra_context={"refund_amount": payment.amount}
    )


def check_and_confirm_payout(payment):
    payout_id = payment.gateway_response.get("payout_id")

    if not payout_id:
        return

    headers = {
        "x-client-id": settings.PAYOS_PAYOUT_CLIENT_ID,
        "x-api-key": settings.PAYOS_PAYOUT_API_KEY,
    }

    try:
        res = requests.get(
            f"{settings.PAYOS_API_BASE}/v1/payouts/{payout_id}",
            headers=headers,
            timeout=15
        )

        result = res.json()
        print(result)

    except Exception:
        return

    if result["code"] != "00":
        return

    approval_state = result["data"]["approvalState"]

    if approval_state == "COMPLETED":
        confirm_refund(payment)

    elif approval_state in ("FAILED", "REJECTED"):
        notify_payout_failed(
            payment.order,
            "Lệnh chi hoàn tiền bị payOS từ chối hoặc thất bại"
        )


def push_message_to_firebase(message):
    ref = db.reference(
        f'chat_rooms/{message.room_id}/messages/{message.id}'
    )

    ref.set({
        'id': message.id,
        'sender_id': message.sender_id,
        'sender_name': (
            message.sender.first_name
            if message.sender
            else 'Đã xoá'
        ),
        'content': message.content,
        'attachment': (
            message.attachment.url
            if message.attachment
            else None
        ),
        'is_read': message.is_read,
        'created_at': message.created_at.isoformat(),
    })


def run_ai_stylist_query(user, query_text, previous_session=None):
    previous_criteria = previous_session.ai_requirements if previous_session else None
    criteria = stylist.extract_criteria(query_text, previous_criteria=previous_criteria)
    if not criteria.is_fashion_related:
        session = AIStylistSession.objects.create(user=user,query_text=query_text,ai_requirements=criteria.model_dump())
        return session
    if criteria.needs_clarification:
        session = AIStylistSession.objects.create(
            user=user,
            query_text=query_text,
            occasion=criteria.occasion or "",
            budget_min=criteria.budget_min,
            budget_max=criteria.budget_max,
            style_preference=criteria.style_preference or "",
            ai_requirements=criteria.model_dump(),
        )
        return session
    candidates = stylist.retrieve_candidate_products(criteria)
    recommendation = stylist.generate_recommendations(query_text,candidates)
    session = AIStylistSession.objects.create(
        user=user,
        query_text=query_text,
        occasion=criteria.occasion or "",
        budget_min=criteria.budget_min,
        budget_max=criteria.budget_max,
        style_preference=criteria.style_preference or "",
        ai_requirements=criteria.model_dump(),
    )
    valid_ids = {p.id for p in candidates}
    rank = 0
    for item in recommendation.items:
        if item.product_id not in valid_ids:
            continue
        rank += 1
        AIStylistRecommendationItem.objects.create(
            session=session,
            product_id=item.product_id,
            reason=item.reason,
            rank_order=rank,
        )
    return session