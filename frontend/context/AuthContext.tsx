'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: number;
  username: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  balance?: number;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  createAccount: (
    username: string, 
    email: string, 
    password: string, 
    name: string, 
    phoneNumber: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory user storage (for demo purposes only)
type UserStorage = {
  [key: string]: {
    username: string;
    email: string;
    password: string;
    name?: string;
    phoneNumber?: string;
  };
};

const users: UserStorage = {};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Load user from localStorage and cookies on app startup
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken') || 
                       document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error loading stored auth data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Login failed' };
      }

      // Store token and user data
      setToken(data.token);
      setUser(data.user);
      
      // Store token in localStorage for persistence
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Also store in cookies for SSR compatibility
      document.cookie = `authToken=${data.token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Failed to connect to server' };
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = async (
    username: string, 
    email: string, 
    password: string, 
    name: string, 
    phoneNumber: string
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          name,
          phoneNumber
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Registration failed' };
      }

      // After successful registration, automatically log in
      const loginResult = await login(username, password);
      if (loginResult.success) {
      return { success: true };
      } else {
        return { success: false, message: 'Account created but login failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Failed to connect to server' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsLoading(false);
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear cookies
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token,
        login, 
        createAccount,
        logout, 
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
