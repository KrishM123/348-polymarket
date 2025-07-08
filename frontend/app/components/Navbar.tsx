"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <div className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <a href="/" className="text-2xl font-bold text-blue-600">
          Polymarket
        </a>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Welcome, </span>
                <span className="font-semibold text-blue-600">
                  {user?.username}
                </span>
                <span className="text-gray-600 ml-2">
                  (${user?.balance?.toFixed(2)})
                </span>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowLogin(true)}
                variant="outline"
                size="sm"
              >
                Login
              </Button>
              <Button onClick={() => setShowRegister(true)} size="sm">
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>

      <LoginForm
        open={showLogin}
        onOpenChange={setShowLogin}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />

      <RegisterForm
        open={showRegister}
        onOpenChange={setShowRegister}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </>
  );
};

export default Navbar;
