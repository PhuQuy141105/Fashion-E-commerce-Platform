import random
from datetime import date, datetime, timedelta
from decimal import Decimal
from django.contrib.auth.hashers import make_password
from django.contrib.gis.geos import Point
from django.utils import timezone
from shop_online.models import (
    User, UserRole, Gender,
    Address,
    Category, Brand,
    Product, ProductGenderTarget, ProductStatus,
    ProductTag, OccasionTag,
    ProductVariant, SizeOption,
    CartItem,
    Voucher, DiscountType,
    Order, OrderItem, OrderStatus,
    Remittance, RemittanceItem,
    Review, ReviewImage,
    ChatRoom, ChatMessage,
    Notification, NotificationType,
    Payment, PaymentMethod, PaymentStatus,
    AIStylistSession, AIStylistRecommendationItem,
)
import time
from shop_online.image_fetcher import attach_product_thumbnail, attach_variant_images
print("Bắt đầu tạo dữ liệu mẫu cho Shop Quần Áo")

random.seed(42)

now = timezone.now()
today = date.today()

BANK_BIN = "970422"
BANK_ACCOUNT_NUMBER = "0325391105"
BANK_ACCOUNT_NAME = "PHAM HOANG PHU QUY"

User.objects.filter(username="admin").update(
    role=UserRole.ADMIN,
    bank_bin=BANK_BIN,
    bank_account_number=BANK_ACCOUNT_NUMBER,
    bank_account_name=BANK_ACCOUNT_NAME,
)

admin_extra = User.objects.create(
    username="admin_shop",
    email="admin.shop@fashionshop.vn",
    password=make_password("Admin@123"),
    first_name="Quản Trị",
    last_name="Shop",
    role=UserRole.ADMIN,
    gender=Gender.OTHER,
    phone="0900000000",
    dob=date(1992, 1, 1),
    is_staff=True,
    bank_bin=BANK_BIN,
    bank_account_number=BANK_ACCOUNT_NUMBER,
    bank_account_name=BANK_ACCOUNT_NAME,
)

customer_data = [
    ("ngoc_anh", "ngoc.anh@gmail.com", "Ngọc Anh", "Lê", Gender.FEMALE, "0912345601", date(1998, 3, 14)),
    ("minh_quan", "minh.quan@gmail.com", "Minh Quân", "Trần", Gender.MALE, "0912345602", date(1995, 7, 22)),
    ("thu_thao", "thu.thao@gmail.com", "Thu Thảo", "Nguyễn", Gender.FEMALE, "0912345603", date(2000, 11, 5)),
    ("hoang_phuc", "hoang.phuc@gmail.com", "Hoàng Phúc", "Phạm", Gender.MALE, "0912345604", date(1993, 5, 18)),
    ("bao_tran", "bao.tran@gmail.com", "Bảo Trân", "Đỗ", Gender.FEMALE, "0912345605", date(1999, 9, 30)),
    ("duc_thinh", "duc.thinh@gmail.com", "Đức Thịnh", "Vũ", Gender.MALE, "0912345606", date(1997, 2, 9)),
    ("linh_chi", "linh.chi@gmail.com", "Linh Chi", "Hoàng", Gender.FEMALE, "0912345607", date(2001, 6, 27)),
    ("gia_huy", "gia.huy@gmail.com", "Gia Huy", "Bùi", Gender.MALE, "0912345608", date(1996, 12, 3)),
    ("khanh_van", "khanh.van@gmail.com", "Khánh Vân", "Ngô", Gender.FEMALE, "0912345609", date(1994, 4, 16)),
]

customers = []
for username, email, first, last, gender, phone, dob in customer_data:
    customers.append(User.objects.create(
        username=username, email=email,
        password=make_password("Customer@123"),
        first_name=first, last_name=last,
        role=UserRole.CUSTOMER, gender=gender,
        phone=phone, dob=dob,
        bank_bin=BANK_BIN,
        bank_account_number=BANK_ACCOUNT_NUMBER,
        bank_account_name=BANK_ACCOUNT_NAME,
    ))

shipper_data = [
    ("shipper_nam", "shipper.nam@fashionshop.vn", "Văn Nam", "Trịnh", Gender.MALE, "0933000001", date(1994, 8, 12)),
    ("shipper_hai", "shipper.hai@fashionshop.vn", "Trung Hải", "Đặng", Gender.MALE, "0933000002", date(1997, 1, 25)),
    ("shipper_lan", "shipper.lan@fashionshop.vn", "Thuý Lan", "Mai", Gender.FEMALE, "0933000003", date(1996, 10, 3)),
]

shippers = []
for username, email, first, last, gender, phone, dob in shipper_data:
    shippers.append(User.objects.create(
        username=username, email=email,
        password=make_password("Shipper@123"),
        first_name=first, last_name=last,
        role=UserRole.SHIPPER, gender=gender,
        phone=phone, dob=dob,
        bank_bin=BANK_BIN,
        bank_account_number=BANK_ACCOUNT_NUMBER,
        bank_account_name=BANK_ACCOUNT_NAME,
    ))

address_data = [
    (0, "Ngọc Anh", "0912345601", "TP. Hồ Chí Minh", "Quận 1", "Phường Bến Nghé",
     "12 Nguyễn Huệ", True, 10.7769, 106.7009),
    (0, "Ngọc Anh (công ty)", "0912345601", "TP. Hồ Chí Minh", "Quận 3", "Phường Võ Thị Sáu",
     "45 Võ Văn Tần", False, 10.7829, 106.6917),
    (1, "Minh Quân", "0912345602", "Hà Nội", "Cầu Giấy", "Phường Dịch Vọng",
     "78 Xuân Thủy", True, 21.0333, 105.7917),
    (2, "Thu Thảo", "0912345603", "Đà Nẵng", "Hải Châu", "Phường Thạch Thang",
     "23 Trần Phú", True, 16.0678, 108.2208),
    (3, "Hoàng Phúc", "0912345604", "TP. Hồ Chí Minh", "Quận Bình Thạnh", "Phường 25",
     "101 Điện Biên Phủ", True, 10.8106, 106.7109),
    (4, "Bảo Trân", "0912345605", "Cần Thơ", "Ninh Kiều", "Phường An Hòa",
     "56 Mậu Thân", True, 10.0333, 105.7469),
    (5, "Đức Thịnh", "0912345606", "TP. Hồ Chí Minh", "Quận 7", "Phường Tân Phú",
     "9 Nguyễn Lương Bằng", True, 10.7411, 106.7217),
    (6, "Linh Chi", "0912345607", "Hải Phòng", "Lê Chân", "Phường An Biên",
     "34 Tô Hiệu", True, 20.8449, 106.6822),
]

