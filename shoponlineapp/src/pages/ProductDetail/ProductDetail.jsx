import { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Star,
  ShoppingBag,
  Zap,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Home,
  Loader2,
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { authApis, endpoints } from '../../configs/Apis';
import { fetchProducts } from '../../services/ProductService';
import ProductGallery from '../../components/ProductGallery/ProductGallery';
import VariantSelector from '../../components/VariantSelector/VariantSelector';
import QuantitySelector from '../../components/QuantitySelector/QuantitySelector';
import ProductTabs from '../../components/ProductTabs/ProductTabs';
import RelatedProducts from '../../components/RelatedProducts/RelatedProducts';
import styles from './ProductDetail.module.css';

export default function ProductDetail({
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted = false,
}) {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialThumbnail = location.state?.initialThumbnail || null;
  const [product, setProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [localWishlisted, setLocalWishlisted] = useState(isWishlisted);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [banner, setBanner] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (!productId) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    setIsLoadingProduct(true);
    setLoadError(null);

    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
    setBanner(null);

    authApis
      .get(endpoints['product-detail'](productId))
      .then(({ data }) => setProduct(data))
      .catch((err) => {
        console.error('Không tải được chi tiết sản phẩm:', err);
        setLoadError('Không tải được thông tin sản phẩm.');
      })
      .finally(() => setIsLoadingProduct(false));

    setIsLoadingVariants(true);

    authApis
      .get(endpoints['product-variants'](productId))
      .then(({ data }) => setVariants(data.results ?? data))
      .catch((err) => console.error('Không tải được biến thể sản phẩm:', err))
      .finally(() => setIsLoadingVariants(false));
  }, [productId]);


  useEffect(() => {
    if (!product?.category?.id) return;

    fetchProducts({ category: product.category.id }, 1)
      .then((res) => {
        setRelatedProducts(res.items.filter((p) => p.id !== product.id).slice(0, 4));
      })
      .catch((err) => console.error('Không tải được sản phẩm liên quan:', err));
  }, [product?.category?.id, product?.id]);

  const matchedVariant = useMemo(
    () => variants.find((v) => v.size === selectedSize && v.color === selectedColor),
    [variants, selectedSize, selectedColor]
  );

  const maxQty = matchedVariant?.stock_qty ?? 1;
  const unitPrice = Number(matchedVariant?.final_price ?? product?.base_price ?? 0);

  
  const galleryProductImages = product?.images && product.images.length > 0
    ? product.images
    : initialThumbnail
    ? [initialThumbnail]
    : [];

  const handleWishlistClick = () => {
    setLocalWishlisted((prev) => !prev);
    onToggleWishlist?.(product);
  };

  const handleAddToCart = async () => {
    if (variants.length > 0 && !matchedVariant) {
      setBanner({ type: 'error', message: 'Vui lòng chọn đủ size và màu sắc.' });
      return;
    }

    if (matchedVariant && quantity > matchedVariant.stock_qty) {
      setBanner({ type: 'error', message: `Số lượng vượt quá tồn kho (còn ${matchedVariant.stock_qty}).` });
      return;
    }

    setIsAddingToCart(true);
    setBanner(null);

    try {
      const { data } = await authApis.post(endpoints['cart-items'], {
        variant: matchedVariant?.id,
        quantity,
      });

      setBanner({ type: 'success', message: `Đã thêm ${quantity} sản phẩm vào giỏ hàng.` });
      onAddToCart?.(product, quantity, matchedVariant, data);
    } catch (err) {
      console.error('Thêm vào giỏ hàng thất bại:', err);
      const message = err.response?.data?.detail || 'Thêm vào giỏ hàng thất bại. Vui lòng thử lại.';
      setBanner({ type: 'error', message });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const handleBuyNow = async () => {
    if (variants.length > 0 && !matchedVariant) {
      setBanner({ type: 'error', message: 'Vui lòng chọn đủ size và màu sắc.' });
      return;
    }

    if (matchedVariant && quantity > matchedVariant.stock_qty) {
      setBanner({ type: 'error', message: `Số lượng vượt quá tồn kho (còn ${matchedVariant.stock_qty}).` });
      return;
    }

    setIsBuyingNow(true);
    setBanner(null);
    try {
      const { data: cartItem } = await authApis.post(endpoints['cart-items'], {
        variant: matchedVariant?.id,
        quantity,
      });
      navigate('/checkout', { state: { cartItemIds: [cartItem.id] } });
    } catch (err) {
      console.error('Mua ngay thất bại:', err);
      const message = err.response?.data?.error || err.response?.data?.detail || 'Không thể tiến hành mua ngay. Vui lòng thử lại.';
      setBanner({ type: 'error', message: Array.isArray(message) ? message[0] : message });
    } finally {
      setIsBuyingNow(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className={styles.loadingPage}>
        <Loader2 className={styles.loadingIcon} />
        <span>Đang tải sản phẩm...</span>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className={styles.errorPage}>
        <p>{loadError || 'Không tìm thấy sản phẩm.'}</p>
        <button type="button" onClick={() => navigate('/')}>
          Về trang chủ
        </button>
      </div>
    );
  }

  const isOutOfStock = isLoadingVariants
    ? product.status === 'OUT_OF_STOCK'
    : !variants.some((v) => v.stock_qty > 0);

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        
        <button type="button" onClick={() => navigate('/products')} className={styles.breadcrumbButton}>
          <Home />
         Trang chủ
        </button>

        <ChevronRight className={styles.breadcrumbArrow} />

        <strong>{product.name}</strong>
      </nav>

      {banner && (
        <div
          className={`${styles.banner} ${
            banner.type === 'success' ? styles.bannerSuccess : banner.type === 'error' ? styles.bannerError : styles.bannerInfo
          }`}
        >
          {banner.message}
        </div>
      )}

      <div className={styles.productLayout}>
        <div className={styles.galleryColumn}>
          <ProductGallery
            productImages={galleryProductImages}
            variants={variants}
            productName={product.name}
            isFeatured={product.is_featured}
            isOutOfStock={isOutOfStock}
            onSelectVariant={(v) => {
              setSelectedColor(v.color);
            }}
          />
        </div>

        <div className={styles.infoColumn}>
          <div className={styles.topInfo}>
            <span className={styles.brand}>{product.brand?.name}</span>

            <div className={styles.statusGroup}>
              {!isOutOfStock ? (
                <span className={styles.inStock}>
                  <span />
                  Còn hàng
                </span>
              ) : (
                <span className={styles.outOfStock}>Hết hàng</span>
              )}

              {product.is_featured && <span className={styles.featured}>Nổi bật</span>}
            </div>
          </div>

          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.ratingRow}>
            {product.review_count > 0 && (
              <>
                <div className={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={i < Math.round(product.avg_rating) ? styles.starFilled : styles.starEmpty} />
                  ))}
                </div>

                <span className={styles.ratingValue}>{Number(product.avg_rating).toFixed(1)}</span>

                <span>-</span>

                <button
                  type="button"
                  onClick={() => document.getElementById('product-details-tabs-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className={styles.reviewLink}
                >
                  {product.review_count} đánh giá
                </button>

                <span>-</span>
              </>
            )}

            <span>{product.category?.name}</span>

            {product.sold_count > 0 && (
              <>
                <span>-</span>
                <span>Đã bán {product.sold_count}</span>
              </>
            )}
          </div>

          <div className={styles.priceBox}>
            <span>{unitPrice.toLocaleString('vi-VN')}VNĐ</span>
          </div>

          <hr className={styles.divider} />

          {isLoadingVariants ? (
            <div className={styles.variantLoading}>
              <Loader2 className={styles.spinner} />
              <span>Đang tải phân loại...</span>
            </div>
          ) : variants.length > 0 ? (
            <VariantSelector
              variants={variants}
              selectedSize={selectedSize}
              onSizeChange={(size) => {
                setSelectedSize(size);
            
                setQuantity(1);
              }}
              selectedColor={selectedColor}
              onColorChange={(color) => {
                setSelectedColor(color);
                setQuantity(1);
              }}
            />
          ) : (
            <p className={styles.noVariants}>Sản phẩm hiện không còn phân loại nào sẵn hàng.</p>
          )}

          <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={1} max={Math.max(maxQty, 1)} />

          <div className={styles.actionSection}>
            <div className={styles.actionGrid}>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAddingToCart || isOutOfStock}
                className={styles.addCartButton}
              >
                {isAddingToCart ? <Loader2 className={styles.buttonIcon} /> : <ShoppingBag className={styles.buttonIcon} />}
                <span>{isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</span>
              </button>

              <button type="button" onClick={handleBuyNow} disabled={isOutOfStock || isBuyingNow} className={styles.buyNowButton}>
                {isBuyingNow ? <Loader2 className={styles.buttonIconAccent} /> : <Zap className={styles.buttonIconAccent} />}
                <span>{isBuyingNow ? 'Đang xử lý...' : 'Mua ngay'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleWishlistClick}
              className={`${styles.wishlistButton} ${localWishlisted ? styles.wishlistActive : ''}`}
            >
              <Heart className={styles.buttonIcon} fill={localWishlisted ? 'currentColor' : 'none'} />
              <span>{localWishlisted ? 'Đã lưu vào yêu thích' : 'Thêm vào yêu thích'}</span>
            </button>
          </div>

          <div className={styles.policyBox}>
            <div className={styles.policyItem}>
              <div className={styles.policyIcon}>
                <Truck />
              </div>
              <div>
                <strong>Giao hàng đảm bảo</strong>
                <span>Giao hàng tiêu chuẩn trong 2–4 ngày làm việc.</span>
              </div>
            </div>

            <div className={styles.policyItem}>
              <div className={styles.policyIcon}>
                <RotateCcw />
              </div>
              <div>
                <strong>Đổi trả trong 30 ngày</strong>
                <span>Đổi trả sản phẩm còn nguyên tem mác.</span>
              </div>
            </div>

            <div className={styles.policyItem}>
              <div className={styles.policyIcon}>
                <ShieldCheck />
              </div>
              <div>
                <strong>Cam kết chính hãng 100%</strong>
                <span>Sản phẩm được kiểm định trước khi giao.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductTabs productId={productId} product={product} />

      <RelatedProducts title="Có thể bạn cũng thích" subtitle="Gợi ý từ cùng danh mục sản phẩm" products={relatedProducts} />

      <div className={styles.mobileActionBar}>
        <button
          type="button"
          onClick={handleWishlistClick}
          className={`${styles.mobileWishlist} ${localWishlisted ? styles.wishlistActive : ''}`}
          aria-label="Yêu thích"
        >
          <Heart fill={localWishlisted ? 'currentColor' : 'none'} />
        </button>

        <button type="button" onClick={handleAddToCart} disabled={isAddingToCart || isOutOfStock} className={styles.mobileCart}>
          <ShoppingBag />
          <span>Thêm vào giỏ ({(unitPrice * quantity).toLocaleString('vi-VN')}VNĐ)</span>
        </button>

        <button type="button" onClick={handleBuyNow} disabled={isOutOfStock || isBuyingNow} className={styles.mobileBuy}>
          <Zap />
          <span>{isBuyingNow ? 'Đang xử lý...' : 'Mua ngay'}</span>
        </button>
      </div>
    </main>
  );
}