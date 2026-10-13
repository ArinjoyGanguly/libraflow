import React, { useState, useEffect } from 'react';
import type { CurrentUser, UserRole } from '../types';
import { AuthContext } from './auth-context';

const PRESET_USERS: Record<UserRole, CurrentUser> = {
  admin: {
    userId: 'AD01',
    name: 'Suresh Kumar',
    email: 'admin1@libraflow.edu',
    role: 'admin',
  },
  employee: {
    userId: 'E01',
    name: 'Ramesh Sharma',
    email: 'ramesh.s@libraflow.edu',
    role: 'employee',
  },
  member: {
    userId: 'M001',
    name: 'Aarav Patel',
    email: 'aarav.patel@student.edu',
    role: 'member',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem('libraflow_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return PRESET_USERS.admin;
      }
    }
    return PRESET_USERS.admin;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('libraflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('libraflow_user');
    }
  }, [user]);

  const switchRole = (newRole: UserRole) => {
    setUser(PRESET_USERS[newRole]);
  };

  const login = (email: string, role: UserRole, name?: string) => {
    setUser({
      userId: role === 'admin' ? 'AD01' : role === 'employee' ? 'E01' : 'M001',
      name: name || (role === 'admin' ? 'Admin' : role === 'employee' ? 'Staff Librarian' : 'Student Member'),
      email,
      role,
    });
  };

  const logout = () => {
    setUser(null);
  };

  const role = user?.role || 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, switchRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
