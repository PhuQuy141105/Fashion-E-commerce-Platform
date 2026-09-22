import { Clock, Banknote, CalendarCheck, TrendingUp } from 'lucide-react';
import styles from './CODStatisticCards.module.css';

export const CODStatisticCards = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'pending-cod-orders',
      label: 'Đơn chờ đối soát',
      value: `${stats.pendingOrders} đơn`,
      subtext: 'Đang giữ bởi shipper',
      icon: Clock,
      tone: 'amber',
    },
    {
      id: 'pending-cod-amount',
      label: 'Tiền COD chờ đối soát',
      value: `${Number(stats.pendingAmount).toLocaleString('vi-VN')} VNĐ`,
      subtext: 'Tổng tất cả shipper',
      icon: Banknote,
      tone: 'accent',
    },
    {
      id: 'remitted-today',
      label: 'Đã đối soát hôm nay',
      value: `${Number(stats.remittedToday).toLocaleString('vi-VN')} VNĐ`,
      subtext: 'Tính theo ngày hiện tại',
      icon: CalendarCheck,
      tone: 'emerald',
    },
    {
      id: 'remitted-month',
      label: 'Đã đối soát tháng này',
      value: `${Number(stats.remittedThisMonth).toLocaleString('vi-VN')} VNĐ`,
      subtext: 'Tổng trong tháng',
      icon: TrendingUp,
      tone: 'neutral',
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.id} id={`cod-stat-card-${card.id}`} className={styles.card}>
            <div className={styles.topRow}>
              <div className={`${styles.iconBox} ${styles[`tone_${card.tone}`]}`}>
                <Icon className={styles.icon} />
              </div>
            </div>

            <div style={{ textAlign: "justify" }}>
              <p className={styles.label}>{card.label}</p>
              <h3 className={styles.value}>{card.value}</h3>
              <p className={styles.subtext}>{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CODStatisticCards;