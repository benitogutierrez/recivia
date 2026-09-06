import { create } from 'zustand'

interface ToastState {
  message: string | null
  show: (msg: string) => void
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (msg) => {
    set({ message: msg })
    setTimeout(() => set((s) => (s.message === msg ? { message: null } : {})), 2600)
  },
}))
