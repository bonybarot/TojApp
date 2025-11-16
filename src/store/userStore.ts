import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserStore {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useUserStore = create<UserStore>(set => ({
  user: null,
  isLoggedIn: false,
  login: (email: string, password: string) => {
    // Mock login - in real app, this would call an API
    const mockUser: User = {
      id: '1',
      name: 'John Doe',
      email: email,
      avatar: 'https://i.pravatar.cc/150?img=1',
    };
    set({
      user: mockUser,
      isLoggedIn: true,
    });
  },
  logout: () => {
    set({
      user: null,
      isLoggedIn: false,
    });
  },
  setUser: (user: User) => {
    set({ user });
  },
}));