for c_idx, name, phone, province, district, ward, detail, is_default, lat, lng in address_data:
    Address.objects.create(
        user=customers[c_idx], recipient_name=name, recipient_phone=phone,
        province=province, district=district, ward=ward,
        detail_address=detail, is_default=is_default,
        location=Point(lng, lat, srid=4326),
    )

cat_ao = Category.objects.create(name="Áo", description="Các loại áo thời trang nam nữ")
cat_ao_thun = Category.objects.create(name="Áo thun", parent=cat_ao, description="Áo thun cotton, thể thao")
cat_ao_somi = Category.objects.create(name="Áo sơ mi", parent=cat_ao, description="Áo sơ mi công sở, dạo phố")
cat_ao_khoac = Category.objects.create(name="Áo khoác", parent=cat_ao, description="Áo khoác denim, dạ, gió")
cat_ao_len = Category.objects.create(name="Áo len", parent=cat_ao, description="Áo len, áo nỉ giữ ấm")

cat_quan = Category.objects.create(name="Quần", description="Các loại quần nam nữ")
cat_quan_jean = Category.objects.create(name="Quần jean", parent=cat_quan, description="Quần jean các kiểu dáng")
cat_quan_short = Category.objects.create(name="Quần short", parent=cat_quan, description="Quần short nam nữ")
cat_quan_tay = Category.objects.create(name="Quần tây", parent=cat_quan, description="Quần tây công sở")

cat_vaydam = Category.objects.create(name="Váy - Đầm", description="Váy và đầm nữ các phong cách")
cat_thethao = Category.objects.create(name="Đồ thể thao", description="Trang phục thể thao, gym, yoga")
cat_phukien = Category.objects.create(name="Phụ kiện", description="Nón, thắt lưng, túi xách...")

brand_names = ["Owen", "Routine", "Coolmate", "IVY moda", "Canifa", "Việt Tiến"]
brands = {}
for name in brand_names:
    brands[name] = Brand.objects.create(
        name=name, description=f"Thương hiệu thời trang {name}"
    )

