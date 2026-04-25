import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUiStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'ui-storage',
      // Only persist necessary UI state
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    }
  )
);

export default useUiStore;
