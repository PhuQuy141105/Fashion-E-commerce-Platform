from rest_framework import serializers
from shop_online.models import *
import time
from django.utils import timezone
from datetime import timedelta
from shop_online import utils
from payos import PayOS, APIError
from payos.types import CreatePaymentLinkRequest
from apis import settings
from decimal import Decimal
import cloudinary.uploader
from django.utils.text import slugify
import requests
from django.db import transaction

class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'gender', 'phone', 'dob', 'avatar', 'first_name', 'last_name']
        extra_kwargs = {'role': {'read_only': True}}
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['full_name'] = (instance.last_name + " " if instance.last_name else "") + instance.first_name
        if instance.avatar:
            data['avatar'] = instance.avatar.url
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = SimpleUserSerializer.Meta.model
        fields = SimpleUserSerializer.Meta.fields + ['username', 'password']
        extra_kwargs = {'password': {'write_only': True}}
    def create(self, validated_data):
        validated_data.pop('role', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.role = UserRole.CUSTOMER
        if not user.first_name and not user.last_name:
            user.first_name = user.username
        user.set_password(password)
        user.save()
        Notification.objects.create(user=user,type=NotificationType.SYSTEM,title='Chào mừng bạn đến với Fashion Shop',body=f'Xin chào {user.first_name}, cảm ơn bạn đã đăng ký tài khoản. Chúc bạn mua sắm vui vẻ',)
        return user

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'recipient_name', 'recipient_phone', 'province','district', 'ward', 'detail_address', 'is_default']
    def validate(self,data):
        request = self.context.get('request')
        user = request.user
        def field_value(name):
            if name in data:
                return data[name]
            if self.instance:
                return getattr(self.instance, name)

        province = field_value('province')
        district = field_value('district')
        ward = field_value('ward')
        detail_address = field_value('detail_address')
        duplicate_qs = Address.objects.filter(
            user=user, active=True,
            province__iexact=(province or '').strip(),
            district__iexact=(district or '').strip(),
            ward__iexact=(ward or '').strip(),
            detail_address__iexact=(detail_address or '').strip(),
        )

        if self.instance:
            duplicate_qs = duplicate_qs.exclude(pk=self.instance.pk)
        if duplicate_qs.exists():
            raise serializers.ValidationError({'error': 'Địa chỉ này đã tồn tại trong danh sách của bạn'})
        return data
    def create(self,validated_data):
        request = self.context.get('request')
        user = request.user
        has_address = Address.objects.filter(user=user, active=True).exists()
        if has_address:
            validated_data['is_default'] = False
        if validated_data['is_default']:
            Address.objects.filter(user=user, active=True, is_default=True).update(is_default=False)
        location = utils.geocode_address(
            validated_data.get('province'),
            validated_data.get('district'),
            validated_data.get('ward'),
            validated_data.get('detail_address')
        )
        return Address.objects.create(user=user, location=location, **validated_data)
    def update(self,instance,validated_data):
        request = self.context.get('request')
        user = request.user
        is_default = validated_data.get('is_default',instance.is_default)
        address_fields_changed = any(f in validated_data and validated_data[f] != getattr(instance, f)for f in ['province', 'district', 'ward', 'detail_address'])
        if address_fields_changed:
            province = validated_data.get('province', instance.province)
            district = validated_data.get('district', instance.district)
            ward = validated_data.get('ward', instance.ward)
            detail_address = validated_data.get('detail_address', instance.detail_address)
            instance.location = utils.geocode_address(province, district, ward, detail_address)
        if is_default and not instance.is_default:
            Address.objects.filter(user=user, active=True, is_default=True).exclude(pk=instance.pk).update(is_default=False)
        return super().update(instance, validated_data)
    def delete(self):
        request = self.context.get('request')
        user = request.user
        total_address = Address.objects.filter(user=user,active=True).count()
        if total_address <= 1:
            raise serializers.ValidationError("Bạn phải giữ lại ít nhất 1 địa chỉ giao hàng.")
        was_default = self.instance.is_default
        self.instance.delete()
        if was_default:
            next_default = Address.objects.filter(user=user, active=True).order_by('-created_at').first()
            if next_default:
                next_default.is_default = True
                next_default.save(update_fields=['is_default'])

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'parent']

class  BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'logo']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo:
            data['logo'] = instance.logo.url
        return data

class ProductListSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'category', 'brand', 'gender_target','base_price', 'is_featured', 'status', 'sold_count', 'thumbnail', 'description', 'total_stock']

    def get_thumbnail(self, obj):
        image_obj = obj.images.filter(active=True).first()
        if not image_obj or not image_obj.image:
            return None
        return image_obj.image
    def to_representation(self, instance):
        data = super().to_representation(instance)
        variants = instance.variants.filter(active=True, stock_qty__gt=0)
        sizes = variants.values_list('size', flat=True).distinct()
        data['variant_count'] = instance.variants.filter(active=True).count()
        data['category'] = CategorySerializer(instance.category).data
        data['brand'] = BrandSerializer(instance.brand).data
        data['available_sizes'] = [s.value if hasattr(s,'value') else s for s in sizes]
        data['available_colors'] = list(variants.values_list('color', flat=True).distinct())
        data['avg_rating'] = instance.avg_review
        return data

class ProductVariantSerializer(serializers.ModelSerializer):
    final_price = serializers.DecimalField(max_digits=12, decimal_places=0, read_only=True)
    images = serializers.SerializerMethodField()
    class Meta:
        model = ProductVariant
        fields = ['id', 'size', 'color', 'stock_qty', 'price_adjustment', 'final_price', 'images']
    def get_images(self, obj):
        return [img.image for img in obj.images.all() if img.active]
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['size'] = data['size'].value if hasattr(data['size'],'value') else data['size']
        return data


class ProductVariantAdminListSerializer(serializers.ModelSerializer):
    final_price = serializers.DecimalField(max_digits=12, decimal_places=0, read_only=True)
    class Meta:
        model = ProductVariant
        fields = ['id', 'size', 'color', 'stock_qty', 'price_adjustment', 'final_price']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['size'] = data['size'].value if hasattr(data['size'], 'value') else data['size']
        image_obj = instance.product.images.filter(active=True).first()
        data['product'] = {
            'id': instance.product.id,
            'name': instance.product.name,
            'brand': instance.product.brand.name if instance.product.brand else None,
            'thumbnail': image_obj.image if image_obj else None,
        }
        return data

class ProductVariantCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id','product','size','color','stock_qty','price_adjustment',]
    def validate(self, data):
        product = data.get('product',self.instance.product if self.instance else None)
        size = data.get('size',self.instance.size if self.instance else None)
        color = data.get('color',self.instance.color if self.instance else None)
        stock_qty = data.get('stock_qty', self.instance.stock_qty if self.instance else None)
        if stock_qty is not None and stock_qty < 0:
            raise serializers.ValidationError({'error': 'Số lượng tồn kho không được âm'})
        qs = ProductVariant.objects.filter(product=product,size=size,color=color,active=True)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({'error': 'Biến thể này đã tồn tại cho sản phẩm'})
        return data
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['size'] = (instance.size.value if hasattr(instance.size, 'value')else instance.size)
        return data

class ProductDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'description', 'category', 'brand','gender_target', 'material', 'care_instruction', 'base_price','is_featured', 'status', 'sold_count', 'view_count']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['category'] = CategorySerializer(instance.category).data
        data['brand'] = BrandSerializer(instance.brand).data
        data['review'] = ReviewSerializer(instance.reviews, many=True).data
        variants = instance.variants.filter(active=True, stock_qty__gt=0)
        data['variants'] = ProductVariantSerializer(variants, many=True).data
        data['avg_rating'] = instance.avg_review
        data['review_count'] = instance.reviews.filter(active=True, is_hidden=False).count()
        data['images'] = [img.image for img in instance.images.all() if img.active and img.variant_id is None]
        data['rating_breakdown'] = {
            str(i): instance.reviews.filter(active=True, is_hidden=False, rating=i).count()
            for i in range(1, 6)
       }
        return data

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'user', 'product', 'rating', 'comment', 'created_at','is_hidden']
        read_only_fields = ['user', 'product']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['user'] = SimpleUserSerializer(instance.user).data
        data['images'] = [img.image for img in instance.images.filter(active=True)]
        data['is_verified_purchase'] = instance.order_item is not None
        return data

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    thumbnail = serializers.ImageField(write_only=True, required=False)
    class Meta:
        model = Product
        fields = ['id', 'category', 'brand', 'name', 'slug', 'description','gender_target', 'material', 'care_instruction', 'base_price', 'is_featured', 'status','thumbnail']
        extra_kwargs = {'slug': {'required': False}}
    def validate(self, data):
        base_price = data.get('base_price', self.instance.base_price if self.instance else None)
        status = data.get('status', self.instance.status.value if self.instance else None)
        valid_status = [s.value for s in ProductStatus]
        if status not in valid_status:
            raise serializers.ValidationError({"error": f"Trạng thái không hợp lệ, chỉ chấp nhận {valid_status}"})
        if base_price <= 0:
            raise serializers.ValidationError({"error": "Giá sản phẩm phải lớn hơn 0"})
        return data
    def upload_thumbnail(self, file):
        try:
            result = cloudinary.uploader.upload(file, folder='products')
        except Exception as e:
            raise serializers.ValidationError({'error': 'Tải ảnh lên thất bại'})
        return result['secure_url']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['category'] = CategorySerializer(instance.category).data
        data['brand'] = BrandSerializer(instance.brand).data if instance.brand else None
        data['status'] = instance.status.value if hasattr(instance.status, 'value') else instance.status
        image_obj = instance.images.filter(active=True).first()
        data['thumbnail'] = image_obj.image if image_obj else None
        return data
    def create(self, validated_data):
        thumbnail = validated_data.pop('thumbnail', None)
        if not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data['name'])  # from django.utils.text import slugify
        product = Product.objects.create(**validated_data)
        if thumbnail:
            image_url = self.upload_thumbnail(thumbnail)
            ProductImage.objects.create(product=product, image=image_url, is_thumbnail=True)
        return product
    def update(self, instance, validated_data):
        thumbnail = validated_data.pop('thumbnail', None)
        product = super().update(instance, validated_data)
        if thumbnail:
            image_url = self.upload_thumbnail(thumbnail)
            product.images.filter(active=True, is_thumbnail=True).update(is_thumbnail=False)
            ProductImage.objects.create(product=product, image=image_url, is_thumbnail=True)
        return product

class ProductTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTag
        fields = ['id', 'product', 'tag']
    def validate_tag(self, value):
        valid = [t.value for t in OccasionTag]
        if value not in valid:
            raise serializers.ValidationError(f'Tag không hợp lệ, chỉ chấp nhận: {valid}')
        return value
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['tag'] = instance.tag.value if hasattr(instance.tag, 'value') else instance.tag
        data["images"] = [img.image.url for img in instance.images.filter(active=True)]
        return data


class ReviewCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(child=serializers.ImageField(), write_only=True, required=False, max_length=4)
    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'images']
    def validate(self, data):
        rating = data["rating"]
        if rating < 1 or rating > 5:
            raise serializers.ValidationError({"error": "Số sao đánh giá phải từ 1 đến 5"})
        order_item = self.context.get("order_item")
        product = self.context.get("product")
        request = self.context.get("request")
        if order_item:
            if order_item.order.status != OrderStatus.DELIVERED:
                raise serializers.ValidationError({"error": "Đơn hàng chưa được giao, không thể đánh giá"})
            if Review.objects.filter(order_item=order_item, active=True).exists():
                raise serializers.ValidationError({"error": "Sản phẩm này đã được đánh giá."})
        return data
    def upload_image(self, file):
        try:
            result = cloudinary.uploader.upload(file, folder='reviews')
        except Exception as e:
            raise serializers.ValidationError({'error': f'Tải ảnh lên thất bại: {e}'})
        return result['secure_url']

    def create(self, validated_data):
        images = validated_data.pop("images", [])
        order_item = self.context.get("order_item")
        product = self.context.get("product")
        request = self.context.get("request")
        user = request.user
        if order_item:
            review = Review.objects.create(order_item=order_item, user=user, product=order_item.variant.product,**validated_data)
        else:
            matched_order_item = (OrderItem.objects.filter(order__user=user,order__status=OrderStatus.DELIVERED,variant__product=product,active=True)
                                  .exclude(id__in=Review.objects.filter(active=True, order_item__isnull=False)
                                  .values_list('order_item_id', flat=True)).first())
            review = Review.objects.create(order_item=matched_order_item, user=user, product=product, **validated_data)
        for img in images:
            image_url = self.upload_image(img)
            ReviewImage.objects.create(review=review, image=image_url)
        return review

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["images"] = [img.image for img in  instance.images.filter(active=True)]
        data['is_verified_purchase'] = instance.order_item is not None
        return data

