import React from 'react';
import { Eye, PackageCheck, XCircle, CreditCard, Banknote, SearchX, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import OrderStatusBadge from '../OrderStatusBadge/OrderStatusBadge';
import PaymentStatusBadge from '../PaymentStatusBadge/PaymentStatusBadge';
import styles from './OrdersTable.module.css';

export const OrdersTable = ({
  orders,
  isLoading,
  currentPage,
  pageSize,
  onPageChange,
  onViewOrder,
  onConfirmOrder,
  onCancelOrder,
  onResetFilters,
}) => {
  const totalCount = orders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageItems = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return (
      <div className={styles.stateCard}>
        <Loader2 className={styles.loadingIcon} />
        <p>Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.stateCard}>
        <div className={styles.emptyIconBox}>
          <SearchX className={styles.emptyIcon} />
        </div>
        <h3 className={styles.emptyTitle}>Không tìm thấy đơn hàng nào</h3>
        <p className={styles.emptyText}>Không có đơn hàng nào khớp bộ lọc hiện tại.</p>
        <button type="button" onClick={onResetFilters} className={styles.resetButton}>
          Xoá bộ lọc
        </button>
      </div>
    );
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headRow}>
              <th className={styles.th}>Mã đơn</th>
              <th className={styles.th}>Người nhận</th>
              <th className={styles.th}>Ngày đặt</th>
              <th className={styles.th}>Tổng tiền</th>
              <th className={styles.th}>Thanh toán</th>
              <th className={styles.th}>Trạng thái TT</th>
              <th className={styles.th}>Trạng thái đơn</th>
              <th className={`${styles.th} ${styles.thRight}`}>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.map((order) => {
              const isPending = order.status === 'PENDING';
              const formattedDate = new Date(order.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

              return (
                <tr key={order.id} className={styles.row}>
                  <td className={styles.cell}>
                    <button type="button" onClick={() => onViewOrder(order.id)} className={styles.codeButton}>
                      #{order.code}
                    </button>
                  </td>

                  <td className={styles.cell}>
                    <div className={styles.recipientName}>{order.recipient_name}</div>
                    <div className={styles.recipientPhone}>{order.recipient_phone}</div>
                  </td>

                  <td className={styles.cell}>
                    <span className={styles.dateText}>{formattedDate}</span>
                  </td>

                  <td className={styles.cell}>
                    <div className={styles.totalAmount}>{Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</div>
                    <div className={styles.itemCount}>{order.item_count ?? 0} sản phẩm</div>
                  </td>

                  <td className={styles.cell}>
                    <div className={styles.paymentMethodRow}>
                      {order.payment_method === 'COD' ? <Banknote className={styles.paymentMethodIconCod} /> : <CreditCard className={styles.paymentMethodIconPayos} />}
                      <span>{order.payment_method === 'COD' ? 'COD' : 'PayOS'}</span>
                    </div>
                  </td>

                  <td className={styles.cell}>
                    <PaymentStatusBadge paymentMethod={order.payment_method} payment={order.payment} size="sm" />
                  </td>

                  <td className={styles.cell}>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </td>

                  <td className={`${styles.cell} ${styles.cellRight}`}>
                    <div className={styles.actionsRow}>
                      <button type="button" id={`admin-order-view-${order.id}`} onClick={() => onViewOrder(order.id)} className={styles.actionButton} title="Xem chi tiết">
                        <Eye className={styles.actionIcon} />
                      </button>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            id={`admin-order-confirm-${order.id}`}
                            onClick={() => onConfirmOrder(order)}
                            className={`${styles.actionButton} ${styles.actionButtonIndigo}`}
                            title="Xác nhận đơn (chuyển sang đóng gói)"
                          >
                            <PackageCheck className={styles.actionIcon} />
                          </button>

                          <button
                            type="button"
                            id={`admin-order-cancel-${order.id}`}
                            onClick={() => onCancelOrder(order)}
                            className={`${styles.actionButton} ${styles.actionButtonRose}`}
                            title="Huỷ đơn"
                          >
                            <XCircle className={styles.actionIcon} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span className={styles.paginationInfo}>
          Hiện <strong>{pageItems.length}</strong> / <strong>{totalCount}</strong> đơn hàng
        </span>

        <div className={styles.paginationControls}>
          <span className={styles.pageLabel}>
            Trang {currentPage}/{totalPages}
          </span>
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

export default OrdersTable;