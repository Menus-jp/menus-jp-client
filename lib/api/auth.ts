import axios, { AxiosInstance } from "axios";
import { LoginResponse, RegisterResponse, AuthError } from "@/lib/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8005/api";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
  }
  // For FormData, remove the default application/json Content-Type so the
  // browser can set multipart/form-data with the correct boundary automatically.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("sessionId");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: async (
    idToken: string,
    accessToken?: string,
    redirectUrl?: string,
  ): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post("/auth/google-login/", {
        id_token: idToken,
        access_token: accessToken,
        redirect_url: redirectUrl,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData: AuthError = error.response?.data || {
          error: "REQUEST_ERROR",
          message: error.message,
          details: "Failed to complete login request",
        };
        throw errorData;
      }
      throw error;
    }
  },

  register: async (
    idToken: string,
    username?: string,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string,
    accessToken?: string,
    signupFlow: string = "web",
    redirectUrl?: string,
  ): Promise<RegisterResponse> => {
    try {
      const response = await apiClient.post("/auth/google-register/", {
        id_token: idToken,
        access_token: accessToken,
        username,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        signup_flow: signupFlow,
        redirect_url: redirectUrl,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData: AuthError = error.response?.data || {
          error: "REQUEST_ERROR",
          message: error.message,
          details: "Failed to complete registration request",
        };
        throw errorData;
      }
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get("/users/me/");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData: AuthError = error.response?.data || {
          error: "REQUEST_ERROR",
          message: error.message,
          details: "Failed to fetch user profile",
        };
        throw errorData;
      }
      throw error;
    }
  },

  logout: () => {
    // Clear local storage and cookies
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionId");
  },
};

export default apiClient;
