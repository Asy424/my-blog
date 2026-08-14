"use client";

import { useState, useEffect, useCallback } from "react";
import { verifyToken } from "@/lib/github-admin";

const TOKEN_STORAGE_KEY = "gh_token";

export function useAuth() {
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tokenWarning, setTokenWarning] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      queueMicrotask(() => {
        setToken(saved);
        setIsAuthenticated(true);
      });
    }
  }, []);

  const login = useCallback(async (inputToken: string) => {
    const t = inputToken.trim();
    if (!t) return false;

    setAuthLoading(true);
    setAuthError("");
    setTokenWarning("");

    try {
      const result = await verifyToken(t);
      if (!result.valid) {
        setAuthError("Token 无效，请检查后重试");
        return false;
      }
      sessionStorage.setItem(TOKEN_STORAGE_KEY, t);
      setToken(t);
      setIsAuthenticated(true);
      setTokenWarning(result.warning);
      return true;
    } catch {
      setAuthError("验证失败，请检查网络连接");
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
    setIsAuthenticated(false);
    setAuthError("");
    setTokenWarning("");
  }, []);

  const clearAuthError = useCallback(() => setAuthError(""), []);

  return {
    token,
    isAuthenticated,
    authLoading,
    authError,
    tokenWarning,
    login,
    logout,
    clearAuthError,
  };
}
