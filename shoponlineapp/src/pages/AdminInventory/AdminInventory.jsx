import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, AlertCircle, Loader2, RefreshCw, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import StaffLayout from '../../components/StaffLayout/StaffLayout';
import StockUpdateModal  from '../../components/StockUpdateModal/StockUpdateModal';
import styles from './AdminInventory.module.css';

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

const PAGE_SIZE = 10;

export default function AdminInventory() {

  const [currentUser, setCurrentUser] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [banner, setBanner] = useState(null);

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL'); 
  const [currentPage, setCurrentPage] = useState(1);

  const [activeVariant, setActiveVariant] = useState(null);

  useEffect(() => {
    authApis.get(endpoints['current-user']).then((res) => setCurrentUser(res.data)).catch(() => {});
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await authApis.get(endpoints['all-variants']);
      setVariants(data.results ?? data);
    } catch (err) {
      console.error('Không tải được dữ liệu tồn kho:', err);
      setLoadError(extractApiError(err, 'Không tải được dữ liệu tồn kho.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const filteredVariants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return variants.filter((v) => {
      const matchesSearch =
        !q ||
        v.product?.name?.toLowerCase().includes(q) ||
        v.product?.brand?.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q) ||
        String(v.size).toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (stockFilter === 'LOW_STOCK') return v.stock_qty > 0 && v.stock_qty < 10;
      if (stockFilter === 'OUT_OF_STOCK') return v.stock_qty === 0;
      return true;
    });
  }, [variants, search, stockFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVariants.length / PAGE_SIZE));
  const paginatedVariants = useMemo(
    () => filteredVariants.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredVariants, currentPage]
  );

  const lowStockCount = useMemo(() => variants.filter((v) => v.stock_qty > 0 && v.stock_qty < 10).length, [variants]);
  const outOfStockCount = useMemo(() => variants.filter((v) => v.stock_qty === 0).length, [variants]);

  const handleUpdateStock = async (newStock) => {
    try {
      const { data: updated } = await authApis.patch(endpoints['variant-detail'](activeVariant.id), { stock_qty: newStock });
      setVariants((prev) => prev.map((v) => (v.id === updated.id ? { ...v, ...updated, product: v.product } : v)));
      showBanner('success', 'Đã cập nhật tồn kho.');
    } catch (err) {
      throw new Error(extractApiError(err, 'Không thể cập nhật tồn kho.'));
    }
  };

  return (
    <StaffLayout activePage="inventory" currentUser={currentUser}>
      <main id="admin-inventory-page" className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Tồn kho & Mức dự trữ</h1>
            <p className={styles.subtitle}>Theo dõi số lượng tồn kho theo từng biến thể trên toàn bộ danh mục.</p>
          </div>
        </div>

        {banner && <div className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>{banner.message}</div>}

        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo sản phẩm, thương hiệu, màu, size..."
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterTabs}>
            <button type="button" onClick={() => setStockFilter('ALL')} className={`${styles.filterTab} ${stockFilter === 'ALL' ? styles.filterTabActive : ''}`}>
              Tất cả ({variants.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('LOW_STOCK')}
              className={`${styles.filterTab} ${stockFilter === 'LOW_STOCK' ? styles.filterTabWarning : ''}`}
            >
              <AlertTriangle className={styles.filterTabIcon} />
              <span>Sắp hết ({lowStockCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('OUT_OF_STOCK')}
              className={`${styles.filterTab} ${stockFilter === 'OUT_OF_STOCK' ? styles.filterTabDanger : ''}`}
            >
              <AlertCircle className={styles.filterTabIcon} />
              <span>Hết hàng ({outOfStockCount})</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.stateCard}>
            <Loader2 className={styles.loadingIcon} />
            <p>Đang tải dữ liệu tồn kho...</p>
          </div>
        ) : loadError ? (
          <div className={styles.stateCard}>
            <p className={styles.errorText}>{loadError}</p>
            <button type="button" onClick={loadData} className={styles.retryButton}>
              Thử lại
            </button>
          </div>
        ) : filteredVariants.length === 0 ? (
          <div className={styles.stateCard}>
            <p>Không có biến thể nào khớp bộ lọc.</p>
          </div>
        ) : (
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.headRow}>
                    <th className={styles.th}>Sản phẩm</th>
                    <th className={styles.th}>Màu & Size</th>
                    <th className={styles.th}>Trạng thái</th>
                    <th className={styles.th}>Tồn kho</th>
                    <th className={`${styles.th} ${styles.thRight}`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVariants.map((v) => {
                    const isOutOfStock = v.stock_qty === 0;
                    const isLowStock = v.stock_qty > 0 && v.stock_qty < 10;
                    return (
                      <tr key={v.id} className={styles.row}>
                        <td className={styles.cell}>
                          <div className={styles.productCell}>
                            {v.product?.thumbnail ? (
                              <img src={v.product.thumbnail} alt={v.product.name} referrerPolicy="no-referrer" className={styles.thumb} />
                            ) : (
                              <div className={styles.thumbPlaceholder}>
                                <ImageOff className={styles.thumbPlaceholderIcon} />
                              </div>
                            )}
                            <div>
                              <p className={styles.productName}>{v.product?.name}</p>
                              <p className={styles.productBrand}>{v.product?.brand}</p>
                            </div>
                          </div>
                        </td>

                        <td className={styles.cell}>
                          <span className={styles.colorText}>{v.color}</span>
                          <span className={styles.sizeTag}>Size {v.size}</span>
                        </td>

                        <td className={styles.cell}>
                          {isOutOfStock ? (
                            <span className={`${styles.badge} ${styles.badgeDanger}`}>
                              
                              Hết hàng
                            </span>
                          ) : isLowStock ? (
                            <span className={`${styles.badge} ${styles.badgeWarning}`}>
                              <AlertTriangle className={styles.badgeIcon} />
                              Sắp hết (&lt;10)
                            </span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                             
                              Đủ hàng
                            </span>
                          )}
                        </td>

                        <td className={styles.cell}>
                          <span className={`${styles.stockValue} ${styles.badge} ${styles.badgeInStock} ${isOutOfStock ? styles.stockValueDanger : isLowStock ? styles.stockValueWarning : ''}`}>
                            {v.stock_qty} sản phẩm
                          </span>
                        </td>

                        <td className={`${styles.cell} ${styles.cellRight}`}>
                          <button type="button" onClick={() => setActiveVariant(v)} className={styles.refillButton}>
                            <RefreshCw className={styles.refillIcon} />
                            <span>Nạp nhanh</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Trang {currentPage}/{totalPages} • {filteredVariants.length} biến thể
              </span>

              <div className={styles.paginationControls}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className={styles.pageButton}
                >
                  <ChevronLeft className={styles.pageIcon} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className={styles.pageButton}
                >
                  <ChevronRight className={styles.pageIcon} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <StockUpdateModal
        isOpen={Boolean(activeVariant)}
        variant={activeVariant}
        productName={activeVariant?.product?.name || ''}
        onClose={() => setActiveVariant(null)}
        onConfirm={handleUpdateStock}
      />
    </StaffLayout>
  );
}