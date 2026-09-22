import { Inbox, Calendar, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import styles from './PendingCODOrdersTable.module.css';

export const PendingCODOrdersTable = ({
  orders,
  selectedOrderIds = [],
  onToggleSelectOrder,
  onToggleSelectAll,
  currentPage,
  pageSize,
  onPageChange,
  isLoading,
  readOnly = false,
}) => {
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const pageOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAllSelected = orders.length > 0 && orders.every((o) => selectedOrderIds.includes(o.id));
  const isSomeSelected = orders.some((o) => selectedOrderIds.includes(o.id)) && !isAllSelected;

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonBody}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.emptyCard}>
        <div className={styles.emptyIconBox}>
          <Inbox className={styles.emptyIcon} />
        </div>
        <h3 className={styles.emptyTitle}>Không có đơn COD nào chờ đối soát</h3>
        <p className={styles.emptyText}>Shipper này đã đối soát hết các đơn đã giao.</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header} style={{justifyContent: readOnly ? 'flex-end' : ' '}}>
        {readOnly ? (
          ''
        ) : (
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              id="cod-select-all-checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomeSelected;
              }}
              onChange={onToggleSelectAll}
              className={styles.checkbox}
            />
            <span>{selectedOrderIds.length > 0 ? `Đã chọn ${selectedOrderIds.length} đơn` : 'Chọn tất cả'}</span>
          </label>
        )}

        <span className={styles.countText}>
          Hiện <strong>{pageOrders.length}</strong>/<strong>{orders.length}</strong> đơn chờ đối soát
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headRow}>
              {!readOnly && <th className={styles.thCheckbox}></th>}
              <th className={styles.th}>Mã đơn</th>
              <th className={styles.th}>Người nhận</th>
              <th className={styles.th}>Ngày giao</th>
              <th className={`${styles.th} ${styles.thRight}`}>Số tiền COD</th>
              <th className={`${styles.th} ${styles.thCenter}`}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {pageOrders.map((order) => {
              const isSelected = selectedOrderIds.includes(order.id);
              return (
                <tr key={order.id} id={`pending-order-row-${order.id}`} className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}>
                  {!readOnly && (
                    <td className={styles.cellCheckbox}>
                      <input
                        type="checkbox"
                        id={`checkbox-order-${order.id}`}
                        checked={isSelected}
                        onChange={() => onToggleSelectOrder(order.id)}
                        className={styles.checkbox}
                      />
                    </td>
                  )}

                  <td className={styles.cell}>
                    <span className={styles.orderCode}>#{order.code}</span>
                    <span className={styles.itemCount}>{order.item_count ?? 0} sản phẩm</span>
                  </td>

                  <td className={styles.cell}>
                    <span className={styles.recipientName}>{order.recipient_name}</span>
                    <span className={styles.recipientPhone}>{order.recipient_phone}</span>
                  </td>

                  <td className={styles.cell}>
                    <div className={styles.dateRow}>
                      <Calendar className={styles.dateIcon} />
                      <span>{order.delivered_at ? new Date(order.delivered_at).toLocaleDateString('vi-VN') : '—'}</span>
                    </div>
                  </td>

                  <td className={`${styles.cell} ${styles.cellRight}`}>
                    <span className={styles.amount}>{Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</span>
                  </td>

                  <td className={`${styles.cell} ${styles.cellCenter}`}>
                    <span className={styles.statusBadge}>
                      <ShieldCheck className={styles.statusIcon} />
                      Chờ bàn giao
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span className={styles.paginationInfo}>
          Trang {currentPage}/{totalPages}
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

export default PendingCODOrdersTable;