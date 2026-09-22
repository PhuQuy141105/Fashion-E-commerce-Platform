import { Truck, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from './ShipperPendingCard.module.css';

export const ShipperPendingCard = ({ shippers, selectedShipperId, onSelectShipper, isLoading }) => {
  if (isLoading) {
    return (
      <div className={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  if (shippers.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Truck className={styles.emptyIcon} />
        <p>Chưa có shipper nào trong hệ thống.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Truck className={styles.headerIcon} />
        <h2 className={styles.headerTitle}>Chọn shipper để đối soát</h2>
        <span className={styles.countTag}>{shippers.length} shipper</span>
      </div>

      <div className={styles.grid}>
        {shippers.map((shipper) => {
          const isSelected = selectedShipperId === shipper.id;
          const displayName = shipper.full_name?.trim() || shipper.username || 'Shipper';

          return (
            <div
              key={shipper.id}
              id={`shipper-card-${shipper.id}`}
              onClick={() => onSelectShipper(shipper.id)}
              className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
            >
              <div>
                <div className={styles.cardTopRow}>
                  <div className={styles.avatarRow}>
                    {shipper.avatar ? (
                      <img src={shipper.avatar} alt={displayName} referrerPolicy="no-referrer" className={styles.avatar} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>{displayName.charAt(0).toUpperCase()}</div>
                    )}
                    <div className={styles.nameBlock}>
                      <h3 className={styles.name}>{displayName}</h3>
                      <p className={styles.phone}>{shipper.phone || '—'}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className={styles.selectedBadge}>
                      <CheckCircle2 className={styles.selectedBadgeIcon} />
                    </span>
                  )}
                </div>

                <div className={styles.metrics}>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Đơn chờ đối soát</span>
                    <span className={styles.metricValue}>{shipper.pendingOrdersCount} đơn</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Số tiền chờ</span>
                    <span className={styles.metricValueBig}>{Number(shipper.pendingCODAmount).toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>
              </div>

              <div className={styles.footer}>
                <span className={styles.settledText}>{shipper.completedRemittancesCount ?? 0} lượt đã đối soát</span>

                <button
                  type="button"
                  id={`shipper-select-btn-${shipper.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectShipper(shipper.id);
                  }}
                  className={styles.viewButton}
                >
                  <span>Xem đơn chờ</span>
                  <ArrowRight className={styles.viewButtonIcon} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShipperPendingCard;