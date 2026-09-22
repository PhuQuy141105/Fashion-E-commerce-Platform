import { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import styles from './ChatInput.module.css';

export const ChatInput = ({ value, onChange, onSend, disabled = false }) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachmentFile, setAttachmentFile] = useState(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [value]);

  const canSend = (value.trim() || attachmentFile) && !disabled;

  const handleSubmit = () => {
    if (!canSend) return;
    onSend(value.trim(), attachmentFile);
    setAttachmentFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setAttachmentFile(file);
  };

  return (
    <div className={styles.wrapper}>
      {attachmentFile && (
        <div className={styles.attachmentPreview}>
          <Paperclip className={styles.attachmentPreviewIcon} />
          <span className={styles.attachmentPreviewName}>{attachmentFile.name}</span>
          <button
            type="button"
            onClick={() => {
              setAttachmentFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className={styles.attachmentPreviewRemove}
            aria-label="Bỏ tệp đính kèm"
          >
            <X className={styles.attachmentPreviewRemoveIcon} />
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className={styles.form}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className={styles.hiddenFileInput} />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={styles.attachButton}
          aria-label="Đính kèm ảnh"
          title="Đính kèm ảnh"
        >
          <Paperclip className={styles.attachIcon} />
        </button>

        <textarea
          ref={textareaRef}
          id="chat-input-textarea"
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          disabled={disabled}
          className={styles.textarea}
        />

        <button
          type="submit"
          id="chat-input-send-btn"
          disabled={!canSend}
          className={styles.sendButton}
          aria-label="Gửi tin nhắn"
        >
          <Send className={styles.sendIcon} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;