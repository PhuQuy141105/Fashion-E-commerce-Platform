from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.urls import path
from django.shortcuts import render
from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from datetime import timedelta
from .models import (Order, OrderItem, Product, ProductVariant, User, Review, Voucher,Payment, Remittance, OrderStatus, PaymentStatus, PaymentMethod, UserRole,)

@staff_member_required
def stats_view(request):
    now = timezone.now()
    today = now.date()
    month_start = today.replace(day=1)
    last_7_days = today - timedelta(days=6)
    delivered_orders = Order.objects.filter(active=True, status=OrderStatus.DELIVERED)
    total_revenue = delivered_orders.aggregate(total=Sum('total_amount'))['total'] or 0
    today_revenue = delivered_orders.filter(delivered_at__date=today).aggregate(total=Sum('total_amount'))['total'] or 0
    month_revenue = delivered_orders.filter(delivered_at__date__gte=month_start).aggregate(total=Sum('total_amount'))['total'] or 0
    avg_order_value = delivered_orders.aggregate(avg=Avg('total_amount'))['avg'] or 0
    daily_revenue_qs = (
        delivered_orders.filter(delivered_at__date__gte=last_7_days)
        .values('delivered_at__date')
        .annotate(total=Sum('total_amount'))
        .order_by('delivered_at__date')
    )
    daily_revenue_map = {row['delivered_at__date']: row['total'] for row in daily_revenue_qs}
    daily_revenue = [
        {'date': (last_7_days + timedelta(days=i)), 'total': daily_revenue_map.get(last_7_days + timedelta(days=i), 0)}
        for i in range(7)
    ]
    max_daily_revenue = max((d['total'] for d in daily_revenue), default=0) or 1

    total_orders = Order.objects.filter(active=True).count()
    status_rows = Order.objects.filter(active=True).values('status').annotate(count=Count('id'))
    status_map = {row['status'].value if hasattr(row['status'], 'value') else row['status']: row['count'] for row in status_rows}

    STATUS_LABELS = {
        'PENDING': 'Chờ xác nhận', 'PACKING': 'Đang đóng gói', 'SHIPPING': 'Đang giao',
        'DELIVERED': 'Đã giao', 'CANCELLED': 'Đã huỷ',
    }
    order_status_breakdown = [
        {'key': key, 'label': STATUS_LABELS.get(key, key), 'count': status_map.get(key, 0)}
        for key in ['PENDING', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED']
    ]

    cancelled_count = status_map.get('CANCELLED', 0)
    cancellation_rate = round((cancelled_count / total_orders * 100), 1) if total_orders > 0 else 0

    top_products = (
        OrderItem.objects.filter(active=True, order__active=True, order__status=OrderStatus.DELIVERED)
        .values('variant__product__id', 'variant__product__name')
        .annotate(total_sold=Sum('quantity'), total_revenue=Sum(F('quantity') * F('unit_price')))
        .order_by('-total_sold')[:10]
    )

    payment_method_rows = Order.objects.filter(active=True).values('payment_method').annotate(count=Count('id'))
    PAYMENT_METHOD_LABELS = {'COD': 'Tiền mặt (COD)', 'PAYOS': 'PayOS'}
    payment_method_breakdown = [
        {'label': PAYMENT_METHOD_LABELS.get(row['payment_method'].value if hasattr(row['payment_method'], 'value') else row['payment_method'], row['payment_method']), 'count': row['count']}
        for row in payment_method_rows
    ]
    payment_status_rows = Payment.objects.filter(active=True).values('status').annotate(count=Count('id'))
    PAYMENT_STATUS_LABELS = {
        'PENDING': 'Chờ thanh toán', 'PAID': 'Đã thanh toán', 'CANCELLED': 'Đã huỷ',
        'REFUND_PENDING': 'Chờ hoàn tiền', 'REFUNDED': 'Đã hoàn tiền', 'FAILED': 'Thất bại',
    }
    payment_status_breakdown = [
        {'label': PAYMENT_STATUS_LABELS.get(row['status'].value if hasattr(row['status'], 'value') else row['status'], row['status']), 'count': row['count']}
        for row in payment_status_rows
    ]

    top_vouchers = Voucher.objects.filter(active=True, used_count__gt=0).order_by('-used_count')[:5]

    visible_reviews = Review.objects.filter(active=True, is_hidden=False)
    avg_rating = round(visible_reviews.aggregate(avg=Avg('rating'))['avg'] or 0, 2)
    total_reviews = visible_reviews.count()

    cod_pending_amount = Order.objects.filter(active=True, payment_method=PaymentMethod.COD, status=OrderStatus.DELIVERED, cod_remitted=False).aggregate(total=Sum('total_amount'))['total'] or 0
    cod_remitted_amount = Remittance.objects.filter(active=True).aggregate(total=Sum('total_amount'))['total'] or 0

    low_stock_products = (
        Product.objects.filter(active=True)
        .annotate(stock=Sum('variants__stock_qty', filter=Q(variants__active=True)))
        .filter(Q(stock__lt=10) | Q(stock__isnull=True))
        .order_by('stock')[:10]
    )

    total_customers = User.objects.filter(role=UserRole.CUSTOMER).count()
    new_customers_month = User.objects.filter(role=UserRole.CUSTOMER, date_joined__date__gte=month_start).count()

    context = {
        **admin.site.each_context(request),
        'title': 'Thống kê tổng quan',
        'total_revenue': total_revenue,
        'today_revenue': today_revenue,
        'month_revenue': month_revenue,
        'avg_order_value': avg_order_value,
        'daily_revenue': daily_revenue,
        'max_daily_revenue': max_daily_revenue,
        'total_orders': total_orders,
        'order_status_breakdown': order_status_breakdown,
        'cancellation_rate': cancellation_rate,
        'top_products': top_products,
        'payment_method_breakdown': payment_method_breakdown,
        'payment_status_breakdown': payment_status_breakdown,
        'top_vouchers': top_vouchers,
        'avg_rating': avg_rating,
        'total_reviews': total_reviews,
        'cod_pending_amount': cod_pending_amount,
        'cod_remitted_amount': cod_remitted_amount,
        'low_stock_products': low_stock_products,
        'total_customers': total_customers,
        'new_customers_month': new_customers_month,
    }
    return render(request, 'admin/stats.html', context)

original_get_urls = admin.site.get_urls


def get_urls_with_stats():
    custom_urls = [path('stats/', admin.site.admin_view(stats_view), name='stats')]
    return custom_urls + original_get_urls()
admin.site.get_urls = get_urls_with_stats