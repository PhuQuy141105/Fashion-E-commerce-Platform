import React, { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, RefreshCw } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import StaffLayout from '../../components/StaffLayout/StaffLayout';
import VoucherStatisticsCards  from '../../components/VoucherStatisticsCards/VoucherStatisticsCards';
import VoucherFiltersToolbar  from '../../components/VoucherFiltersToolbar/VoucherFiltersToolbar';
import VouchersTable  from '../../components/VouchersTable/VouchersTable';
import VoucherFormModal  from '../../components/VoucherFormModal/VoucherFormModal';
import DeleteVoucherDialog  from '../../components/DeleteVoucherDialog/DeleteVoucherDialog';
import styles from './AdminVouchers.module.css';

const DEFAULT_FILTERS = { search: '', status: 'ALL', discountType: 'ALL', ordering: 'newest' };
const PAGE_SIZE = 10;

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data)) return data[0] || fallback;
  if (data.error) return Array.isArray(data.error) ? data.error[0] : data.error;
  if (typeof data === 'string') return data;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
  return fallback;
}

export default function AdminVouchers() {
  const [currentUser, setCurrentUser] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [banner, setBanner] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const [formModal, setFormModal] = useState({ isOpen: false, voucher: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    authApis.get(endpoints['current-user']).then((res) => setCurrentUser(res.data)).catch(() => {});
  }, []);

  const fetchVouchers = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setLoadError(null);
      try {
        const params = {};
        if (filters.search.trim()) params.search = filters.search.trim();
        if (filters.status !== 'ALL') params.status = filters.status;
        if (filters.discountType !== 'ALL') params.discount_type = filters.discountType;
        if (filters.ordering) params.ordering = filters.ordering;

        const { data } = await authApis.get(endpoints['vouchers'], { params });
        setVouchers(data.results ?? data);
        if (isManualRefresh) showBanner('success', 'Đã làm mới danh sách voucher.');
      } catch (err) {
        console.error('Không tải được danh sách voucher:', err);
        setLoadError(extractApiError(err, 'Không tải được danh sách voucher.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleFilterChange = (partial) => setFilters((prev) => ({ ...prev, ...partial }));
  const handleResetFilters = () => setFilters(DEFAULT_FILTERS);

  const handleSelectStatusFromStats = (status) => {
    setFilters((prev) => ({ ...prev, status: prev.status === status ? 'ALL' : status }));
  };

  const handleOpenCreate = () => setFormModal({ isOpen: true, voucher: null });
  const handleOpenEdit = (voucher) => setFormModal({ isOpen: true, voucher });

  const handleSubmitVoucher = async (payload) => {
    try {
      if (formModal.voucher) {
        await authApis.patch(endpoints['voucher-detail'](formModal.voucher.id), payload);
        showBanner('success', `Đã cập nhật voucher "${payload.code}".`);
      } else {
        await authApis.post(endpoints['vouchers'], payload);
        showBanner('success', `Đã tạo voucher "${payload.code}".`);
      }
      setFormModal({ isOpen: false, voucher: null });
      fetchVouchers();
    } catch (err) {
      throw new Error(extractApiError(err, 'Không thể lưu voucher.'));
    }
  };

  const handleConfirmDelete = async (voucherId) => {
    try {
      await authApis.delete(endpoints['voucher-detail'](voucherId));
      showBanner('success', 'Đã xoá voucher.');
      fetchVouchers();
    } catch (err) {
      throw new Error(extractApiError(err, 'Xoá voucher thất bại.'));
    }
  };

  return (
    <StaffLayout activePage="vouchers" currentUser={currentUser}>
      <main id="admin-vouchers-page" className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Mã giảm giá</h1>
            <p className={styles.subtitle}>Tạo và quản lý các mã giảm giá cho khách hàng.</p>
          </div>

          <div className={styles.headerActions}>
            <button type="button" id="admin-vouchers-refresh-btn" onClick={() => fetchVouchers(true)} disabled={isRefreshing} className={styles.refreshButton}>
              <RefreshCw className={`${styles.refreshIcon} ${isRefreshing ? styles.spinning : ''}`} />
              <span>Làm mới</span>
            </button>

            <button type="button" id="admin-vouchers-create-btn" onClick={handleOpenCreate} className={styles.createButton}>
              <Plus className={styles.createIcon} />
              <span>Tạo voucher</span>
            </button>
          </div>
        </div>

        {banner && <div className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>{banner.message}</div>}

        <VoucherStatisticsCards vouchers={vouchers} selectedStatus={filters.status} onSelectStatus={handleSelectStatusFromStats} isLoading={isLoading} />

        <VoucherFiltersToolbar filters={filters} onApplyFilters={handleFilterChange} onResetFilters={handleResetFilters} />

        {loadError ? (
          <div className={styles.errorState}>
            <p>{loadError}</p>
            <button type="button" onClick={() => fetchVouchers()} className={styles.retryButton}>
              Thử lại
            </button>
          </div>
        ) : (
          <VouchersTable
            vouchers={vouchers}
            isLoading={isLoading}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            onEdit={handleOpenEdit}
            onDelete={setDeleteTarget}
            onCreateNew={handleOpenCreate}
            onResetFilters={handleResetFilters}
          />
        )}
      </main>

      <VoucherFormModal
        isOpen={formModal.isOpen}
        voucherToEdit={formModal.voucher}
        onClose={() => setFormModal({ isOpen: false, voucher: null })}
        onSubmit={handleSubmitVoucher}
      />

      <DeleteVoucherDialog isOpen={Boolean(deleteTarget)} voucher={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} />
    </StaffLayout>
  );
}