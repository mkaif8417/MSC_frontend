import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api/v1",

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error?.response?.status;

    const errorCode =
      error?.response?.data?.error?.code;

    const authenticationErrors = [
      "UNAUTHORIZED",
      "INVALID_TOKEN",
      "TOKEN_EXPIRED",
    ];

    if (
      status === 401 &&
      authenticationErrors.includes(errorCode)
    ) {
      window.location.href = "/login";
    }

    return Promise.reject({
      status,
      code: errorCode || "UNKNOWN_ERROR",
      message:
        error?.response?.data?.error?.message ||
        "Something went wrong. Please try again.",
      details:
        error?.response?.data?.error?.details,
    });
  }
);

export default axiosInstance;