products_data = [
    (cat_ao_thun, "Coolmate", "Áo thun cotton basic trắng", "ao-thun-cotton-basic",
     "Áo thun cotton 100% co giãn 4 chiều, form regular fit, dễ phối đồ hàng ngày.",
     ProductGenderTarget.UNISEX, "Cotton 100%", "Giặt máy nước lạnh, không dùng thuốc tẩy",
     Decimal("199000"), ProductStatus.ACTIVE, True, 1520, 860),

    (cat_ao_thun, "Routine", "Áo thun in họa tiết Graphic", "ao-thun-graphic-routine",
     "Áo thun form rộng in họa tiết graphic phong cách streetwear.",
     ProductGenderTarget.MALE, "Cotton 95% - Spandex 5%", "Giặt tay, lộn trái khi giặt",
     Decimal("259000"), ProductStatus.ACTIVE, True, 980, 520),

    (cat_ao_somi, "Việt Tiến", "Áo sơ mi trắng công sở", "ao-somi-trang-cong-so",
     "Áo sơ mi vải Oxford cao cấp, form slimfit, phù hợp môi trường công sở.",
     ProductGenderTarget.MALE, "Vải Oxford", "Giặt máy, ủi ở nhiệt độ trung bình",
     Decimal("350000"), ProductStatus.ACTIVE, False, 640, 310),

    (cat_ao_somi, "IVY moda", "Áo sơ mi lụa nữ", "ao-somi-lua-nu",
     "Áo sơ mi lụa mềm mại, thiết kế thanh lịch, phù hợp đi làm và dạo phố.",
     ProductGenderTarget.FEMALE, "Lụa satin", "Giặt tay nhẹ nhàng, không vắt mạnh",
     Decimal("420000"), ProductStatus.ACTIVE, True, 1105, 640),

    (cat_ao_khoac, "Routine", "Áo khoác denim unisex", "ao-khoac-denim-unisex",
     "Áo khoác jean phong cách trẻ trung, chất liệu denim dày dặn.",
     ProductGenderTarget.UNISEX, "Denim cotton", "Giặt riêng lần đầu, hạn chế giặt máy",
     Decimal("550000"), ProductStatus.ACTIVE, False, 430, 180),

    (cat_ao_khoac, "IVY moda", "Áo khoác dạ nữ dáng dài", "ao-khoac-da-nu-dang-dai",
     "Áo khoác dạ giữ ấm tốt, thiết kế dáng dài sang trọng cho mùa đông.",
     ProductGenderTarget.FEMALE, "Dạ pha len", "Giặt khô chuyên nghiệp",
     Decimal("890000"), ProductStatus.ACTIVE, True, 512, 240),

    (cat_ao_len, "Canifa", "Áo len cổ lọ", "ao-len-co-lo-canifa",
     "Áo len cổ lọ mềm mịn, giữ ấm tốt, thích hợp mặc mùa lạnh.",
     ProductGenderTarget.UNISEX, "Len pha Acrylic", "Giặt tay, phơi ngang tránh giãn form",
     Decimal("320000"), ProductStatus.ACTIVE, False, 288, 120),

    (cat_quan_jean, "Coolmate", "Quần jean slimfit nam", "quan-jean-slimfit-nam",
     "Quần jean form slimfit tôn dáng, vải denim co giãn thoải mái vận động.",
     ProductGenderTarget.MALE, "Denim cotton co giãn", "Giặt máy nước lạnh, lộn trái",
     Decimal("450000"), ProductStatus.ACTIVE, True, 870, 505),

    (cat_quan_jean, "IVY moda", "Quần jean ống rộng nữ", "quan-jean-ong-rong-nu",
     "Quần jean ống rộng phong cách unisex, dễ phối đồ.",
     ProductGenderTarget.FEMALE, "Denim cotton", "Giặt máy, không sấy nhiệt cao",
     Decimal("480000"), ProductStatus.ACTIVE, False, 355, 150),

    (cat_quan_short, "Routine", "Quần short kaki nam", "quan-short-kaki-nam",
     "Quần short kaki basic, chất vải dày dặn, form regular.",
     ProductGenderTarget.MALE, "Kaki cotton", "Giặt máy bình thường",
     Decimal("250000"), ProductStatus.ACTIVE, False, 210, 95),

    (cat_quan_tay, "Việt Tiến", "Quần tây công sở nam", "quan-tay-cong-so-nam",
     "Quần tây form slimfit, vải cao cấp ít nhăn, phù hợp đi làm.",
     ProductGenderTarget.MALE, "Polyester - Wool blend", "Ủi hơi nước, giặt khô",
     Decimal("380000"), ProductStatus.ACTIVE, False, 402, 175),

    (cat_vaydam, "IVY moda", "Váy liền hoa nhí", "vay-lien-hoa-nhi",
     "Váy liền hoạ tiết hoa nhí nữ tính, chất vải voan nhẹ nhàng.",
     ProductGenderTarget.FEMALE, "Voan lụa", "Giặt tay, phơi trong bóng râm",
     Decimal("390000"), ProductStatus.ACTIVE, True, 1340, 780),

    (cat_vaydam, "IVY moda", "Đầm dự tiệc sang trọng", "dam-du-tiec-sang-trong",
     "Đầm dạ hội thiết kế ôm nhẹ, phù hợp các dịp tiệc, sự kiện.",
     ProductGenderTarget.FEMALE, "Voan cao cấp", "Giặt khô chuyên nghiệp",
     Decimal("750000"), ProductStatus.OUT_OF_STOCK, True, 690, 410),

    (cat_thethao, "Coolmate", "Áo thun thể thao Dry-Fit", "ao-thun-dry-fit",
     "Áo thun thể thao công nghệ Dry-Fit thấm hút mồ hôi, khô nhanh.",
     ProductGenderTarget.UNISEX, "Polyester Dry-Fit", "Giặt máy, không dùng nước xả vải",
     Decimal("220000"), ProductStatus.ACTIVE, False, 560, 260),

    (cat_thethao, "Canifa", "Quần legging tập gym nữ", "quan-legging-gym-nu",
     "Quần legging co giãn 4 chiều, ôm dáng, phù hợp tập gym/yoga.",
     ProductGenderTarget.FEMALE, "Polyester - Spandex", "Giặt máy nước lạnh",
     Decimal("280000"), ProductStatus.ACTIVE, True, 745, 430),

    (cat_phukien, "Coolmate", "Nón lưỡi trai basic", "non-luoi-trai-basic",
     "Nón lưỡi trai form unisex, dễ phối cùng nhiều trang phục.",
     ProductGenderTarget.UNISEX, "Cotton twill", "Lau sạch bằng khăn ẩm",
     Decimal("120000"), ProductStatus.ACTIVE, False, 190, 80),

    (cat_phukien, "Việt Tiến", "Thắt lưng da nam", "that-lung-da-nam",
     "Thắt lưng da thật cao cấp, khóa kim loại chống gỉ.",
     ProductGenderTarget.MALE, "Da bò thật", "Lau khô, tránh nước",
     Decimal("210000"), ProductStatus.DISCONTINUED, False, 95, 40),

    (cat_phukien, "Canifa", "Túi tote vải canvas", "tui-tote-vai-canvas",
     "Túi tote vải canvas bền chắc, phong cách tối giản.",
     ProductGenderTarget.FEMALE, "Vải canvas", "Giặt tay, không vắt mạnh",
     Decimal("150000"), ProductStatus.ACTIVE, False, 320, 140),

    (cat_ao_thun, "Canifa", "Áo thun cổ tim nữ", "ao-thun-co-tim-nu",
     "Áo thun cổ tim form ôm nhẹ, chất cotton mềm mại, tôn dáng nữ tính.",
     ProductGenderTarget.FEMALE, "Cotton 100%", "Giặt máy nước lạnh",
     Decimal("189000"), ProductStatus.ACTIVE, False, 430, 210),

    (cat_ao_thun, "Owen", "Áo thun polo nam", "ao-thun-polo-nam",
     "Áo thun polo cổ bẻ lịch sự, vải cá sấu thoáng mát, phù hợp đi làm bán thời gian hoặc dạo phố.",
     ProductGenderTarget.MALE, "Cotton cá sấu", "Giặt máy, ủi nhẹ",
     Decimal("259000"), ProductStatus.ACTIVE, True, 615, 340),

    (cat_ao_thun, "Routine", "Áo thun tay lỡ unisex", "ao-thun-tay-lo-unisex",
     "Áo thun tay lỡ form suông rộng, phong cách trẻ trung năng động.",
     ProductGenderTarget.UNISEX, "Cotton 100%", "Giặt máy nước lạnh, phơi trong bóng râm",
     Decimal("209000"), ProductStatus.ACTIVE, False, 375, 160),

    (cat_ao_thun, "Coolmate", "Áo thun raglan bóng chày", "ao-thun-raglan-bong-chay",
     "Áo thun raglan phối màu tay, phong cách thể thao đường phố.",
     ProductGenderTarget.UNISEX, "Cotton 95% - Spandex 5%", "Giặt máy, lộn trái khi giặt",
     Decimal("229000"), ProductStatus.ACTIVE, False, 298, 130),

    (cat_ao_thun, "Canifa", "Áo thun in chữ basic", "ao-thun-in-chu-basic",
     "Áo thun form regular in chữ tối giản, dễ phối cùng quần jean hoặc quần short.",
     ProductGenderTarget.UNISEX, "Cotton 100%", "Giặt máy nước lạnh, không dùng thuốc tẩy",
     Decimal("179000"), ProductStatus.ACTIVE, False, 342, 175),

    (cat_ao_thun, "Owen", "Áo thun cotton compact nam", "ao-thun-cotton-compact-nam",
     "Áo thun cotton compact cao cấp, sợi vải mịn, ít nhăn, giữ form lâu.",
     ProductGenderTarget.MALE, "Cotton compact", "Giặt máy nước lạnh, ủi nhẹ",
     Decimal("269000"), ProductStatus.ACTIVE, True, 520, 285),

    (cat_ao_thun, "IVY moda", "Áo thun croptop nữ", "ao-thun-croptop-nu",
     "Áo thun croptop form ngắn, phong cách trẻ trung cá tính.",
     ProductGenderTarget.FEMALE, "Cotton pha Spandex", "Giặt tay, phơi trong bóng râm",
     Decimal("195000"), ProductStatus.ACTIVE, False, 410, 190),

    (cat_ao_thun, "Coolmate", "Áo thun thể thao phối màu", "ao-thun-the-thao-phoi-mau",
     "Áo thun thể thao phối 2 màu, vải thoáng khí, phù hợp tập luyện hoặc mặc hàng ngày.",
     ProductGenderTarget.UNISEX, "Polyester thoáng khí", "Giặt máy, không dùng nước xả vải",
     Decimal("225000"), ProductStatus.ACTIVE, False, 265, 120),
]

