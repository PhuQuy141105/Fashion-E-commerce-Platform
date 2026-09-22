export const setAccessToken = (value) => localStorage.setItem("accessToken", value);
export const getAccessToken = () => localStorage.getItem("accessToken");
export const removeAccessToken = () => localStorage.removeItem("accessToken");
export const setRefreshToken = (value) => localStorage.setItem("refreshToken", value);
export const getRefreshToken = () => localStorage.getItem("refreshToken");
export const removeRefreshToken = () => localStorage.removeItem("refreshToken");
export const setUser = (user) => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
};export const getUser = () => {
  const saved = localStorage.getItem("user");
  if (!saved || saved === "undefined") {
    return null;
  }
  try {
    return JSON.parse(saved);
  } catch (error) {
    localStorage.removeItem("user");
    return null;
  }
};
export const removeUser = () => localStorage.removeItem("user");