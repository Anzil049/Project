import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      role: null,
      token: null,
      
      login: (userData) => set({ 
        user: userData, 
        isAuthenticated: true, 
        role: userData.role,
        token: userData.token 
      }),
      
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false, role: null, token: null });
      },
      
      updateUser: (updatedUser) => set((state) => ({ 
        user: { ...state.user, ...updatedUser } 
      })),
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useAuthStore;
