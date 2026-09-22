import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../configs/Context';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import AdminChatWidget from '../AdminChatWidget/AdminChatWidget';
import ChatWidget from '../ChatWidget/ChatWidget';
import styles from './StaffLayout.module.css';

export const StaffLayout = ({ activePage, currentUser, children }) => {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const role = currentUser?.role === 'SHIPPER' ? 'SHIPPER' : 'ADMIN';
  const handleLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        role={role}
        currentPage={activePage}
        onNavigate={(path) => navigate(path)}
        onLogout={handleLogoutClick}
        onPreviewStore={() => navigate('/products')}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className={styles.main}>
        <Topbar
          role={role}
          currentPage={activePage}
          adminUser={currentUser}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onLogout={handleLogoutClick}
          onPreviewStore={() => navigate('/products')}
        />

        <div className={styles.content}>{children}</div>
      </div>

      {role === 'SHIPPER' ? (
        <ChatWidget
          currentUser={currentUser}
          headerTitle="Hỗ trợ nội bộ"
          headerSubtitle="Trò chuyện trực tiếp với Admin"
          toastTitle="Tin nhắn từ Admin"
          ariaLabel="Mở chat với Admin"
          titleAttr="Nhắn tin với Admin"
        />
      ) : (
        <AdminChatWidget currentUser={currentUser} />
      )}
    </div>
  );
};

export default StaffLayout;