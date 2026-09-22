import { useState, useEffect, useMemo, useCallback } from 'react';
import { Wallet, CheckCircle2, RefreshCw } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import StaffLayout from '../../components/StaffLayout/StaffLayout';
import PendingCODOrdersTable  from '../../components/PendingCODOrdersTable/PendingCODOrdersTable';
import RemittanceHistoryTable from '../../components/RemittanceHistoryTable/RemittanceHistoryTable';
import styles from './ShipperCODReconciliation.module.css';

const ORDERS_PAGE_SIZE = 8;

export default function ShipperCODReconciliation() {
  const [currentUser, setCurrentUser] = useState(null);

  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [ordersPage, setOrdersPage] = useState(1);

  const [remittances, setRemittances] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    authApis.get(endpoints['current-user']).then((res) => setCurrentUser(res.data)).catch(() => {});
  }, []);

  const loadPending = useCallback(async () => {
    setIsLoadingPending(true);
    try {
      const { data } = await authApis.get(endpoints['shipper-my-cod-pending']);
      setPendingOrders(data.orders);
      setPendingAmount(data.total_pending_amount);
    } catch (err) {
      console.error('Không tải được đơn COD đang giữ:', err);
    } finally {
      setIsLoadingPending(false);
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
    loadPending();
    loadHistory();
  }, [loadPending, loadHistory]);

  const totalRemitted = useMemo(() => remittances.reduce((sum, r) => sum + Number(r.total_amount), 0), [remittances]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([loadPending(), loadHistory()]).finally(() => setIsRefreshing(false));
  };

  return (
    <StaffLayout activePage="shipper-cod-reconciliation" currentUser={currentUser}>
      <main id="shipper-cod-reconciliation-page" className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Đối soát COD của tôi</h1>
            <p className={styles.subtitle}>Xem số tiền COD đang giữ và lịch sử đối soát</p>
          </div>

          <button type="button" onClick={handleRefresh} disabled={isRefreshing} className={styles.refreshButton}>
            <RefreshCw className={`${styles.refreshIcon} ${isRefreshing ? styles.spinning : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.statIconAmber}`}>
              <Wallet className={styles.statIcon} />
            </div>
            <div>
              <p className={styles.statLabel}>Tiền COD đang giữ</p>
              <h3 className={styles.statValue}>{isLoadingPending ? '—' : `${Number(pendingAmount).toLocaleString('vi-VN')} VNĐ`}</h3>
              <p className={styles.statSub}>{pendingOrders.length} đơn chưa đối soát</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.statIconEmerald}`}>
              <CheckCircle2 className={styles.statIcon} />
            </div>
            <div>
              <p className={styles.statLabel}>Đã đối soát</p>
              <h3 className={styles.statValue}>{isLoadingHistory ? '—' : `${totalRemitted.toLocaleString('vi-VN')} VNĐ`}</h3>
              <p className={styles.statSub}>{remittances.length} lượt đối soát</p>
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Đơn hàng COD đang giữ</h2>
          <PendingCODOrdersTable
            orders={pendingOrders}
            isLoading={isLoadingPending}
            currentPage={ordersPage}
            pageSize={ORDERS_PAGE_SIZE}
            onPageChange={setOrdersPage}
            readOnly
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Lịch sử đối soát</h2>
          <RemittanceHistoryTable remittances={remittances} isLoading={isLoadingHistory} />
        </section>
      </main>
    </StaffLayout>
  );
}