products = []
for (cat, brand_name, name, slug, desc, gender_t, material, care, price, status,
     featured, views, sold) in products_data:
    products.append(Product.objects.create(
        category=cat, brand=brands[brand_name], name=name, slug=slug,
        description=desc, gender_target=gender_t, material=material,
        care_instruction=care, base_price=price, status=status,
        is_featured=featured, view_count=views, sold_count=sold,
    ))

product_tag_map = {
    0: [OccasionTag.CASUAL, OccasionTag.TRAVEL],
    1: [OccasionTag.CASUAL, OccasionTag.PARTY],
    2: [OccasionTag.OFFICE],
    3: [OccasionTag.OFFICE, OccasionTag.DATE],
    4: [OccasionTag.CASUAL, OccasionTag.TRAVEL],
    5: [OccasionTag.OFFICE, OccasionTag.TRAVEL],
    6: [OccasionTag.CASUAL],
    7: [OccasionTag.CASUAL, OccasionTag.DATE],
    8: [OccasionTag.CASUAL],
    9: [OccasionTag.CASUAL, OccasionTag.SPORT],
    10: [OccasionTag.OFFICE],
    11: [OccasionTag.DATE, OccasionTag.PARTY],
    12: [OccasionTag.PARTY, OccasionTag.WEDDING],
    13: [OccasionTag.SPORT],
    14: [OccasionTag.SPORT],
    15: [OccasionTag.CASUAL, OccasionTag.SPORT, OccasionTag.TRAVEL],
    16: [OccasionTag.OFFICE],
    17: [OccasionTag.CASUAL, OccasionTag.TRAVEL],
    18: [OccasionTag.CASUAL, OccasionTag.DATE],
    19: [OccasionTag.CASUAL, OccasionTag.OFFICE],
    20: [OccasionTag.CASUAL, OccasionTag.TRAVEL],
    21: [OccasionTag.CASUAL, OccasionTag.SPORT],
    22: [OccasionTag.CASUAL],
    23: [OccasionTag.CASUAL, OccasionTag.OFFICE],
    24: [OccasionTag.CASUAL, OccasionTag.DATE],
    25: [OccasionTag.CASUAL, OccasionTag.SPORT],
}

for p_idx, tags in product_tag_map.items():
    for tag in tags:
        ProductTag.objects.create(product=products[p_idx], tag=tag)

variant_map = {
    0: [(SizeOption.S, "Trắng", 40, 0), (SizeOption.M, "Trắng", 55, 0),
        (SizeOption.L, "Đen", 30, 0), (SizeOption.XL, "Đen", 20, 0)],
    1: [(SizeOption.M, "Đen", 25, 0), (SizeOption.L, "Đen", 25, 0),
        (SizeOption.L, "Xám", 15, 0)],
    2: [(SizeOption.M, "Trắng", 30, 0), (SizeOption.L, "Trắng", 25, 0),
        (SizeOption.XL, "Trắng", 10, 20000)],
    3: [(SizeOption.S, "Trắng ngà", 18, 0), (SizeOption.M, "Trắng ngà", 22, 0),
        (SizeOption.M, "Hồng phấn", 15, 0)],
    4: [(SizeOption.M, "Xanh denim", 12, 0), (SizeOption.L, "Xanh denim", 14, 0)],
    5: [(SizeOption.S, "Be", 8, 0), (SizeOption.M, "Be", 10, 0),
        (SizeOption.M, "Đen", 9, 0)],
    6: [(SizeOption.FREESIZE, "Nâu", 20, 0), (SizeOption.FREESIZE, "Xám", 18, 0)],
    7: [(SizeOption.S, "Xanh đậm", 20, 0), (SizeOption.M, "Xanh đậm", 28, 0),
        (SizeOption.L, "Xanh đậm", 22, 0), (SizeOption.M, "Đen", 16, 30000)],
    8: [(SizeOption.S, "Xanh nhạt", 14, 0), (SizeOption.M, "Xanh nhạt", 16, 0)],
    9: [(SizeOption.M, "Kaki be", 25, 0), (SizeOption.L, "Kaki be", 20, 0),
        (SizeOption.L, "Xanh rêu", 15, 0)],
    10: [(SizeOption.M, "Xanh đen", 18, 0), (SizeOption.L, "Xanh đen", 16, 0)],
    11: [(SizeOption.S, "Hoa vàng", 10, 0), (SizeOption.M, "Hoa vàng", 12, 0),
         (SizeOption.M, "Hoa xanh", 9, 0)],
    12: [(SizeOption.S, "Đỏ đô", 0, 0), (SizeOption.M, "Đỏ đô", 0, 0)],
    13: [(SizeOption.S, "Trắng", 30, 0), (SizeOption.M, "Trắng", 35, 0),
         (SizeOption.L, "Xanh navy", 20, 0)],
    14: [(SizeOption.S, "Đen", 22, 0), (SizeOption.M, "Đen", 26, 0),
         (SizeOption.M, "Xám", 14, 0)],
    15: [(SizeOption.FREESIZE, "Đen", 40, 0), (SizeOption.FREESIZE, "Be", 25, 0)],
    16: [(SizeOption.FREESIZE, "Nâu", 5, 0), (SizeOption.FREESIZE, "Đen", 5, 0)],
    17: [(SizeOption.FREESIZE, "Be", 30, 0), (SizeOption.FREESIZE, "Đen", 20, 0)],
    18: [(SizeOption.S, "Trắng", 26, 0), (SizeOption.M, "Trắng", 30, 0),
         (SizeOption.M, "Hồng", 18, 0)],
    19: [(SizeOption.M, "Trắng", 24, 0), (SizeOption.L, "Trắng", 22, 0),
         (SizeOption.L, "Xanh navy", 18, 0)],
    20: [(SizeOption.M, "Be", 20, 0), (SizeOption.L, "Be", 18, 0),
         (SizeOption.L, "Đen", 16, 0)],
    21: [(SizeOption.M, "Xanh navy", 22, 0), (SizeOption.L, "Xanh navy", 20, 0),
         (SizeOption.L, "Trắng", 15, 0)],
    22: [(SizeOption.S, "Trắng", 28, 0), (SizeOption.M, "Trắng", 32, 0),
         (SizeOption.M, "Đen", 20, 0)],
    23: [(SizeOption.M, "Trắng", 26, 0), (SizeOption.L, "Trắng", 24, 0),
         (SizeOption.L, "Xám", 16, 0)],
    24: [(SizeOption.S, "Đen", 18, 0), (SizeOption.M, "Đen", 20, 0),
         (SizeOption.M, "Be", 12, 0)],
    25: [(SizeOption.M, "Đen - Trắng", 20, 0), (SizeOption.L, "Đen - Trắng", 18, 0),
         (SizeOption.L, "Xanh navy - Trắng", 14, 0)],
}

