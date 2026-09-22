from django.urls import path, include
from rest_framework.routers import DefaultRouter
from shop_online import views
r = DefaultRouter()
r.register('users', views.UserViewSet, 'user')
r.register('products', views.ProductViewSet, 'product')
r.register('order-items', views.OrderItemViewSet, 'order-item')
r.register('cart', views.CartViewSet, 'cart')
r.register('orders', views.OrderViewSet, 'order')
r.register('payments', views.PaymentViewSet, 'payment')
r.register('variants', views.ProductVariantViewSet, 'variant')
r.register('reviews', views.ReviewViewSet, basename='reviews')
r.register('vouchers', views.VoucherViewSet, basename='vouchers')
r.register('chat', views.ChatViewSet, basename='chat')
r.register('ai-stylist', views.AIStylistViewSet, basename='ai-stylist')
r.register('shippers', views.ShipperCODViewSet, basename='shippers')
r.register('categories', views.CategoryViewSet, basename='category')
r.register('brands', views.BrandViewSet, basename='brand')
r.register('notifications', views.NotificationViewSet, basename='notification')
urlpatterns = [
    path('', include(r.urls)),
]