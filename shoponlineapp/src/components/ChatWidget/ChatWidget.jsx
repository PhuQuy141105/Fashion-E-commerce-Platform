import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ref, onValue } from 'firebase/database';
import { authApis, endpoints } from '../../configs/Apis';
import { db } from '../../configs/FirebaseConfig';
import FloatingChatButton from '../FloatingChatButton/FloatingChatButton';
import ChatHeader from '../ChatHeader/ChatHeader';
import ChatMessageBubble from '../ChatMessageBubble/ChatMessageBubble';
import ChatEmptyState from '../ChatEmptyState/ChatEmptyState';
import ChatQuickActions from '../ChatQuickActions/ChatQuickActions';
import ChatInput from '../ChatInput/ChatInput';
import styles from './ChatWidget.module.css';

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

export const ChatWidget = ({
  currentUser,
  headerTitle = 'Hỗ trợ khách hàng',
  headerSubtitle = 'Trò chuyện trực tiếp với shop',
  toastTitle = 'Hỗ trợ khách hàng',
  ariaLabel = 'Mở chat với shop',
  titleAttr = 'Nhắn tin với shop',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [messagesById, setMessagesById] = useState({});
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const optimisticIdRef = useRef(0);

  useEffect(() => {
    if (!currentUser) return;
    authApis
      .get(endpoints['chat-room'])
      .then(({ data }) => setRoomId(data.id))
      .catch((err) => console.error('Không lấy được phòng chat:', err))
      .finally(() => setIsLoadingRoom(false));
  }, [currentUser]);

  useEffect(() => {
    if (!roomId) return;
    setIsLoadingHistory(true);
    authApis
      .get(endpoints['chat-room-messages'](roomId))
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
      .finally(() => setIsLoadingHistory(false));
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const messagesRef = ref(db, `chat_rooms/${roomId}/messages`);
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
  }, [roomId]);

  const messages = useMemo(
    () => Object.values(messagesById).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [messagesById]
  );

  const unreadCount = useMemo(
    () => messages.filter((m) => m.senderId !== currentUser?.id && !m.isRead).length,
    [messages, currentUser]
  );

  const lastMessagePreview = useMemo(() => {
    const lastFromOther = [...messages].reverse().find((m) => m.senderId !== currentUser?.id);
    return lastFromOther?.content || null;
  }, [messages, currentUser]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages.length, isOpen, scrollToBottom]);

  const handleSend = async (text, attachmentFile) => {
    if (!roomId || isSending) return;
    setErrorMessage(null);

    const tempId = `temp-${++optimisticIdRef.current}`;
    const optimisticMessage = {
      id: tempId,
      content: text,
      senderId: currentUser?.id,
      senderName: currentUser?.full_name || currentUser?.username || 'Bạn',
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

      const { data } = await authApis.post(endpoints['chat-room-messages'](roomId), formData);

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
    return (
      <FloatingChatButton
        onToggle={() => setIsOpen(true)}
        unreadCount={unreadCount}
        lastMessagePreview={lastMessagePreview}
        toastTitle={toastTitle}
        ariaLabel={ariaLabel}
        titleAttr={titleAttr}
      />
    );
  }

  const isLoading = isLoadingRoom || isLoadingHistory;

  return (
    <div id="live-chat-widget-container" className={styles.wrapper}>
      <ChatHeader onClose={() => setIsOpen(false)} title={headerTitle} subtitle={headerSubtitle} />

      <div id="chat-messages-scroll-area" className={styles.scrollArea}>
        {messages.length === 0 && !isLoading && (
          <ChatQuickActions onSelectSuggestion={(text) => setInputValue(text)} disabled={isSending} />
        )}

        {isLoading ? (
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
                isOwn={msg.senderId === currentUser.id}
                showDayGroup={showDayGroup}
                dayLabel={dayLabel}
              />
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

      <ChatInput value={inputValue} onChange={setInputValue} onSend={handleSend} disabled={isSending || !roomId} />
    </div>
  );
};

export default ChatWidget;