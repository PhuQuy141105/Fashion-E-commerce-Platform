import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Search, Pencil, ChevronRight } from 'lucide-react';
import { authApis,endpoints } from '../../configs/Apis';
import AccountSidebar from '../../components/AccountSideBar/AccountSideBar';
import AddressCard from '../../components/AddressCard/AddressCard';
import AddressFormModal from '../../components/AddressFormModal/AddressFormModal';
import DeleteAddressModal from '../../components/DeleteAddressModal/DeleteAddressModal';
import DuplicateAddressModal from '../../components/DuplicatedAddressModal/DuplicatedAddressModal';
import AddressSkeleton from '../../components/AddressSkeleton/AddressSkeleton';
import AddressEmptyState from '../../components/AddressEmptyState/AddressEmptyState';
import styles from './Address.module.css';
import Navbar from '../../components/Navbar/Navbar';

const DUPLICATE_ERROR_TEXT = 'Địa chỉ này đã tồn tại trong danh sách của bạn';

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

export default function Address() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [banner, setBanner] = useState(null);

  const [formModal, setFormModal] = useState({ isOpen: false, mode: 'add', address: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, address: null });
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  useEffect(() => {
    authApis
      .get(endpoints['current-user'])
      .then((res) => setCurrentUser(res.data))
      .catch((err) => console.error('Không lấy được thông tin người dùng:', err));
  }, []);

  const loadAddresses = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await authApis.get(endpoints['user-addresses']);
      setAddresses(data.results ?? data);
    } catch (err) {
      console.error('Không tải được danh sách địa chỉ:', err);
      setLoadError('Không tải được danh sách địa chỉ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const defaultAddress = useMemo(() => addresses.find((a) => a.is_default) || null, [addresses]);

  const filteredAddresses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return addresses;
    return addresses.filter((a) =>
      [a.recipient_name, a.recipient_phone, a.detail_address, a.ward, a.district, a.province]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [addresses, searchTerm]);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  const handleSetDefault = async (address) => {
    try {
      const { data } = await authApis.patch(endpoints['user-address-detail'](address.id), { is_default: true });
      setAddresses((prev) => prev.map((a) => (a.id === data.id ? data : { ...a, is_default: false })));
      showBanner('success', 'Đã đặt làm địa chỉ mặc định.');
    } catch (err) {
      console.error('Đặt mặc định thất bại:', err);
      showBanner('error', extractApiError(err, 'Đặt địa chỉ mặc định thất bại.'));
    }
  };

  const handleOpenAdd = () => setFormModal({ isOpen: true, mode: 'add', address: null });
  const handleOpenEdit = (address) => setFormModal({ isOpen: true, mode: 'edit', address });
  const handleCloseForm = () => setFormModal((prev) => ({ ...prev, isOpen: false }));

  const handleSubmitForm = async (values) => {
    try {
      if (formModal.mode === 'edit') {
        const { data } = await authApis.patch(endpoints['user-address-detail'](formModal.address.id), values);
        setAddresses((prev) =>
          prev.map((a) => (a.id === data.id ? data : values.is_default ? { ...a, is_default: false } : a))
        );
        showBanner('success', 'Đã cập nhật địa chỉ.');
      } else {
        const { data } = await authApis.post(endpoints['user-addresses'], values);
        setAddresses((prev) =>
          data.is_default ? prev.map((a) => ({ ...a, is_default: false })).concat(data) : [...prev, data]
        );
        showBanner('success', 'Đã thêm địa chỉ mới.');
      }
      handleCloseForm();
    } catch (err) {
      const message = extractApiError(err, formModal.mode === 'edit' ? 'Cập nhật địa chỉ thất bại.' : 'Thêm địa chỉ thất bại.');
      if (message === DUPLICATE_ERROR_TEXT) {
        setIsDuplicateModalOpen(true);
        return; 
      }
      throw new Error(message);
    }
  };

  const handleOpenDelete = (address) => {
    if (addresses.length <= 1) {
      showBanner('error', 'Bạn phải giữ lại ít nhất 1 địa chỉ giao hàng.');
      return;
    }
    setDeleteModal({ isOpen: true, address });
  };
  const handleCloseDelete = () => setDeleteModal((prev) => ({ ...prev, isOpen: false }));

  const handleConfirmDelete = async (address) => {
    try {
      await authApis.delete(endpoints['user-address-detail'](address.id));
      await loadAddresses();
      showBanner('success', 'Đã xoá địa chỉ.');
    } catch (err) {
      throw new Error(extractApiError(err, 'Xoá địa chỉ thất bại.'));
    }
  };

  return (
    <>
      <Navbar
        activePage="addresses"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenLogoutModal={handleLogout}
        onOpenAIStylist={() => {}}
        currentUser={currentUser}
      />

      <div className={styles.page}>
      <div className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <button type="button" onClick={() => navigate('/profile')} className={styles.breadcrumbLink}>
            Tài khoản
          </button>
          <ChevronRight className={styles.breadcrumbArrow} />
          <span className={styles.breadcrumbCurrent}>Địa chỉ giao hàng</span>
        </nav>

        <div className={styles.layout}>
          <AccountSidebar currentPage="addresses" onLogout={handleLogout} currentUser={currentUser} />

          <main className={styles.main}>
            <div className={styles.headerCard}>
              <div className={styles.headerTop}>
                <div>
                  <div className={styles.headerBadgeRow}>
                    <span className={styles.headerBadge}>THÔNG TIN CÁC ĐỊA CHỈ </span>
                    <span className={styles.headerCount}>
                     - {addresses.length} địa chỉ đã lưu
                    </span>
                  </div>
                  <h1 className={styles.headerTitle}>Địa chỉ giao hàng</h1>
                  <p className={styles.headerSubtitle}>
                    Quản lý và cập nhật các địa chỉ giao hàng của bạn một cách thuận tiện, đồng thời lựa chọn địa chỉ mặc định để tiết kiệm thời gian khi thực hiện đặt hàng và thanh toán
                  </p>
                </div>

                <button type="button" id="add-new-address-header-btn" onClick={handleOpenAdd} className={styles.addButton}>
                  <Plus className={styles.addIcon} />
                  <span>Thêm địa chỉ mới</span>
                </button>
              </div>

              <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                  <Search className={styles.searchIcon} />
                  <input
                    id="address-search-input"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên người nhận, đường, quận/huyện..."
                    className={styles.searchInput}
                  />
                  {searchTerm && (
                    <button type="button" onClick={() => setSearchTerm('')} className={styles.clearSearch}>
                      Xoá
                    </button>
                  )}
                </div>
              </div>
            </div>

            {banner && (
              <div className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>
                {banner.message}
              </div>
            )}

            {defaultAddress && addresses.length > 1 && !searchTerm && (
              <div className={styles.defaultBanner}>
                <div className={styles.defaultBannerLeft}>
                  <div className={styles.defaultBannerIconBox}>
                    <MapPin className={styles.defaultBannerIcon} />
                  </div>
                  <div>
                    <div className={styles.defaultBannerLabelRow}>
                      <span className={styles.defaultBannerLabel}>ĐỊA CHỈ MẶC ĐỊNH HIỆN TẠI:</span>
                      <span className={styles.defaultBannerName}>{defaultAddress.recipient_name}</span>
                    </div>
                    <p className={styles.defaultBannerText}>
                      {defaultAddress.detail_address}, {defaultAddress.province} • Liên hệ: {defaultAddress.recipient_phone}
                    </p>
                  </div>
                </div>

                <button type="button" id="highlight-edit-default-btn" onClick={() => handleOpenEdit(defaultAddress)} className={styles.defaultBannerEdit}>
                  <Pencil className={styles.defaultBannerEditIcon} />
                  Sửa chi tiết →
                </button>
              </div>
            )}

            {isLoading ? (
              <AddressSkeleton />
            ) : loadError ? (
              <div className={styles.errorState}>
                <p>{loadError}</p>
                <button type="button" onClick={loadAddresses} className={styles.retryButton}>
                  Thử lại
                </button>
              </div>
            ) : addresses.length === 0 ? (
              <AddressEmptyState onAddNew={handleOpenAdd} />
            ) : filteredAddresses.length === 0 ? (
              <div className={styles.noResults}>
                <p className={styles.noResultsTitle}>Không tìm thấy địa chỉ phù hợp</p>
                <p className={styles.noResultsText}>Thử một từ khoá tìm kiếm khác.</p>
                <button type="button" onClick={() => setSearchTerm('')} className={styles.clearFiltersButton}>
                  Xoá bộ lọc
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {filteredAddresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    isOnlyAddress={addresses.length <= 1}
                    onSetDefault={handleSetDefault}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <AddressFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        initialAddress={formModal.address}
        isFirstAddress={addresses.length === 0}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
      />

      <DeleteAddressModal
        isOpen={deleteModal.isOpen}
        address={deleteModal.address}
        hasOtherAddresses={addresses.length > 1}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />

      <DuplicateAddressModal isOpen={isDuplicateModalOpen} onClose={() => setIsDuplicateModalOpen(false)} />
      </div>
    </>
  );
}