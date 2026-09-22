import { Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import styles from "./RegistrationSuccessModal.module.css";

const RegistrationSuccessModal = ({
  isOpen,
  onLogin,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="registration-success-modal-overlay"
          className={styles.registrationModalOverlay}
        >
          <motion.div
            className={styles.registrationModalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />


          <motion.div
            id="registration-success-modal"
            className={styles.registrationSuccessModal}
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 15,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 15,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
           

            <div
              id="registration-success-icon"
              className={styles.registrationSuccessIcon}
            >
              <Check />
            </div>

         

            <h3
              id="registration-success-title"
              className={styles.registrationSuccessTitle}
            >
              Đăng ký tài khoản thành công
            </h3>

          
            <p
              id="registration-success-description"
              className={styles.registrationSuccessDescription}
            >
              Tài khoản của bạn đã được khởi tạo thành công.
              Vui lòng đăng nhập để bắt đầu trải nghiệm mua sắm.
            </p>

          
            <button
              type="button"
              id="registration-success-login-btn"
              className={styles.registrationSuccessLoginBtn}
              onClick={onLogin}
            >
              <span>Đăng nhập</span>

              <ArrowRight size={17} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RegistrationSuccessModal;