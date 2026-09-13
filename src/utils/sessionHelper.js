import { getCurrentUser } from "../services/authService";

export const checkLoginStatus = async () => {
  try {
    const response = await getCurrentUser();

    if (response?.success && response?.data?.user) {
      return response;
    }

    return null;
  } catch (error) {
    return null;
  }
};