class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['id', 'variant', 'quantity']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        variant = instance.variant
        data['variant'] = {
            'id': variant.id,
            'product': ProductListSerializer(variant.product).data,
            'size': variant.size.value if hasattr(variant.size, 'value') else variant.size,
            'color': variant.color,
            'stock_qty': variant.stock_qty,
            'final_price': variant.final_price,
        }
        data['subtotal'] = instance.subtotal
        return data
    def validate(self, data):
        variant = data.get('variant', self.instance.variant if self.instance else None)
        quantity = data.get('quantity', self.instance.quantity if self.instance else None)
        if variant.stock_qty <= 0:
            raise serializers.ValidationError({'error': 'Sản phẩm đã hết hàng'})
        if quantity is not None and quantity > variant.stock_qty:
            raise serializers.ValidationError({'error': 'Số lượng vượt quá tồn kho hiện có.'})
        return data
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        variant = validated_data['variant']
        quantity = validated_data['quantity']
        cart_item = CartItem.objects.filter(user=user, variant=variant, active=True).first()
        if cart_item:
            new_quantity = cart_item.quantity + quantity
            if new_quantity > variant.stock_qty:
                raise serializers.ValidationError({'error': 'Số lượng vượt quá tồn kho hiện có.'})
            cart_item.quantity = new_quantity
            cart_item.save(update_fields=['quantity'])
            return cart_item
        return CartItem.objects.create(user=user, **validated_data)

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'variant', 'product_name', 'size', 'color', 'unit_price', 'quantity']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        image_obj = instance.variant.product.images.filter(active=True).first()
        data['thumbnail'] = image_obj.image if image_obj else None
        data['subtotal'] = instance.subtotal
        return data

class OrderListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'code', 'status', 'payment_method','total_amount', 'expected_delivery_date', 'created_at','delivered_at', 'recipient_name','shipping_address']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['items'] = OrderItemSerializer(instance.items.filter(active=True), many=True).data
        data['item_count'] = sum(instance.items.filter(active=True).values_list('quantity', flat=True))
        data['payment'] = PaymentSerializer(instance.payment).data if hasattr(instance, 'payment') else None
        return data

class OrderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'code', 'recipient_name', 'recipient_phone', 'shipping_address','shipping_fee', 'subtotal_amount', 'discount_amount', 'total_amount','voucher', 'payment_method', 'status',
                 'cancel_reason', 'expected_delivery_date', 'delivered_at', 'created_at']
        read_only_fields = ['code', 'recipient_name', 'recipient_phone', 'shipping_address','shipping_fee', 'subtotal_amount', 'discount_amount', 'total_amount','voucher', 'payment_method',
                           'expected_delivery_date', 'delivered_at', 'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['items'] = OrderItemSerializer(instance.items.filter(active=True), many=True).data
        return data
    def validate(self, data):
        request = self.context['request']
        user = request.user
        new_status = data['status']
        if new_status is None:
            return data
        if user.role == UserRole.CUSTOMER:
            if new_status != "CANCELLED":
                raise serializers.ValidationError({'error': 'Trạng thái cập nhật không hợp lệ'})
            if self.instance.status != OrderStatus.PENDING:
                raise serializers.ValidationError({'error': 'Không thể huỷ đơn hàng'})
        if user.role == UserRole.ADMIN:
            if new_status not in ['PACKING', 'CANCELLED']:
                raise serializers.ValidationError({'error': 'Trạng thái cập nhật không hợp lệ'})
            if self.instance.status != OrderStatus.PENDING:
                raise serializers.ValidationError({'error': 'Chỉ có thể xử lý đơn hàng đang ở trạng thái chờ xác nhận'})
        if user.role == UserRole.SHIPPER:
            valid_transitions = {
                OrderStatus.PACKING: ['SHIPPING'],
                OrderStatus.SHIPPING: ['DELIVERED', 'CANCELLED'],
            }
            allowed = valid_transitions.get(self.instance.status, [])
            if new_status not in allowed:
                raise serializers.ValidationError({'error': 'Không thể cập nhật trạng thái đơn hàng theo yêu cầu này'})
        return data
    def update(self, instance, validated_data):
        new_status = validated_data['status']
        if new_status == "CANCELLED":
            reason = validated_data.get('cancel_reason', '')
            utils.cancel_order(instance, reason=reason)
            return instance
        if new_status =='PACKING':
            instance.status = OrderStatus.PACKING
            instance.save(update_fields=['status'])
            utils.notify_order_packing(instance)
            return instance
        if new_status == 'SHIPPING':
            instance.status = OrderStatus.SHIPPING
            instance.shipped_at = timezone.now()
            instance.save(update_fields=['status', 'shipped_at'])
            utils.notify_order_shipping(instance)
            return instance
        if new_status == 'DELIVERED':
            instance.status = OrderStatus.DELIVERED
            instance.delivered_at = timezone.now()
            instance.save(update_fields=['status', 'delivered_at'])
            utils.notify_order_delivered(instance)
            return instance
        return super().update(instance, validated_data)

class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'address_id', 'voucher_code', 'payment_method', 'cart_item_ids']
    address_id = serializers.IntegerField(write_only=True)
    voucher_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cart_item_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False, allow_empty=False)
    def validate(self, data):
        request = self.context['request']
        user = request.user
        address = Address.objects.filter(pk=data["address_id"], user=user, active=True).first()
        cart_items_qs = CartItem.objects.filter(user=user, active=True).select_related('variant__product')
        cart_item_ids = data.get('cart_item_ids')
        if cart_item_ids:
            cart_items_qs = cart_items_qs.filter(id__in=cart_item_ids)
            if cart_items_qs.count() != len(set(cart_item_ids)):
                raise serializers.ValidationError({'error': 'Một số sản phẩm đã chọn không còn trong giỏ hàng, vui lòng tải lại trang'})
        cart_items = list(cart_items_qs)
        if not cart_items:
            raise serializers.ValidationError({'error': 'Giỏ hàng trống, không thể đặt hàng'})

        for item in cart_items:
            if item.quantity > item.variant.stock_qty:
                raise serializers.ValidationError(
                    {'error': f'Số lượng tồn kho không đủ cho sản phẩm {item.variant.product.name}.'}
                )

        data['address'] = address
        data['cart_items'] = cart_items

        voucher = None
        code = data.get('voucher_code')
        if code:
            voucher = Voucher.objects.filter(code=code, active=True).first()
            if not voucher or not voucher.is_valid:
                raise serializers.ValidationError({'error': 'Mã giảm giá không hợp lệ hoặc đã hết hạn'})
        data['voucher'] = voucher
        return data
    def create(self, validated_data):
        request = self.context['request']
        user = request.user
        address = validated_data['address']
        cart_items = validated_data['cart_items']
        voucher = validated_data['voucher']
        payment_method = validated_data['payment_method']
        now = timezone.now()
        subtotal = sum(item.variant.final_price * item.quantity for item in cart_items)
        shipping_fee, expected_delivery_date = utils.calculate_shipping_info(now, address)
        discount_amount = 0
        pre_amount = subtotal + shipping_fee
        if voucher:
            if voucher.discount_type == DiscountType.PERCENT:
                discount_amount = subtotal * voucher.discount_value / 100
                if voucher.max_discount_amount:
                    discount_amount = min(discount_amount, voucher.max_discount_amount)
            else:
                discount_amount = min(voucher.discount_value, pre_amount)
            if subtotal < voucher.min_order_value:
                raise serializers.ValidationError({'error': 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá'})
        total_amount = pre_amount - discount_amount
        with transaction.atomic():
            order = Order.objects.create(
                user=user,
                code=f"DH{int(time.time())}",
                recipient_name=address.recipient_name,
                recipient_phone=address.recipient_phone,
                shipping_address=f"{address.detail_address}, {address.ward}, {address.district}, {address.province}",
                shipping_fee=shipping_fee,
                subtotal_amount=subtotal,
                discount_amount=discount_amount,
                total_amount=total_amount,
                voucher=voucher,
                payment_method=payment_method,
                status=OrderStatus.PENDING,
                expected_delivery_date=expected_delivery_date,
            )
            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    variant=item.variant,
                    product_name=item.variant.product.name,
                    size=item.variant.size.value if hasattr(item.variant.size, 'value') else item.variant.size,
                    color=item.variant.color,
                    unit_price=item.variant.final_price,
                    quantity=item.quantity,
                )
                item.variant.stock_qty -= item.quantity
                item.variant.save(update_fields=['stock_qty'])
                if payment_method == 'COD':
                    item.delete()
            if voucher:
                voucher.used_count += 1
                voucher.save(update_fields=['used_count'])
            if order.payment_method == PaymentMethod.COD:
                utils.confirm_order_and_assign_shipper(order)
            else:
                payment = Payment.objects.create(order=order, amount=total_amount, method=PaymentMethod.PAYOS, status=PaymentStatus.PENDING)
                payment_serializer = PaymentSerializer()
                payment_serializer.create_payos_link(payment)
        payment_method_label = "Thanh toán khi nhận hàng (COD)" if payment_method == PaymentMethod.COD else "Thanh toán online qua PayOS"
        utils.send_order_email(order, subject=f"[Fuwuys Shop] Xác nhận đặt hàng - {order.code}",
                               template_name="order_placed.html",
                               extra_context={"payment_method_label": payment_method_label,"expected_delivery_date": expected_delivery_date})
        return order


class OrderPreviewSerializer(serializers.Serializer):
    address_id = serializers.IntegerField()
    voucher_code = serializers.CharField(required=False, allow_blank=True)
    cart_item_ids = serializers.ListField(child=serializers.IntegerField(), required=False, allow_empty=False)
    def validate(self, data):
        request = self.context['request']
        user = request.user
        address = Address.objects.filter(pk=data['address_id'], user=user, active=True).first()
        if not address:
            raise serializers.ValidationError({'error': 'Địa chỉ giao hàng không hợp lệ'})
        cart_items_qs = CartItem.objects.filter(user=user, active=True).select_related('variant__product')
        cart_item_ids = data.get('cart_item_ids')
        if cart_item_ids:
            cart_items_qs = cart_items_qs.filter(id__in=cart_item_ids)
            if cart_items_qs.count() != len(set(cart_item_ids)):
                raise serializers.ValidationError({'error': 'Một số sản phẩm đã chọn không còn trong giỏ hàng, vui lòng tải lại trang'})
        cart_items = list(cart_items_qs)
        if not cart_items:
            raise serializers.ValidationError({'error': 'Giỏ hàng trống, không thể tính đơn hàng'})
        data['address'] = address
        data['cart_items'] = cart_items
        return data
    def to_preview(self):
        data = self.validated_data
        address = data['address']
        cart_items = data['cart_items']
        code = data.get('voucher_code')
        subtotal = sum(item.variant.final_price * item.quantity for item in cart_items)
        voucher_valid = False
        voucher_error = None
        shipping_fee, expected_delivery_date = utils.calculate_shipping_info(timezone.now(), address)
        discount_amount = 0
        pre_amount = subtotal + shipping_fee
        if code:
            voucher = Voucher.objects.filter(code=code, active=True).first()
            if not voucher or not voucher.is_valid:
                voucher_error = 'Mã giảm giá không hợp lệ hoặc đã hết hạn'
            else:
                if voucher.discount_type == DiscountType.PERCENT:
                    discount_amount = subtotal * voucher.discount_value / 100
                    if voucher.max_discount_amount:
                        discount_amount = min(discount_amount, voucher.max_discount_amount)
                else:
                    discount_amount = min(voucher.discount_value, pre_amount)
                if subtotal < voucher.min_order_value:
                    voucher_error = 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá'
                    discount_amount = Decimal('0')
                else:
                    voucher_valid = True
        total_amount = pre_amount - discount_amount
        return {
            'subtotal': subtotal,
            'shipping_fee': shipping_fee,
            'discount_amount': discount_amount,
            'total_amount': total_amount,
            'expected_delivery_date': expected_delivery_date,
            'voucher_code': code or None,
            'voucher_valid': voucher_valid,
            'voucher_error': voucher_error,
        }

class RemittanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Remittance
        fields = ['id', 'shipper', 'confirmed_by', 'total_amount', 'note', 'remitted_at']
        read_only_fields = ['confirmed_by', 'total_amount', 'remitted_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['shipper'] = SimpleUserSerializer(instance.shipper).data
        data['confirmed_by'] = SimpleUserSerializer(instance.confirmed_by).data if instance.confirmed_by else None
        data['items'] = [
            {'order_id': item.order_id, 'order_code': item.order.code, 'amount': item.amount}
            for item in instance.items.select_related('order').all()
        ]
        return data


class CreateRemittanceSerializer(serializers.Serializer):
    shipper_id = serializers.IntegerField()
    order_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)
    note = serializers.CharField(required=False, allow_blank=True)
    def validate(self, data):
        shipper = User.objects.filter(pk=data['shipper_id'], role=UserRole.SHIPPER, is_active=True).first()
        if not shipper:
            raise serializers.ValidationError({'error': 'Shipper không hợp lệ'})
        order_ids = set(data['order_ids'])
        orders = Order.objects.filter(id__in=order_ids, shipper=shipper, payment_method=PaymentMethod.COD,status=OrderStatus.DELIVERED, cod_remitted=False, active=True)
        if orders.count() != len(order_ids):
            raise serializers.ValidationError({'error': 'Một số đơn không hợp lệ để đối soát'})
        data['shipper'] = shipper
        data['orders'] = list(orders)
        return data

    def create(self, validated_data):
        request = self.context['request']
        shipper = validated_data['shipper']
        orders = validated_data['orders']
        total = sum(o.total_amount for o in orders)
        remittance =Remittance.objects.create(shipper=shipper, confirmed_by=request.user,total_amount=total, note=validated_data.get('note', ''))
        for order in orders:
            RemittanceItem.objects.create(remittance=remittance, order=order, amount=order.total_amount)
            order.cod_remitted = True
            order.save(update_fields=['cod_remitted'])
        Notification.objects.create(
            user=shipper, type=NotificationType.SYSTEM, title="Đã xác nhận đối soát COD",
            body=f"Admin đã xác nhận bạn nộp {int(total):,}đ, gồm {len(orders)} đơn hàng.",
            ref_id=remittance.pk,
        )
        return remittance

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'order', 'amount', 'status', 'checkout_url', 'qr_code', 'expired_at', 'paid_at', 'transaction_id']
        read_only_fields = fields

    def create_payos_link(self, payment):
        payos_client = PayOS(client_id=settings.PAYOS_CLIENT_ID, api_key=settings.PAYOS_API_KEY,
                             checksum_key=settings.PAYOS_CHECKSUM_KEY)
        order_code = int(f"{payment.order.pk}{int(time.time()) % 100000}")
        try:
            payos_response = payos_client.payment_requests.create(payment_data=CreatePaymentLinkRequest(
                order_code=order_code,
                amount=int(payment.amount),
                description=f"TT {payment.order.code}"[:25],
                cancel_url=settings.PAYOS_CANCEL_URL,
                return_url=settings.PAYOS_RETURN_URL,
            ))
        except APIError as e:
            raise serializers.ValidationError({'error': f'{e.error_desc}'})
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
            raise serializers.ValidationError({'error': 'Không thể kết nối tới cổng thanh toán, vui lòng thử lại sau ít phút'})
        payment.transaction_id = str(order_code)
        payment.checkout_url = payos_response.checkout_url
        payment.qr_code = payos_response.qr_code
        payment.save(update_fields=['transaction_id', 'checkout_url', 'qr_code'])
        return payment

