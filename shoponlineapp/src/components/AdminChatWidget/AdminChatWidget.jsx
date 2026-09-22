import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ref, onValue } from 'firebase/database';
import { authApis, endpoints } from '../../configs/Apis';
import { db } from '../../configs/FirebaseConfig';
import FloatingChatButton from '../FloatingChatButton/FloatingChatButton';
import AdminChatRoomList from '../AdminChatRoomList/AdminChatRoomList';
import AdminChatThreadHeader from '../AdminChatThreadHeader/AdminChatThreadHeader';
import ChatMessageBubble from '../ChatMessageBubble/ChatMessageBubble';
import ChatEmptyState from '../ChatEmptyState/ChatEmptyState';
import ChatInput from '../ChatInput/ChatInput';
import styles from './AdminChatWidget.module.css';

function getDayLabel(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return 'Hôm nay';
  if (sameDay(date, yesterday)) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function normalizeRestMessage(raw) {
  return {
    id: raw.id,
    content: raw.content,
    senderId: raw.sender?.id ?? null,
    senderName: raw.sender?.full_name?.trim() || raw.sender?.username || raw.sender?.email || 'Người dùng',
    senderAvatar: raw.sender?.avatar || null,
    attachment: raw.attachment || null,
    isRead: Boolean(raw.is_read),
    createdAt: raw.created_at,
    isOptimistic: false,
  };
}

function normalizeFirebaseMessage(raw) {
  return {
    id: raw.id,
    content: raw.content,
    senderId: raw.sender_id ?? null,
    senderName: raw.sender_name || 'Người dùng',
    senderAvatar: null,
    attachment: raw.attachment || null,
    isRead: Boolean(raw.is_read),
    createdAt: raw.created_at,
    isOptimistic: false,
  };
}

export const AdminChatWidget = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('list');

  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [roomSearch, setRoomSearch] = useState('');

  const [activeRoom, setActiveRoom] = useState(null);  
  const [messagesById, setMessagesById] = useState({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const optimisticIdRef = useRef(0);
  const lastMarkedReadIdRef = useRef(null);

  const loadRooms = useCallback(() => {
    if (!currentUser) return;
    setIsLoadingRooms(true);
    authApis
      .get(endpoints['chat-rooms-list'])
      .then(({ data }) => setRooms(data.results ?? data))
      .catch((err) => console.error('Không tải được danh sách hội thoại:', err))
      .finally(() => setIsLoadingRooms(false));
  }, [currentUser]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const totalUnread = useMemo(() => rooms.reduce((sum, r) => sum + (r.unread_count || 0), 0), [rooms]);
  const latestUnreadRoom = useMemo(() => rooms.filter((r) => r.unread_count > 0).sort((a, b) => new Date(b.last_message?.created_at || 0) - new Date(a.last_message?.created_at || 0))[0], [rooms]);

  const markRoomRead = useCallback((roomId) => {
    authApis.patch(endpoints['chat-room-mark-read'](roomId)).catch((err) => console.error('Đánh dấu đã đọc thất bại:', err));
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, unread_count: 0 } : r)));
  }, []);

  const handleSelectRoom = (room) => {
    setActiveRoom(room);
    setView('thread');
    setMessagesById({});
    setErrorMessage(null);
    lastMarkedReadIdRef.current = null;
  };

  const handleBackToList = () => {
    setView('list');
    setActiveRoom(null);
    loadRooms(); 
  };

  useEffect(() => {
    if (!activeRoom) return;
    setIsLoadingMessages(true);
    authApis
      .get(endpoints['chat-room-messages'](activeRoom.id))
      .then(({ data }) => {
        const list = data.results ?? data;
        setMessagesById((prev) => {
          const next = { ...prev };
          list.forEach((raw) => {
            next[raw.id] = normalizeRestMessage(raw);
          });
          return next;
        });
      })
      .catch((err) => console.error('Không tải được lịch sử chat:', err))
      .finally(() => setIsLoadingMessages(false));
  }, [activeRoom]);

  useEffect(() => {
    if (!activeRoom) return;
    const messagesRef = ref(db, `chat_rooms/${activeRoom.id}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const val = snapshot.val() || {};
      setMessagesById((prev) => {
        const next = { ...prev };
        Object.values(val).forEach((raw) => {
          next[raw.id] = normalizeFirebaseMessage(raw);
        });
        return next;
      });
    });
    return () => unsubscribe();
  }, [activeRoom]);

  const messages = useMemo(
    () => Object.values(messagesById).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [messagesById]
  );

  useEffect(() => {
    if (!activeRoom || messages.length === 0) return;
    const lastFromCustomer = [...messages].reverse().find((m) => m.senderId === activeRoom.customer?.id);
    if (lastFromCustomer && lastFromCustomer.id !== lastMarkedReadIdRef.current) {
      lastMarkedReadIdRef.current = lastFromCustomer.id;
      markRoomRead(activeRoom.id);
    }
  }, [messages, activeRoom, markRoomRead]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && view === 'thread') scrollToBottom();
  }, [messages.length, isOpen, view, scrollToBottom]);

  const handleSend = async (text, attachmentFile) => {
    if (!activeRoom || isSending) return;
    setErrorMessage(null);

    const tempId = `temp-${++optimisticIdRef.current}`;
    const optimisticMessage = {
      id: tempId,
      content: text,
      senderId: currentUser?.id,
      senderName: currentUser?.full_name || currentUser?.username || 'Admin',
      senderAvatar: currentUser?.avatar || null,
      attachment: attachmentFile ? URL.createObjectURL(attachmentFile) : null,
      isRead: false,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    setMessagesById((prev) => ({ ...prev, [tempId]: optimisticMessage }));
    setInputValue('');
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('content', text || '');
      if (attachmentFile) formData.append('attachment', attachmentFile);

      const { data } = await authApis.post(endpoints['chat-room-messages'](activeRoom.id), formData);

      setMessagesById((prev) => {
        const next = { ...prev };
        delete next[tempId];
        next[data.id] = normalizeRestMessage(data);
        return next;
      });
    } catch (err) {
      console.error('Gửi tin nhắn thất bại:', err);
      setMessagesById((prev) => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      setErrorMessage(err.response?.data?.content?.[0] || 'Gửi tin nhắn thất bại. Vui lòng thử lại.');
      setInputValue(text);
    } finally {
      setIsSending(false);
    }
  };

  if (!currentUser) return null;

  if (!isOpen) {
    const previewName = latestUnreadRoom?.customer?.full_name?.trim() || latestUnreadRoom?.customer?.username;
    return (
      <FloatingChatButton
        onToggle={() => {
          setIsOpen(true);
          loadRooms();
        }}
        unreadCount={totalUnread}
        lastMessagePreview={latestUnreadRoom?.last_message?.content}
        toastTitle={previewName || 'Tin nhắn mới'}
        ariaLabel="Mở tin nhắn khách hàng"
        titleAttr="Tin nhắn khách hàng"
        ctaText="Bấm để xem"
      />
    );
  }

  return (
    <div id="admin-chat-widget-container" className={styles.wrapper}>
      {view === 'list' ? (
        <AdminChatRoomList
          rooms={rooms}
          isLoading={isLoadingRooms}
          search={roomSearch}
          onSearchChange={setRoomSearch}
          onSelectRoom={handleSelectRoom}
          onClose={() => setIsOpen(false)}
        />
      ) : (
        <>
          <AdminChatThreadHeader customer={activeRoom?.customer} onBack={handleBackToList} onClose={() => setIsOpen(false)} />

          <div id="admin-chat-messages-scroll-area" className={styles.scrollArea}>
            {isLoadingMessages ? (
              <div className={styles.skeleton}>
                <div className={styles.skeletonRowLeft}>
                  <div className={styles.skeletonAvatar} />
                  <div className={styles.skeletonBubbleLeft} />
                </div>
                <div className={styles.skeletonRowRight}>
                  <div className={styles.skeletonBubbleRight} />
                </div>
              </div>
            ) : messages.length === 0 ? (
              <ChatEmptyState />
            ) : (
              messages.map((msg, index) => {
                const prev = messages[index - 1];
                const dayLabel = getDayLabel(msg.createdAt);
                const showDayGroup = !prev || getDayLabel(prev.createdAt) !== dayLabel;
                return (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.senderId !== activeRoom.customer?.id}
                    otherAvatarUrl={activeRoom.customer?.avatar}
                    otherAvatarInitial={(activeRoom.customer?.full_name?.trim() || activeRoom.customer?.username || '?').charAt(0).toUpperCase()}
                    showDayGroup={showDayGroup}
                    dayLabel={dayLabel}
                  />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

          <ChatInput value={inputValue} onChange={setInputValue} onSend={handleSend} disabled={isSending} />
        </>
      )}
    </div>
  );
};

export default AdminChatWidget;