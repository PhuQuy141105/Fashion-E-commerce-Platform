from django.test import TestCase
from rest_framework.exceptions import ValidationError
from shop_online import serializers
from shop_online.models import OrderStatus, PaymentMethod
from shop_online.tests import factories as f


class FakeRequest:
    def __init__(self, user):
        self.user = user


class VoucherSerializerUnitTests(TestCase):
    def test_validate_code_bao_loi_khi_trung_ma_khong_phan_biet_hoa_thuong(self):
        f.make_voucher(code="SALE50")
        serializer = serializers.VoucherSerializer(data={
            "code": "sale50", "discount_type": "PERCENT", "discount_value": 10,
            "start_date": "2026-01-01T00:00:00Z", "end_date": "2026-12-31T00:00:00Z",
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("code", serializer.errors)

    def test_validate_code_tu_dong_viet_hoa(self):
        serializer = serializers.VoucherSerializer(data={
            "code": "newsale", "discount_type": "PERCENT", "discount_value": 10,
            "start_date": "2026-01-01T00:00:00Z", "end_date": "2026-12-31T00:00:00Z",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["code"], "NEWSALE")

    def test_cap_nhat_voucher_khong_tu_bao_loi_trung_voi_chinh_no(self):
        voucher = f.make_voucher(code="KEEP10")
        serializer = serializers.VoucherSerializer(
            instance=voucher, data={"code": "KEEP10", "description": "Cập nhật mô tả"}, partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)


class ReviewCreateSerializerUnitTests(TestCase):
    def test_danh_gia_qua_order_item_that_bai_neu_don_chua_giao(self):
        order, item = f.make_full_order(status=OrderStatus.SHIPPING)
        serializer = serializers.ReviewCreateSerializer(
            data={"rating": 5, "comment": "Tốt"},
            context={"request": FakeRequest(order.user), "order_item": item},
        )
        self.assertFalse(serializer.is_valid())

    def test_danh_gia_qua_order_item_thanh_cong_khi_da_giao(self):
        order, item = f.make_full_order(status=OrderStatus.DELIVERED)
        serializer = serializers.ReviewCreateSerializer(
            data={"rating": 5, "comment": "Rất hài lòng"},
            context={"request": FakeRequest(order.user), "order_item": item},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        review = serializer.save()
        self.assertEqual(review.order_item, item)
        self.assertEqual(review.product, item.variant.product)

    def test_danh_gia_qua_order_item_khong_the_danh_gia_2_lan(self):
        order, item = f.make_full_order(status=OrderStatus.DELIVERED)
        f.make_review(user=order.user, product=item.variant.product, order_item=item)
        serializer = serializers.ReviewCreateSerializer(
            data={"rating": 4, "comment": "Đánh giá lại"},
            context={"request": FakeRequest(order.user), "order_item": item},
        )
        self.assertFalse(serializer.is_valid())

    def test_danh_gia_truc_tiep_khong_can_don_hang_van_thanh_cong(self):
        customer = f.make_customer()
        product = f.make_product()
        serializer = serializers.ReviewCreateSerializer(
            data={"rating": 4, "comment": "Sản phẩm ổn"},
            context={"request": FakeRequest(customer), "product": product},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        review = serializer.save()
        self.assertIsNone(review.order_item)
        self.assertEqual(review.product, product)

    def test_danh_gia_truc_tiep_HIEN_CHUA_chan_spam_lap_lai(self):
        customer = f.make_customer()
        product = f.make_product()
        f.make_review(user=customer, product=product, order_item=None)
        serializer = serializers.ReviewCreateSerializer(
            data={"rating": 3, "comment": "Đánh giá lần 2"},
            context={"request": FakeRequest(customer), "product": product},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_rating_ngoai_khoang_1_5_bi_tu_choi(self):
        customer = f.make_customer()
        product = f.make_product()
        serializer = serializers.ReviewCreateSerializer(
            data={"rating": 6, "comment": "Không hợp lệ"},
            context={"request": FakeRequest(customer), "product": product},
        )
        self.assertFalse(serializer.is_valid())


class OrderDetailSerializerUnitTests(TestCase):
    def test_khach_hang_chi_duoc_huy_don_dang_pending(self):
        order = f.make_order(status=OrderStatus.SHIPPING)
        serializer = serializers.OrderDetailSerializer(
            instance=order, data={"status": "CANCELLED"}, partial=True,
            context={"request": FakeRequest(order.user)},
        )
        self.assertFalse(serializer.is_valid())

    def test_khach_hang_huy_don_pending_thanh_cong(self):
        order = f.make_order(status=OrderStatus.PENDING)
        serializer = serializers.OrderDetailSerializer(
            instance=order, data={"status": "CANCELLED", "cancel_reason": "Đổi ý"}, partial=True,
            context={"request": FakeRequest(order.user)},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_admin_khong_the_chuyen_thang_sang_delivered(self):
        order = f.make_order(status=OrderStatus.PENDING)
        admin = f.make_admin()
        serializer = serializers.OrderDetailSerializer(
            instance=order, data={"status": "DELIVERED"}, partial=True,
            context={"request": FakeRequest(admin)},
        )
        self.assertFalse(serializer.is_valid())

    def test_shipper_chi_duoc_chuyen_packing_sang_shipping(self):
        order = f.make_order(status=OrderStatus.PACKING)
        shipper = f.make_shipper()
        serializer = serializers.OrderDetailSerializer(
            instance=order, data={"status": "SHIPPING"}, partial=True,
            context={"request": FakeRequest(shipper)},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_shipper_khong_the_huy_don_dang_packing(self):
        order = f.make_order(status=OrderStatus.PACKING)
        shipper = f.make_shipper()
        serializer = serializers.OrderDetailSerializer(
            instance=order, data={"status": "CANCELLED"}, partial=True,
            context={"request": FakeRequest(shipper)},
        )
        self.assertFalse(serializer.is_valid())

    def test_shipper_duoc_huy_don_dang_shipping(self):
        order = f.make_order(status=OrderStatus.SHIPPING)
        shipper = f.make_shipper()
        serializer = serializers.OrderDetailSerializer(
            instance=order, data={"status": "CANCELLED", "cancel_reason": "Khách từ chối nhận"}, partial=True,
            context={"request": FakeRequest(shipper)},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
