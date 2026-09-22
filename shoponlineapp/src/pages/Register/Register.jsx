import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";

import RegistrationSuccessModal from "../../components/RegistrationSuccessModal/RegistrationSuccessModal";
import apis, { endpoints } from "../../configs/Apis";

import styles from "./Register.module.css";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    gender: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState({});



  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "Vui lòng nhập tên";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Vui lòng nhập họ";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Vui lòng nhập tên đăng nhập";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!formData.gender) {
      newErrors.gender = "Vui lòng chọn giới tính";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const res = await apis.post(
        endpoints["users"],
        formData
      );

      console.log(res.data);

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Status:", error.response?.status);
  console.error("Data:", error.response?.data);
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    handleRegister();
  };


  const handleNavigateLogin = () => {
    setShowSuccessModal(false);
    navigate("/");
  };

  return (
    <>
      <div className={styles.registerPage}>
        <div className={styles.registerContainer}>

  

          <div className={styles.registerBrand}>
            <div className={styles.registerBrandContent}>

              <div className={styles.registerLogo}>
                <UserPlus size={30} />
              </div>

              <h1>Chào mừng bạn!</h1>

              <p>
                Tạo tài khoản để bắt đầu trải nghiệm
                mua sắm cùng Quý
              </p>

            </div>
          </div>

        

          <div className={styles.registerFormSection}>


            <div className={styles.registerHeader}>
              <h2>Tạo tài khoản</h2>

              <p>
                Điền thông tin bên dưới để đăng ký tài khoản
              </p>
            </div>


            <form
              onSubmit={handleSubmit}
              className={styles.registerForm}
            >

            

              <div className={styles.formRow}>


                <div className={styles.formGroup}>
                  <label htmlFor="last_name">
                    Họ
                  </label>

                  <input
                    id="last_name"
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Nhập họ"
                    className={
                      errors.last_name
                        ? styles.inputError
                        : ""
                    }
                  />

                  {errors.last_name && (
                    <span className={styles.errorMessage}>
                      {errors.last_name}
                    </span>
                  )}
                </div>


                <div className={styles.formGroup}>
                  <label htmlFor="first_name">
                    Tên
                  </label>

                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Nhập tên"
                    className={
                      errors.first_name
                        ? styles.inputError
                        : ""
                    }
                  />

                  {errors.first_name && (
                    <span className={styles.errorMessage}>
                      {errors.first_name}
                    </span>
                  )}
                </div>

              </div>

          
              <div className={styles.formGroup}>
                <label htmlFor="username">
                  Tên đăng nhập
                </label>

                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Nhập tên đăng nhập"
                  className={
                    errors.username
                      ? styles.inputError
                      : ""
                  }
                />

                {errors.username && (
                  <span className={styles.errorMessage}>
                    {errors.username}
                  </span>
                )}
              </div>

            

              <div className={styles.formGroup}>
                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className={
                    errors.email
                      ? styles.inputError
                      : ""
                  }
                />

                {errors.email && (
                  <span className={styles.errorMessage}>
                    {errors.email}
                  </span>
                )}
              </div>

          
              <div className={styles.formRow}>

         

                <div className={styles.formGroup}>
                  <label htmlFor="phone">
                    Số điện thoại
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    className={
                      errors.phone
                        ? styles.inputError
                        : ""
                    }
                  />

                  {errors.phone && (
                    <span className={styles.errorMessage}>
                      {errors.phone}
                    </span>
                  )}
                </div>

   

                <div className={styles.formGroup}>
                  <label htmlFor="gender">
                    Giới tính
                  </label>

                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={
                      errors.gender
                        ? styles.inputError
                        : ""
                    }
                  >
                    <option value="">
                      Chọn giới tính
                    </option>

                    <option value="MALE">
                      Nam
                    </option>

                    <option value="FEMALE">
                      Nữ
                    </option>

                    <option value="OTHER">
                      Khác
                    </option>
                  </select>

                  {errors.gender && (
                    <span className={styles.errorMessage}>
                      {errors.gender}
                    </span>
                  )}
                </div>

              </div>

            

              <div className={styles.formGroup}>
                <label htmlFor="password">
                  Mật khẩu
                </label>

                <div className={styles.passwordWrapper}>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu"
                    className={
                      errors.password
                        ? styles.inputError
                        : ""
                    }
                  />

                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword
                        ? "Ẩn mật khẩu"
                        : "Hiện mật khẩu"
                    }
                  >
                    {!showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

                {errors.password && (
                  <span className={styles.errorMessage}>
                    {errors.password}
                  </span>
                )}
              </div>

            
              <button
                type="submit"
                className={styles.registerButton}
              >
                Đăng ký
              </button>

            </form>

         
            <div className={styles.loginRedirect}>
              <span>
                Đã có tài khoản?
              </span>

              <button
                type="button"
                onClick={() => navigate("/")}
              >
                Đăng nhập
              </button>
            </div>

          </div>
        </div>
      </div>



      <RegistrationSuccessModal
        isOpen={showSuccessModal}
        onLogin={handleNavigateLogin}
      />
    </>
  );
};

export default Register;