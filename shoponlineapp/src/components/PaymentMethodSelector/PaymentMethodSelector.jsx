import { Banknote, Check, ShieldCheck } from 'lucide-react';
import styles from './PaymentMethodSelector.module.css';

export const PaymentMethodSelector = ({ selectedMethod, onSelectMethod }) => {
  return (
    <section id="checkout-payment-method-section" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.stepBadge}>4</div>
          <div>
            <h2 className={styles.title}>Phương thức thanh toán</h2>
            <p className={styles.subtitle}>Chọn cách bạn muốn thanh toán đơn hàng này</p>
          </div>
        </div>

        <div className={styles.secureNote}>
          <ShieldCheck className={styles.secureIcon} />
          <span>Cổng thanh toán bảo mật</span>
        </div>
      </div>

      <div className={styles.grid}>
        <div
          id="payment-option-cod"
          onClick={() => onSelectMethod('COD')}
          className={`${styles.option} ${selectedMethod === 'COD' ? styles.optionSelected : ''}`}
        >
          <div>
            <div className={styles.optionTop}>
              <div className={styles.codIconBox}>
                <Banknote className={styles.codIcon} />
              </div>
              <div className={`${styles.radio} ${selectedMethod === 'COD' ? styles.radioActive : ''}`}>
                {selectedMethod === 'COD' && <Check className={styles.radioIcon} />}
              </div>
            </div>

            <h3 className={styles.optionTitle}>Thanh toán khi nhận hàng</h3>
            <p className={styles.optionDesc}>Thanh toán bằng tiền mặt khi nhận được đơn hàng.</p>
          </div>

          <div className={styles.optionFooter}>
            <span>Không cần trả trước</span>
          </div>
        </div>

        <div
          id="payment-option-payos"
          onClick={() => onSelectMethod('PAYOS')}
          className={`${styles.option} ${selectedMethod === 'PAYOS' ? styles.optionSelected : ''}`}
        >
          <div>
            <div className={styles.optionTop}>
              <div className={styles.payosIconBox}>
                <span className={styles.payosLogo}>
                  Pay<span className={styles.payosLogoAccent}>OS</span>
                </span>
              </div>
              <div className={`${styles.radio} ${selectedMethod === 'PAYOS' ? styles.radioActive : ''}`}>
                {selectedMethod === 'PAYOS' && <Check className={styles.radioIcon} />}
              </div>
            </div>

            <h3 className={styles.optionTitle}>PayOS</h3>
            <p className={styles.optionDesc}>Thanh toán online qua chuyển khoản / QR / thẻ.</p>
          </div>

          <div className={styles.optionFooter}>
            <span>Xác nhận ngay trong trang</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentMethodSelector;