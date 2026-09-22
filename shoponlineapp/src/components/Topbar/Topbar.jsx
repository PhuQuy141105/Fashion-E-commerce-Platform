import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, User, LogOut, ChevronDown, ShieldCheck, Store } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import NotificationDropdown from '../NotificationDropdown/NotificationDropdown';
import styles from './Topbar.module.css';

const PAGE_TITLES = {
  products: 'Quản lý sản phẩm',
  variants: 'Biến thể & Tồn kho',
  inventory: 'Kiểm soát tồn kho',
  orders: 'Quản lý đơn hàng',
  'cod-reconciliation': 'Đối soát COD',
  reviews: 'Đánh giá sản phẩm',
  vouchers: 'Mã giảm giá',
  deliveries: 'Đơn hàng giao', 
};
export const Topbar = ({ role = 'ADMIN', currentPage, adminUser, onOpenMobileMenu, onLogout, onPreviewStore }) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    authApis
      .get(endpoints['notifications'])
      .then(({ data }) => setNotifications(data.results ?? data))
      .catch((err) => console.error('Không tải được thông báo:', err))
      .finally(() => setIsLoadingNotifications(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await authApis.post(endpoints['notification-mark-all-read']);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Đánh dấu đã đọc tất cả thất bại:', err);
    }
  };

  const handleNotificationClick = async (item) => {
    setIsNotificationsOpen(false);
    if (!item.is_read) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      authApis.patch(endpoints['notification-detail'](item.id)).catch((err) => console.error('Đánh dấu đã đọc thất bại:', err));
    }
    if (item.type === 'ORDER' && item.ref_id) {
      navigate(`/orders/${item.ref_id}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate(`/admin/products?search=${encodeURIComponent(searchValue.trim())}`);
  };

  const displayName = adminUser?.full_name?.trim() || adminUser?.username || (role === 'SHIPPER' ? 'Shipper' : 'Admin');
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const roleBadgeText = role === 'SHIPPER' ? 'Nhân viên giao hàng' : 'Toàn quyền quản trị';

  return (
    <header className={styles.topbar}  style={role === "SHIPPER" ? { justifyContent: "flex-end" } : {}}>

      {role !== 'SHIPPER' && (
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Tìm sản phẩm nhanh..."
            className={styles.searchInput}
          />
        </form>
      )}

      <div className={styles.right}>
        <div className={styles.dropdownWrapper} ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={styles.iconButton}
            aria-label="Thông báo"
          >
            <Bell className={styles.iconButtonIcon} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {isNotificationsOpen && (
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              isLoading={isLoadingNotifications}
              onMarkAllAsRead={handleMarkAllRead}
              onNotificationClick={handleNotificationClick}
            />
          )}
        </div>

        <div className={styles.dropdownWrapper} ref={profileRef}>
          <button type="button" id="admin-profile-menu-btn" onClick={() => setIsProfileOpen(!isProfileOpen)} className={styles.profileButton}>
            <div className={styles.avatar}>{avatarInitial}</div>
            <ChevronDown className={styles.chevron} />
          </button>

          {isProfileOpen && (
            <div id="admin-profile-dropdown" className={styles.profileDropdown}>
              <div className={styles.profileDropdownHeader}>
                <p className={styles.profileDropdownName}>{displayName}</p>
                <p className={styles.profileDropdownEmail}>{adminUser?.email}</p>
                <div className={styles.accessBadge}>
                  <ShieldCheck className={styles.accessBadgeIcon} />
                  <span>{roleBadgeText}</span>
                </div>
              </div>

              <div className={styles.profileDropdownBody}>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onPreviewStore();
                  }}
                  className={styles.profileDropdownButton}
                >
                  <Store className={styles.profileDropdownIconAccent} />
                  <span>Xem trang khách hàng</span>
                </button>
              </div>

              <div className={styles.profileDropdownFooter}>
                <button
                  type="button"
                  id="admin-dropdown-logout-btn"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className={styles.logoutDropdownButton}
                >
                  <LogOut className={styles.profileDropdownIcon} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;