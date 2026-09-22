import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ShoppingBag,
  Settings,
  User,
  Package,
  Heart,
  LogOut,
  MapPin,
  Search,
  X,
  ChevronDown,
  Bell,
  Truck,
  Shield,
} from "lucide-react";
import { useCart } from "../../configs/Context";
import { authApis, endpoints } from "../../configs/Apis";
import AIStylistModal from "../AIStylistModal/AIStylistModal";
import ChatWidget from "../ChatWidget/ChatWidget";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";
import styles from "./Navbar.module.css";
import { useAuth } from "../../configs/Context";

export default function Navbar({
  activePage,
  onPageChange = () => {},
  searchQuery = "",
  onSearchChange = () => {},
  onOpenLogoutModal = () => {},
  currentUser,
  onSelectOrder = () => {},
}) {
  const { handleLogout } = useAuth();
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isAIStylistOpen, setIsAIStylistOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const navigate = useNavigate();
  const { cartCount } = useCart(); 

  
  useEffect(() => {
    authApis
      .get(endpoints["notifications"])
      .then(({ data }) => setNotifications(data.results ?? data))
      .catch((err) => console.error("Không tải được thông báo:", err))
      .finally(() => setIsLoadingNotifications(false));
  }, []);

  const unreadNotificationCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllNotificationsRead = async () => {
    try {
      await authApis.post(endpoints["notification-mark-all-read"]);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Đánh dấu đã đọc tất cả thất bại:", err);
    }
  };

  const handleNotificationClick = async (item) => {
    setIsNotificationsOpen(false);
    if (!item.is_read) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      authApis.patch(endpoints["notification-detail"](item.id)).catch((err) => console.error("Đánh dấu đã đọc thất bại:", err));
    }
    if (item.type === "ORDER" && item.ref_id) {
      navigate(`/orders/${item.ref_id}`);
    }
  };

  const PAGE_PATHS = {
    home: '/products',
    cart: '/cart',
    addresses: '/addresses',
    orders: '/orders',
    
  };

  
  const goToPage = (page) => {
    onPageChange(page);
    const path = PAGE_PATHS[page];
    if (path) navigate(path);
  };

  const handleLogoutClick = () => {
    handleLogout()
    navigate('/')
  }

  const dropdownRef = useRef(null);
  const settingsRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsAvatarDropdownOpen(false);
      }

      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setIsSettingsDropdownOpen(false);
      }

      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (activePage !== "home" && activePage !== "product-detail") {
      goToPage("home");
    }
  };

  
  const displayName = currentUser?.full_name?.trim() || currentUser?.username || "Đang tải...";
  const avatarInitial = (currentUser?.full_name || currentUser?.username || "?").charAt(0).toUpperCase();

  return (
    <>
    <header id="main-app-navbar" className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <div className={styles.searchWrapper}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className={styles.searchBox}>
              <div className={styles.searchIconWrapper}>
                <Search className={styles.searchIcon} />
              </div>

              <input
                type="text"
                id="navbar-search-input"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);

                  if (
                    activePage !== "home" &&
                    activePage !== "product-detail"
                  ) {
                    goToPage("home");
                  }
                }}
                placeholder="Tìm sản phẩm, thương hiệu hoặc danh mục..."
                className={styles.searchInput}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className={styles.clearSearchButton}
                  aria-label="Xoá tìm kiếm"
                >
                  <X className={styles.clearSearchIcon} />
                </button>
              )}
            </div>
          </form>
        </div>

        <div className={styles.navActions}>
          <div className={styles.tooltipWrapper}>
            <button
              type="button"
              id="nav-ai-recommendations-btn"
              onClick={() => setIsAIStylistOpen(true)}
              className={`${styles.navButton} ${isAIStylistOpen ? styles.navButtonActive : ""}`}
              aria-label="Trợ lý AI & Gợi ý trang phục"
            >
              <Sparkles className={styles.aiIcon} />
            </button>

            <div className={styles.tooltip}>Trợ lý AI & Gợi ý trang phục</div>
          </div>

          <div className={styles.tooltipWrapper}>
            <button
              type="button"
              id="nav-shopping-cart-btn"
              onClick={() => goToPage("cart")}
              className={`${styles.navButton} ${styles.cartButton} ${
                activePage === "cart" ? styles.navButtonActive : ""
              }`}
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className={styles.navIcon} />
              {cartCount > 0 && (
                <span id="navbar-cart-count-badge" className={styles.cartBadge}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            <div className={styles.tooltip}>Giỏ hàng {cartCount > 0 ? `(${cartCount})` : ''}</div>
          </div>

          <div className={styles.dropdownWrapper} ref={notifRef}>
            <button
              type="button"
              id="nav-notifications-btn"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`${styles.navButton} ${styles.cartButton} ${
                isNotificationsOpen ? styles.navButtonActive : ""
              }`}
              aria-label="Thông báo"
            >
              <Bell className={styles.navIcon} />
              {unreadNotificationCount > 0 && (
                <span id="notifications-badge-count" className={styles.cartBadge}>
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadNotificationCount}
                isLoading={isLoadingNotifications}
                onMarkAllAsRead={handleMarkAllNotificationsRead}
                onNotificationClick={handleNotificationClick}
              />
            )}
          </div>

          <div className={styles.dropdownWrapper} ref={settingsRef}>
            <button
              type="button"
              id="nav-settings-account-btn"
              onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
              className={`${styles.navButton} ${
                isSettingsDropdownOpen ||
                activePage === "addresses" ||
                activePage === "profile"
                  ? styles.navButtonActive
                  : ""
              }`}
              aria-label="Cài đặt tài khoản"
              aria-expanded={isSettingsDropdownOpen}
            >
              <Settings className={styles.navIcon} />
            </button>

            {isSettingsDropdownOpen && (
              <div id="settings-dropdown-menu" className={styles.userDropdown}>
                <button
                  type="button"
                  id="settings-dropdown-account-btn"
                  onClick={() => {
                    setIsSettingsDropdownOpen(false);
                    goToPage("profile");
                  }}
                  className={styles.dropdownButton}
                >
                  <User className={styles.dropdownIcon} />
                  <span>Tài khoản của tôi</span>
                </button>

                <button
                  type="button"
                  id="settings-dropdown-addresses-btn"
                  onClick={() => {
                    setIsSettingsDropdownOpen(false);
                    goToPage("addresses");
                  }}
                  className={styles.dropdownButton}
                >
                  <MapPin className={styles.dropdownIcon} />
                  <span>Địa chỉ giao hàng</span>
                </button>
              </div>
            )}
          </div>

          <div className={styles.dropdownWrapper} ref={dropdownRef}>
            <button
              type="button"
              id="nav-user-avatar-btn"
              onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
              className={styles.avatarButton}
              aria-label="Menu người dùng"
              aria-expanded={isAvatarDropdownOpen}
            >
              <div className={styles.avatar}>{avatarInitial}</div>

              <ChevronDown className={styles.chevron} />
            </button>

            {isAvatarDropdownOpen && (
              <div
                id="user-avatar-dropdown-menu"
                className={styles.userDropdown}
              >
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>{avatarInitial}</div>
                  <div className={styles.infoContainer}>
                    <p className={styles.userName}>{displayName}</p>

                    <p className={styles.userEmail}>{currentUser?.email || ""}</p>
                  </div>
                </div>

                <button
                  type="button"
                  id="dropdown-my-account-btn"
                  onClick={() => {
                    setIsAvatarDropdownOpen(false);
                    goToPage("profile");
                  }}
                  className={styles.dropdownButton}
                >
                  <User className={styles.dropdownIcon} />
                  <span>Tài khoản của tôi</span>
                </button>

                <button
                  type="button"
                  id="dropdown-my-addresses-btn"
                  onClick={() => {
                    setIsAvatarDropdownOpen(false);
                    goToPage("addresses");
                  }}
                  className={styles.dropdownButton}
                >
                  <MapPin className={styles.dropdownIcon} />
                  <span>Địa chỉ giao hàng</span>
                </button>

                <button
                  type="button"
                  id="dropdown-my-orders-btn"
                  onClick={() => {
                    setIsAvatarDropdownOpen(false);
                    goToPage("orders");
                  }}
                  className={styles.dropdownButton}
                >
                  <Package className={styles.dropdownIcon} />
                  <span>Đơn hàng của tôi</span>
                </button>

                <button
                  type="button"
                  id="dropdown-my-wishlist-btn"
                  onClick={() => {
                    setIsAvatarDropdownOpen(false);
                    goToPage("wishlist");
                  }}
                  className={styles.dropdownButton}
                >
                  <Heart className={styles.dropdownIcon} />
                  <span>Yêu thích</span>
                </button>

                <div className={styles.divider} />

                {currentUser?.role === "SHIPPER" && (
                  <button
                    type="button"
                    id="dropdown-shipper-portal-btn"
                    onClick={() => {
                      setIsAvatarDropdownOpen(false);
                      goToPage("shipper-deliveries");
                    }}
                    className={styles.dropdownButton}
                  >
                    <Truck
                      className={`${styles.dropdownIcon} ${styles.goldIcon}`}
                    />
                    <span>Cổng Shipper</span>
                  </button>
                )}

                {currentUser?.role === "ADMIN" && (
                  <button
                    type="button"
                    id="dropdown-admin-portal-btn"
                    onClick={() => {
                      setIsAvatarDropdownOpen(false);
                      goToPage("admin-dashboard");
                    }}
                    className={styles.dropdownButton}
                  >
                    <Shield className={styles.dropdownIcon} />
                    <span>Cổng Admin</span>
                  </button>
                )}

                {(currentUser?.role === "SHIPPER" ||
                  currentUser?.role === "ADMIN") && (
                  <div className={styles.divider} />
                )}

                <button
                  type="button"
                  id="dropdown-logout-btn"
                  onClick={() => {
                    setIsAvatarDropdownOpen(false);
                    onOpenLogoutModal();
                    handleLogoutClick();
                  }}
                  className={`${styles.dropdownButton} ${styles.logoutButton}`}
                >
                  <LogOut className={styles.dropdownIcon} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

    <AIStylistModal isOpen={isAIStylistOpen} onClose={() => setIsAIStylistOpen(false)} currentUser={currentUser} />
    <ChatWidget currentUser={currentUser} />
    </>
  );
}