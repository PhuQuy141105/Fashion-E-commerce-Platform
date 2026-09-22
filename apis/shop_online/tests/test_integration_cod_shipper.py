from rest_framework.test import APITestCase
from rest_framework import status
from shop_online.models import OrderStatus, PaymentMethod
from shop_online.tests import factories as f


class ShipperCODViewTests(APITestCase):
    def test_shipper_xem_duoc_don_cod_dang_giu_cua_minh(self):
        shipper = f.make_shipper()
        order, _ = f.make_full_order(shipper=shipper, status=OrderStatus.DELIVERED, payment_method=PaymentMethod.COD)
        self.client.force_authenticate(user=shipper)
        res = self.client.get("/shippers/me/cod-pending/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["orders"]), 1)
        self.assertEqual(int(res.data["total_pending_amount"]), int(order.total_amount))

    def test_don_da_doi_soat_khong_con_xuat_hien_trong_danh_sach_cho(self):
        shipper = f.make_shipper()
        order, _ = f.make_full_order(shipper=shipper, status=OrderStatus.DELIVERED, payment_method=PaymentMethod.COD)
        order.cod_remitted = True
        order.save()
        self.client.force_authenticate(user=shipper)
        res = self.client.get("/shippers/me/cod-pending/")
        self.assertEqual(len(res.data["orders"]), 0)

    def test_shipper_khong_goi_duoc_pending_cua_shipper_khac_qua_id(self):
        shipper_a = f.make_shipper()
        shipper_b = f.make_shipper()
        f.make_full_order(shipper=shipper_a, status=OrderStatus.DELIVERED, payment_method=PaymentMethod.COD)
        self.client.force_authenticate(user=shipper_b)
        res = self.client.get(f"/shippers/{shipper_a.id}/cod-pending/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class AdminCreateRemittanceTests(APITestCase):
    def setUp(self):
        self.admin = f.make_admin()
        self.client.force_authenticate(user=self.admin)
        self.shipper = f.make_shipper()
        self.order, _ = f.make_full_order(shipper=self.shipper, status=OrderStatus.DELIVERED, payment_method=PaymentMethod.COD)

    def test_admin_tao_doi_soat_thanh_cong(self):
        res = self.client.post("/shippers/cod-remittances/", {
            "shipper_id": self.shipper.id, "order_ids": [self.order.id], "note": "Đợt 1",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.order.refresh_from_db()
        self.assertTrue(self.order.cod_remitted)

    def test_khong_tao_duoc_doi_soat_voi_don_chua_giao(self):
        pending_order, _ = f.make_full_order(shipper=self.shipper, status=OrderStatus.SHIPPING, payment_method=PaymentMethod.COD)
        res = self.client.post("/shippers/cod-remittances/", {
            "shipper_id": self.shipper.id, "order_ids": [pending_order.id],
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_shipper_khong_tao_duoc_doi_soat(self):
        self.client.force_authenticate(user=self.shipper)
        res = self.client.post("/shippers/cod-remittances/", {
            "shipper_id": self.shipper.id, "order_ids": [self.order.id],
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_shipper_xem_duoc_lich_su_doi_soat_cua_chinh_minh(self):
        self.client.post("/shippers/cod-remittances/", {
            "shipper_id": self.shipper.id, "order_ids": [self.order.id],
        }, format="json")
        self.client.force_authenticate(user=self.shipper)
        res = self.client.get("/shippers/cod-remittances/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
