import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  role: string | null;
  permissions: string[];
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('aura_access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await ApiClient.request('/auth/me');
      setUser(data.user);
      setOrganization(data.organization);
      setRole(data.role);
      setPermissions(data.permissions || []);
    } catch (err) {
      console.error('Failed to load current user session:', err);
      localStorage.removeItem('aura_access_token');
      localStorage.removeItem('aura_refresh_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: any) => {
    const data = await ApiClient.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    localStorage.setItem('aura_access_token', data.accessToken);
    localStorage.setItem('aura_refresh_token', data.refreshToken);
    setUser(data.user);
    setOrganization(data.user.organization);
    setRole(data.user.role);
    setPermissions(data.user.permissions || []);
  };

  const register = async (userData: any) => {
    const data = await ApiClient.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    localStorage.setItem('aura_access_token', data.accessToken);
    localStorage.setItem('aura_refresh_token', data.refreshToken);
    setUser(data.user);
    setOrganization(data.user.organization);
    setRole(data.user.role);
    setPermissions(data.user.permissions || []);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('aura_refresh_token');
    try {
      await ApiClient.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('aura_access_token');
    localStorage.removeItem('aura_refresh_token');
    setUser(null);
    setOrganization(null);
    setRole(null);
    setPermissions([]);
  };

  const hasPermission = (perm: string) => {
    return permissions.includes(perm) || role === 'SUPER_ADMIN' || role === 'ORGANIZATION_ADMIN';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        role,
        permissions,
        loading,
        login,
        register,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
