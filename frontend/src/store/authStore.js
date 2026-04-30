import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  role: null,
  loading: true, // Start as loading to check auth on mount

  login: (userData) => set({ 
    user: userData, 
    isAuthenticated: true, 
    role: userData.role,
    loading: false
  }),
  
  logout: () => {
    set({ user: null, isAuthenticated: false, role: null, loading: false });
  },
  
  setLoading: (isLoading) => set({ loading: isLoading }),

  updateUser: (updatedUser) => set((state) => ({ 
    user: { ...state.user, ...updatedUser } 
  })),
}));

export default useAuthStore;
