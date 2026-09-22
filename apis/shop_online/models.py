from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.gis.db import models as gis_models
from django_enum import EnumField
from django.utils import timezone
from django.db.models import Avg
from cloudinary.models import CloudinaryField
from enum import Enum
from ckeditor.fields import RichTextField

class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True
        ordering = ["-created_at"]

class UserRole(Enum):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"
    SHIPPER = "SHIPPER"

class Gender(Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

class ProductGenderTarget(Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    UNISEX = "UNISEX"

class ProductStatus(Enum):
    ACTIVE = "ACTIVE"
    OUT_OF_STOCK = "OUT_OF_STOCK"
    DISCONTINUED = "DISCONTINUED"

class SizeOption(Enum):
    XS = "XS"
    S = "S"
    M = "M"
    L = "L"
    XL = "XL"
    XXL = "XXL"
    FREESIZE = "FREESIZE"

class DiscountType(Enum):
    PERCENT = "PERCENT"
    FIXED = "FIXED"

class OrderStatus(Enum):
    PENDING = "PENDING"
    PACKING = "PACKING"
    SHIPPING = "SHIPPING"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class OccasionTag(Enum):
    OFFICE = "OFFICE"
    PARTY = "PARTY"
    CASUAL = "CASUAL"
    SPORT = "SPORT"
    DATE = "DATE"
    WEDDING = "WEDDING"
    TRAVEL = "TRAVEL"

class PaymentMethod(Enum):
    COD = "COD"
    PAYOS = "PAYOS"

class PaymentStatus(Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"
    REFUND_PENDING = "REFUND_PENDING"
    FAILED = "FAILED"

class NotificationType(Enum):
    ORDER = "ORDER"
    CHAT = "CHAT"
    PROMOTION = "PROMOTION"
    SYSTEM = "SYSTEM"

class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = EnumField(UserRole, default=UserRole.CUSTOMER)
    gender = EnumField(Gender, null=True, blank=True)
    phone = models.CharField(max_length=10, null=True, blank=True, unique=True)
    dob = models.DateField(null=True, blank=True)
    avatar = CloudinaryField('avatar',null=True, blank=True)
    bank_bin = models.CharField(max_length=20,default='970422')
    bank_account_number = models.CharField(max_length=30,default='0325391105')
    bank_account_name = models.CharField(max_length=100,default='PHAM HOANG PHU QUY')

class Address(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    recipient_name = models.CharField(max_length=100)
    recipient_phone = models.CharField(max_length=10)
    province = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    ward = models.CharField(max_length=100)
    detail_address = models.CharField(max_length=255)
    is_default = models.BooleanField(default=False)
    location = gis_models.PointField(geography=True, null=True, blank=True, srid=4326)


class Category(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children")
    image = CloudinaryField("category_image", null=True, blank=True)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.name

class Brand(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    logo = CloudinaryField("brand_logo", null=True, blank=True)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.name

class Product(BaseModel):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = RichTextField(blank=True)
    gender_target = EnumField(ProductGenderTarget, default=ProductGenderTarget.UNISEX)
    material = models.CharField(max_length=200, blank=True)
    care_instruction = models.TextField(blank=True)
    base_price = models.DecimalField(max_digits=12, decimal_places=0)
    status = EnumField(ProductStatus, default=ProductStatus.ACTIVE)
    is_featured = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    sold_count = models.PositiveIntegerField(default=0)
    @property
    def total_stock(self):
        total = 0
        for v in self.variants.filter(active=True):
            total += v.stock_qty
        return total
    @property
    def avg_review(self):
        return self.reviews.filter(active=True).aggregate(avg = Avg('rating'))['avg'] or 0
    def __str__(self):
        return self.name

class ProductTag(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="tags")
    tag = EnumField(OccasionTag)
    class Meta:
        unique_together = ["product", "tag"]
    def __str__(self):
        return f"{self.product.name} - {self.tag}"

class ProductVariant(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    size = EnumField(SizeOption)
    color = models.CharField(max_length=50)
    stock_qty = models.PositiveIntegerField(default=0)
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    class Meta:
        unique_together = ["product", "size", "color"]
    @property
    def final_price(self):
        return self.product.base_price + self.price_adjustment
    def __str__(self):
        return f"{self.product.name} - {self.size} - {self.color}"

class ProductImage(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True, related_name="images")
    image = models.URLField(max_length=1000)
    is_thumbnail = models.BooleanField(default=False)
    class Meta:
        ordering = ["-is_thumbnail", "created_at"]

class CartItem(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cart_items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name="cart_items")
    quantity = models.PositiveIntegerField(default=1)
    class Meta:
        unique_together = ["user", "variant"]
    @property
    def subtotal(self):
        return self.variant.final_price * self.quantity

class Voucher(BaseModel):
    code = models.CharField(max_length=30, unique=True)
    description = models.CharField(max_length=255, blank=True)
    discount_type = EnumField(DiscountType, default=DiscountType.PERCENT)
    discount_value = models.DecimalField(max_digits=10, decimal_places=0)
    min_order_value = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    max_discount_amount = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    usage_limit = models.PositiveIntegerField(default=1)
    used_count = models.PositiveIntegerField(default=0)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    @property
    def is_valid(self):
        now = timezone.now()
        return self.active and self.start_date <= now <= self.end_date and self.used_count < self.usage_limit
    def __str__(self):
        return self.code

class Order(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    shipper = models.ForeignKey( User, on_delete=models.SET_NULL, null=True, blank=True,related_name="delivering_orders",limit_choices_to={"role": UserRole.SHIPPER},)
    code = models.CharField(max_length=20, unique=True)
    recipient_name = models.CharField(max_length=100)
    recipient_phone = models.CharField(max_length=10)
    shipping_address = models.CharField(max_length=500)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    subtotal_amount = models.DecimalField(max_digits=12, decimal_places=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=0)
    voucher = models.ForeignKey(Voucher, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    payment_method = EnumField(PaymentMethod, default=PaymentMethod.COD)
    status = EnumField(OrderStatus, default=OrderStatus.PENDING)
    cancel_reason = models.CharField(max_length=255, blank=True)
    expected_delivery_date = models.DateField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    cod_remitted = models.BooleanField(default=False,help_text="Đánh dấu shipper đã nộp lại tiền mặt COD của đơn này chưa")
    def __str__(self):
        return self.code

class Remittance(BaseModel):
    shipper = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cod_remittances")
    confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="confirmed_remittances")
    total_amount = models.DecimalField(max_digits=14, decimal_places=0)
    note = models.CharField(max_length=255, blank=True)
    remitted_at = models.DateTimeField(default=timezone.now)
    def __str__(self):
        return f"Remittance #{self.pk} - {self.shipper} - {int(self.total_amount):,}đ"

class RemittanceItem(BaseModel):
    remittance = models.ForeignKey(Remittance, on_delete=models.CASCADE, related_name="items")
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="cod_remittance_item")
    amount = models.DecimalField(max_digits=12, decimal_places=0)

class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name="order_items")
    product_name = models.CharField(max_length=200)
    size = models.CharField(max_length=20)
    color = models.CharField(max_length=50)
    unit_price = models.DecimalField(max_digits=12, decimal_places=0)
    quantity = models.PositiveIntegerField()
    @property
    def subtotal(self):
        return self.unit_price * self.quantity

class Review(BaseModel):
    order_item = models.OneToOneField(OrderItem, on_delete=models.CASCADE, related_name="review", null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    is_hidden = models.BooleanField(default=False)


class ReviewImage(BaseModel):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="images")
    image = models.URLField()

class ChatRoom(BaseModel):
    customer = models.OneToOneField(User, on_delete=models.CASCADE, related_name="chat_room")

class ChatMessage(BaseModel):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="sent_messages")
    content = models.TextField(blank=True)
    attachment = CloudinaryField("chat_attachment", null=True, blank=True)
    is_read = models.BooleanField(default=False)
    class Meta:
        ordering = ["created_at"]


class Notification(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    type = EnumField(NotificationType, default=NotificationType.SYSTEM)
    title = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    ref_id = models.PositiveIntegerField(null=True, blank=True)
    class Meta:
        ordering = ["-created_at"]

class Payment(BaseModel):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")
    amount = models.DecimalField(max_digits=12, decimal_places=0)
    method = EnumField(PaymentMethod)
    status = EnumField(PaymentStatus, default=PaymentStatus.PENDING)
    transaction_id = models.CharField(max_length=200, blank=True)
    gateway_response = models.JSONField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    transaction_id = models.CharField(max_length=200, blank=True)
    expired_at = models.DateTimeField(null=True, blank=True)
    checkout_url = models.URLField(blank=True)
    qr_code = models.TextField(blank=True)

class AIStylistSession(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_stylist_sessions")
    previous_session = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='follow_ups')
    query_text = models.TextField(help_text="Mô tả nhu cầu bằng ngôn ngữ tự nhiên")
    occasion = models.CharField(max_length=100, blank=True)
    budget_min = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    style_preference = models.CharField(max_length=200, blank=True)
    ai_requirements = models.JSONField(null=True, blank=True, help_text="Tiêu chí LLM trích xuất: occasion, budget, style, category, color")

class AIStylistRecommendationItem(BaseModel):
    session = models.ForeignKey(AIStylistSession, on_delete=models.CASCADE, related_name="recommendations")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="ai_recommendations")
    reason = models.TextField(help_text="Giải thích lý do LLM chọn sản phẩm này")
    rank_order = models.PositiveIntegerField(default=0)
    class Meta:
        ordering = ["rank_order"]










