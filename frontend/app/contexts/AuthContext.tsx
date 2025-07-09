"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, tokenStorage } from "../../lib/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUserBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = tokenStorage.getToken();
    const savedUser = tokenStorage.getUser();

    if (token && savedUser) {
      setUser(savedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (userData: User, token: string) => {
    tokenStorage.setToken(token);
    tokenStorage.setUser(userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    tokenStorage.removeToken();
    tokenStorage.removeUser();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      tokenStorage.setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, updateUserBalance }}
    >
      {children}
    </AuthContext.Provider>
  );
};
