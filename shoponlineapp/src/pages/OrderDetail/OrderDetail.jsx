import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, XCircle, PackageCheck, CheckCircle2, Package, ChevronRight } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import Navbar from '../../components/Navbar/Navbar';
import StaffLayout from '../../components/StaffLayout/StaffLayout';
import OrderInfoCard from '../../components/OrderInfoCard/OrderInfoCard';
import OrderItemsCard from '../../components/OrderItemsCard/OrderItemsCard';
import OrderStatusTimeline from '../../components/OrderStatusTimeline/OrderStatusTimeline';
import PaymentSummaryCard from '../../components/PaymentSummaryCard/PaymentSummaryCard';
import CancelOrderDialogs from '../../components/CancelOrderDialogs/CancelOrderDialogs';
import ConfirmOrderDialog from '../../components/ConfirmOrderDialog/ConfirmOrderDialog';
import CompleteDeliveryModal from '../../components/CompleteDeliveryModal/CompleteDeliveryModal';
import RefundPendingCard from '../../components/RefundPendingCard/RefundPendingCard';
import styles from './OrderDetail.module.css';

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data)) return data[0] || fallback;
  if (data.error) return Array.isArray(data.error) ? data.error[0] : data.error;
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
  return fallback;
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  const isShipperView = location.pathname.startsWith('/shipper');

  const [currentUser, setCurrentUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  useEffect(() => {
    authApis
      .get(endpoints['current-user'])
      .then((res) => setCurrentUser(res.data))
      .catch((err) => console.error('Không lấy được thông tin người dùng:', err));
  }, []);

  const fetchOrder = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await authApis.get(endpoints['order-detail'](id));
      setOrder(data);
    } catch (err) {
      console.error('Không tải được chi tiết đơn hàng:', err);
      setLoadError(extractApiError(err, 'Không tải được chi tiết đơn hàng.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleConfirmCancel = async (orderId, reason) => {
    try {
      const { data } = await authApis.patch(endpoints['order-detail'](orderId), {
        status: 'CANCELLED',
        cancel_reason: reason,
      });
      setOrder((prev) => ({ ...prev, ...data }));
    } catch (err) {
      throw new Error(extractApiError(err, 'Không thể huỷ đơn hàng.'));
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      const { data } = await authApis.patch(endpoints['order-detail'](orderId), { status: 'PACKING' });
      setOrder((prev) => ({ ...prev, ...data }));
    } catch (err) {
      throw new Error(extractApiError(err, 'Xác nhận đơn hàng thất bại.'));
    }
  };

  const handleStartShipping = async () => {
    try {
      const { data } = await authApis.patch(endpoints['order-detail'](order.id), { status: 'SHIPPING' });
      setOrder((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Nhận đơn thất bại:', err);
    }
  };

  const handleCompleteDelivery = async (orderId) => {
    try {
      const { data } = await authApis.patch(endpoints['order-detail'](orderId), { status: 'DELIVERED' });
      setOrder((prev) => ({ ...prev, ...data }));
    } catch (err) {
      throw new Error(extractApiError(err, 'Xác nhận giao hàng thất bại.'));
    }
  };

  const backListPath = isAdminView ? '/admin/orders' : isShipperView ? '/shipper/deliveries' : '/orders';
  const Wrapper =
    isAdminView || isShipperView
      ? ({ children }) => (
          <StaffLayout activePage={isShipperView ? 'deliveries' : 'orders'} currentUser={currentUser}>
            {children}
          </StaffLayout>
        )
      : ({ children }) => (
          <>
            <Navbar activePage="orders" currentUser={currentUser} onOpenLogoutModal={() => {}} onOpenAIStylist={() => {}} />
            {children}
          </>
        );

  if (isLoading) {
    return (
      <Wrapper>
        <main className={styles.page}>
          <div className={styles.loadingBar} />
          <div className={styles.loadingInfo} />
          <div className={styles.loadingGrid}>
            <div className={styles.loadingColumn}>
              <div className={styles.loadingCard} />
              <div className={styles.loadingCard} />
            </div>
            <div className={styles.loadingColumn}>
              <div className={styles.loadingSummary} />
            </div>
          </div>
        </main>
      </Wrapper>
    );
  }

  if (loadError || !order) {
    return (
      <Wrapper>
        <main className={styles.notFound}>
          <div className={styles.notFoundIconBox}>
            <Package className={styles.notFoundIcon} />
          </div>
          <h2 className={styles.notFoundTitle}>Không tìm thấy đơn hàng</h2>
          <p className={styles.notFoundText}>{loadError || 'Đơn hàng không tồn tại hoặc bạn không có quyền xem.'}</p>
          <button type="button" onClick={() => navigate(backListPath)} className={styles.notFoundButton}>
            Về danh sách đơn hàng
          </button>
        </main>
      </Wrapper>
    );
  }

  const isPending = order.status === 'PENDING';
  const showAdminConfirm = isAdminView && isPending;
  const showAdminOrCustomerCancel = !isShipperView && isPending;
  const showShipperStart = isShipperView && order.status === 'PACKING';
  const showShipperComplete = isShipperView && order.status === 'SHIPPING';
  const showShipperCancel = isShipperView && order.status === 'SHIPPING';

  return (
    <Wrapper>
      <main id="order-detail-page" className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              {!isAdminView && !isShipperView && (
                <>
                  <button type="button" onClick={() => navigate('/products')} className={styles.breadcrumbLink}>
                    Trang chủ
                  </button>
                  <ChevronRight className={styles.breadcrumbArrow} />
                </>
              )}
              <button type="button" onClick={() => navigate(backListPath)} className={styles.breadcrumbLink}>
                Đơn hàng
              </button>
              <ChevronRight className={styles.breadcrumbArrow} />
              <span className={styles.breadcrumbCurrent}>#{order.code}</span>
            </nav>

            <button type="button" onClick={() => navigate(backListPath)} className={styles.backLink}>
              <ArrowLeft className={styles.backIcon} />
              <span>Danh sách đơn hàng</span>
            </button>
          </div>

          <div className={styles.headerActions}>
            {showAdminConfirm && (
              <button type="button" id="order-detail-confirm-btn" onClick={() => setIsConfirmModalOpen(true)} className={styles.confirmButton}>
                <PackageCheck className={styles.confirmIcon} />
                <span>Xác nhận đơn</span>
              </button>
            )}

            {showShipperStart && (
              <button type="button" id="order-detail-start-shipping-btn" onClick={handleStartShipping} className={styles.confirmButton}>
                <PackageCheck className={styles.confirmIcon} />
                <span>Nhận đơn & bắt đầu giao</span>
              </button>
            )}

            {showShipperComplete && (
              <button type="button" id="order-detail-complete-btn" onClick={() => setIsCompleteModalOpen(true)} className={styles.completeButton}>
                <CheckCircle2 className={styles.confirmIcon} />
                <span>Giao thành công</span>
              </button>
            )}

            {(showAdminOrCustomerCancel || showShipperCancel) && (
              <button type="button" id="order-detail-cancel-btn" onClick={() => setIsCancelModalOpen(true)} className={styles.cancelButton}>
                <XCircle className={styles.cancelIcon} />
                <span>Huỷ đơn hàng</span>
              </button>
            )}

            {/* "Tiếp tục mua sắm" CHỈ dành cho khách hàng */}
            {!isAdminView && !isShipperView && (
              <button type="button" onClick={() => navigate('/products')} className={styles.continueButton}>
                <ShoppingBag className={styles.continueIcon} />
                <span>Tiếp tục mua sắm</span>
              </button>
            )}
          </div>
        </div>

        {isAdminView && <RefundPendingCard payment={order.payment} />}

        <OrderInfoCard order={order} />

        <div className={styles.grid}>
          <div className={styles.leftColumn}>
            <OrderItemsCard items={order.items || []} />
            <OrderStatusTimeline order={order} />
          </div>

          <div className={styles.rightColumn}>
            <PaymentSummaryCard order={order} />
          </div>
        </div>
      </main>

      <CancelOrderDialogs
        isOpen={isCancelModalOpen}
        order={order}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirmCancel={handleConfirmCancel}
      />

      {isAdminView && (
        <ConfirmOrderDialog
          isOpen={isConfirmModalOpen}
          order={order}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmOrder}
        />
      )}

      {isShipperView && (
        <CompleteDeliveryModal
          isOpen={isCompleteModalOpen}
          order={order}
          onClose={() => setIsCompleteModalOpen(false)}
          onConfirm={handleCompleteDelivery}
        />
      )}
    </Wrapper>
  );
}