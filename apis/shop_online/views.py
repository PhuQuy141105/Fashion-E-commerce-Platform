from math import perm
from urllib import request
from django.contrib.admin import action
from django.shortcuts import render
from rest_framework import viewsets, generics, permissions, parsers, status, filters
from rest_framework.response import Response
from rest_framework.generics import get_object_or_404
from rest_framework.decorators import action
from django.db.models import Q, Prefetch, F
from shop_online import serializers, perms, paginators
from shop_online.models import *
from shop_online.serializers import ProductListSerializer
from payos import PayOS
from apis import settings
from shop_online import utils
from django.db.models import Sum

class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['address_detail']:
            return [perms.AddressCustomerOwner()]
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = serializers.UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(serializers.UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(methods=['get'],url_path='current-user',detail=False)
    def current_user(self, request):
        serializer = serializers.UserSerializer(request.user)
        return Response(serializer.data,status=status.HTTP_200_OK)

    @action(methods=['get', 'post'], url_path='current-user/addresses', detail=False)
    def addresses(self, request):
        if request.method == 'POST':
            serializer = serializers.AddressSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            address = serializer.save()
            return Response(serializers.AddressSerializer(address).data, status=status.HTTP_201_CREATED)
        addresses = Address.objects.filter(user=request.user, active=True)
        return Response(serializers.AddressSerializer(addresses, many=True).data, status=status.HTTP_200_OK)

    @action(methods=['patch', 'delete'], url_path=r'current-user/addresses/(?P<id>\d+)', detail=False)
    def address_detail(self, request, id):
        address = get_object_or_404(Address, id=id, user=request.user, active=True)
        if request.method == 'DELETE':
            serializer = serializers.AddressSerializer(address, context={'request': request})
            serializer.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = serializers.AddressSerializer(address, data=request.data, partial=True, context={'request': request} )
        serializer.is_valid(raise_exception=True)
        address = serializer.save()
        return Response(serializers.AddressSerializer(address).data, status=status.HTTP_200_OK)

class ProductViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView, generics.RetrieveUpdateAPIView):
    queryset = Product.objects.filter(active=True, status=ProductStatus.ACTIVE)
    serializer_class = serializers.ProductListSerializer
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = paginators.ItemPaginator
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    def get_permissions(self):
        if self.action in ['add_tag','create', 'update', 'partial_update','create_variant']:
            return [perms.IsAdmin()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action in ['retrieve']:
            return serializers.ProductDetailSerializer
        if self.action in ['get_create_reviews']:
            if self.request.method == 'GET':
                return serializers.ReviewSerializer
            return serializers.ReviewCreateSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return serializers.ProductCreateUpdateSerializer
        if self.action in ['get_create_variant']:
            if self.request.method == "POST":
                return serializers.ProductVariantCreateUpdateSerializer
            return serializers.ProductVariantSerializer
        return serializers.ProductListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.ADMIN and self.action in ['update', 'partial_update', 'create_variant', 'list','create_variant'] :
            query = Product.objects.filter(active=True)
        else:
            query = self.queryset
        query = query.select_related('category', 'brand').prefetch_related('variants', 'images','reviews')
        keyword = self.request.query_params.get('search')
        category_id = self.request.query_params.get('category')
        brand_id = self.request.query_params.get('brand')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        size = self.request.query_params.get('size')
        color = self.request.query_params.get('color')
        sort = self.request.query_params.get('sort')
        product_status = self.request.query_params.get('status')
        stock_status = self.request.query_params.get('stock_status')
        if keyword:
            query = query.filter(Q(name__icontains=keyword) | Q(description__icontains=keyword)).distinct()
        if category_id:
            query = query.filter(category_id=category_id)
        if brand_id:
            query = query.filter(brand_id=brand_id)
        if min_price:
            query = query.filter(base_price__gte=min_price)
        if max_price:
            query = query.filter(base_price__lte=max_price)
        if size:
            query = query.filter(variants__size=size.upper(), variants__stock_qty__gt=0)
        if color:
            query = query.filter(variants__color__icontains=color, variants__stock_qty__gt=0)
        if size or color:
            query = query.distinct()
        sort_map = {
            'price_asc': 'base_price',
            'price_desc': '-base_price',
            'newest': '-created_at',
            'best_selling': '-sold_count',
        }
        if sort in sort_map:
            query = query.order_by(sort_map[sort])
        if product_status:
            valid_status = [s.value for s in ProductStatus]
            if product_status in valid_status:
                query = query.filter(status=product_status)
        if stock_status in ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'):
            query = query.annotate(_total_stock=Sum('variants__stock_qty', filter=Q(variants__active=True)))
            if stock_status == 'OUT_OF_STOCK':
                query = query.filter(Q(_total_stock=0) | Q(_total_stock__isnull=True))
            elif stock_status == 'LOW_STOCK':
                query = query.filter(_total_stock__gt=0, _total_stock__lt=10)
            elif stock_status == 'IN_STOCK':
                query = query.filter(_total_stock__gte=10)
        return query

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        product = get_object_or_404(self.queryset, pk=kwargs['pk'])
        product.view_count +=1
        product.save(update_fields=['view_count'])
        serializer = self.get_serializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(self.get_serializer(product).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        product = self.get_object()
        serializer = self.get_serializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(self.get_serializer(product).data, status=status.HTTP_200_OK)

    def update(self, request, pk=None):
        product = self.get_object()
        serializer = self.get_serializer(product, data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(self.get_serializer(product).data, status=status.HTTP_200_OK)

    # @action(methods=['get'], url_path='variants', detail=True)
    # def get_variants(self, request, pk=None):
    #     print("🔥 GET VARIANTS ĐƯỢC GỌI")
    #     product = self.get_object()
    #     variants = product.variants.filter(active=True)
    #     serializer = self.get_serializer(variants, many=True)
    #     return Response(serializer.data,status=status.HTTP_200_OK)

    @action(methods=['get', 'post'], url_path='reviews', detail=True)
    def get_create_reviews(self, request, pk=None):
        product = self.get_object()
        if request.method == 'POST':
            serializer = serializers.ReviewCreateSerializer(data=request.data, context={'request': request, 'product': product})
            serializer.is_valid(raise_exception=True)
            review = serializer.save()
            return Response(serializers.ReviewCreateSerializer(review).data, status=status.HTTP_201_CREATED)
        is_admin = request.user.is_authenticated and request.user.role == UserRole.ADMIN
        reviews = Review.objects.filter(product=product, active=True)
        if not is_admin:
            reviews = reviews.filter(is_hidden=False)
        rating = request.query_params.get('rating')
        keyword = request.query_params.get('search')
        ordering_map = {
            'newest': '-created_at',
            'rating_desc': '-rating',
            'rating_asc': 'rating',
        }
        ordering = request.query_params.get('ordering')
        if rating:
          reviews = reviews.filter(rating=int(rating))
        if keyword:
            reviews = reviews.filter(comment__icontains=keyword)
        reviews = reviews.order_by(ordering_map.get(ordering, '-created_at'))
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = serializers.ReviewSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = serializers.ReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['get','post'], url_path='variants', detail=True)
    def get_create_variant(self, request, pk=None):
        product = self.get_object()
        if request.method == "POST":
            serializer = self.get_serializer(data={**request.data, 'product': product.pk})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        variants = product.variants.filter(active=True)
        serializer = self.get_serializer(variants, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='tags', detail=True)
    def add_tag(self, request, pk=None):
        product = self.get_object()
        serializer = serializers.ProductTagSerializer(data={**request.data, 'product': product.pk})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CategoryViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Category.objects.filter(active=True).order_by('name')
    serializer_class = serializers.CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class BrandViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Brand.objects.filter(active=True).order_by('name')
    serializer_class = serializers.BrandSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ProductVariantViewSet(viewsets.ViewSet, generics.ListAPIView,generics.UpdateAPIView):
    queryset = ProductVariant.objects.filter(active=True)
    permission_classes = [perms.IsAdmin]
    def get_queryset(self):
        query = self.queryset.select_related('product__brand').prefetch_related('product__images')
        return query

    def get_serializer_class(self):
        if self.action == 'list':
            return serializers.ProductVariantAdminListSerializer
        return serializers.ProductVariantCreateUpdateSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def partial_update(self, request, pk=None):
        variant = self.get_object()
        serializer = self.get_serializer(variant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

class OrderItemViewSet(viewsets.ViewSet,generics.ListAPIView):
    queryset = OrderItem.objects.filter(active=True)
    serializer_class = serializers.ReviewCreateSerializer
    permission_classes = [perms.OrderItemCustomerOwner]
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]
    def get_queryset(self):
        query = self.queryset.select_related('order', 'variant__product')
        return query
    @action(methods=['post'], url_path='review', detail=True)
    def post_review(self, request, pk=None):
        order_item = self.get_object()
        serializer = serializers.ReviewCreateSerializer(data=request.data,context={'request': request, 'order_item': order_item})
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        serializer = serializers.ReviewCreateSerializer(review)
        return Response(serializer.data,status=status.HTTP_201_CREATED)

class CartViewSet(viewsets.ViewSet,generics.ListAPIView):
    queryset = CartItem.objects.filter(active=True)
    serializer_class = serializers.CartItemSerializer
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]
    permission_classes = [permissions.IsAuthenticated]
    def get_permissions(self):
        if self.action in ['handle_item_detail']:
            return [perms.CartItemCustomerOwner()]
        return super().get_permissions()
    def get_queryset(self):
        return (CartItem.objects.filter(active=True, user = self.request.user) .select_related('variant__product'))
    def list(self, request, *args, **kwargs):
        cart_items = self.get_queryset()
        serializer = serializers.CartItemSerializer(cart_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    @action(methods=['post'], url_path='items', detail=False)
    def create_cart_items(self, request):
        serializer = serializers.CartItemSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        cart_item = serializer.save()
        return Response(serializers.CartItemSerializer(cart_item).data, status=status.HTTP_201_CREATED)
    @action(methods=['get','patch', 'delete'], url_path=r'items/(?P<pk>\d+)', detail=False)
    def handle_item_detail(self, request, pk=None):
        cart_item = self.get_object()
        if request.method == 'GET':
            serializer = serializers.CartItemSerializer(cart_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        if request.method == 'DELETE':
            cart_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = serializers.CartItemSerializer(cart_item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        cart_item = serializer.save()
        return Response(serializers.CartItemSerializer(cart_item).data, status=status.HTTP_200_OK)

class OrderViewSet(viewsets.ViewSet, generics.ListCreateAPIView,generics.RetrieveUpdateAPIView):
    queryset = Order.objects.filter(active=True)
    serializer_class = serializers.OrderListSerializer
    permission_classes = [perms.OrderAccess]
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]
    def get_permissions(self):
        if self.action in ['create', 'preview']:
            return [perms.IsCustomer()]
        return super().get_permissions()
    def get_serializer_class(self):
        if self.action == 'create':
            return serializers.OrderCreateSerializer
        if self.action in ['retrieve', 'partial_update']:
            return serializers.OrderDetailSerializer
        return serializers.OrderListSerializer

    def get_queryset(self):
        query = self.queryset
        order_status = self.request.query_params.get('status')
        payment_method = self.request.query_params.get('payment_method')
        order_code = self.request.query_params.get('order_code')
        recipient_name = self.request.query_params.get('recipient_name')
        if order_status:
            query = query.filter(status=order_status.upper())
        if payment_method:
            query = query.filter(payment_method=payment_method.upper())
        if order_code:
            query = query.filter(code__icontains=order_code)
        if recipient_name:
            query = query.filter(recipient_name__icontains=recipient_name)
        return query
    def list(self, request, *args, **kwargs):
        user = request.user
        query = self.get_queryset()
        if user.role == UserRole.ADMIN:
            orders = query
        elif user.role == UserRole.SHIPPER:
            orders = query.filter(shipper=user)
        else:
            orders = query.filter(user=user)
        orders = orders.prefetch_related('items')
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def partial_update(self, request, pk=None):
        order = self.get_object()
        serializer = self.get_serializer(order, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def retrieve(self, request, pk=None):
        order = self.get_object()
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        result = {'order': serializers.OrderDetailSerializer(order).data}
        if order.payment_method == PaymentMethod.PAYOS:
            result['payment'] = serializers.PaymentSerializer(order.payment).data
        return Response(result, status=status.HTTP_201_CREATED)
    @action(methods=['post'], detail=False, url_path='preview')
    def preview(self, request):
        serializer = serializers.OrderPreviewSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        result = serializer.to_preview()
        return Response(result, status=status.HTTP_200_OK)

class ShipperCODViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class = serializers.RemittanceSerializer
    def get_permissions(self):
        if self.action == 'my_pending':
            return [perms.IsShipper()]
        if self.action == 'list_create_remittance' and self.request.method == 'GET':
            return [perms.IsAdminOrShipper()]
        return [perms.IsAdmin()]
    def pending_orders_data(self, shipper_id):
        orders = Order.objects.filter(shipper_id=shipper_id, payment_method=PaymentMethod.COD,status=OrderStatus.DELIVERED, cod_remitted=False, active=True)
        total = sum(o.total_amount for o in orders)
        return {'shipper_id': shipper_id,'total_pending_amount': total,'orders': serializers.OrderListSerializer(orders, many=True).data}
    def list(self, request, *args, **kwargs):
        shippers = User.objects.filter(role=UserRole.SHIPPER, is_active=True)
        serializer = serializers.UserSerializer(shippers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    @action(methods=['get'], url_path=r'(?P<id>\d+)/cod-pending', detail=False)
    def pending(self, request, id=None):
        return Response(self.pending_orders_data(id), status=status.HTTP_200_OK)
    @action(methods=['get'], url_path='me/cod-pending', detail=False)
    def my_pending(self, request):
        return Response(self.pending_orders_data(request.user.id), status=status.HTTP_200_OK)
    @action(methods=['get','post'], url_path='cod-remittances', detail=False)
    def list_create_remittance(self, request):
        if request.method == 'POST':
            serializer = serializers.CreateRemittanceSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            remittance = serializer.save()
            return Response(serializers.RemittanceSerializer(remittance).data,status=status.HTTP_201_CREATED)
        qs = Remittance.objects.filter(active=True).order_by('-remitted_at')
        if request.user.role == UserRole.SHIPPER:
            qs = qs.filter(shipper_id=request.user.id)
        else:
            shipper_id = request.query_params.get('shipper_id')
            if shipper_id:
                qs = qs.filter(shipper_id=shipper_id)
        serializer = serializers.RemittanceSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PaymentViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = Payment.objects.filter(active=True)
    serializer_class = serializers.PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Payment.objects.none()
        return self.queryset.filter(order__user=self.request.user)
    @action(methods=['get'], url_path='check-status', detail=True)
    def check_status(self, request, pk=None):
        payment = self.get_object()
        serializer = serializers.PaymentSerializer(payment)
        client = PayOS(client_id=settings.PAYOS_CLIENT_ID, api_key=settings.PAYOS_API_KEY, checksum_key=settings.PAYOS_CHECKSUM_KEY)
        info = client.payment_requests.get(payment.transaction_id)
        if info.status == 'PAID':
            self.mark_paid(payment)
        return Response(serializers.PaymentSerializer(payment).data)
    def mark_paid(self, payment):
        payment.status = PaymentStatus.PAID
        payment.paid_at = timezone.now()
        payment.save(update_fields=['status', 'paid_at'])
        order = payment.order
        variant_ids = order.items.values_list('variant_id', flat=True)
        CartItem.objects.filter(user=order.user, variant_id__in=variant_ids).delete()
        utils.confirm_order_and_assign_shipper(order)
        utils.notify_payment_success(order)

class ReviewViewSet(viewsets.ViewSet, generics.UpdateAPIView):
    queryset = Review.objects.filter(active=True)
    serializer_class = serializers.ReviewSerializer
    permission_classes = [perms.IsAdmin]
    def partial_update(self, request, pk=None):
        review = self.get_object()
        serializer = self.serializer_class(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

class VoucherViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.RetrieveUpdateAPIView, generics.DestroyAPIView):
    queryset = Voucher.objects.filter(active=True).order_by('-created_at')
    serializer_class = serializers.VoucherSerializer
    permission_classes = [perms.IsAdmin]
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]
    def get_queryset(self):
        qs = self.queryset
        search = self.request.query_params.get('search')
        status_param = self.request.query_params.get('status')
        discount_type = self.request.query_params.get('discount_type')
        ordering = self.request.query_params.get('ordering')
        if search:
            qs = qs.filter(Q(code__icontains=search) | Q(description__icontains=search))
        if discount_type:
            qs = qs.filter(discount_type=discount_type.upper())
        now = timezone.now()
        if status_param == 'VALID':
            qs = qs.filter(start_date__lte=now, end_date__gte=now, used_count__lt=F('usage_limit'))
        elif status_param == 'EXPIRED':
            qs = qs.filter(Q(end_date__lt=now) | Q(start_date__gt=now) | Q(used_count__gte=F('usage_limit')))
        ordering_map = {
            'newest': '-created_at',
            'oldest': 'created_at',
            'end_date_asc': 'end_date',
            'end_date_desc': '-end_date',
            'discount_value_desc': '-discount_value',
            'discount_value_asc': 'discount_value',
        }
        return qs.order_by(ordering_map.get(ordering, '-created_at'))
    def list(self, request, *args, **kwargs):
        vouchers = self.get_queryset()
        serializer = self.get_serializer(vouchers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    def retrieve(self, request, pk=None):
        voucher = self.get_object()
        serializer = self.get_serializer(voucher)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def update(self, request, pk=None):
        voucher = self.get_object()
        serializer = self.get_serializer(voucher, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    def partial_update(self, request, pk=None):
        voucher = self.get_object()
        serializer = self.get_serializer(voucher, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    def destroy(self, request, pk=None):
        voucher = self.get_object()
        voucher.active = False
        voucher.save(update_fields=['active'])
        return Response(status=status.HTTP_204_NO_CONTENT)

class ChatViewSet(viewsets.ViewSet, generics.UpdateAPIView):
    serializer_class = serializers.ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_permissions(self):
        if self.action in ['get_list_rooms']:
            return [perms.IsAdmin()]
        if self.action in ['messages', 'partial_update']:
            return [perms.RoomAccess()]
        if self.action == 'get_own_room':
            return [perms.IsCustomerOrShipper()]
        return super().get_permissions()
    def partial_update(self, request, *args, **kwargs):
        room = self.get_object()
        room.messages.filter(active=True, is_read=False, sender=room.customer).update(is_read=True)
        return Response(status=status.HTTP_200_OK)
    @action(methods=['get'], url_path='room', detail=False)
    def get_own_room(self, request):
        room, _ = ChatRoom.objects.get_or_create(customer=request.user)
        serializer = serializers.ChatRoomSerializer(room)
        return Response(serializer.data, status=status.HTTP_200_OK)
    @action(methods=['get'], url_path='rooms', detail=False)
    def get_list_rooms(self, request):
        rooms = ChatRoom.objects.filter(active=True).select_related('customer')
        serializer = serializers.ChatRoomSerializer(rooms, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    @action(methods=['get', 'post'], url_path=r'rooms/(?P<id>\d+)/messages', detail=False)
    def messages(self, request, id=None):
        room = get_object_or_404(ChatRoom, id=id)
        if request.method == 'POST':
            serializer = serializers.ChatMessageSerializer(data=request.data, context={'request': request, 'room': room})
            serializer.is_valid(raise_exception=True)
            message = serializer.save()
            return Response(serializers.ChatMessageSerializer(message).data, status=status.HTTP_201_CREATED)
        history = ChatMessage.objects.filter(room=room, active=True).select_related('sender')
        return Response(serializers.ChatMessageSerializer(history, many=True).data, status=status.HTTP_200_OK)

class AIStylistViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    serializer_class = serializers.AIStylistSessionSerializer
    queryset = AIStylistSession.objects.filter(active=True)
    permission_classes = [perms.IsCustomer]
    def get_queryset(self):
        return AIStylistSession.objects.filter(active=True, user=self.request.user).order_by('-created_at')
    @action(methods=['post'], url_path='query', detail=False)
    def query(self, request):
        serializer = serializers.AIStylistQuerySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        return Response(serializers.AIStylistSessionSerializer(session).data,status=status.HTTP_201_CREATED)
    @action(methods=['get'], url_path=r'sessions/(?P<pk>\d+)', detail=False)
    def get_session(self, request, pk=None):
        session = self.get_object()
        return Response(serializers.AIStylistSessionSerializer(session).data, status=status.HTTP_200_OK)


class NotificationViewSet(viewsets.ViewSet, generics.ListAPIView, generics.UpdateAPIView):
    serializer_class = serializers.NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user, active=True)
    def partial_update(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(serializers.NotificationSerializer(notification).data, status=status.HTTP_200_OK)
    @action(methods=['post'], detail=False, url_path='read-all')
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, active=True, is_read=False).update(is_read=True)
        return Response({'detail': 'Đã đánh dấu tất cả thông báo là đã đọc'}, status=status.HTTP_200_OK)