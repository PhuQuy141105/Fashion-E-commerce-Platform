import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Truck } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import StaffLayout from '../../components/StaffLayout/StaffLayout';
import OrderStatusCard, { STATUS_CONFIGS } from '../../components/OrderStatusCard/OrderStatusCard';
import OrderFiltersBar from '../../components/OrderFiltersBar/OrderFiltersBar';
import DeliveryCard from '../../components/DeliveryCard/DeliveryCard';
import CompleteDeliveryModal from '../../components/CompleteDeliveryModal/CompleteDeliveryModal';
import CancelOrderDialogs from '../../components/CancelOrderDialogs/CancelOrderDialogs';
import styles from './Delivery.module.css';
const STATUS_KEYS = ['PENDING', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
const DEFAULT_FILTERS = { orderCode: '', paymentMethod: 'ALL' };

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data)) return data[0] || fallback;
  if (data.error) return Array.isArray(data.error) ? data.error[0] : data.error;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
  return fallback;
}

export default function Delivery() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [banner, setBanner] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [completeTarget, setCompleteTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  useEffect(() => {
    authApis.get(endpoints['current-user']).then((res) => setCurrentUser(res.data)).catch(() => {});
  }, []);

  const fetchOrders = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setLoadError(null);
      try {
        const params = {};
        if (filters.orderCode.trim()) params.order_code = filters.orderCode.trim();
        if (filters.paymentMethod !== 'ALL') params.payment_method = filters.paymentMethod;
        if (statusFilter !== 'ALL') params.status = statusFilter;

        const { data } = await authApis.get(endpoints['orders'], { params });
        setOrders(data.results ?? data);
        if (isManualRefresh) showBanner('success', 'Đã làm mới danh sách đơn giao.');
      } catch (err) {
        console.error('Không tải được danh sách đơn hàng:', err);
        setLoadError(extractApiError(err, 'Không tải được danh sách đơn hàng.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters, statusFilter]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const statusCounts = useMemo(() => {
    const counts = { PENDING: 0, PACKING: 0, SHIPPING: 0, DELIVERED: 0, CANCELLED: 0 };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status] += 1;
    });
    return counts;
  }, [orders]);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleStatusCardClick = (key) => setStatusFilter((prev) => (prev === key ? 'ALL' : key));

  const handleStartShipping = async (order) => {
    try {
      await authApis.patch(endpoints['order-detail'](order.id), { status: 'SHIPPING' });
      showBanner('success', `Đã nhận đơn #${order.code}, bắt đầu giao hàng.`);
      fetchOrders();
    } catch (err) {
      showBanner('error', extractApiError(err, 'Không thể nhận đơn.'));
    }
  };

  const handleConfirmComplete = async (orderId) => {
    try {
      await authApis.patch(endpoints['order-detail'](orderId), { status: 'DELIVERED' });
      showBanner('success', 'Đã xác nhận giao hàng thành công.');
      fetchOrders();
    } catch (err) {
      throw new Error(extractApiError(err, 'Xác nhận giao hàng thất bại.'));
    }
  };

  const handleConfirmCancel = async (orderId, reason) => {
    try {
      await authApis.patch(endpoints['order-detail'](orderId), { status: 'CANCELLED', cancel_reason: reason });
      showBanner('success', 'Đã huỷ đơn hàng theo yêu cầu khách.');
      fetchOrders();
    } catch (err) {
      throw new Error(extractApiError(err, 'Huỷ đơn hàng thất bại.'));
    }
  };

  return (
    <StaffLayout activePage="deliveries" currentUser={currentUser}>
      <main id="shipper-deliveries-page" className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Đơn hàng giao</h1>
            <p className={styles.subtitle}>Danh sách đơn hàng được phân công cho bạn.</p>
          </div>

          <button type="button" onClick={() => fetchOrders(true)} disabled={isRefreshing} className={styles.refreshButton}>
            <RefreshCw className={`${styles.refreshIcon} ${isRefreshing ? styles.spinning : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {banner && <div className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>{banner.message}</div>}

        <div className={styles.statusGrid}>
          {STATUS_KEYS.map((key) => (
            <OrderStatusCard
              key={key}
              config={STATUS_CONFIGS[key]}
              count={statusCounts[key]}
              isActive={statusFilter === key}
              onClick={() => handleStatusCardClick(key)}
            />
          ))}
        </div>

        <OrderFiltersBar
          filters={{ ...filters, recipientName: '', status: 'ALL' }}
          fields={['orderCode', 'paymentMethod']}
          onApplyFilters={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
          onResetFilters={() => setFilters(DEFAULT_FILTERS)}
        />

        {loadError ? (
          <div className={styles.errorState}>
            <p>{loadError}</p>
            <button type="button" onClick={() => fetchOrders()} className={styles.retryButton}>
              Thử lại
            </button>
          </div>
        ) : isLoading ? (
          <div className={styles.loadingState}>Đang tải danh sách đơn hàng...</div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconBox}>
              <Truck className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>Không có đơn hàng nào</h3>
            <p className={styles.emptyText}>Không có đơn nào khớp bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {orders.map((order) => (
              <DeliveryCard
                key={order.id}
                order={order}
                onSelect={(o) => navigate(`/shipper/deliveries/${o.id}`)}
                onStartShipping={handleStartShipping}
                onCompleteDelivery={setCompleteTarget}
                onCancelOrder={setCancelTarget}   
              />
            ))}
          </div>
        )}
      </main>

      <CompleteDeliveryModal isOpen={Boolean(completeTarget)} order={completeTarget} onClose={() => setCompleteTarget(null)} onConfirm={handleConfirmComplete} />
      <CancelOrderDialogs
        isOpen={Boolean(cancelTarget)}
        order={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirmCancel={handleConfirmCancel}
      />
    </StaffLayout>
  );
}