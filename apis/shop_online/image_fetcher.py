import os
from dotenv import load_dotenv
import requests
from shop_online.models import ProductImage


CATEGORY_QUERY_MAP = {
    "Áo thun": "t-shirt fashion model",
    "Áo sơ mi": "shirt fashion model",
    "Áo khoác": "jacket fashion model",
    "Áo len": "sweater fashion model",
    "Quần jean": "jeans fashion model",
    "Quần tây": "trousers fashion model",
    "Quần short": "shorts fashion model",
    "Váy - Đầm": "dress fashion model",
    "Đồ thể thao": "sportswear fashion model",
    "Phụ kiện": "fashion accessories",
}

COLOR_QUERY_MAP = {
    "Trắng": "white",
    "Trắng ngà": "ivory white",
    "Đen": "black",
    "Xanh navy": "navy blue",
    "Xanh đậm": "dark blue",
    "Xanh nhạt": "light blue",
    "Xanh denim": "denim blue",
    "Xanh đen": "navy black",
    "Xanh rêu": "olive green",
    "Đỏ đô": "maroon red",
    "Be": "beige",
    "Kaki be": "khaki beige",
    "Xám": "gray",
    "Nâu": "brown",
    "Hồng": "pink",
    "Hồng phấn": "pastel pink",
    "Hoa vàng": "yellow floral",
    "Hoa xanh": "blue floral",
    "Đen - Trắng": "black and white colorblock",
    "Xanh navy - Trắng": "navy blue and white colorblock",
}


load_dotenv()
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")


def build_query(product, color=None):
    category_kw = CATEGORY_QUERY_MAP.get(product.category.name,"fashion clothing")
    if color:
        color_kw = COLOR_QUERY_MAP.get(color, "")
        return f"{color_kw} {category_kw}".strip()
    return category_kw


def search_unsplash(query, per_page=5):
    res = requests.get("https://api.unsplash.com/search/photos",
        params={
            "query": query,
            "per_page": per_page,
        },
        headers={
            "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"
        },
        timeout=15,
    )
    if res.status_code != 200:
        print(f"[API ERROR] {res.status_code}: {res.text[:200]}")
        return None
    results = res.json().get("results", [])
    return results[0]["urls"]["regular"] if results else None


def search_with_fallback(product, color=None):
    category_kw = CATEGORY_QUERY_MAP.get(  product.category.name,"fashion clothing")
    attempts = []
    if color:
        attempts.append(build_query(product, color))
    attempts.append(category_kw)
    attempts.append("fashion clothing model")
    for query in attempts:
        image_url = search_unsplash(query)
        if image_url:
            return image_url, query
    return None, None

def attach_product_thumbnail(product):
    if product.images.filter(is_thumbnail=True).exists():
        return
    image_url, matched_query = search_with_fallback(product)
    if not image_url:
        print(f"[MISS] {product.name}")
        return
    ProductImage.objects.create(product=product,image=image_url,is_thumbnail=True,)
    print(f"[OK-thumb] {product.name} <- '{matched_query}'")

def attach_variant_images(product):
    seen_colors = set()
    for variant in product.variants.filter(active=True):
        if variant.color in seen_colors:
            continue
        seen_colors.add(variant.color)
        if ProductImage.objects.filter(product=product,variant__color=variant.color).exists():
            continue
        image_url, matched_query = search_with_fallback(product,color=variant.color)
        if not image_url:
            print(f"[MISS-variant] "f"{product.name} - {variant.color}")
            continue
        ProductImage.objects.create(product=product,variant=variant,image=image_url,)
        print(f"[OK-variant] {product.name} - {variant.color} <- '{matched_query}'")