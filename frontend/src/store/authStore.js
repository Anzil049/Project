import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  role: null,
  loading: true, // Start as loading to check auth on mount

  login: (userData) => {
    // Save token per-role in localStorage (shared across tabs)
    if (userData.token) {
      localStorage.setItem(`medcare_token_${userData.role}`, userData.token);
    }
    // Save active role in sessionStorage (per-tab, so each tab keeps its own role)
    sessionStorage.setItem('medcare_active_role', userData.role);

    set({ 
      user: userData, 
      isAuthenticated: true, 
      role: userData.role,
      loading: false
    });
  },
  
  logout: () => {
    const activeRole = sessionStorage.getItem('medcare_active_role');
    if (activeRole) {
      localStorage.removeItem(`medcare_token_${activeRole}`);
    }
    sessionStorage.removeItem('medcare_active_role');
    set({ user: null, isAuthenticated: false, role: null, loading: false });
  },
  
  setLoading: (isLoading) => set({ loading: isLoading }),

  updateUser: (updatedUser) => set((state) => ({ 
    user: { ...state.user, ...updatedUser } 
  })),
}));

export default useAuthStore;
