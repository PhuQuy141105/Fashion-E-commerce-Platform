import React, { useState } from 'react';
import { Search, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, FileCheck, Truck } from 'lucide-react';
import styles from './RemittanceHistoryTable.module.css';

export const RemittanceHistoryTable = ({ remittances, isLoading }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const pageSize = 8;

  const filtered = remittances.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const shipperName = (r.shipper?.full_name || r.shipper?.username || '').toLowerCase();
    return String(r.id).includes(q) || shipperName.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            id="admin-cod-history-search-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo mã đối soát hoặc tên shipper..."
            className={styles.searchInput}
          />
        </div>
        <span className={styles.totalText}>
          Tổng đã đối soát: <strong>{remittances.length}</strong>
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIconBox}>
            <FileCheck className={styles.emptyIcon} />
          </div>
          <h3 className={styles.emptyTitle}>Chưa có lịch sử đối soát nào</h3>
          <p className={styles.emptyText}>Các đợt đối soát COD đã xác nhận sẽ hiện ở đây.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.headRow}>
                  <th className={styles.th}></th>
                  <th className={styles.th}>Mã đối soát</th>
                  <th className={styles.th}>Shipper</th>
                  <th className={`${styles.th} ${styles.thCenter}`}>Số đơn</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Tổng tiền</th>
                  <th className={styles.th}>Thời gian</th>
                  <th className={`${styles.th} ${styles.thCenter}`}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => {
                  const shipperName = r.shipper?.full_name?.trim() || r.shipper?.username || 'Shipper';
                  const isExpanded = expandedId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr onClick={() => setExpandedId(isExpanded ? null : r.id)} className={styles.row}>
                        <td className={styles.cellExpand}>
                          <ChevronDown className={`${styles.expandIcon} ${isExpanded ? styles.expandIconOpen : ''}`} />
                        </td>
                        <td className={styles.cell}>
                          <span className={styles.remittanceCode}>#{r.id}</span>
                          {r.confirmed_by && <span className={styles.confirmedBy}>Bởi {r.confirmed_by.full_name || r.confirmed_by.username}</span>}
                        </td>
                        <td className={styles.cell}>
                          <div className={styles.shipperCell}>
                            {r.shipper?.avatar ? (
                              <img src={r.shipper.avatar} alt={shipperName} referrerPolicy="no-referrer" className={styles.shipperAvatar} />
                            ) : (
                              <div className={styles.shipperAvatarPlaceholder}>
                                <Truck className={styles.shipperAvatarIcon} />
                              </div>
                            )}
                            <div>
                              <p className={styles.shipperName}>{shipperName}</p>
                              {r.shipper?.phone && <p className={styles.shipperPhone}>{r.shipper.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className={`${styles.cell} ${styles.cellCenter}`}>
                          <span className={styles.orderCountTag}>{r.items?.length ?? 0} đơn</span>
                        </td>
                        <td className={`${styles.cell} ${styles.cellRight}`}>
                          <span className={styles.amount}>{Number(r.total_amount).toLocaleString('vi-VN')} VNĐ</span>
                        </td>
                        <td className={styles.cell}>
                          <span className={styles.dateText}>{new Date(r.remitted_at).toLocaleString('vi-VN')}</span>
                        </td>
                        <td className={`${styles.cell} ${styles.cellCenter}`}>
                          <span className={styles.statusBadge}>
                            <CheckCircle2 className={styles.statusIcon} />
                            Hoàn tất
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className={styles.expandRow}>
                          <td colSpan={7} className={styles.expandCell}>
                            <div className={styles.expandContent}>
                              {r.note && (
                                <p className={styles.noteText}>
                                  <strong>Ghi chú:</strong> {r.note}
                                </p>
                              )}
                              <div className={styles.itemsList}>
                                {(r.items || []).map((item) => (
                                  <div key={item.order_id} className={styles.itemRow}>
                                    <span className={styles.itemCode}>#{item.order_code}</span>
                                    <span className={styles.itemAmount}>{Number(item.amount).toLocaleString('vi-VN')} VNĐ</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
              <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className={styles.pageButton}>
                <ChevronLeft className={styles.pageIcon} />
              </button>
              <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className={styles.pageButton}>
                <ChevronRight className={styles.pageIcon} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemittanceHistoryTable;