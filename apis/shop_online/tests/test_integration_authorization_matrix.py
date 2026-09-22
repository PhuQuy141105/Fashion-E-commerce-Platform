from rest_framework.test import APITestCase
from rest_framework import status
from shop_online.models import OrderStatus, PaymentMethod
from shop_online.tests import factories as f


class OrderAuthorizationMatrixTests(APITestCase):
    def test_chu_don_xem_duoc_don_cua_minh(self):
        order, _ = f.make_full_order(status=OrderStatus.PENDING)
        self.client.force_authenticate(user=order.user)
        res = self.client.get(f"/orders/{order.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_khach_hang_khac_khong_xem_duoc_don_khong_phai_cua_minh(self):
        order, _ = f.make_full_order(status=OrderStatus.PENDING)
        other_customer = f.make_customer()
        self.client.force_authenticate(user=other_customer)
        res = self.client.get(f"/orders/{order.id}/")
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_shipper_khong_duoc_gan_khong_xem_duoc_don(self):
        order, _ = f.make_full_order(status=OrderStatus.PACKING)
        other_shipper = f.make_shipper()
        self.client.force_authenticate(user=other_shipper)
        res = self.client.get(f"/orders/{order.id}/")
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_shipper_duoc_gan_xem_duoc_don(self):
        shipper = f.make_shipper()
        order, _ = f.make_full_order(status=OrderStatus.PACKING, shipper=shipper)
        self.client.force_authenticate(user=shipper)
        res = self.client.get(f"/orders/{order.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_admin_xem_duoc_moi_don(self):
        order, _ = f.make_full_order(status=OrderStatus.PENDING)
        admin = f.make_admin()
        self.client.force_authenticate(user=admin)
        res = self.client.get(f"/orders/{order.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_khach_hang_khong_goi_duoc_api_xac_nhan_don_chi_danh_cho_admin(self):
        order, _ = f.make_full_order(status=OrderStatus.PENDING)
        self.client.force_authenticate(user=order.user)
        res = self.client.patch(f"/orders/{order.id}/", {"status": "PACKING"}, format="json")
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])


class ReviewAuthorizationMatrixTests(APITestCase):
    def test_khach_sua_duoc_danh_gia_cua_chinh_minh(self):
        review = f.make_review()
        self.client.force_authenticate(user=review.user)
        res = self.client.patch(f"/reviews/{review.id}/", {"comment": "Cập nhật lại"}, format="json")
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])

    def test_khach_khac_khong_sua_duoc_danh_gia_khong_phai_cua_minh(self):
        review = f.make_review()
        other_customer = f.make_customer()
        self.client.force_authenticate(user=other_customer)
        res = self.client.patch(f"/reviews/{review.id}/", {"comment": "Sửa hộ"}, format="json")
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_khach_hang_khong_an_duoc_danh_gia_chi_admin_moi_duoc(self):
        review = f.make_review()
        self.client.force_authenticate(user=review.user)
        res = self.client.patch(f"/reviews/{review.id}/", {"is_hidden": True}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_shipper_khong_co_quyen_gi_voi_danh_gia(self):
        review = f.make_review()
        shipper = f.make_shipper()
        self.client.force_authenticate(user=shipper)
        res = self.client.patch(f"/reviews/{review.id}/", {"is_hidden": True}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_an_duoc_moi_danh_gia(self):
        review = f.make_review()
        admin = f.make_admin()
        self.client.force_authenticate(user=admin)
        res = self.client.patch(f"/reviews/{review.id}/", {"is_hidden": True}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class RemittanceAuthorizationMatrixTests(APITestCase):
    def test_shipper_xem_duoc_doi_soat_cua_chinh_minh(self):
        shipper = f.make_shipper()
        self.client.force_authenticate(user=shipper)
        res = self.client.get("/shippers/cod-remittances/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_shipper_khong_xem_duoc_doi_soat_cua_shipper_khac(self):
        shipper_a = f.make_shipper()
        shipper_b = f.make_shipper()
        order, _ = f.make_full_order(shipper=shipper_a, status=OrderStatus.DELIVERED, payment_method=PaymentMethod.COD)
        self.client.force_authenticate(user=shipper_a)
        remit_res = self.client.post("/shippers/cod-remittances/", {
            "shipper_id": shipper_a.id, "order_ids": [order.id],
        }, format="json")
        self.assertEqual(remit_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_khach_hang_khong_co_quyen_gi_voi_doi_soat(self):
        customer = f.make_customer()
        self.client.force_authenticate(user=customer)
        res = self.client.get("/shippers/cod-remittances/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_xem_duoc_toan_bo_doi_soat_moi_shipper(self):
        shipper = f.make_shipper()
        f.make_full_order(shipper=shipper, status=OrderStatus.DELIVERED, payment_method=PaymentMethod.COD)
        admin = f.make_admin()
        self.client.force_authenticate(user=admin)
        res = self.client.get("/shippers/cod-remittances/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_shipper_khong_tu_tao_duoc_doi_soat_cho_chinh_minh(self):
        shipper = f.make_shipper()
        order, _ = f.make_full_order(shipper=shipper, status=OrderStatus.DELIVERED, payment_method=PaymentMethod.COD)
        self.client.force_authenticate(user=shipper)
        res = self.client.post("/shippers/cod-remittances/", {
            "shipper_id": shipper.id, "order_ids": [order.id],
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
