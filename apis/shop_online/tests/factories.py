from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

from shop_online.models import *

_counter = {"n": 0}


def _next_n():
    _counter["n"] += 1
    return _counter["n"]


def make_user(role=UserRole.CUSTOMER, **kwargs):
    n = _next_n()
    defaults = {
        "username": f"user{n}",
        "email": f"user{n}@example.com",
        "role": role,
        "phone": f"09{n:08d}"[:10],
    }
    defaults.update(kwargs)
    user = User(**defaults)
    user.set_password(kwargs.get("password", "Test@1234"))
    user.save()
    return user


def make_customer(**kwargs):
    return make_user(role=UserRole.CUSTOMER, **kwargs)


def make_admin(**kwargs):
    return make_user(role=UserRole.ADMIN, **kwargs)


def make_shipper(**kwargs):
    return make_user(role=UserRole.SHIPPER, **kwargs)


def make_category(**kwargs):
    n = _next_n()
    defaults = {"name": f"Danh mục {n}"}
    defaults.update(kwargs)
    return Category.objects.create(**defaults)


def make_brand(**kwargs):
    n = _next_n()
    defaults = {"name": f"Thương hiệu {n}"}
    defaults.update(kwargs)
    return Brand.objects.create(**defaults)


def make_product(category=None, brand=None, base_price=200000, **kwargs):
    n = _next_n()
    category = category or make_category()
    defaults = {
        "category": category,
        "brand": brand,
        "name": f"Sản phẩm {n}",
        "slug": f"san-pham-{n}",
        "base_price": Decimal(base_price),
        "status": ProductStatus.ACTIVE,
    }
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


def make_variant(product=None, stock_qty=10, size=SizeOption.M, color="Đen", **kwargs):
    product = product or make_product()
    defaults = {
        "product": product,
        "size": size,
        "color": color,
        "stock_qty": stock_qty,
    }
    defaults.update(kwargs)
    return ProductVariant.objects.create(**defaults)


def make_product_with_variant(stock_qty=10, base_price=200000):
    """Tiện dùng nhất cho các test cần 1 sản phẩm có thể mua ngay."""
    product = make_product(base_price=base_price)
    variant = make_variant(product=product, stock_qty=stock_qty)
    return product, variant


def make_address(user=None, is_default=True, **kwargs):
    user = user or make_customer()
    defaults = {
        "user": user,
        "recipient_name": "Nguyễn Văn A",
        "recipient_phone": "0912345678",
        "province": "TP.HCM",
        "district": "Quận 1",
        "ward": "Phường Bến Nghé",
        "detail_address": "123 Đường ABC",
        "is_default": is_default,
    }
    defaults.update(kwargs)
    return Address.objects.create(**defaults)


def make_cart_item(user, variant, quantity=1):
    return CartItem.objects.create(user=user, variant=variant, quantity=quantity)


def make_voucher(**kwargs):
    n = _next_n()
    now = timezone.now()
    defaults = {
        "code": f"VOUCHER{n}",
        "discount_type": DiscountType.PERCENT,
        "discount_value": Decimal(10),
        "min_order_value": Decimal(0),
        "usage_limit": 100,
        "start_date": now - timedelta(days=1),
        "end_date": now + timedelta(days=30),
    }
    defaults.update(kwargs)
    return Voucher.objects.create(**defaults)


def make_order(user=None, shipper=None, status=OrderStatus.PENDING,
               payment_method=PaymentMethod.COD, total_amount=200000, **kwargs):
    user = user or make_customer()
    n = _next_n()
    defaults = {
        "user": user,
        "shipper": shipper,
        "code": f"DH{n:08d}",
        "recipient_name": "Nguyễn Văn A",
        "recipient_phone": "0912345678",
        "shipping_address": "123 Đường ABC, Phường Bến Nghé, Quận 1, TP.HCM",
        "subtotal_amount": Decimal(total_amount),
        "total_amount": Decimal(total_amount),
        "payment_method": payment_method,
        "status": status,
    }
    defaults.update(kwargs)
    return Order.objects.create(**defaults)


def make_order_item(order=None, variant=None, quantity=1, **kwargs):
    order = order or make_order()
    variant = variant or make_variant()
    defaults = {
        "order": order,
        "variant": variant,
        "product_name": variant.product.name,
        "size": str(variant.size),
        "color": variant.color,
        "unit_price": variant.final_price,
        "quantity": quantity,
    }
    defaults.update(kwargs)
    return OrderItem.objects.create(**defaults)


def make_full_order(user=None, shipper=None, status=OrderStatus.DELIVERED, payment_method=PaymentMethod.COD,
                     stock_qty=10, quantity=1):
    """Tạo 1 đơn hàng đầy đủ: user, variant, order, order_item — dùng nhiều nhất."""
    user = user or make_customer()
    product, variant = make_product_with_variant(stock_qty=stock_qty)
    unit_price = variant.final_price
    order = make_order(
        user=user, shipper=shipper, status=status, payment_method=payment_method,
        total_amount=unit_price * quantity,
        subtotal_amount=unit_price * quantity,
    )
    item = make_order_item(order=order, variant=variant, quantity=quantity, unit_price=unit_price)
    return order, item


def make_payment(order, status=PaymentStatus.PENDING, method=PaymentMethod.PAYOS, **kwargs):
    defaults = {
        "order": order,
        "amount": order.total_amount,
        "method": method,
        "status": status,
    }
    defaults.update(kwargs)
    return Payment.objects.create(**defaults)


def make_review(user=None, product=None, order_item=None, rating=5, **kwargs):
    user = user or make_customer()
    product = product or make_product()
    defaults = {
        "user": user,
        "product": product,
        "order_item": order_item,
        "rating": rating,
        "comment": "Sản phẩm rất tốt",
    }
    defaults.update(kwargs)
    return Review.objects.create(**defaults)

def make_chat_room(customer=None, **kwargs):
    customer = customer or make_customer()
    defaults = {"customer": customer}
    defaults.update(kwargs)
    return ChatRoom.objects.create(**defaults)

def make_chat_message(room=None, sender=None, content="Xin chào", **kwargs):
    room = room or make_chat_room()
    sender = sender or room.customer
    defaults = {"room": room, "sender": sender, "content": content}
    defaults.update(kwargs)
    return ChatMessage.objects.create(**defaults)