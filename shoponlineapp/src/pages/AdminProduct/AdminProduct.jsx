import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Package, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import { fetchAdminProducts, fetchCategories, fetchBrands, ADMIN_DEFAULT_FILTERS } from '../../services/ProductService';
import StaffLayout from '../../components/StaffLayout/StaffLayout';
import ProductFilters from '../../components/ProductFilters/ProductFilters';
import ProductTable from '../../components/ProductTable/ProductTable';
import ArchiveProductModal from '../../components/ArchiveProductModal/ArchiveProductModal';
import ProductFormModal from '../../components/ProductFormModal/ProductFormModal';
import styles from './AdminProduct.module.css';

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

export default function AdminProducts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(16);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [banner, setBanner] = useState(null);

  const [stats, setStats] = useState({ total: 0, active: 0, lowStock: 0, outOfStock: 0 });

  const [filters, setFilters] = useState({ ...ADMIN_DEFAULT_FILTERS, search: searchParams.get('search') || '' });

  const [formModal, setFormModal] = useState({ isOpen: false, mode: 'add', product: null });
  const [archiveTarget, setArchiveTarget] = useState(null);

  useEffect(() => {
    authApis.get(endpoints['current-user']).then((res) => setCurrentUser(res.data)).catch(() => {});
    fetchCategories().then(setCategories);
    fetchBrands().then(setBrands);
  }, []);

  const fetchTableData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await fetchAdminProducts(filters, currentPage);
      setProducts(result.items);
      setTotalProducts(result.totalItems);
      setPageSize(result.pageSize);
    } catch (err) {
      console.error('Không tải được danh sách sản phẩm:', err);
      setLoadError(extractApiError(err, 'Không tải được danh sách sản phẩm.'));
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.category, filters.brand, filters.status, filters.stockStatus]);

  
  const fetchStats = useCallback(async () => {
    const baseFilters = { ...ADMIN_DEFAULT_FILTERS, search: filters.search, category: filters.category, brand: filters.brand };
    try {
      const [totalRes, activeRes, lowStockRes, outOfStockRes] = await Promise.all([
        fetchAdminProducts(baseFilters, 1),
        fetchAdminProducts({ ...baseFilters, status: 'ACTIVE' }, 1),
        fetchAdminProducts({ ...baseFilters, stockStatus: 'LOW_STOCK' }, 1),
        fetchAdminProducts({ ...baseFilters, stockStatus: 'OUT_OF_STOCK' }, 1),
      ]);
      setStats({
        total: totalRes.totalItems,
        active: activeRes.totalItems,
        lowStock: lowStockRes.totalItems,
        outOfStock: outOfStockRes.totalItems,
      });
    } catch (err) {
      console.error('Không tải được số liệu thống kê:', err);
    }
  }, [filters.search, filters.category, filters.brand]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleFilterChange = (partial) => setFilters((prev) => ({ ...prev, ...partial }));
  const handleReset = () => setFilters(ADMIN_DEFAULT_FILTERS);

  const handleOpenAdd = () => setFormModal({ isOpen: true, mode: 'add', product: null });
  const handleOpenEdit = (product) => setFormModal({ isOpen: true, mode: 'edit', product });

  const refreshAfterMutation = () => {
    fetchTableData();
    fetchStats();
  };

  const handleSubmitProduct = async (formData) => {
    try {
      if (formModal.mode === 'edit') {
        await authApis.patch(endpoints['product-detail'](formModal.product.id), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showBanner('success', 'Đã cập nhật sản phẩm.');
      } else {
        await authApis.post(endpoints['products'], formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        showBanner('success', 'Đã tạo sản phẩm mới.');
      }
      setFormModal({ isOpen: false, mode: 'add', product: null });
      refreshAfterMutation();
    } catch (err) {
      throw new Error(extractApiError(err, 'Không thể lưu sản phẩm.'));
    }
  };

  const handleConfirmArchive = async (product) => {
    try {
      await authApis.patch(endpoints['product-detail'](product.id), { status: 'DISCONTINUED' });
      showBanner('success', `Đã ngừng bán "${product.name}".`);
      refreshAfterMutation();
    } catch (err) {
      throw new Error(extractApiError(err, 'Ngừng bán sản phẩm thất bại.'));
    }
  };

  return (
    <StaffLayout activePage="products" currentUser={currentUser}>
      <main id="admin-products-page" className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Quản lý sản phẩm</h1>
            <p className={styles.subtitle}>Tạo, cập nhật sản phẩm và quản lý tồn kho.</p>
          </div>

          <button type="button" id="admin-add-product-btn" onClick={handleOpenAdd} className={styles.addButton}>
            <Plus className={styles.addIcon} />
            <span>Thêm sản phẩm</span>
          </button>
        </div>

        <div className={styles.statsGrid}>
          <button type="button" className={styles.statCard} onClick={() => handleFilterChange({ status: 'All', stockStatus: 'All' })}>
            <div className={styles.statIconBox}>
              <Package className={styles.statIcon} />
            </div>
            <div>
              <p className={styles.statLabel}>Tổng sản phẩm</p>
              <h3 className={styles.statValue}>{stats.total}</h3>
            </div>
          </button>

          <button type="button" className={styles.statCard} onClick={() => handleFilterChange({ status: 'ACTIVE', stockStatus: 'All' })}>
            <div className={`${styles.statIconBox} ${styles.statIconEmerald}`}>
              <CheckCircle2 className={styles.statIcon} />
            </div>
            <div>
              <p className={styles.statLabel}>Đang bán</p>
              <h3 className={`${styles.statValue} ${styles.statValueEmerald}`}>{stats.active}</h3>
            </div>
          </button>

          <button type="button" className={styles.statCard} onClick={() => handleFilterChange({ status: 'All', stockStatus: 'LOW_STOCK' })}>
            <div className={`${styles.statIconBox} ${styles.statIconAmber}`}>
              <AlertTriangle className={styles.statIcon} />
            </div>
            <div>
              <p className={styles.statLabel}>Sắp hết hàng</p>
              <h3 className={`${styles.statValue} ${styles.statValueAmber}`}>{stats.lowStock}</h3>
            </div>
          </button>

          <button type="button" className={styles.statCard} onClick={() => handleFilterChange({ status: 'All', stockStatus: 'OUT_OF_STOCK' })}>
            <div className={`${styles.statIconBox} ${styles.statIconRose}`}>
              <AlertCircle className={styles.statIcon} />
            </div>
            <div>
              <p className={styles.statLabel}>Hết hàng</p>
              <h3 className={`${styles.statValue} ${styles.statValueRose}`}>{stats.outOfStock}</h3>
            </div>
          </button>
        </div>

        {banner && <div className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>{banner.message}</div>}

        <ProductFilters filters={filters} categories={categories} brands={brands} onFilterChange={handleFilterChange} onReset={handleReset} />

        {loadError ? (
          <div className={styles.errorState}>
            <p>{loadError}</p>
            <button type="button" onClick={fetchTableData} className={styles.retryButton}>
              Thử lại
            </button>
          </div>
        ) : (
          <ProductTable
            products={products}
            isLoading={isLoading}
            totalProducts={totalProducts}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onViewVariants={(p) => navigate(`/admin/products/${p.id}/variants`)}
            onEdit={handleOpenEdit}
            onArchive={setArchiveTarget}
            onAddNewProduct={handleOpenAdd}
          />
        )}
      </main>

      <ProductFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        initialProduct={formModal.product}
        categories={categories}
        brands={brands}
        onClose={() => setFormModal({ isOpen: false, mode: 'add', product: null })}
        onSubmit={handleSubmitProduct}
      />

      <ArchiveProductModal isOpen={Boolean(archiveTarget)} product={archiveTarget} onClose={() => setArchiveTarget(null)} onConfirm={handleConfirmArchive} />
    </StaffLayout>
  );
}