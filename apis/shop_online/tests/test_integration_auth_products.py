from rest_framework.test import APITestCase
from rest_framework import status
from oauth2_provider.models import Application
from shop_online.models import User, UserRole
from shop_online.tests import factories as f


class RegisterTests(APITestCase):
    def test_dang_ky_thanh_cong_tra_ve_201_va_role_mac_dinh_la_customer(self):
        payload = {
            "username": "newcustomer",
            "email": "newcustomer@example.com",
            "password": "Test@1234",
            "first_name": "Văn A",
        }
        res = self.client.post("/users/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="newcustomer")
        self.assertEqual(user.role, UserRole.CUSTOMER)
        self.assertTrue(user.check_password("Test@1234"))

    def test_dang_ky_trung_email_bao_loi(self):
        f.make_customer(email="taken@example.com")
        res = self.client.post("/users/", {
            "username": "another", "email": "taken@example.com", "password": "Test@1234",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_dang_ky_khong_the_tu_gan_role_admin(self):
        res = self.client.post("/users/", {
            "username": "hacker", "email": "hacker@example.com", "password": "Test@1234",
            "role": "ADMIN",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="hacker")
        self.assertEqual(user.role, UserRole.CUSTOMER)

from decouple import config as env_config

class OAuthLoginTests(APITestCase):
    def setUp(self):
        self.customer = f.make_customer(username="loginuser")
        self.customer.set_password("Test@1234")
        self.customer.save()
        Application.objects.create(
            name="Test App",
            client_id=env_config("OAUTH_CLIENT_ID"),
            client_secret=env_config("OAUTH_CLIENT_SECRET"),
            client_type=Application.CLIENT_CONFIDENTIAL,
            authorization_grant_type=Application.GRANT_PASSWORD,
            user=self.customer,
        )

    def test_dang_nhap_dung_mat_khau_tra_ve_access_token(self):
        res = self.client.post("/o/token/", {
            "grant_type": "password",
            "username": "loginuser",
            "password": "Test@1234",
        }, content_type="application/json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", res.json())

    def test_dang_nhap_sai_mat_khau_that_bai(self):
        res = self.client.post("/o/token/", {
            "grant_type": "password",
            "username": "loginuser",
            "password": "SaiMatKhau",
        }, content_type="application/json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class CurrentUserTests(APITestCase):
    def test_chua_dang_nhap_bi_tu_choi(self):
        res = self.client.get("/users/current-user/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_da_dang_nhap_xem_duoc_thong_tin_ca_nhan(self):
        user = f.make_customer(email="me@example.com")
        self.client.force_authenticate(user=user)
        res = self.client.get("/users/current-user/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], "me@example.com")


class AddressTests(APITestCase):
    def setUp(self):
        self.customer = f.make_customer()
        self.client.force_authenticate(user=self.customer)

    def test_them_dia_chi_thanh_cong(self):
        payload = {
            "recipient_name": "Nguyễn Văn B", "recipient_phone": "0987654321",
            "province": "TP.HCM", "district": "Quận 3", "ward": "Phường 1",
            "detail_address": "45 Đường XYZ", "is_default": True,
        }
        res = self.client.post("/users/current-user/addresses/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_khong_xem_duoc_dia_chi_cua_nguoi_khac(self):
        other_user = f.make_customer()
        address = f.make_address(user=other_user)
        res = self.client.patch(f"/users/current-user/addresses/{address.id}/", {"recipient_name": "Hack"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class ProductBrowsingTests(APITestCase):
    def setUp(self):
        self.category = f.make_category(name="Áo thun")
        self.brand = f.make_brand(name="Local Brand")
        self.product, self.variant = f.make_product_with_variant()
        self.product.category = self.category
        self.product.brand = self.brand
        self.product.save()
        self.customer = f.make_customer()

    def test_khach_CHUA_dang_nhap_hien_KHONG_xem_duoc_san_pham(self):
        res = self.client.get("/products/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_khach_da_dang_nhap_xem_duoc_danh_sach_san_pham(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.get("/products/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_xem_chi_tiet_1_san_pham(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.get(f"/products/{self.product.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], self.product.name)

    def test_loc_san_pham_theo_category(self):
        self.client.force_authenticate(user=self.customer)
        other = f.make_product()
        res = self.client.get(f"/products/?category={self.category.id}")
        ids = [p["id"] for p in res.data.get("results", res.data)]
        self.assertIn(self.product.id, ids)
        self.assertNotIn(other.id, ids)

    def test_tim_kiem_san_pham_theo_ten(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.get(f"/products/?search={self.product.name}")
        ids = [p["id"] for p in res.data.get("results", res.data)]
        self.assertIn(self.product.id, ids)