'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  username: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  balance?: number;
};

type AuthContextType = {
  user: User | null;
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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user = users[username.toLowerCase()];
      if (user && user.password === password) {
        setUser({ username: user.username, email: user.email });
        return { success: true };
      }
      return { success: false, message: 'Invalid username or password' };
    } catch (error) {
      return { success: false, message: 'An error occurred during login' };
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

      users[username.toLowerCase()] = { 
        username, 
        email, 
        password, 
        name, 
        phoneNumber 
      };
      setUser({ 
        username, 
        email, 
        name: name || '', 
        phoneNumber: phoneNumber || '' 
      });
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Failed to connect to server' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoading(false);
    router.push('/');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
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
