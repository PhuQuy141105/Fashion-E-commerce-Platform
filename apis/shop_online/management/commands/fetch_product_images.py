import time
from django.core.management.base import BaseCommand
from shop_online.models import Product
from shop_online.image_fetcher import attach_product_thumbnail, attach_variant_images

class Command(BaseCommand):
    help = "Tải ảnh sản phẩm từ Unsplash và gắn vào DB, khớp theo tên/category/màu."
    def add_arguments(self, parser):
        parser.add_argument('--with-variants', action='store_true',help='Tải thêm ảnh riêng theo từng màu variant')
    def handle(self, *args, **options):
        products = Product.objects.filter(active=True)
        total = products.count()
        for i, product in enumerate(products, 1):
            self.stdout.write(f"({i}/{total}) Xử lý: {product.name}")
            attach_product_thumbnail(product)
            time.sleep(1.2)
            if options['with_variants']:
                attach_variant_images(product)
                time.sleep(1.2)
        self.stdout.write(self.style.SUCCESS("Hoàn tất tải ảnh sản phẩm."))