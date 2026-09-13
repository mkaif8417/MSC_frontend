import axiosInstance from "./AxiosInstance";

export const login = async (payload) => {
  const response = await axiosInstance.post(
    "/auth/login",
    payload
  );

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axiosInstance.get(
    "/auth/me"
  );

  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post(
    "/auth/logout"
  );

  return response.data;
};