class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = ['id', 'code', 'description', 'discount_type', 'discount_value','min_order_value', 'max_discount_amount', 'usage_limit', 'used_count',
                  'start_date', 'end_date']
        read_only_fields = ['used_count']
    def validate_code(self, value):
        qs = Voucher.objects.filter(code__iexact=value, active=True)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Mã voucher đã tồn tại.')
        return value.upper()

    def validate(self, data):
        code = data.get('code', self.instance.code if self.instance else None)
        start_date = data.get('start_date', self.instance.start_date if self.instance else None)
        end_date = data.get('end_date', self.instance.end_date if self.instance else None)
        discount_type = data.get('discount_type', self.instance.discount_type if self.instance else None)
        discount_value = data.get('discount_value', self.instance.discount_value if self.instance else None)
        usage_limit = data.get('usage_limit', self.instance.usage_limit if self.instance else None)
        if code:
            res = Voucher.objects.filter(code__iexact=code, active=True)
            if self.instance:
                res = res.exclude(pk=self.instance.pk)
            if res.exists():
                raise serializers.ValidationError('Mã voucher đã tồn tại')

        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({'error': 'Ngày kết thúc phải sau ngày bắt đầu'})
        if discount_value is not None and discount_value <= 0:
            raise serializers.ValidationError({'error': 'Giá trị giảm giá phải lớn hơn 0'})
        if discount_type == "PERCENT" and discount_value is not None and discount_value > 100:
            raise serializers.ValidationError({'error': 'Giảm theo phần trăm không được vượt quá 100%'})
        return data
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['discount_type'] = instance.discount_type.value if hasattr(instance.discount_type, 'value') else instance.discount_type
        data['is_valid'] = instance.is_valid
        return data

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'room', 'sender', 'content', 'attachment', 'is_read', 'created_at']
        read_only_fields = ['room', 'sender', 'is_read', 'created_at']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['sender'] = SimpleUserSerializer(instance.sender).data if instance.sender else None
        if instance.attachment:
            data['attachment'] = instance.attachment.url
        return data
    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Nội dung tin nhắn không được để trống')
        return value
    def create(self, validated_data):
        room = self.context['room']
        request = self.context['request']
        message = ChatMessage.objects.create(room=room, sender=request.user, **validated_data)
        try:
            utils.push_message_to_firebase(message)
        except Exception:
            pass
        return message

class ChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = ['id', 'customer', 'created_at']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['customer'] = SimpleUserSerializer(instance.customer).data
        last_msg = instance.messages.filter(active=True).order_by('-created_at').first()
        data['last_message'] = ChatMessageSerializer(last_msg).data if last_msg else None
        data['unread_count'] = instance.messages.filter(active=True, is_read=False, sender=instance.customer).count()
        return data

class AIStylistRecommendationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIStylistRecommendationItem
        fields = ['id', 'product', 'reason', 'rank_order']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['product'] = ProductListSerializer(instance.product).data
        return data

class AIStylistSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIStylistSession
        fields = ['id', 'query_text', 'occasion', 'budget_min', 'budget_max','style_preference', 'ai_requirements', 'previous_session', 'created_at']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        recommendations = instance.recommendations.filter(active=True)
        data['recommendations'] = AIStylistRecommendationItemSerializer(recommendations, many=True).data
        req = instance.ai_requirements or {}
        data['needs_clarification'] = req.get('needs_clarification', False)
        data['clarification_question'] = req.get('clarification_question')
        data['is_fashion_related'] = req.get('is_fashion_related', True)
        return data

class AIStylistQuerySerializer(serializers.Serializer):
    query_text = serializers.CharField()
    previous_session_id = serializers.IntegerField(required=False, allow_null=True)
    def validate_query_text(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Vui lòng mô tả nhu cầu của bạn')
        return value
    def create(self, validated_data):
        request = self.context['request']
        previous_session = None
        prev_id = validated_data.get('previous_session_id')
        if prev_id:
            previous_session = AIStylistSession.objects.filter(id=prev_id, user=request.user, active=True).first()
        return utils.run_ai_stylist_query(request.user, validated_data['query_text'], previous_session=previous_session)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'body', 'is_read', 'ref_id', 'created_at']
