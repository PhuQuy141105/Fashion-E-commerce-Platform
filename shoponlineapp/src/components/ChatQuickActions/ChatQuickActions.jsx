import { Sparkles } from 'lucide-react';
import styles from './ChatQuickActions.module.css';

const QUICK_SUGGESTIONS = [
  { id: 'order-status', label: 'Kiểm tra đơn hàng', promptText: 'Cho tôi hỏi tình trạng đơn hàng của tôi hiện tại thế nào?' },
  { id: 'return-policy', label: 'Chính sách đổi trả', promptText: 'Chính sách đổi trả sản phẩm của shop như thế nào?' },
  { id: 'sizing', label: 'Tư vấn size', promptText: 'Tôi cần tư vấn chọn size phù hợp.' },
  { id: 'shipping', label: 'Phí vận chuyển', promptText: 'Phí và thời gian giao hàng của shop là bao lâu?' },
];

export const ChatQuickActions = ({ onSelectSuggestion, disabled = false }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.greeting}>
        <div className={styles.greetingTitle}>Xin chào! 👋 Chào mừng bạn đến với shop.</div>
        <p className={styles.greetingText}>Bạn cần hỗ trợ gì? Chọn 1 chủ đề bên dưới hoặc nhập tin nhắn trực tiếp.</p>
      </div>

      <div className={styles.chips}>
        {QUICK_SUGGESTIONS.map((sug) => (
          <button
            key={sug.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSuggestion(sug.promptText)}
            className={styles.chip}
          >
            <Sparkles className={styles.chipIcon} />
            <span>{sug.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatQuickActions;