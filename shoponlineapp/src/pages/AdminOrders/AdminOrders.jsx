import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import StaffLayout from '../../components/StaffLayout/StaffLayout';
import OrderFiltersBar from '../../components/OrderFiltersBar/OrderFiltersBar';
import OrdersTable from '../../components/OrderStable/OrderStable';
import ConfirmOrderDialog from '../../components/ConfirmOrderDialog/ConfirmOrderDialog';
import CancelOrderDialogs from '../../components/CancelOrderDialogs/CancelOrderDialogs';
import styles from './AdminOrders.module.css';
import OrderStatusCard, { STATUS_CONFIGS } from '../../components/OrderStatusCard/OrderStatusCard';
const STATUS_KEYS = ['PENDING', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
const DEFAULT_FILTERS = { orderCode: '', recipientName: '', paymentMethod: 'ALL', status: 'ALL' };
const PAGE_SIZE = 10;

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

export default function AdminOrders() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [banner, setBanner] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmTarget, setConfirmTarget] = useState(null);
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
        if (filters.recipientName.trim()) params.recipient_name = filters.recipientName.trim();
        if (filters.paymentMethod !== 'ALL') params.payment_method = filters.paymentMethod;
        if (filters.status !== 'ALL') params.status = filters.status;

        const { data } = await authApis.get(endpoints['orders'], { params });
        setOrders(data.results ?? data);
        if (isManualRefresh) showBanner('success', 'Đã làm mới danh sách đơn hàng.');
      } catch (err) {
        console.error('Không tải được danh sách đơn hàng:', err);
        setLoadError(extractApiError(err, 'Không tải được danh sách đơn hàng.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  const handleFilterChange = (partial) => setFilters((prev) => ({ ...prev, ...partial }));
  const handleReset = () => setFilters(DEFAULT_FILTERS);

  const handleStatusCardClick = (statusKey) => {
    setFilters((prev) => ({ ...prev, status: prev.status === statusKey ? 'ALL' : statusKey }));
  };


  const handleOpenCancel = async (order) => {
    try {
      const { data } = await authApis.get(endpoints['order-detail'](order.id));
      setCancelTarget(data);
    } catch (err) {
      showBanner('error', extractApiError(err, 'Không tải được chi tiết đơn hàng.'));
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await authApis.patch(endpoints['order-detail'](orderId), { status: 'PACKING' });
      showBanner('success', 'Đã xác nhận đơn hàng, chuyển sang đóng gói.');
      fetchOrders();
    } catch (err) {
      throw new Error(extractApiError(err, 'Xác nhận đơn hàng thất bại.'));
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      await authApis.patch(endpoints['order-detail'](orderId), { status: 'CANCELLED', cancel_reason: reason });
      showBanner('success', 'Đã huỷ đơn hàng.');
      fetchOrders();
    } catch (err) {
      throw new Error(extractApiError(err, 'Huỷ đơn hàng thất bại.'));
    }
  };

  return (
    <StaffLayout activePage="orders" currentUser={currentUser}>
      <main id="admin-orders-page" className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Quản lý đơn hàng</h1>
            <p className={styles.subtitle}>Xem, xác nhận và huỷ đơn hàng của khách.</p>
          </div>

          <button type="button" id="admin-refresh-orders-btn" onClick={() => fetchOrders(true)} disabled={isRefreshing} className={styles.refreshButton}>
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
              isActive={filters.status === key}
              onClick={() => handleStatusCardClick(key)}
            />
          ))}
        </div>

        <OrderFiltersBar filters={filters} onApplyFilters={handleFilterChange} onResetFilters={handleReset} />

        {loadError ? (
          <div className={styles.errorState}>
            <p>{loadError}</p>
            <button type="button" onClick={() => fetchOrders()} className={styles.retryButton}>
              Thử lại
            </button>
          </div>
        ) : (
          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            onViewOrder={(id) => navigate(`/orders/${id}`)}
            onConfirmOrder={setConfirmTarget}
            onCancelOrder={handleOpenCancel}
            onResetFilters={handleReset}
          />
        )}
      </main>

      <ConfirmOrderDialog isOpen={Boolean(confirmTarget)} order={confirmTarget} onClose={() => setConfirmTarget(null)} onConfirm={handleConfirmOrder} />

      <CancelOrderDialogs
        isOpen={Boolean(cancelTarget)}
        order={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirmCancel={handleCancelOrder}
      />
    </StaffLayout>
  );
}