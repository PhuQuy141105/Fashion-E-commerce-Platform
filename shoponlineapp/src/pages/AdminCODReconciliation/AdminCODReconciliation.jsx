import { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import StaffLayout from '../../components/StaffLayout/StaffLayout';
import CODStatisticCards from '../../components/CODStatisticCards/CODStatisticCards';
import ShipperPendingCard from '../../components/ShipperPendingCard/ShipperPendingCard';
import PendingCODOrdersTable from '../../components/PendingCODOrdersTable/PendingCODOrdersTable';
import SelectedOrdersSummaryBar from '../../components/SelectedOrdersSummaryBar/SelectedOrdersSummaryBar';
import CreateReconciliationModal from '../../components/CreateReconciliationModal/CreateReconciliationModal';
import CODSuccessModal from '../../components/CODSuccessModal/CODSuccessModal';
import RemittanceHistoryTable from '../../components/RemittanceHistoryTable/RemittanceHistoryTable';
import styles from './AdminCODReconciliation.module.css';

const ORDERS_PAGE_SIZE = 8;

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

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function AdminCODReconciliation() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); 

  const [shippers, setShippers] = useState([]);
  const [isLoadingShippers, setIsLoadingShippers] = useState(true);
  const [selectedShipperId, setSelectedShipperId] = useState(null);

  const [shipperOrders, setShipperOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  const [remittances, setRemittances] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successRemittance, setSuccessRemittance] = useState(null);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    authApis.get(endpoints['current-user']).then((res) => setCurrentUser(res.data)).catch(() => {});
  }, []);
  const loadShippers = useCallback(async () => {
    setIsLoadingShippers(true);
    try {
      const { data: shipperList } = await authApis.get(endpoints['shippers']);
      const withPending = await Promise.all(
        shipperList.map(async (s) => {
          try {
            const { data } = await authApis.get(endpoints['shipper-cod-pending'](s.id));
            return { ...s, pendingOrdersCount: data.orders.length, pendingCODAmount: data.total_pending_amount };
          } catch {
            return { ...s, pendingOrdersCount: 0, pendingCODAmount: 0 };
          }
        })
      );
      setShippers(withPending);
    } catch (err) {
      console.error('Không tải được danh sách shipper:', err);
    } finally {
      setIsLoadingShippers(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const { data } = await authApis.get(endpoints['cod-remittances']);
      setRemittances(data);
    } catch (err) {
      console.error('Không tải được lịch sử đối soát:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadShippers();
    loadHistory();
  }, [loadShippers, loadHistory]);

  const shippersWithCompletedCount = useMemo(() => {
    return shippers.map((s) => ({
      ...s,
      completedRemittancesCount: remittances.filter((r) => r.shipper?.id === s.id).length,
    }));
  }, [shippers, remittances]);

  const selectedShipper = shippersWithCompletedCount.find((s) => s.id === selectedShipperId) || null;

  const loadShipperOrders = useCallback(async (shipperId) => {
    setIsLoadingOrders(true);
    setSelectedOrderIds([]);
    setOrdersPage(1);
    try {
      const { data } = await authApis.get(endpoints['shipper-cod-pending'](shipperId));
      setShipperOrders(data.orders);
    } catch (err) {
      console.error('Không tải được đơn chờ đối soát:', err);
      setShipperOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const handleSelectShipper = (shipperId) => {
    setSelectedShipperId(shipperId);
    loadShipperOrders(shipperId);
  };

  const selectedOrderObjects = shipperOrders.filter((o) => selectedOrderIds.includes(o.id));

  const handleToggleSelectOrder = (orderId) => {
    setSelectedOrderIds((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]));
  };

  const handleToggleSelectAll = () => {
    const allIds = shipperOrders.map((o) => o.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedOrderIds.includes(id));
    setSelectedOrderIds(allSelected ? [] : allIds);
  };

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleConfirmReconciliation = async (note) => {
    try {
      const { data } = await authApis.post(endpoints['cod-remittances'], {
        shipper_id: selectedShipperId,
        order_ids: selectedOrderIds,
        note,
      });
      setIsCreateModalOpen(false);
      setSuccessRemittance(data);
      setSelectedOrderIds([]);
      loadShipperOrders(selectedShipperId);
      loadShippers();
      loadHistory();
    } catch (err) {
      throw new Error(extractApiError(err, 'Tạo đối soát thất bại. Vui lòng thử lại.'));
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const pendingOrders = shippers.reduce((sum, s) => sum + (s.pendingOrdersCount || 0), 0);
    const pendingAmount = shippers.reduce((sum, s) => sum + Number(s.pendingCODAmount || 0), 0);
    const remittedToday = remittances
      .filter((r) => isSameDay(new Date(r.remitted_at), now))
      .reduce((sum, r) => sum + Number(r.total_amount), 0);
    const remittedThisMonth = remittances
      .filter((r) => {
        const d = new Date(r.remitted_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, r) => sum + Number(r.total_amount), 0);
    return { pendingOrders, pendingAmount, remittedToday, remittedThisMonth };
  }, [shippers, remittances]);

  return (
    <StaffLayout activePage="cod-reconciliation" currentUser={currentUser}>
      <main id="admin-cod-reconciliation-page" className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Đối soát COD</h1>
            <p className={styles.subtitle}>Xác nhận tiền mặt COD shipper đã bàn giao.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              loadShippers();
              loadHistory();
              if (selectedShipperId) loadShipperOrders(selectedShipperId);
            }}
            className={styles.refreshButton}
          >
            <RefreshCw className={styles.refreshIcon} />
            <span>Làm mới</span>
          </button>
        </div>

        {banner && <div className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>{banner.message}</div>}

        <CODStatisticCards stats={stats} isLoading={isLoadingShippers || isLoadingHistory} />

        <div className={styles.tabs}>
          <button type="button" onClick={() => setActiveTab('pending')} className={`${styles.tab} ${activeTab === 'pending' ? styles.tabActive : ''}`}>
            Chờ đối soát
          </button>
          <button type="button" onClick={() => setActiveTab('history')} className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}>
            Lịch sử đối soát
          </button>
        </div>

        {activeTab === 'pending' ? (
          <div className={styles.pendingTabContent}>
            <ShipperPendingCard
              shippers={shippersWithCompletedCount}
              selectedShipperId={selectedShipperId}
              onSelectShipper={handleSelectShipper}
              isLoading={isLoadingShippers}
            />

            {selectedShipperId && (
              <>
                <SelectedOrdersSummaryBar
                  selectedOrders={selectedOrderObjects}
                  shipperName={selectedShipper?.full_name?.trim() || selectedShipper?.username || 'Shipper'}
                  onClearSelection={() => setSelectedOrderIds([])}
                  onCreateRemittance={() => setIsCreateModalOpen(true)}
                />

                <PendingCODOrdersTable
                  orders={shipperOrders}
                  selectedOrderIds={selectedOrderIds}
                  onToggleSelectOrder={handleToggleSelectOrder}
                  onToggleSelectAll={handleToggleSelectAll}
                  currentPage={ordersPage}
                  pageSize={ORDERS_PAGE_SIZE}
                  onPageChange={setOrdersPage}
                  isLoading={isLoadingOrders}
                />
              </>
            )}
          </div>
        ) : (
          <RemittanceHistoryTable remittances={remittances} isLoading={isLoadingHistory} />
        )}
      </main>

      <CreateReconciliationModal
        isOpen={isCreateModalOpen}
        shipper={selectedShipper}
        selectedOrders={selectedOrderObjects}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleConfirmReconciliation}
      />

      <CODSuccessModal
        isOpen={Boolean(successRemittance)}
        remittance={successRemittance}
        onClose={() => setSuccessRemittance(null)}
        onViewHistory={() => {
          setSuccessRemittance(null);
          setActiveTab('history');
        }}
      />
    </StaffLayout>
  );
}