variants = {}
for p_idx, rows in variant_map.items():
    for i, (size, color, stock, adj) in enumerate(rows):
        v = ProductVariant.objects.create(
            product=products[p_idx], size=size, color=color,
            stock_qty=stock, price_adjustment=Decimal(adj),
        )
        variants[(p_idx, i)] = v

cart_data = [
    (0, (0, 0), 2), (0, (7, 1), 1),
    (1, (7, 0), 1), (1, (9, 0), 1),
    (2, (11, 0), 1), (2, (3, 0), 1),
    (4, (12, 0), 1),
    (6, (11, 1), 2), (6, (15, 0), 1),
]
for c_idx, v_key, qty in cart_data:
    CartItem.objects.create(user=customers[c_idx], variant=variants[v_key], quantity=qty)

vouchers_data = [
    ("WELCOME10", "Giảm 10% cho đơn hàng đầu tiên", DiscountType.PERCENT, Decimal("10"),
     Decimal("200000"), Decimal("50000"), 500, 120, now - timedelta(days=30), now + timedelta(days=30)),
    ("FREESHIP", "Miễn phí vận chuyển tối đa 30k", DiscountType.FIXED, Decimal("30000"),
     Decimal("150000"), None, 1000, 430, now - timedelta(days=15), now + timedelta(days=15)),
    ("SALE50K", "Giảm ngay 50.000đ", DiscountType.FIXED, Decimal("50000"),
     Decimal("300000"), None, 300, 88, now - timedelta(days=10), now + timedelta(days=20)),
    ("VIP20", "Giảm 20% cho khách hàng thân thiết", DiscountType.PERCENT, Decimal("20"),
     Decimal("500000"), Decimal("150000"), 100, 40, now - timedelta(days=5), now + timedelta(days=25)),
    ("SUMMER25", "Khuyến mãi hè - đã kết thúc", DiscountType.PERCENT, Decimal("25"),
     Decimal("250000"), Decimal("100000"), 200, 200, now - timedelta(days=60), now - timedelta(days=5)),
]

vouchers = []
for code, desc, dtype, dval, min_order, max_disc, limit, used, start, end in vouchers_data:
    vouchers.append(Voucher.objects.create(
        code=code, description=desc, discount_type=dtype, discount_value=dval,
        min_order_value=min_order, max_discount_amount=max_disc,
        usage_limit=limit, used_count=used, start_date=start, end_date=end,
    ))

orders_data = [
    (0, "DH20260601001", [((0, 0), 2), ((7, 1), 1)], 0,
     PaymentMethod.PAYOS, PaymentStatus.PAID, OrderStatus.DELIVERED, 25),
    (1, "DH20260603002", [((7, 0), 1), ((9, 0), 1)], None,
     PaymentMethod.COD, PaymentStatus.PAID, OrderStatus.DELIVERED, 20),
    (2, "DH20260605003", [((11, 0), 1), ((3, 0), 1)], 1,
     PaymentMethod.PAYOS, PaymentStatus.PAID, OrderStatus.DELIVERED, 18),
    (3, "DH20260610004", [((2, 0), 1)], None,
     PaymentMethod.COD, PaymentStatus.PENDING, OrderStatus.SHIPPING, 5),
    (4, "DH20260612005", [((12, 1), 1), ((16, 0), 1)], 3,
     PaymentMethod.PAYOS, PaymentStatus.PAID, OrderStatus.PACKING, 3),
    (5, "DH20260614006", [((4, 0), 1)], None,
     PaymentMethod.COD, PaymentStatus.PENDING, OrderStatus.PENDING, 1),
    (6, "DH20260615007", [((11, 1), 2), ((15, 0), 1)], 2,
     PaymentMethod.PAYOS, PaymentStatus.PAID, OrderStatus.DELIVERED, 15),
    (7, "DH20260616008", [((10, 0), 1), ((17, 0), 1)], None,
     PaymentMethod.COD, PaymentStatus.CANCELLED, OrderStatus.CANCELLED, 10),
    (8, "DH20260618009", [((5, 1), 1)], None,
     PaymentMethod.PAYOS, PaymentStatus.PAID, OrderStatus.DELIVERED, 8),
    (3, "DH20260620010", [((9, 0), 2)], None,
     PaymentMethod.COD, PaymentStatus.PAID, OrderStatus.DELIVERED, 4),
]

orders = []
order_items_by_order = {}
shipper_cursor = 0

