import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      mustChangePassword: false,

      // Actions
      login: (userData, accessToken) => {
        set({
          user: userData,
          token: accessToken,
          isAuthenticated: true,
          mustChangePassword: userData.must_change_password || false,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          mustChangePassword: false,
        });
      },

      updatePassword: () => {
        set((state) => ({
          mustChangePassword: false,
          user: state.user
            ? { ...state.user, must_change_password: false }
            : null,
        }));
      },

      // Getters
      getAuthHeader: () => {
        const { token } = get();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        mustChangePassword: state.mustChangePassword,
      }),
    }
  )
);

export default useAuthStore;
