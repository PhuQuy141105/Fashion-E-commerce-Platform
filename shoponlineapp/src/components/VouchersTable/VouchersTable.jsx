import { Edit3, Trash2, Percent, DollarSign, SearchX, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import VoucherStatusBadge from '../VoucherStatusBadge/VoucherStatusBadge';
import styles from './VouchersTable.module.css';

export const VouchersTable = ({ vouchers, isLoading, currentPage, pageSize, onPageChange, onEdit, onDelete, onCreateNew, onResetFilters }) => {
  const totalPages = Math.max(1, Math.ceil(vouchers.length / pageSize));
  const pageItems = vouchers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return (
      <div className={styles.stateCard}>
        <Loader2 className={styles.loadingIcon} />
        <p>Đang tải danh sách voucher...</p>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className={styles.stateCard}>
        <div className={styles.emptyIconBox}>
          <SearchX className={styles.emptyIcon} />
        </div>
        <h3 className={styles.emptyTitle}>Không tìm thấy voucher nào</h3>
        <p className={styles.emptyText}>Không có voucher nào khớp bộ lọc hiện tại.</p>
        <div className={styles.emptyActions}>
          <button type="button" onClick={onResetFilters} className={styles.resetButton}>
            Xoá bộ lọc
          </button>
          <button type="button" onClick={onCreateNew} className={styles.createButton}>
            <Plus className={styles.createIcon} />
            <span>Tạo voucher mới</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headRow}>
              <th className={styles.th}>Mã voucher</th>
              <th className={styles.th}>Loại giảm giá</th>
              <th className={styles.th}>Điều kiện</th>
              <th className={`${styles.th} ${styles.thCenter}`}>Đã dùng</th>
              <th className={styles.th}>Thời hạn</th>
              <th className={`${styles.th} ${styles.thCenter}`}>Trạng thái</th>
              <th className={`${styles.th} ${styles.thRight}`}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((v) => (
              <tr key={v.id} className={styles.row}>
                <td className={styles.cell}>
                  <span className={styles.code}>{v.code}</span>
                  {v.description && <span className={styles.description}>{v.description}</span>}
                </td>

                <td className={styles.cell}>
                  <div className={styles.discountRow}>
                    
                    <span className={styles.discountValue}>
                      {v.discount_type === 'PERCENT' ? `${Number(v.discount_value)}%` : `${Number(v.discount_value).toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                  {v.max_discount_amount && <span className={styles.maxDiscount}>Tối đa {Number(v.max_discount_amount).toLocaleString('vi-VN')}đ</span>}
                </td>

                <td className={styles.cell}>
                  <span className={styles.minOrder}>
                    Đơn tối thiểu {Number(v.min_order_value).toLocaleString('vi-VN')}đ
                  </span>
                </td>

                <td className={`${styles.cell} ${styles.cellCenter}`}>
                  <span className={styles.usageTag}>
                    {v.used_count}/{v.usage_limit}
                  </span>
                </td>

                <td className={styles.cell}>
                  <span className={styles.dateText}>{new Date(v.start_date).toLocaleDateString('vi-VN')}</span>
                  <span className={styles.dateArrow}>→</span>
                  <span className={styles.dateText}>{new Date(v.end_date).toLocaleDateString('vi-VN')}</span>
                </td>

                <td className={`${styles.cell} ${styles.cellCenter}`}>
                  <VoucherStatusBadge voucher={v} size="sm" />
                </td>

                <td className={`${styles.cell} ${styles.cellRight}`}>
                  <div className={styles.actionsRow}>
                    <button type="button" id={`voucher-edit-btn-${v.id}`} onClick={() => onEdit(v)} className={styles.actionButton} title="Sửa voucher">
                      <Edit3 className={styles.actionIcon} />
                    </button>
                    <button
                      type="button"
                      id={`voucher-delete-btn-${v.id}`}
                      onClick={() => onDelete(v)}
                      className={`${styles.actionButton} ${styles.actionButtonRose}`}
                      title="Xoá voucher"
                    >
                      <Trash2 className={styles.actionIcon} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span className={styles.paginationInfo}>
          Trang {currentPage}/{totalPages} • {vouchers.length} voucher
        </span>
        <div className={styles.paginationControls}>
          <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className={styles.pageButton}>
            <ChevronLeft className={styles.pageIcon} />
          </button>
          <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className={styles.pageButton}>
            <ChevronRight className={styles.pageIcon} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VouchersTable;