for c_idx, code, items, v_idx, method, pay_status, ostatus, delta_days in orders_data:
    subtotal = Decimal("0")
    line_items = []
    for v_key, qty in items:
        variant = variants[v_key]
        unit_price = variant.final_price
        subtotal += unit_price * qty
        line_items.append((variant, unit_price, qty))

    voucher = vouchers[v_idx] if v_idx is not None else None
    discount = Decimal("0")
    if voucher:
        if voucher.discount_type == DiscountType.PERCENT:
            discount = subtotal * voucher.discount_value / Decimal("100")
            if voucher.max_discount_amount:
                discount = min(discount, voucher.max_discount_amount)
        else:
            discount = voucher.discount_value

    shipping_fee = Decimal("0") if subtotal >= Decimal("500000") else Decimal("30000")
    total = subtotal + shipping_fee - discount

    assigned_shipper = None
    shipped_at = None
    if ostatus in (OrderStatus.SHIPPING, OrderStatus.DELIVERED):
        assigned_shipper = shippers[shipper_cursor % len(shippers)]
        shipper_cursor += 1
        shipped_at = now - timedelta(days=max(delta_days - 1, 0))
    elif ostatus == OrderStatus.PACKING:
        assigned_shipper = shippers[shipper_cursor % len(shippers)]
        shipper_cursor += 1

    addr = customers[c_idx].addresses.filter(is_default=True).first()
    order = Order.objects.create(
        user=customers[c_idx], shipper=assigned_shipper, code=code,
        recipient_name=addr.recipient_name if addr else customers[c_idx].get_full_name(),
        recipient_phone=addr.recipient_phone if addr else customers[c_idx].phone,
        shipping_address=(f"{addr.detail_address}, {addr.ward}, {addr.district}, {addr.province}"
                           if addr else "Chưa cập nhật"),
        shipping_fee=shipping_fee, subtotal_amount=subtotal,
        discount_amount=discount, total_amount=total, voucher=voucher,
        payment_method=method, status=ostatus,
        expected_delivery_date=today + timedelta(days=3),
        shipped_at=shipped_at,
        delivered_at=(now - timedelta(days=delta_days - 2)) if ostatus == OrderStatus.DELIVERED else None,
        cancel_reason="Khách hàng đổi ý, không muốn mua nữa" if ostatus == OrderStatus.CANCELLED else "",
    )
    orders.append(order)

    created_items = []
    for variant, unit_price, qty in line_items:
        oi = OrderItem.objects.create(
            order=order, variant=variant, product_name=variant.product.name,
            size=str(variant.size), color=variant.color,
            unit_price=unit_price, quantity=qty,
        )
        created_items.append(oi)

        if ostatus == OrderStatus.DELIVERED:
            product = variant.product
            product.sold_count = product.sold_count + qty
            product.save(update_fields=["sold_count"])

    order_items_by_order[code] = created_items

    if pay_status == PaymentStatus.PAID:
        gateway_message = "Thành công"
    elif pay_status == PaymentStatus.CANCELLED:
        gateway_message = "Giao dịch đã bị huỷ"
    else:
        gateway_message = "Thất bại hoặc đang chờ xử lý"

    Payment.objects.create(
        order=order, amount=total, method=method, status=pay_status,
        transaction_id=f"PAYOS-{code}",
        gateway_response={"message": gateway_message},
        paid_at=(now - timedelta(days=delta_days)) if pay_status == PaymentStatus.PAID else None,
    )

orders_by_code = {o.code: o for o in orders}
cod_remitted_order = orders_by_code["DH20260603002"]

if cod_remitted_order.shipper:
    remittance = Remittance.objects.create(
        shipper=cod_remitted_order.shipper,
        confirmed_by=admin_extra,
        total_amount=cod_remitted_order.total_amount,
        note=f"Nộp tiền COD đơn {cod_remitted_order.code}",
        remitted_at=now - timedelta(days=5),
    )
    RemittanceItem.objects.create(
        remittance=remittance,
        order=cod_remitted_order,
        amount=cod_remitted_order.total_amount,
    )
    cod_remitted_order.cod_remitted = True
    cod_remitted_order.save(update_fields=["cod_remitted"])

# ---------------------------------------------------------------------------
# ĐÁNH GIÁ SẢN PHẨM (REVIEW)
# ---------------------------------------------------------------------------
# 1) Các đánh giá "thật" gắn với đơn hàng cụ thể (order_item) - giữ nguyên vì
#    đây là đánh giá phát sinh từ một giao dịch mua hàng có thật.
review_data = [
    ("DH20260601001", 0, 5, "Áo chất vải mát, mặc rất thoải mái, sẽ ủng hộ tiếp!"),
    ("DH20260603002", 0, 4, "Quần jean form đẹp nhưng hơi rộng so với size thường mặc."),
    ("DH20260605003", 0, 5, "Váy đẹp như hình, giao hàng nhanh."),
    ("DH20260615007", 0, 4, "Đầm ưng ý, chất liệu ổn trong tầm giá."),
    ("DH20260618009", 0, 3, "Áo khoác đẹp nhưng màu hơi khác so với ảnh trên web."),
]

reviews_by_order_code = {}
for order_code, item_idx, rating, comment in review_data:
    oi = order_items_by_order[order_code][item_idx]
    order = oi.order
    review = Review.objects.create(
        order_item=oi, user=order.user, product=oi.variant.product,
        rating=rating, comment=comment,
    )
    reviews_by_order_code[order_code] = review

review_image_data = [
    ("DH20260601001", ["review_images/dh20260601001_1.jpg", "review_images/dh20260601001_2.jpg"]),
    ("DH20260605003", ["review_images/dh20260605003_1.jpg"]),
    ("DH20260618009", ["review_images/dh20260618009_1.jpg"]),
]

for order_code, image_paths in review_image_data:
    review = reviews_by_order_code[order_code]
    for path in image_paths:
        ReviewImage.objects.create(review=review, image=path)

# 2) Bổ sung đánh giá cho TẤT CẢ sản phẩm để mỗi sản phẩm có ít nhất
#    TARGET_REVIEWS_PER_PRODUCT đánh giá, đa dạng số sao và nội dung
#    comment được viết tương thích với rating (khen tương ứng 5-4 sao,
#    trung lập ở 3 sao, chê tương ứng ở 2-1 sao) để dữ liệu chân thật hơn.

TARGET_REVIEWS_PER_PRODUCT = 10

# Tỷ lệ rating mô phỏng thực tế của một shop bán hàng có uy tín:
# đa số 5-4 sao, một ít 3 sao, hiếm 2-1 sao.
RATING_POOL = [5, 5, 5, 4, 4, 4, 3, 3, 2, 1]

