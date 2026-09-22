import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, History, Plus, Sparkle } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import AIChatBubble from '../AIChatBubble/AIChatBubble';
import AITypingIndicator from '../AITypingIndicator/AITypingIndicator';
import AIWelcomeState from '../AIWelcomeState/AIWelcomeState';
import AISessionHistory from '../AISessionHistory/AISessionHistory';
import ProductOptionModal from '../ProductOptionModal/ProductOptionModal';
import styles from './AIStylistModal.module.css';

export const AIStylistModal = ({ isOpen, onClose, currentUser }) => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [cartModalProduct, setCartModalProduct] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const loadSessions = async () => {
    try {
      const { data } = await authApis.get(endpoints['ai-stylist-sessions']);
      setSessions(data.results ?? data);
    } catch (err) {
      console.error('Không tải được lịch sử AI Stylist:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    } else {
      setIsHistoryOpen(false);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [activeSession, isSubmitting, isOpen]);

  const handleTextareaChange = (e) => {
    setInputPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSend = async () => {
    const text = inputPrompt.trim();
    if (!text || isSubmitting) return;
    setInputPrompt('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = { query_text: text };
      if (activeSession?.id) {
        payload.previous_session_id = activeSession.id;
      }
      const { data } = await authApis.post(endpoints['ai-stylist-query'], payload);
      setSessions((prev) => [data, ...prev]);
      setActiveSession(data);
    } catch (err) {
      console.error('AI Stylist query thất bại:', err);
      const message = err.response?.data?.error || err.response?.data?.query_text?.[0] || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
      setErrorMessage(Array.isArray(message) ? message[0] : message);
      setInputPrompt(text);
    } finally {
      setIsSubmitting(false);
    }
};

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewSession = () => {
    setActiveSession(null);
    setErrorMessage(null);
    setInputPrompt('');
    textareaRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        id="ai-stylist-modal-overlay"
        className={styles.overlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div id="ai-stylist-modal-content" className={styles.modal}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <button
                type="button"
                id="ai-stylist-history-toggle-btn"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className={`${styles.historyButton} ${isHistoryOpen ? styles.historyButtonActive : ''}`}
                aria-label="Lịch sử tư vấn"
              >
                <History className={styles.historyIcon} />
                <span className={styles.historyLabel}>Lịch sử</span>
              </button>

              <div>
                <div className={styles.titleRow}>
                  <span className={styles.title}>
                    
                    AI Stylist
                  </span>
                </div>
                <p className={styles.subtitle}>Mô tả nhu cầu, AI sẽ gợi ý trang phục phù hợp cho bạn</p>
              </div>
            </div>

            <div className={styles.headerRight}>
              <button type="button" id="ai-stylist-new-session-btn" onClick={handleNewSession} className={styles.newButton}>
                <Plus className={styles.newButtonIcon} />
                <span className={styles.newButtonLabel}>Mới</span>
              </button>

              <button type="button" id="ai-stylist-close-btn" onClick={onClose} className={styles.closeButton} aria-label="Đóng">
                <X className={styles.closeIcon} />
              </button>
            </div>
          </div>

          <div className={styles.body}>
            {isHistoryOpen && (
              <div className={styles.historyDrawer}>
                <AISessionHistory
                  sessions={sessions}
                  activeSessionId={activeSession?.id}
                  onSelectSession={(session) => setActiveSession(session)}
                  onNewSession={handleNewSession}
                  onClose={() => setIsHistoryOpen(false)}
                />
              </div>
            )}

            <div className={styles.conversationArea}>
              <div id="ai-stylist-messages-container" className={styles.messagesContainer}>
                {!activeSession && !isSubmitting && <AIWelcomeState />}

                {activeSession && (
                  <AIChatBubble
                    session={activeSession}
                    userName={currentUser?.full_name || currentUser?.username || 'Bạn'}
                    onSelectForCart={setCartModalProduct}
                    onNavigateAway={onClose}
                  />
                )}

                {isSubmitting && <AITypingIndicator />}

                <div ref={messagesEndRef} />
              </div>

              <div className={styles.inputArea}>
                {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className={styles.inputForm}
                >
                  <div className={styles.inputSparkle}>
                    <Sparkle className={styles.inputSparkleIcon} />
                  </div>

                  <textarea
                    ref={textareaRef}
                    id="ai-stylist-input-textarea"
                    rows={1}
                    value={inputPrompt}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                    placeholder="Mô tả trang phục bạn cần... (vd: 'Đồ dự tiệc cưới dưới 2 triệu, tông be')"
                    className={styles.textarea}
                  />

                  <button
                    type="submit"
                    id="ai-stylist-send-btn"
                    disabled={!inputPrompt.trim() || isSubmitting}
                    className={styles.sendButton}
                    aria-label="Gửi yêu cầu"
                  >
                    <Send className={styles.sendIcon} />
                  </button>
                </form>

                
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductOptionModal
        isOpen={Boolean(cartModalProduct)}
        product={cartModalProduct}
        onClose={() => setCartModalProduct(null)}
      />
    </>
  );
};

export default AIStylistModal;