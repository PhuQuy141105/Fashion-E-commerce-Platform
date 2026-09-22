from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from shop_online.models import OrderStatus, PaymentMethod
from shop_online.tests import factories as f


class ProductVariantUnitTests(TestCase):
    def test_final_price_cong_dung_price_adjustment(self):
        product = f.make_product(base_price=100000)
        variant = f.make_variant(product=product, price_adjustment=Decimal(20000))
        self.assertEqual(variant.final_price, Decimal(120000))

    def test_final_price_mac_dinh_bang_base_price_khi_khong_dieu_chinh(self):
        product = f.make_product(base_price=150000)
        variant = f.make_variant(product=product)
        self.assertEqual(variant.final_price, Decimal(150000))


class ProductUnitTests(TestCase):
    def test_total_stock_cong_don_tat_ca_bien_the_dang_active(self):
        product = f.make_product()
        f.make_variant(product=product, stock_qty=5)
        f.make_variant(product=product, stock_qty=7, size="L")
        self.assertEqual(product.total_stock, 12)

    def test_total_stock_bo_qua_bien_the_da_bi_an(self):
        product = f.make_product()
        f.make_variant(product=product, stock_qty=5)
        inactive = f.make_variant(product=product, stock_qty=100, size="L")
        inactive.active = False
        inactive.save()
        self.assertEqual(product.total_stock, 5)

    def test_avg_review_tra_ve_0_khi_chua_co_danh_gia_nao(self):
        product = f.make_product()
        self.assertEqual(product.avg_review, 0)

    def test_avg_review_tinh_dung_trung_binh(self):
        product = f.make_product()
        f.make_review(product=product, rating=5)
        f.make_review(product=product, rating=3)
        self.assertEqual(product.avg_review, 4)


class CartItemUnitTests(TestCase):
    def test_subtotal_nhan_dung_don_gia_va_so_luong(self):
        product = f.make_product(base_price=100000)
        variant = f.make_variant(product=product)
        item = f.make_cart_item(user=f.make_customer(), variant=variant, quantity=3)
        self.assertEqual(item.subtotal, Decimal(300000))


class OrderItemUnitTests(TestCase):
    def test_subtotal_nhan_dung_don_gia_va_so_luong(self):
        item = f.make_order_item(unit_price=Decimal(50000), quantity=4)
        self.assertEqual(item.subtotal, Decimal(200000))


class VoucherUnitTests(TestCase):
    def test_is_valid_true_khi_con_han_va_con_luot_dung(self):
        voucher = f.make_voucher(usage_limit=10, used_count=2)
        self.assertTrue(voucher.is_valid)

    def test_is_valid_false_khi_da_het_han(self):
        now = timezone.now()
        voucher = f.make_voucher(start_date=now - timedelta(days=10), end_date=now - timedelta(days=1))
        self.assertFalse(voucher.is_valid)

    def test_is_valid_false_khi_chua_toi_ngay_bat_dau(self):
        now = timezone.now()
        voucher = f.make_voucher(start_date=now + timedelta(days=1), end_date=now + timedelta(days=10))
        self.assertFalse(voucher.is_valid)

    def test_is_valid_false_khi_da_dung_het_luot(self):
        voucher = f.make_voucher(usage_limit=5, used_count=5)
        self.assertFalse(voucher.is_valid)

    def test_is_valid_false_khi_bi_vo_hieu_hoa_thu_cong(self):
        voucher = f.make_voucher()
        voucher.active = False
        voucher.save()
        self.assertFalse(voucher.is_valid)


class CategoryUnitTests(TestCase):
    def test_xoa_category_cha_khong_xoa_theo_category_con(self):
        parent = f.make_category(name="Áo")
        child = f.make_category(name="Áo thun", parent=parent)
        parent.delete()
        child.refresh_from_db()
        self.assertIsNone(child.parent)
