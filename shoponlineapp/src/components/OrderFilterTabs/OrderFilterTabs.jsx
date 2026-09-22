import { Layers } from 'lucide-react';
import styles from './OrderFilterTabs.module.css';

const TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'PACKING', label: 'Đóng gói' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'CANCELLED', label: 'Đã huỷ' },
];

export const OrderFilterTabs = ({ currentFilter, onSelectFilter, statusCounts }) => {
  return (
    <div id="order-filter-tabs-container" className={styles.wrapper} role="tablist" aria-label="Lọc theo trạng thái đơn hàng">
      {TABS.map((tab) => {
        const isActive = currentFilter === tab.key;
        const count = statusCounts[tab.key] || 0;
        return (
          <button
            key={tab.key}
            id={`filter-tab-${tab.key.toLowerCase()}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectFilter(tab.key)}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            {tab.key === 'ALL' && <Layers className={styles.allIcon} />}
            <span>{tab.label}</span>
            <span className={`${styles.count} ${isActive ? styles.countActive : ''}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default OrderFilterTabs;