rating_comment_templates = {
    5: [
        "Chất lượng vượt mong đợi, {product} mặc rất đã, chắc chắn sẽ ủng hộ shop dài dài.",
        "Quá ưng ý luôn, {product} đúng như hình, giao hàng nhanh, đóng gói cẩn thận.",
        "Đây là lần thứ {n} mình mua {product} rồi, chưa lần nào thấy thất vọng cả.",
        "{product} chất liệu {material} sờ vào rất thích, form chuẩn, mặc lên tự tin hẳn.",
        "5 sao cho {product}, đường may tỉ mỉ, giá cả hợp lý so với chất lượng nhận được.",
        "Mặc thử là ưng liền, {product} lên form đẹp, màu sắc y hình shop đăng.",
        "Dịch vụ tốt, {product} đóng gói kỹ, chất {material} mặc thoáng mát cả ngày.",
    ],
    4: [
        "{product} khá ổn, chỉ hơi tiếc là màu thực tế nhạt hơn ảnh trên web một chút.",
        "Nhìn chung hài lòng với {product}, chất liệu {material} mặc thoáng, chỉ tội ship hơi trễ.",
        "Sản phẩm ổn so với giá tiền, {product} form hơi rộng hơn mình nghĩ nhưng vẫn mặc được.",
        "Ưng {product} nhưng đường chỉ ở một góc chưa gọn lắm, không đáng kể mấy.",
        "Chất lượng tốt, giao hàng nhanh, sẽ ủng hộ thêm nếu shop ra mẫu mới.",
        "{product} mặc lên khá đẹp, chỉ hơi tiếc bảng size hơi lệch so với mô tả.",
    ],
    3: [
        "{product} tạm ổn, không có gì đặc sắc nhưng cũng không đến nỗi tệ.",
        "Chất liệu {material} bình thường, đúng như mô tả nhưng không quá ấn tượng.",
        "Mặc được nhưng phom dáng của {product} không tôn dáng lắm, cân nhắc trước khi mua.",
        "Giao hàng đúng hẹn, {product} ở mức chấp nhận được so với giá tiền.",
        "Sản phẩm ok nhưng mình nghĩ giá {product} hơi cao so với chất lượng thực tế.",
    ],
    2: [
        "{product} hơi thất vọng, chất liệu {material} mỏng hơn mình tưởng khá nhiều.",
        "Size không chuẩn, đặt đúng bảng size mà mặc rộng thùng thình, chưa ưng lắm.",
        "Đường may {product} có vài chỗ chưa kỹ, dùng vài lần đã thấy xù nhẹ.",
        "Màu sắc thực tế khác khá nhiều so với hình quảng cáo, hơi hụt hẫng.",
        "Giao hàng chậm hơn dự kiến và {product} không được như mình mong đợi.",
    ],
    1: [
        "Rất thất vọng với {product}, chất lượng không xứng với giá tiền bỏ ra.",
        "Vải {product} quá mỏng, mới giặt lần đầu đã sờn, không dám mặc tiếp.",
        "Sản phẩm lỗi ở đường may, phải liên hệ đổi trả mất khá nhiều thời gian.",
        "Không giống mô tả chút nào, chắc mình không mua lại {product} nữa.",
    ],
}

existing_review_counts = {
    p_idx: Review.objects.filter(product=products[p_idx]).count()
    for p_idx in range(len(products))
}

