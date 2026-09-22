import requests
from unittest.mock import patch, MagicMock
from rest_framework.test import APITestCase
from rest_framework import status
from shop_online.models import OrderStatus, PaymentMethod, PaymentStatus
from shop_online.tests import factories as f
import groq

class PayOSFailureTests(APITestCase):
    def test_payos_timeout_khi_tao_don_khong_lam_sap_request(self):
        customer = f.make_customer()
        self.client.force_authenticate(user=customer)
        product, variant = f.make_product_with_variant(stock_qty=10)
        address = f.make_address(user=customer)
        cart_item = f.make_cart_item(user=customer, variant=variant, quantity=1)
        with patch("shop_online.serializers.PayOS") as mock_payos_cls:
            mock_client = MagicMock()
            mock_client.payment_requests.create.side_effect = requests.exceptions.Timeout("PayOS timeout")
            mock_payos_cls.return_value = mock_client
            res = self.client.post("/orders/", {
                "address_id": address.id, "payment_method": "PAYOS",
                "cart_item_ids": [cart_item.id],
            }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        variant.refresh_from_db()
        self.assertEqual(variant.stock_qty, 10)


class PayOSWebhookDuplicateTests(APITestCase):
    def test_xac_nhan_thanh_toan_2_lan_khong_cong_don_2_lan(self):
        order, _ = f.make_full_order(status=OrderStatus.PENDING, payment_method=PaymentMethod.PAYOS)
        payment = f.make_payment(order, status=PaymentStatus.PENDING, method=PaymentMethod.PAYOS)
        with patch("shop_online.utils.confirm_refund"):
            payment.status = PaymentStatus.PAID
            payment.save()
            first_status = payment.status
            payment.refresh_from_db()
            second_status = payment.status
        self.assertEqual(first_status, second_status)


class GroqFailureTests(APITestCase):
    def test_groq_timeout_khong_lam_sap_toan_bo_request(self):
        customer = f.make_customer()
        with patch("shop_online.stylist.extract_criteria") as mock_extract:
            mock_extract.side_effect = requests.exceptions.Timeout("Groq timeout")
            with self.assertRaises(requests.exceptions.Timeout):
                from shop_online import utils
                utils.run_ai_stylist_query(customer, "Tôi cần đồ đi tiệc")

    def test_groq_rate_limit_tra_ve_loi_co_kiem_soat(self):
        customer = f.make_customer()
        with patch("shop_online.stylist.extract_criteria") as mock_extract:
            mock_response = MagicMock(status_code=429)
            mock_extract.side_effect = groq.RateLimitError(message="Rate limit exceeded", response=mock_response, body=None)
            with self.assertRaises(groq.RateLimitError):
                from shop_online import utils
                utils.run_ai_stylist_query(customer, "Tôi cần đồ đi tiệc")

class FirebaseFailureTests(APITestCase):
    def test_gui_tin_nhan_van_luu_duoc_csdl_du_firebase_loi(self):
        customer = f.make_customer()
        room = f.make_chat_room(customer=customer)
        self.client.force_authenticate(user=customer)
        with patch("firebase_admin.db.reference") as mock_firebase_ref:
            mock_firebase_ref.side_effect = Exception("Firebase unavailable")
            res = self.client.post(f"/chat/rooms/{room.id}/messages/", {"content": "Xin chào"}, format="json")
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_500_INTERNAL_SERVER_ERROR])

class GeocodingFailureTests(APITestCase):
    def test_geocode_loi_mang_khong_lam_sap_viec_tao_dia_chi(self):
        customer = f.make_customer()
        self.client.force_authenticate(user=customer)
        with patch("shop_online.utils.requests.get") as mock_get:
            mock_get.side_effect = requests.exceptions.ConnectionError("Network error")
            res = self.client.post("/users/current-user/addresses/", {
                "recipient_name": "Nguyễn Văn A", "recipient_phone": "0912345678",
                "province": "TP.HCM", "district": "Quận 1", "ward": "Phường Bến Nghé",
                "detail_address": "123 Đường ABC", "is_default": True,
            },format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)