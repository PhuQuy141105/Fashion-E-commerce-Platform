import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RotateCcw,ChevronRight } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import Navbar from '../../components/Navbar/Navbar';
import AccountSidebar from '../../components/AccountSideBar/AccountSideBar';
import OrderStatusCard, { STATUS_CONFIGS } from '../../components/OrderStatusCard/OrderStatusCard';
import OrderFilterTabs from '../../components/OrderFilterTabs/OrderFilterTabs';
import OrderCard from '../../components/OrderCard/OrderCard';
import OrderEmptyState from '../../components/OrderEmptyState/OrderEmptyState';
import CancelOrderDialogs from '../../components/CancelOrderDialogs/CancelOrderDialogs';
import styles from './OrderHistory.module.css';
const STATUS_KEYS = ['PENDING', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

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

export default function OrderHistory() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [currentFilter, setCurrentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [cancelTarget, setCancelTarget] = useState(null); 
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isLoadingCancelTarget, setIsLoadingCancelTarget] = useState(false);

  useEffect(() => {
    authApis
      .get(endpoints['current-user'])
      .then((res) => setCurrentUser(res.data))
      .catch((err) => console.error('Không lấy được thông tin người dùng:', err));
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await authApis.get(endpoints['orders']);
      setOrders(data.results ?? data);
    } catch (err) {
      console.error('Không tải được danh sách đơn hàng:', err);
      setLoadError(extractApiError(err, 'Không tải được danh sách đơn hàng.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const statusCounts = useMemo(() => {
    const counts = { ALL: orders.length, PENDING: 0, PACKING: 0, SHIPPING: 0, DELIVERED: 0, CANCELLED: 0 };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status] += 1;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (currentFilter !== 'ALL') result = result.filter((o) => o.status === currentFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((o) => o.code.toLowerCase().includes(q));
    }
    return result;
  }, [orders, currentFilter, searchQuery]);

  const handleRequestCancel = async (order) => {
    setIsLoadingCancelTarget(true);
    try {
      const { data } = await authApis.get(endpoints['order-detail'](order.id));
      setCancelTarget(data);
      setIsCancelModalOpen(true);
    } catch (err) {
      console.error('Không tải được chi tiết đơn hàng để huỷ:', err);
    } finally {
      setIsLoadingCancelTarget(false);
    }
  };

  const handleConfirmCancel = async (orderId, reason) => {
    try {
      const { data } = await authApis.patch(endpoints['order-detail'](orderId), {
        status: 'CANCELLED',
        cancel_reason: reason,
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: data.status } : o)));
    } catch (err) {
      throw new Error(extractApiError(err, 'Không thể huỷ đơn hàng.'));
    }
  };

  return (
    <>
      <Navbar activePage="orders" currentUser={currentUser} onOpenLogoutModal={() => {}} onOpenAIStylist={() => {}} />

      <main id="order-history-page" className={styles.page}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <button type="button" onClick={() => navigate('/products')} className={styles.breadcrumbLink}>
            Trang chủ
          </button>
          <ChevronRight className={styles.breadcrumbArrow} />
          <button type="button" onClick={() => navigate('/addresses')} className={styles.breadcrumbLink}>
            Tài khoản
          </button>
          <ChevronRight className={styles.breadcrumbArrow} />
          <span className={styles.breadcrumbCurrent}>Lịch sử đơn hàng</span>
        </nav>

        <div className={styles.layout}>
          <AccountSidebar currentPage="orders" onLogout={() => {}} currentUser={currentUser} />

          <div className={styles.main}>
            <div className={styles.headerRow}>
              <div>
                <div className={styles.titleRow}>
                  <h1 className={styles.title}>Lịch sử đơn hàng</h1>
                  <span className={styles.totalBadge}>{orders.length} đơn hàng</span>
                </div>
                <p className={styles.subtitle}>Xem và quản lý các đơn hàng của bạn.</p>
              </div>

              <button type="button" id="refresh-orders-btn" onClick={fetchOrders} className={styles.refreshButton}>
                <RotateCcw className={styles.refreshIcon} />
                <span>Làm mới</span>
              </button>
            </div>

            <div className={styles.statusSection}>
              <div className={styles.statusHeader}>
                <span className={styles.statusHeaderLabel}>Tổng quan trạng thái</span>
                {currentFilter !== 'ALL' && (
                  <button type="button" onClick={() => setCurrentFilter('ALL')} className={styles.resetFilterLink}>
                    Bỏ lọc
                  </button>
                )}
              </div>

              <div id="order-status-cards-grid" className={styles.statusGrid}>
                {STATUS_KEYS.map((key) => (
                  <OrderStatusCard
                    key={key}
                    config={STATUS_CONFIGS[key]}
                    count={statusCounts[key]}
                    isActive={currentFilter === key}
                    onClick={() => setCurrentFilter((prev) => (prev === key ? 'ALL' : key))}
                  />
                ))}
              </div>
            </div>

            <div className={styles.filterBar}>
              <OrderFilterTabs currentFilter={currentFilter} onSelectFilter={setCurrentFilter} statusCounts={statusCounts} />

              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} />
                <input
                  type="text"
                  id="orders-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã đơn hàng..."
                  className={styles.searchInput}
                />
              </div>
            </div>

            {isLoading ? (
              <div className={styles.skeletonList}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            ) : loadError ? (
              <div className={styles.errorState}>
                <p>{loadError}</p>
                <button type="button" onClick={fetchOrders} className={styles.retryButton}>
                  Thử lại
                </button>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div id="orders-list-container" className={styles.list}>
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={(id) => navigate(`/orders/${id}`)}
                    onRequestCancel={handleRequestCancel}
                  />
                ))}
              </div>
            ) : (
              <OrderEmptyState
                currentFilter={currentFilter}
                onContinueShopping={() => navigate('/products')}
                onResetFilter={() => {
                  setCurrentFilter('ALL');
                  setSearchQuery('');
                }}
              />
            )}
          </div>
        </div>
      </main>

      <CancelOrderDialogs
        isOpen={isCancelModalOpen}
        order={cancelTarget}
        onClose={() => {
          setIsCancelModalOpen(false);
          setCancelTarget(null);
        }}
        onConfirmCancel={handleConfirmCancel}
      />
    </>
  );
}