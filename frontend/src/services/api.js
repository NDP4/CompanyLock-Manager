import axios from "axios";
import useAuthStore from "@/store/authStore";
import toast from "react-hot-toast";

// Base axios instance
const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  (config) => {
    const { getAuthHeader } = useAuthStore.getState();
    const authHeaders = getAuthHeader();

    config.headers = {
      ...config.headers,
      ...authHeaders,
      "Content-Type": config.headers["Content-Type"] || "application/json",
    };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token tidak valid, logout user
      const { logout } = useAuthStore.getState();
      logout();
      toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
    } else if (error.response?.status >= 500) {
      toast.error("Terjadi kesalahan pada server. Silakan coba lagi.");
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (username, password) => {
    const response = await api.post("/auth/login", { username, password });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};

// Users API
export const usersApi = {
  getUsers: async () => {
    const response = await api.get("/users");
    return response.data;
  },

  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
};

// Tokens API
export const tokensApi = {
  generateToken: async (userId, durationMinutes) => {
    const response = await api.post("/tokens/generate", {
      user_id: userId,
      duration_minutes: durationMinutes,
    });
    return response.data;
  },

  useToken: async (token) => {
    const response = await api.post("/tokens/use", { token });
    return response.data;
  },
};

// CSV API
export const csvApi = {
  downloadTemplate: async () => {
    const response = await api.get("/csv/template", {
      responseType: "blob",
    });
    return response.data;
  },

  importUsers: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/csv/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

// Audit Logs API
export const auditApi = {
  getLogs: async (limit = 100) => {
    const response = await api.get(`/audit-logs?limit=${limit}`);
    return response.data;
  },
};

// Health Check API
export const healthApi = {
  check: async () => {
    const response = await api.get("/health");
    return response.data;
  },
};

export default api;
