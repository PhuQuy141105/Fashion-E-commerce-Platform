from rest_framework.test import APITestCase
from rest_framework import status
from shop_online.models import User, OrderStatus
from shop_online.tests import factories as f


class CustomerFullJourneyTests(APITestCase):
    def test_hanh_trinh_mua_hang_va_danh_gia_hoan_chinh(self):
        register_res = self.client.post("/users/", {
            "username": "journeycustomer", "email": "journey@example.com",
            "password": "Test@1234", "first_name": "Khách",
        }, format="json")
        self.assertEqual(register_res.status_code, status.HTTP_201_CREATED)
        customer = User.objects.get(username="journeycustomer")
        product, variant = f.make_product_with_variant(stock_qty=10, base_price=150000)
        address = f.make_address(user=customer)
        self.client.force_authenticate(user=customer)
        detail_res = self.client.get(f"/products/{product.id}/")
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        cart_res = self.client.post("/cart/items/", {"variant": variant.id, "quantity": 2}, format="json")
        self.assertEqual(cart_res.status_code, status.HTTP_201_CREATED)
        cart_item_id = cart_res.data["id"]
        order_res = self.client.post("/orders/", {
            "address_id": address.id, "payment_method": "COD", "cart_item_ids": [cart_item_id],
        }, format="json")
        self.assertEqual(order_res.status_code, status.HTTP_201_CREATED, order_res.data)
        order_id = order_res.data["order"]["id"]
        variant.refresh_from_db()
        self.assertEqual(variant.stock_qty, 8)
        admin = f.make_admin()
        self.client.force_authenticate(user=admin)
        confirm_res = self.client.patch(f"/orders/{order_id}/", {"status": "PACKING"}, format="json")
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)
        from shop_online.models import Order
        shipper = f.make_shipper()
        order = Order.objects.get(id=order_id)
        order.shipper = shipper
        order.save(update_fields=["shipper"])
        self.client.force_authenticate(user=shipper)
        start_res = self.client.patch(f"/orders/{order_id}/", {"status": "SHIPPING"}, format="json")
        self.assertEqual(start_res.status_code, status.HTTP_200_OK)
        deliver_res = self.client.patch(f"/orders/{order_id}/", {"status": "DELIVERED"}, format="json")
        self.assertEqual(deliver_res.status_code, status.HTTP_200_OK, deliver_res.data)
        self.client.force_authenticate(user=customer)
        order_detail_res = self.client.get(f"/orders/{order_id}/")
        self.assertEqual(order_detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(order_detail_res.data["status"], "DELIVERED")
        order_item_id = order_detail_res.data["items"][0]["id"]
        review_res = self.client.post(f"/order-items/{order_item_id}/review/", {
            "rating": 5, "comment": "Chất lượng vượt mong đợi, giao hàng nhanh!",
        }, format="json")
        self.assertEqual(review_res.status_code, status.HTTP_201_CREATED, review_res.data)
        public_reviews_res = self.client.get(f"/products/{product.id}/reviews/")
        results = public_reviews_res.data.get("results", public_reviews_res.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["rating"], 5)
