import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { AuthContext } from "../../configs/Context";
import styles from "./Login.module.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [fieldErrors, setFieldErrors] = useState({});
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({
    username: false,
    password: false,
  });

  const { handleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};

    if (!username.trim()) {
      errors.username = "Username là bắt buộc";
    }

    if (!password) {
      errors.password = "Password là bắt buộc";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setAuthError("");

    setTouched({
      username: true,
      password: true,
    });

    const errors = validate();

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const loggedInUser = await handleLogin(username.trim(), password);

      const role = loggedInUser?.role;
      navigate(role === "ADMIN" ? "/admin/products" : role === "SHIPPER" ? "/shipper/deliveries" : "/products");
    } catch (err) {
      setAuthError("Username hoặc password không hợp lệ");
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;

    setUsername(value);

    if (authError) {
      setAuthError("");
    }

    if (value.trim()) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.username;
        return next;
      });
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;

    setPassword(value);

    if (authError) {
      setAuthError("");
    }

    if (value) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.password;
        return next;
      });
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>

        <div className={styles.loginLogo}>
          <div className={styles.brandLogo}>
            <span className={styles.brandLogoLetter}>
              W
            </span>

            <div className={styles.brandLogoText}>
              <span className={styles.brandLogoName}>
                ATELIER
              </span>

              <span className={styles.brandLogoSub}>
                FUWUYS ATELIER
              </span>
            </div>
          </div>
        </div>

        <div className={styles.loginHeader}>
          <h1>Chào mừng trở lại</h1>

          <p>
            Đăng nhập để shopping tiếp nhe
          </p>
        </div>

        {authError && (
          <div className={styles.loginAlert}>
            <AlertCircle size={17} />

            <span>{authError}</span>
          </div>
        )}

        <form
          className={styles.loginForm}
          onSubmit={handleSubmit}
          noValidate
        >

          <div className={styles.formGroup}>
            <div
              className={`${styles.floatingField} ${
                fieldErrors.username
                  ? styles.hasError
                  : ""
              }`}
            >
              <Mail
                className={`${styles.fieldIcon} ${
                  fieldErrors.username
                    ? styles.hasError
                    : ""
                }`}
                size={18}
              />

              <input
                id="signin-identifier-input"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                onBlur={() =>
                  setTouched((prev) => ({
                    ...prev,
                    username: true,
                  }))
                }
                placeholder=" "
                autoComplete="username"
                disabled={loading}
              />

              <label htmlFor="signin-identifier-input">
                Username
              </label>
            </div>

            {fieldErrors.username && (
              <p className={styles.fieldError}>
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <div
              className={`${styles.floatingField} ${
                fieldErrors.password
                  ? styles.hasError
                  : ""
              }`}
            >
              <Lock
                className={`${styles.fieldIcon} ${
                  fieldErrors.password
                    ? styles.hasError
                    : ""
                }`}
                size={18}
              />

              <input
                id="signin-password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                onBlur={() =>
                  setTouched((prev) => ({
                    ...prev,
                    password: true,
                  }))
                }
                placeholder=" "
                autoComplete="current-password"
                disabled={loading}
              />

              <label htmlFor="signin-password-input">
                Password
              </label>

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                disabled={loading}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {!showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>

            {fieldErrors.password && (
              <p className={styles.fieldError}>
                {fieldErrors.password}
              </p>
            )}
            <div className={styles.loginOptions}>
              <label className={styles.rememberMe}>
                <input
                  type="checkbox"
                  checked={remember}
                  disabled={loading}
                  onChange={(e) =>
                    setRemember(e.target.checked)
                  }
                />

                <span>Remember Me</span>
              </label>

              <button
                type="button"
                className={styles.forgotLink}
                onClick={() => {
                  // navigate("/forgot-password");
                }}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.loginSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className={styles.loadingIcon}
                />

                <span>
                  Đang đăng nhập...
                </span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>

          <div className={styles.loginRegister}>
            <span>
              Chưa có tài khoản ?
            </span>

            <button
              type="button"
              onClick={() => navigate("/register")}
            >
              Tạo ngay
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}