for p_idx, product in enumerate(products):
    need = TARGET_REVIEWS_PER_PRODUCT - existing_review_counts.get(p_idx, 0)
    if need <= 0:
        continue

    ratings_to_add = (RATING_POOL * ((need // len(RATING_POOL)) + 1))[:need]
    random.shuffle(ratings_to_add)

    for i, rating in enumerate(ratings_to_add):
        reviewer = customers[(p_idx * 5 + i) % len(customers)]
        template = random.choice(rating_comment_templates[rating])
        comment = template.format(
            product=product.name,
            material=(product.material or "vải").lower(),
            n=random.choice(["2", "3", "4"]),
        )
        Review.objects.create(
            order_item=None,
            user=reviewer,
            product=product,
            rating=rating,
            comment=comment,
        )

chatting_customers = [0, 2, 4, 6]
chat_texts = [
    [
        ("customer", "Chào shop, áo thun basic còn size L màu đen không ạ?"),
        ("admin", "Dạ chào chị, size L màu đen hiện còn hàng ạ, chị đặt giúp shop nhé."),
        ("customer", "Ok em cảm ơn shop nhiều!"),
    ],
    [
        ("customer", "Cho hỏi đầm dự tiệc bao giờ có hàng lại vậy shop?"),
        ("admin", "Dạ sản phẩm đang tạm hết hàng, dự kiến 1 tuần nữa sẽ nhập thêm ạ."),
    ],
    [
        ("customer", "Đơn DH20260612005 của em khi nào giao vậy shop?"),
        ("admin", "Dạ đơn của chị đang được đóng gói, dự kiến giao trong 2-3 ngày tới ạ."),
        ("customer", "Dạ em cảm ơn."),
    ],
    [
        ("customer", "Shop cho em đổi size quần legging từ S sang M được không?"),
        ("admin", "Dạ được ạ, chị vui lòng gửi lại yêu cầu đổi hàng qua mục Đơn hàng giúp shop nhé."),
    ],
]

for c_idx, convo in zip(chatting_customers, chat_texts):
    room = ChatRoom.objects.create(customer=customers[c_idx])
    for sender_type, content in convo:
        sender = admin_extra if sender_type == "admin" else customers[c_idx]
        ChatMessage.objects.create(
            room=room, sender=sender, content=content,
            is_read=(sender_type == "admin"),
        )

notif_data = [
    (0, NotificationType.ORDER, "Đơn hàng đã được giao thành công",
     "Đơn hàng DH20260601001 của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm!", True, orders[0].id),
    (1, NotificationType.ORDER, "Đơn hàng đã được giao thành công",
     "Đơn hàng DH20260603002 của bạn đã được giao thành công.", True, orders[1].id),
    (2, NotificationType.ORDER, "Đơn hàng đã được giao thành công",
     "Đơn hàng DH20260605003 của bạn đã được giao thành công.", False, orders[2].id),
    (3, NotificationType.ORDER, "Đơn hàng đang được vận chuyển",
     "Đơn hàng DH20260610004 của bạn đang trên đường giao đến bạn.", False, orders[3].id),
    (4, NotificationType.ORDER, "Đơn hàng đang được đóng gói",
     "Đơn hàng DH20260612005 của bạn đang được đóng gói tại kho.", False, orders[4].id),
    (5, NotificationType.ORDER, "Đơn hàng đã được ghi nhận",
     "Đơn hàng DH20260614006 của bạn đã được ghi nhận và đang chờ xác nhận.", False, orders[5].id),
    (7, NotificationType.ORDER, "Đơn hàng đã bị huỷ",
     "Đơn hàng DH20260616008 đã bị huỷ do thanh toán không thành công.", True, orders[7].id),
    (0, NotificationType.PROMOTION, "Ưu đãi 20% dành cho bạn",
     "Mã VIP20 giảm 20% cho đơn từ 500.000đ, áp dụng đến hết tháng.", False, None),
    (2, NotificationType.PROMOTION, "Miễn phí vận chuyển hôm nay",
     "Sử dụng mã FREESHIP để được miễn phí vận chuyển cho đơn hàng hôm nay.", False, None),
    (0, NotificationType.CHAT, "Bạn có tin nhắn mới từ Shop",
     "Shop vừa phản hồi tin nhắn của bạn, hãy vào kiểm tra ngay.", True, None),
    (4, NotificationType.CHAT, "Bạn có tin nhắn mới từ Shop",
     "Shop vừa phản hồi tin nhắn của bạn, hãy vào kiểm tra ngay.", False, None),
    (6, NotificationType.SYSTEM, "Chào mừng bạn đến với Fashion Shop",
     "Cảm ơn bạn đã đăng ký tài khoản. Chúc bạn mua sắm vui vẻ!", False, None),
]

for c_idx, ntype, title, body, is_read, ref_id in notif_data:
    Notification.objects.create(
        user=customers[c_idx], type=ntype, title=title, body=body,
        is_read=is_read, ref_id=ref_id,
    )

shipper_notif_data = [
    (orders[3].shipper, "Bạn được gán đơn hàng mới",
     f"Bạn vừa được gán giao đơn hàng {orders[3].code}. Vui lòng kiểm tra và giao đúng hẹn."),
    (orders[4].shipper, "Bạn được gán đơn hàng mới",
     f"Bạn vừa được gán giao đơn hàng {orders[4].code}. Vui lòng kiểm tra và giao đúng hẹn."),
]
for shipper_user, title, body in shipper_notif_data:
    if shipper_user:
        Notification.objects.create(
            user=shipper_user, type=NotificationType.ORDER,
            title=title, body=body, is_read=False,
        )

ai_sessions_data = [
    (0, "Mình cần một bộ đồ đi làm công sở lịch sự nhưng vẫn thoải mái", "Đi làm",
     Decimal("300000"), Decimal("800000"), "Thanh lịch, tối giản",
     {"occasion": "công sở", "budget": [300000, 800000], "style": "thanh lịch", "category": ["áo sơ mi", "quần tây"]},
     [(3, "Áo sơ mi lụa nữ phù hợp phong cách thanh lịch, dễ phối cùng quần tây."),
      (10, "Quần tây công sở form slimfit giúp tôn dáng, phù hợp môi trường làm việc.")]),
    (4, "Cần trang phục dự tiệc sang trọng cuối tuần này", "Dự tiệc",
     Decimal("500000"), Decimal("1000000"), "Sang trọng, nổi bật",
     {"occasion": "dự tiệc", "budget": [500000, 1000000], "style": "sang trọng", "category": ["đầm"]},
     [(12, "Đầm dự tiệc thiết kế ôm nhẹ, chất liệu cao cấp phù hợp không khí sang trọng.")]),
    (6, "Muốn mua đồ tập gym thoải mái, thấm hút mồ hôi tốt", "Tập gym",
     Decimal("200000"), Decimal("500000"), "Năng động, thể thao",
     {"occasion": "gym", "budget": [200000, 500000], "style": "thể thao", "category": ["đồ thể thao"]},
     [(14, "Áo thun Dry-Fit thấm hút mồ hôi tốt, phù hợp vận động cường độ cao."),
      (15, "Quần legging co giãn 4 chiều, ôm dáng thoải mái khi tập luyện.")]),
]

for c_idx, query, occasion, bmin, bmax, style, requirements, recs in ai_sessions_data:
    session = AIStylistSession.objects.create(
        user=customers[c_idx], query_text=query, occasion=occasion,
        budget_min=bmin, budget_max=bmax, style_preference=style,
        ai_requirements=requirements,
    )
    for rank, (p_idx, reason) in enumerate(recs, start=1):
        AIStylistRecommendationItem.objects.create(
            session=session, product=products[p_idx], reason=reason, rank_order=rank,
        )

_mismatched = User.objects.exclude(
    bank_bin=BANK_BIN,
    bank_account_number=BANK_ACCOUNT_NUMBER,
    bank_account_name=BANK_ACCOUNT_NAME,
)
if _mismatched.exists():
    print(f"CẢNH BÁO: có {_mismatched.count()} user thông tin ngân hàng không khớp chuẩn!")
else:
    print("Đã xác nhận: tất cả user đều dùng chung thông tin ngân hàng "
          f"({BANK_BIN} / {BANK_ACCOUNT_NUMBER} / {BANK_ACCOUNT_NAME}).")

print("Hoàn tất tạo dữ liệu mẫu cho Shop Quần Áo!")
print(f"- Users: {User.objects.count()} (trong đó Shipper: {len(shippers)})")
print(f"- Categories: {Category.objects.count()}, Brands: {Brand.objects.count()}")
print(f"- Products: {Product.objects.count()}, ProductTags: {ProductTag.objects.count()}, Variants: {ProductVariant.objects.count()}")
print(f"- Orders: {Order.objects.count()}, OrderItems: {OrderItem.objects.count()}")
print(f"- Payments: {Payment.objects.count()}, Reviews: {Review.objects.count()}, ReviewImages: {ReviewImage.objects.count()}")
print(f"- Remittances: {Remittance.objects.count()}, RemittanceItems: {RemittanceItem.objects.count()}, "
      f"Đơn COD đã nộp lại (cod_remitted=True): {Order.objects.filter(cod_remitted=True).count()}")
print(f"- ChatRooms: {ChatRoom.objects.count()}, Notifications: {Notification.objects.count()}")
print(f"- AI Stylist Sessions: {AIStylistSession.objects.count()}")
print(f"- Tổng sold_count trên tất cả Product: {sum(p.sold_count for p in Product.objects.all())}")

_low_review_products = [
    p for p in Product.objects.all() if p.reviews.count() < TARGET_REVIEWS_PER_PRODUCT
]
if _low_review_products:
    print(f"CẢNH BÁO: còn {len(_low_review_products)} sản phẩm chưa đủ {TARGET_REVIEWS_PER_PRODUCT} đánh giá!")
else:
    print(f"Đã xác nhận: tất cả {Product.objects.count()} sản phẩm đều có ít nhất {TARGET_REVIEWS_PER_PRODUCT} đánh giá.")