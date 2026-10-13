import { createContext } from 'react';
import type { CurrentUser, UserRole } from '../types';

export interface AuthContextType {
  user: CurrentUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, role: UserRole, name?: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
