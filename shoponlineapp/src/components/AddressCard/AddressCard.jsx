import { useState } from "react";
import { MapPin, Phone, Check, Edit3, Trash2, Star, Copy } from "lucide-react";
import { motion } from "motion/react";
import styles from "./AddressCard.module.css";
export const AddressCard = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isOnlyAddress = false,
  selectable = false,
  isSelected = false,
  onSelect,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullText = `${address.recipient_name}\n${address.recipient_phone}\n${address.detail_address}, ${address.ward}, ${address.district}, ${address.province}`;
    navigator.clipboard?.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      id={`address-card-${address.id}`}
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      onClick={selectable ? () => onSelect?.(address) : undefined}
      role={selectable ? "radio" : undefined}
      aria-checked={selectable ? isSelected : undefined}
      className={`${styles.card} ${address.is_default ? styles.cardDefault : ""} ${
        selectable ? styles.cardSelectable : ""
      } ${selectable && isSelected ? styles.cardSelected : ""}`}
    >
      <div>
        <div className={styles.topRow}>
          <div className={styles.badgeGroup}>
            {address.is_default && (
              <span
                id={`default-badge-${address.id}`}
                className={styles.defaultBadge}
              >
                <Star className={styles.defaultBadgeIcon} />
                ĐỊA CHỈ MẶC ĐỊNH
              </span>
            )}
          </div>

          {selectable ? (
            <div
              className={`${styles.selectRadio} ${isSelected ? styles.selectRadioActive : ""}`}
            >
              {isSelected && <Check className={styles.selectRadioIcon} />}
            </div>
          ) : (
            <button
              id={`copy-address-btn-${address.id}`}
              type="button"
              onClick={handleCopy}
              title="Sao chép địa chỉ"
              className={styles.copyButton}
            >
              {copied ? (
                <span className={styles.copiedLabel}>
                  <Check className={styles.copiedIcon} /> Đã sao chép
                </span>
              ) : (
                <Copy className={styles.copyIcon} />
              )}
            </button>
          )}
        </div>

        <h4 className={styles.recipientName}>{address.recipient_name}</h4>

        <div className={styles.phoneRow}>
          <Phone className={styles.phoneIcon} />
          <span>{address.recipient_phone}</span>
        </div>

        <div className={styles.addressBox}>
          <MapPin className={styles.addressIcon} />
          <div className={styles.addressContent}>
            <p className={styles.addressLine}>{address.detail_address}</p>
            <p className={styles.addressSubline}>
              {address.ward}, {address.district}, {address.province}
            </p>
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <div>
          {selectable ? (
            isSelected ? (
              <span className={styles.primaryLabel}>
                <Check className={styles.primaryIcon} />
                Giao đến địa chỉ này
              </span>
            ) : (
              <span className={styles.clickToSelectLabel}>Bấm để chọn</span>
            )
          ) : !address.is_default ? (
            <button
              id={`set-default-btn-${address.id}`}
              type="button"
              onClick={() => onSetDefault(address)}
              className={styles.setDefaultLink}
            >
              <Star className={styles.setDefaultIcon} />
              Đặt làm mặc định
            </button>
          ) : (
            <span className={styles.primaryLabel}>
              <Check className={styles.primaryIcon} />
              Giao hàng chính
            </span>
          )}
        </div>

        <div className={styles.actionButtons}>
          <button
            id={`edit-address-btn-${address.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(address);
            }}
            className={styles.editButton}
          >
            <Edit3 className={styles.editIcon} />
            Sửa
          </button>

          {!selectable && (
            <button
              id={`delete-address-btn-${address.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(address);
              }}
              disabled={isOnlyAddress}
              title={
                isOnlyAddress
                  ? "Bạn phải giữ lại ít nhất 1 địa chỉ giao hàng"
                  : "Xoá địa chỉ này"
              }
              className={`${styles.deleteButton} ${isOnlyAddress ? styles.deleteButtonDisabled : ""}`}
            >
              <Trash2 className={styles.deleteIcon} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AddressCard;
