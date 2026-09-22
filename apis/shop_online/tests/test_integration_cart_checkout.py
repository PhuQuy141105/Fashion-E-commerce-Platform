from decimal import Decimal
from unittest.mock import patch, MagicMock
from rest_framework.test import APITestCase
from rest_framework import status
from shop_online.models import CartItem, Order, PaymentMethod
from shop_online.tests import factories as f


class CartTests(APITestCase):
    def setUp(self):
        self.customer = f.make_customer()
        self.client.force_authenticate(user=self.customer)
        self.product, self.variant = f.make_product_with_variant(stock_qty=10)

    def test_them_vao_gio_hang_thanh_cong(self):
        res = self.client.post("/cart/items/", {"variant": self.variant.id, "quantity": 2}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CartItem.objects.filter(user=self.customer).count(), 1)

    def test_khong_them_duoc_vuot_qua_ton_kho(self):
        res = self.client.post("/cart/items/", {"variant": self.variant.id, "quantity": 999}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_xem_danh_sach_gio_hang(self):
        f.make_cart_item(user=self.customer, variant=self.variant, quantity=1)
        res = self.client.get("/cart/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_xoa_1_dong_gio_hang(self):
        item = f.make_cart_item(user=self.customer, variant=self.variant, quantity=1)
        res = self.client.delete(f"/cart/items/{item.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CartItem.objects.filter(id=item.id, active=True).exists())

    def test_khong_thao_tac_duoc_gio_hang_cua_nguoi_khac(self):
        other = f.make_customer()
        item = f.make_cart_item(user=other, variant=self.variant, quantity=1)
        res = self.client.delete(f"/cart/items/{item.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class OrderPreviewAndCreateTests(APITestCase):
    def setUp(self):
        self.customer = f.make_customer()
        self.client.force_authenticate(user=self.customer)
        self.product, self.variant = f.make_product_with_variant(stock_qty=10, base_price=100000)
        self.address = f.make_address(user=self.customer)
        self.cart_item = f.make_cart_item(user=self.customer, variant=self.variant, quantity=2)

    def test_xem_truoc_don_hang_tinh_dung_tong_tien(self):
        res = self.client.post("/orders/preview/", {
            "address_id": self.address.id, "cart_item_ids": [self.cart_item.id],
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_dat_hang_cod_thanh_cong_va_tru_ton_kho(self):
        res = self.client.post("/orders/", {
            "address_id": self.address.id, "payment_method": "COD",
            "cart_item_ids": [self.cart_item.id],
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_qty, 8)
        self.assertFalse(CartItem.objects.filter(id=self.cart_item.id, active=True).exists())

    def test_dat_hang_gio_trong_bao_loi(self):
        CartItem.objects.filter(id=self.cart_item.id).delete()
        res = self.client.post("/orders/", {
            "address_id": self.address.id, "payment_method": "COD",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_dat_hang_vuot_ton_kho_bao_loi(self):
        self.cart_item.quantity = 999
        self.cart_item.save()
        res = self.client.post("/orders/", {
            "address_id": self.address.id, "payment_method": "COD",
            "cart_item_ids": [self.cart_item.id],
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("shop_online.serializers.PayOS")
    def test_dat_hang_payos_goi_tao_link_thanh_toan(self, mock_payos_cls):
        mock_client = MagicMock()
        mock_client.payment_requests.create.return_value = MagicMock(
            checkout_url="https://payos.vn/pay/fake", qr_code="fake-qr-data",
        )
        mock_payos_cls.return_value = mock_client

        res = self.client.post("/orders/", {
            "address_id": self.address.id, "payment_method": "PAYOS",
            "cart_item_ids": [self.cart_item.id],
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertIn("payment", res.data)
        self.assertEqual(res.data["payment"]["checkout_url"], "https://payos.vn/pay/fake")
        mock_client.payment_requests.create.assert_called_once()
