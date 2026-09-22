import { useState } from 'react';
import { ShieldCheck, CreditCard } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import { PaymentCheckingCard } from '../PaymentCheckingCard/PaymentCheckingCard';
import { PaymentFailedCard } from '../PaymentFailedCard/PaymentFailedCard';
import { PaymentSuccessModal } from '../PaymentSuccessModal/PaymentSuccessModal';
import styles from './PayOSEmbedSection.module.css';

export const PayOSEmbedSection = ({ order, payment: initialPayment, onBackToCheckout }) => {
  const [payment, setPayment] = useState(initialPayment);
  const [checkStatus, setCheckStatus] = useState('idle'); 
  const [errorMessage, setErrorMessage] = useState(null);

  const handleCheckStatus = async () => {
    setCheckStatus('checking');
    setErrorMessage(null);
    try {
      const { data } = await authApis.get(endpoints['payment-check-status'](payment.id));
      setPayment(data);
      if (data.status === 'PAID') {
        setCheckStatus('success');
      } else if (data.status === 'PENDING') {
        setCheckStatus('pending');
      } else {
        setCheckStatus('failed');
      }
    } catch (err) {
      console.error('Kiểm tra trạng thái thanh toán thất bại:', err);
      setErrorMessage(err.response?.data?.error || 'Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại.');
      setCheckStatus('failed');
    }
  };

  if (checkStatus === 'checking') return <PaymentCheckingCard />;

  if (checkStatus === 'success') return <PaymentSuccessModal order={order} payment={payment} />;

  if (checkStatus === 'pending' || checkStatus === 'failed') {
    return (
      <PaymentFailedCard
        status={checkStatus === 'pending' ? 'PENDING' : 'FAILED'}
        errorMessage={errorMessage}
        onCheckAgain={handleCheckStatus}
        onBackToCheckout={() => {
          setCheckStatus('idle');
          onBackToCheckout?.();
        }}
      />
    );
  }

  return (
    <div id="payos-embed-section" className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <CreditCard className={styles.headerIcon} />
          <div>
            <h2 className={styles.title}>Thanh toán qua PayOS</h2>
            <p className={styles.subtitle}>Đơn hàng #{order?.code}</p>
          </div>
        </div>
        <span className={styles.amount}>{Number(payment?.amount ?? order?.total_amount ?? 0).toLocaleString('vi-VN')} VNĐ</span>
      </div>

      <div className={styles.iframeWrapper}>
        <iframe
          id="payos-checkout-iframe"
          src={payment?.checkout_url}
          title="PayOS Checkout"
          className={styles.iframe}
        />
      </div>

      <div className={styles.secureNote}>
        <ShieldCheck className={styles.secureIcon} />
        <span>Thanh toán được xử lý an toàn bởi PayOS. Sau khi hoàn tất, bấm nút bên dưới để xác nhận.</span>
      </div>

      <button type="button" id="payos-i-have-paid-btn" onClick={handleCheckStatus} className={styles.confirmButton}>
        Tôi đã thanh toán
      </button>

      <button type="button" onClick={onBackToCheckout} className={styles.backLink}>
        Quay lại chỉnh sửa đơn hàng
      </button>
    </div>
  );
};

export default PayOSEmbedSection;