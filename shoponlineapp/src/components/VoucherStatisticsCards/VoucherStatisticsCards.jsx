import { Ticket, CheckCircle2, Clock } from "lucide-react";
import styles from "./VoucherStatisticsCards.module.css";

export const VoucherStatisticsCards = ({
  vouchers,
  selectedStatus,
  onSelectStatus,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className={styles.grid}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  const total = vouchers.length;
  const valid = vouchers.filter((v) => v.is_valid).length;
  const expired = total - valid;

  const cards = [
    {
      id: "ALL",
      label: "Tổng voucher",
      value: total,
      icon: Ticket,
      tone: "neutral",
    },
    {
      id: "VALID",
      label: "Còn hạn",
      value: valid,
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      id: "EXPIRED",
      label: "Hết hạn",
      value: expired,
      icon: Clock,
      tone: "rose",
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedStatus === card.id;
        return (
          <button
            key={card.id}
            type="button"
            id={`voucher-stat-card-${card.id.toLowerCase()}`}
            onClick={() => onSelectStatus(card.id)}
            className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
          >
            <div className={styles.topRow}>
              <div
                className={`${styles.iconBox} ${styles[`tone_${card.tone}`]}`}
              >
                <Icon className={styles.icon} />
              </div>
              <div>
                <span className={styles.label}>{card.label}</span>
                <h3 className={styles.value}>{card.value}</h3>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default VoucherStatisticsCards;
