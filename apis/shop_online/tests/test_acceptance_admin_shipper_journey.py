from unittest.mock import patch, MagicMock
from rest_framework.test import APITestCase
from rest_framework import status
from shop_online.models import OrderStatus, PaymentMethod, PaymentStatus
from shop_online.tests import factories as f


class CancelPaidOrderRefundJourneyTests(APITestCase):
    def test_huy_don_payos_da_thanh_toan_chuyen_sang_cho_hoan_tien(self):
        customer = f.make_customer(bank_bin="970422", bank_account_number="0123456789")
        order, item = f.make_full_order(user=customer, status=OrderStatus.PENDING, payment_method=PaymentMethod.PAYOS)
        payment = f.make_payment(order, status=PaymentStatus.PAID, method=PaymentMethod.PAYOS)

        self.client.force_authenticate(user=customer)
        with patch("shop_online.utils.requests.post") as mock_post:
            mock_post.return_value = MagicMock(json=lambda: {"code": "00", "desc": "success", "data": {"id": "payout-fake-id"}})
            res = self.client.patch(f"/orders/{order.id}/", {"status": "CANCELLED", "cancel_reason": "Đổi ý"}, format="json")

        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        order.refresh_from_db()
        payment.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.CANCELLED)
        self.assertEqual(payment.status, PaymentStatus.REFUND_PENDING)

    def test_huy_don_payos_chua_thanh_toan_khong_can_hoan_tien(self):
        order, item = f.make_full_order(status=OrderStatus.PENDING, payment_method=PaymentMethod.PAYOS)
        f.make_payment(order, status=PaymentStatus.PENDING, method=PaymentMethod.PAYOS)

        self.client.force_authenticate(user=order.user)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "CANCELLED"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)

        order.payment.refresh_from_db()
        self.assertEqual(order.payment.status, PaymentStatus.CANCELLED)


class CODReconciliationFullJourneyTests(APITestCase):
    def test_vong_doi_soat_cod_hoan_chinh(self):
        shipper = f.make_shipper()
        admin = f.make_admin()

        order1, _ = f.make_full_order(shipper=shipper, status=OrderStatus.SHIPPING, payment_method=PaymentMethod.COD)
        order2, _ = f.make_full_order(shipper=shipper, status=OrderStatus.SHIPPING, payment_method=PaymentMethod.COD)
        self.client.force_authenticate(user=shipper)
        for order in (order1, order2):
            res = self.client.patch(f"/orders/{order.id}/", {"status": "DELIVERED"}, format="json")
            self.assertEqual(res.status_code, status.HTTP_200_OK)
        pending_res = self.client.get("/shippers/me/cod-pending/")
        self.assertEqual(len(pending_res.data["orders"]), 2)
        expected_total = int(order1.total_amount + order2.total_amount)
        self.assertEqual(int(pending_res.data["total_pending_amount"]), expected_total)
        self.client.force_authenticate(user=admin)
        remit_res = self.client.post("/shippers/cod-remittances/", {
            "shipper_id": shipper.id, "order_ids": [order1.id, order2.id], "note": "Đối soát cuối ngày",
        }, format="json")
        self.assertEqual(remit_res.status_code, status.HTTP_201_CREATED, remit_res.data)
        self.client.force_authenticate(user=shipper)
        pending_after_res = self.client.get("/shippers/me/cod-pending/")
        self.assertEqual(len(pending_after_res.data["orders"]), 0)
        history_res = self.client.get("/shippers/cod-remittances/")
        self.assertEqual(len(history_res.data), 1)
        self.assertEqual(int(history_res.data[0]["total_amount"]), expected_total)
