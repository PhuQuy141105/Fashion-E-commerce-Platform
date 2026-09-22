import { PackageOpen, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductRow from '../ProductRow/ProductRow';
import styles from './ProductTable.module.css';

export const ProductTable = ({
  products,
  isLoading,
  totalProducts,
  currentPage,
  pageSize,
  onPageChange,
  onViewVariants,
  onEdit,
  onArchive,
  onAddNewProduct,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.loadingState}>
          <Loader2 className={styles.loadingIcon} />
          <p className={styles.loadingText}>Đang tải danh sách sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIconBox}>
            <PackageOpen className={styles.emptyIcon} />
          </div>
          <h3 className={styles.emptyTitle}>Không có sản phẩm nào</h3>
          <p className={styles.emptyText}>Không tìm thấy sản phẩm khớp bộ lọc. Thử điều chỉnh bộ lọc hoặc thêm sản phẩm mới.</p>
          <button type="button" onClick={onAddNewProduct} className={styles.emptyButton}>
            <Plus className={styles.emptyButtonIcon} />
            <span>Thêm sản phẩm đầu tiên</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headRow}>
              <th className={styles.th}>Ảnh</th>
              <th className={styles.th}>Tên sản phẩm</th>
              <th className={styles.th}>Thương hiệu</th>
              <th className={styles.th}>Danh mục</th>
              <th className={styles.th}>Giá gốc</th>
              <th className={styles.th}>Tồn kho</th>
              <th className={styles.th}>Trạng thái</th>
              <th className={`${styles.th} ${styles.thRight}`}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow key={product.id} product={product} onViewVariants={onViewVariants} onEdit={onEdit} onArchive={onArchive} />
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span className={styles.paginationInfo}>
          Trang {currentPage}/{totalPages} • {totalProducts} sản phẩm
        </span>

        <div className={styles.paginationControls}>
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className={styles.pageButton}
          >
            <ChevronLeft className={styles.pageIcon} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className={styles.pageButton}
          >
            <ChevronRight className={styles.pageIcon} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;