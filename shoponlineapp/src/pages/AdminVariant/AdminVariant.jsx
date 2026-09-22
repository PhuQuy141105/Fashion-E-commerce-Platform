import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Layers, ImageOff, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import StaffLayout from '../../components/StaffLayout/StaffLayout';
import VariantCard  from '../../components/VariantCard/VariantCard';
import VariantFormModal from '../../components/VariantFormModal/VariantFormModal';
import StockUpdateModal from '../../components/StockUpdateModal/StockUpdateModal';
import styles from './AdminVariant.module.css';

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data)) return data[0] || fallback;
  if (data.error) return Array.isArray(data.error) ? data.error[0] : data.error;
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
  return fallback;
}

export default function AdminVariant() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [banner, setBanner] = useState(null);

  const [formModal, setFormModal] = useState({ isOpen: false, variant: null });
  const [stockModal, setStockModal] = useState({ isOpen: false, variant: null });

  useEffect(() => {
    authApis.get(endpoints['current-user']).then((res) => setCurrentUser(res.data)).catch(() => {});
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [productRes, variantsRes] = await Promise.all([
        authApis.get(endpoints['product-detail'](id)),
        authApis.get(endpoints['product-variants'](id)),
      ]);
      setProduct(productRes.data);
      setVariants(variantsRes.data.results ?? variantsRes.data);
    } catch (err) {
      console.error('Không tải được dữ liệu biến thể:', err);
      setLoadError(extractApiError(err, 'Không tải được dữ liệu sản phẩm.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const totalStock = useMemo(() => variants.reduce((sum, v) => sum + v.stock_qty, 0), [variants]);
  const lowStockCount = useMemo(() => variants.filter((v) => v.stock_qty > 0 && v.stock_qty < 10).length, [variants]);
  const outOfStockCount = useMemo(() => variants.filter((v) => v.stock_qty === 0).length, [variants]);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleSaveVariant = async (data) => {
    try {
      if (formModal.variant) {
        const { data: updated } = await authApis.patch(endpoints['variant-detail'](formModal.variant.id), data);
        setVariants((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        showBanner('success', 'Đã cập nhật biến thể.');
      } else {
        const { data: created } = await authApis.post(endpoints['product-variants'](id), data);
        setVariants((prev) => [...prev, created]);
        showBanner('success', 'Đã thêm biến thể mới.');
      }
      setFormModal({ isOpen: false, variant: null });
    } catch (err) {
      throw new Error(extractApiError(err, 'Không thể lưu biến thể.'));
    }
  };

  const handleUpdateStock = async (newStock) => {
    try {
      const { data: updated } = await authApis.patch(endpoints['variant-detail'](stockModal.variant.id), { stock_qty: newStock });
      setVariants((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      showBanner('success', 'Đã cập nhật tồn kho.');
    } catch (err) {
      throw new Error(extractApiError(err, 'Không thể cập nhật tồn kho.'));
    }
  };

  if (isLoading) {
    return (
      <StaffLayout activePage="variants" currentUser={currentUser}>
        <div className={styles.loadingPage}>
          <Loader2 className={styles.loadingIcon} />
          <p>Đang tải dữ liệu biến thể...</p>
        </div>
      </StaffLayout>
    );
  }

  if (loadError || !product) {
    return (
      <StaffLayout activePage="variants" currentUser={currentUser}>
        <div className={styles.errorPage}>
          <AlertTriangle className={styles.errorIcon} />
          <p>{loadError || 'Không tìm thấy sản phẩm.'}</p>
          <button type="button" onClick={() => navigate('/admin/products')} className={styles.errorButton}>
            Về danh sách sản phẩm
          </button>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout activePage="variants" currentUser={currentUser}>
      <main className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <nav className={styles.breadcrumb}>
              <button type="button" onClick={() => navigate('/admin/products')} className={styles.breadcrumbLink}>
                Sản phẩm
              </button>
              <ChevronRight className={styles.breadcrumbArrow} />
              <span className={styles.breadcrumbCurrent}>{product.name}</span>
              <ChevronRight className={styles.breadcrumbArrow} />
              <span className={styles.breadcrumbAccent}>Biến thể & Tồn kho</span>
            </nav>
            <h1 className={styles.title}>Quản lý biến thể</h1>
          </div>

          <button
            type="button"
            id="admin-add-variant-btn"
            onClick={() => setFormModal({ isOpen: true, variant: null })}
            className={styles.addButton}
          >
            <Plus className={styles.addIcon} />
            <span>Thêm biến thể</span>
          </button>
        </div>

        {banner && <div className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>{banner.message}</div>}

        <div className={styles.summaryCard}>
          <div className={styles.summaryLeft}>
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} referrerPolicy="no-referrer" className={styles.summaryImage} />
            ) : (
              <div className={styles.summaryImagePlaceholder}>
                <ImageOff className={styles.summaryImagePlaceholderIcon} />
              </div>
            )}
            <div>
              <div className={styles.summaryTags}>
                <span className={styles.brandTag}>{product.brand?.name}</span>
                <span className={styles.categoryText}> - {product.category?.name}</span>
              </div>
              <h2 className={styles.summaryName}>{product.name}</h2>
              <p className={styles.summaryPrice}>Giá gốc: {Number(product.base_price).toLocaleString('vi-VN')} VNĐ</p>
            </div>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Biến thể</span>
              <span className={styles.statValue}>{variants.length}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Tổng tồn kho</span>
              <span className={styles.statValue}>{totalStock}</span>
            </div>
            {lowStockCount > 0 && (
              <div className={`${styles.statBox} ${styles.statBoxWarning}`}>
                <span className={styles.statLabel}>Sắp hết</span>
                <span className={styles.statValue}>{lowStockCount}</span>
              </div>
            )}
            {outOfStockCount > 0 && (
              <div className={`${styles.statBox} ${styles.statBoxDanger}`}>
                <span className={styles.statLabel}>Hết hàng</span>
                <span className={styles.statValue}>{outOfStockCount}</span>
              </div>
            )}
          </div>
        </div>

        {variants.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconBox}>
              <Layers className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>Chưa có biến thể nào</h3>
            <p className={styles.emptyText}>Sản phẩm này chưa có tổ hợp size/màu nào. Thêm biến thể đầu tiên để bắt đầu quản lý tồn kho.</p>
            <button type="button" onClick={() => setFormModal({ isOpen: true, variant: null })} className={styles.emptyButton}>
              <Plus className={styles.emptyButtonIcon} />
              <span>Thêm biến thể đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {variants.map((variant) => (
              <VariantCard
                key={variant.id}
                variant={variant}
                onEdit={(v) => setFormModal({ isOpen: true, variant: v })}
                onUpdateStock={(v) => setStockModal({ isOpen: true, variant: v })}
              />
            ))}
          </div>
        )}
      </main>

      <VariantFormModal
        isOpen={formModal.isOpen}
        productName={product.name}
        basePrice={product.base_price}
        variantToEdit={formModal.variant}
        onClose={() => setFormModal({ isOpen: false, variant: null })}
        onSubmit={handleSaveVariant}
      />

      <StockUpdateModal
        isOpen={stockModal.isOpen}
        variant={stockModal.variant}
        productName={product.name}
        onClose={() => setStockModal({ isOpen: false, variant: null })}
        onConfirm={handleUpdateStock}
      />
    </StaffLayout>
  );
}