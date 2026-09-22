from rest_framework.test import APITestCase
from rest_framework import status
from shop_online.models import Review, OrderStatus, Voucher
from shop_online.tests import factories as f


class OrderItemReviewTests(APITestCase):
    def test_danh_gia_thanh_cong_khi_don_da_giao(self):
        order, item = f.make_full_order(status=OrderStatus.DELIVERED)
        self.client.force_authenticate(user=order.user)
        res = self.client.post(f"/order-items/{item.id}/review/", {"rating": 5, "comment": "Rất tốt"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertTrue(Review.objects.filter(order_item=item).exists())

    def test_khong_danh_gia_duoc_don_chua_giao(self):
        order, item = f.make_full_order(status=OrderStatus.SHIPPING)
        self.client.force_authenticate(user=order.user)
        res = self.client.post(f"/order-items/{item.id}/review/", {"rating": 5, "comment": "Chưa nhận hàng"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_khong_danh_gia_duoc_order_item_cua_nguoi_khac(self):
        order, item = f.make_full_order(status=OrderStatus.DELIVERED)
        other_customer = f.make_customer()
        self.client.force_authenticate(user=other_customer)
        res = self.client.post(f"/order-items/{item.id}/review/", {"rating": 5, "comment": "Không phải đơn của tôi"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_khong_danh_gia_2_lan_cho_cung_1_order_item(self):
        order, item = f.make_full_order(status=OrderStatus.DELIVERED)
        f.make_review(user=order.user, product=item.variant.product, order_item=item)
        self.client.force_authenticate(user=order.user)
        res = self.client.post(f"/order-items/{item.id}/review/", {"rating": 3, "comment": "Đánh giá lại"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class ProductDirectReviewTests(APITestCase):
    def test_danh_gia_truc_tiep_khong_can_mua_hang(self):
        customer = f.make_customer()
        product = f.make_product()
        self.client.force_authenticate(user=customer)
        res = self.client.post(f"/products/{product.id}/reviews/", {"rating": 4, "comment": "Nhìn đẹp"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)

    def test_xem_danh_sach_danh_gia_can_dang_nhap_de_xem(self):
        product = f.make_product()
        f.make_review(product=product)
        customer = f.make_customer()
        self.client.force_authenticate(user=customer)
        res = self.client.get(f"/products/{product.id}/reviews/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_khach_khong_thay_review_da_bi_an(self):
        product = f.make_product()
        f.make_review(product=product, is_hidden=True)
        customer = f.make_customer()
        self.client.force_authenticate(user=customer)
        res = self.client.get(f"/products/{product.id}/reviews/")
        results = res.data.get("results", res.data)
        self.assertEqual(len(results), 0)

    def test_admin_van_thay_duoc_review_da_bi_an(self):
        product = f.make_product()
        f.make_review(product=product, is_hidden=True)
        admin = f.make_admin()
        self.client.force_authenticate(user=admin)
        res = self.client.get(f"/products/{product.id}/reviews/")
        results = res.data.get("results", res.data)
        self.assertEqual(len(results), 1)


class ReviewModerationTests(APITestCase):
    def test_admin_an_duoc_review(self):
        review = f.make_review()
        admin = f.make_admin()
        self.client.force_authenticate(user=admin)
        res = self.client.patch(f"/reviews/{review.id}/", {"is_hidden": True}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        review.refresh_from_db()
        self.assertTrue(review.is_hidden)

    def test_khach_hang_khong_an_duoc_review(self):
        review = f.make_review()
        customer = f.make_customer()
        self.client.force_authenticate(user=customer)
        res = self.client.patch(f"/reviews/{review.id}/", {"is_hidden": True}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class VoucherAdminTests(APITestCase):
    def setUp(self):
        self.admin = f.make_admin()
        self.client.force_authenticate(user=self.admin)

    def test_admin_tao_voucher_thanh_cong(self):
        res = self.client.post("/vouchers/", {
            "code": "SUMMER50", "discount_type": "PERCENT", "discount_value": 50,
            "usage_limit": 100, "start_date": "2026-01-01T00:00:00Z", "end_date": "2026-12-31T00:00:00Z",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)

    def test_admin_khong_tao_duoc_voucher_trung_ma(self):
        f.make_voucher(code="DUP10")
        res = self.client.post("/vouchers/", {
            "code": "DUP10", "discount_type": "PERCENT", "discount_value": 10,
            "usage_limit": 10, "start_date": "2026-01-01T00:00:00Z", "end_date": "2026-12-31T00:00:00Z",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_khach_hang_khong_xem_duoc_danh_sach_voucher_quan_tri(self):
        customer = f.make_customer()
        self.client.force_authenticate(user=customer)
        res = self.client.get("/vouchers/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_xoa_mem_voucher(self):
        voucher = f.make_voucher()
        res = self.client.delete(f"/vouchers/{voucher.id}/")
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        voucher.refresh_from_db()
        self.assertFalse(voucher.active)
