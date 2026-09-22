from django.core import mail
from rest_framework.test import APITestCase
from rest_framework import status

from shop_online.models import Order, OrderStatus, Notification
from shop_online.tests import factories as f


class CustomerCancelOrderTests(APITestCase):
    def test_khach_huy_don_pending_thanh_cong_va_hoan_lai_ton_kho(self):
        order, item = f.make_full_order(status=OrderStatus.PENDING, stock_qty=5, quantity=2)
        item.variant.refresh_from_db()
        stock_before = item.variant.stock_qty

        self.client.force_authenticate(user=order.user)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "CANCELLED", "cancel_reason": "Đổi ý"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)

        order.refresh_from_db()
        item.variant.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.CANCELLED)
        self.assertEqual(item.variant.stock_qty, stock_before + item.quantity)

    def test_khach_khong_huy_duoc_don_dang_giao(self):
        order, _ = f.make_full_order(status=OrderStatus.SHIPPING)
        self.client.force_authenticate(user=order.user)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "CANCELLED"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_khach_khong_huy_duoc_don_cua_nguoi_khac(self):
        order, _ = f.make_full_order(status=OrderStatus.PENDING)
        other_customer = f.make_customer()
        self.client.force_authenticate(user=other_customer)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "CANCELLED"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class AdminOrderTests(APITestCase):
    def setUp(self):
        self.admin = f.make_admin()
        self.client.force_authenticate(user=self.admin)

    def test_admin_xac_nhan_don_pending_sang_packing(self):
        order, _ = f.make_full_order(status=OrderStatus.PENDING)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "PACKING"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.PACKING)

    def test_admin_khong_xac_nhan_duoc_don_da_dang_packing(self):
        order, _ = f.make_full_order(status=OrderStatus.PACKING)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "PACKING"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_huy_don_cod_tao_thong_bao_cho_khach(self):
        order, _ = f.make_full_order(status=OrderStatus.PENDING)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "CANCELLED", "cancel_reason": "Hết hàng"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertTrue(Notification.objects.filter(user=order.user, ref_id=order.pk).exists())

    def test_nguoi_khong_phai_admin_khong_xac_nhan_duoc_don(self):
        order, _ = f.make_full_order(status=OrderStatus.PENDING)
        customer = f.make_customer()
        self.client.force_authenticate(user=customer)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "PACKING"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class ShipperOrderTests(APITestCase):
    def setUp(self):
        self.shipper = f.make_shipper()
        self.client.force_authenticate(user=self.shipper)

    def test_shipper_nhan_don_packing_sang_shipping(self):
        order, _ = f.make_full_order(status=OrderStatus.PACKING, shipper=self.shipper)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "SHIPPING"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.SHIPPING)
        self.assertIsNotNone(order.shipped_at)

    def test_shipper_giao_hang_thanh_cong(self):
        order, _ = f.make_full_order(status=OrderStatus.SHIPPING, shipper=self.shipper)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "DELIVERED"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.DELIVERED)
        self.assertIsNotNone(order.delivered_at)

    def test_shipper_huy_don_dang_giao_kem_ly_do(self):
        order, _ = f.make_full_order(status=OrderStatus.SHIPPING, shipper=self.shipper)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "CANCELLED", "cancel_reason": "Khách không nghe máy"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.CANCELLED)
        self.assertEqual(order.cancel_reason, "Khách không nghe máy")

    def test_shipper_khong_thao_tac_duoc_don_chua_gan_cho_minh(self):
        other_shipper = f.make_shipper()
        order, _ = f.make_full_order(status=OrderStatus.PACKING, shipper=other_shipper)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "SHIPPING"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_shipper_khong_the_nhay_thang_tu_packing_sang_delivered(self):
        order, _ = f.make_full_order(status=OrderStatus.PACKING, shipper=self.shipper)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "DELIVERED"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class OrderListFilterTests(APITestCase):
    def test_khach_chi_thay_don_cua_chinh_minh(self):
        customer = f.make_customer()
        f.make_full_order(user=customer)
        f.make_full_order()  # đơn của người khác
        self.client.force_authenticate(user=customer)
        res = self.client.get("/orders/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data if isinstance(res.data, list) else res.data.get("results", res.data)
        self.assertEqual(len(results), 1)

    def test_shipper_chi_thay_don_duoc_giao_cho_minh(self):
        shipper = f.make_shipper()
        order_a, _ = f.make_full_order(shipper=shipper, status=OrderStatus.PACKING)
        f.make_full_order(status=OrderStatus.PACKING)  # đơn của shipper khác / chưa gán
        self.client.force_authenticate(user=shipper)
        res = self.client.get("/orders/")
        results = res.data if isinstance(res.data, list) else res.data.get("results", res.data)
        ids = [o["id"] for o in results]
        self.assertIn(order_a.id, ids)
        self.assertEqual(len(results), 1)

    def test_admin_thay_tat_ca_don(self):
        f.make_full_order()
        f.make_full_order()
        admin = f.make_admin()
        self.client.force_authenticate(user=admin)
        res = self.client.get("/orders/")
        results = res.data if isinstance(res.data, list) else res.data.get("results", res.data)
        self.assertEqual(len(results), 2)
