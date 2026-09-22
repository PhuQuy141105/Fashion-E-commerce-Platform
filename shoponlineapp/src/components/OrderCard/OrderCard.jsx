import {
  XCircle,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  CreditCard,
  Banknote,
  ArrowRight,
} from "lucide-react";
import styles from "./OrderCard.module.css";

const STATUS_BADGE = {
  PENDING: { label: "Chờ xác nhận", className: "badgeAmber", icon: Clock },
  PACKING: { label: "Đang đóng gói", className: "badgeIndigo", icon: Package },
  SHIPPING: { label: "Đang giao", className: "badgeSky", icon: Truck },
  DELIVERED: {
    label: "Đã giao",
    className: "badgeEmerald",
    icon: CheckCircle2,
  },
  CANCELLED: { label: "Đã huỷ", className: "badgeRose", icon: XCircle },
};

const PLACEHOLDER_THUMBNAIL =
  "https://placehold.co/96x96/EFE9E3/6F6A64?text=%20";

export const OrderCard = ({ order, onViewDetails, onRequestCancel }) => {
  const isPending = order.status === "PENDING";
  const badge = STATUS_BADGE[order.status] || STATUS_BADGE.PENDING;
  const BadgeIcon = badge.icon;

  const items = order.items || [];

  const formattedDate = new Date(order.created_at).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div id={`order-card-${order.id}`} className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.code}>#{order.code}</span>
          <span className={styles.date}>Đặt ngày {formattedDate}</span>
        </div>

        <span className={`${styles.badge} ${styles[badge.className]}`}>
          <BadgeIcon className={styles.badgeIcon} />
          <span>{badge.label}</span>
        </span>
      </div>

      {items.length > 0 && (
        <div className={styles.itemsGrid}>
          {items.map((item) => (
            <div key={item.id} className={styles.itemRow}>
              <img
                src={item.thumbnail || PLACEHOLDER_THUMBNAIL}
                alt={item.product_name}
                referrerPolicy="no-referrer"
                className={styles.itemThumbnail}
              />

              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.product_name}</span>
                <span className={styles.itemMeta}>
                  {item.color} - Size {item.size} - SL: {item.quantity}
                </span>
              </div>

              <span className={styles.itemPrice}>
                {Number(item.subtotal ?? item.unit_price).toLocaleString(
                  "vi-VN",
                )}{" "}
                VNĐ
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <div className={styles.summaryRow}>
          {typeof order.item_count === "number" && (
            <div>
              <span className={styles.summaryLabel}>Số lượng</span>
              <span className={styles.summaryValue}>
                {order.item_count} sản phẩm
              </span>
            </div>
          )}

          <div>
            <span className={styles.summaryLabel}>Thanh toán</span>
            <div className={styles.paymentValue}>
              {order.payment_method === "PAYOS" ? (
                <CreditCard className={styles.paymentIcon} />
              ) : (
                <Banknote className={styles.paymentIcon} />
              )}
              <span>
                {order.payment_method === "PAYOS" ? "PayOS" : "Tiền mặt (COD)"}
              </span>
            </div>
          </div>

          <div>
            <span className={styles.summaryLabel}>Tổng tiền</span>
            <span className={styles.totalValue}>
              {Number(order.total_amount).toLocaleString("vi-VN")} VNĐ
            </span>
          </div>
        </div>
        <div className={styles.actionButtons}>
          {isPending && (
            <button
              type="button"
              id={`order-cancel-btn-${order.id}`}
              onClick={() => onRequestCancel(order)}
              className={styles.cancelButton}
            >
              <XCircle className={styles.cancelIcon} />
              <span>Huỷ đơn</span>
            </button>
          )}

          <button
            type="button"
            id={`order-view-details-btn-${order.id}`}
            onClick={() => onViewDetails(order.id)}
            className={styles.viewButton}
          >
            <span>Xem chi tiết</span>
            <ArrowRight className={styles.viewIcon} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
