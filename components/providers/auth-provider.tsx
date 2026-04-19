"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { authApi } from "@/lib/api/auth";
import {
  AuthContextType,
  LoginResponse,
  RegisterResponse,
  User,
} from "@/lib/types/auth";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

/** Persists token, user and sessionId to localStorage in one synchronous pass. */
function storeAuthData(token: string, user: User, sessionId: string): void {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("sessionId", sessionId);
}

/** Removes all auth keys from localStorage in one synchronous pass. */
function clearAuthData(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("sessionId");
}

/**
 * Extracts a human-readable error message from any thrown value,
 * with HTTP-status-aware copy for common cases.
 */
function extractErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) {
    if (err instanceof Error) return err.message;
    return fallback;
  }

  const status = err.response?.status;
  const data = err.response?.data as Record<string, unknown> | undefined;

  const apiMessage =
    (typeof data?.message === "string" && data.message) ||
    (typeof data?.detail === "string" && data.detail) ||
    (typeof data?.error === "string" && data.error) ||
    null;

  if (apiMessage) return apiMessage;

  if (!err.response) {
    return navigator.onLine
      ? "サーバーに接続できませんでした。しばらくしてから再試行してください。"
      : "インターネット接続を確認してください。";
  }

  switch (status) {
    case 400:
      return "入力内容に誤りがあります。確認してください。";
    case 401:
      return "セッションが無効です。再度ログインしてください。";
    case 403:
      return "この操作は許可されていません。";
    case 404:
      return "リソースが見つかりませんでした。";
    case 429:
      return "リクエストが多すぎます。しばらくしてから再試行してください。";
    default:
      if (status && status >= 500)
        return "サーバーエラーが発生しました。しばらくしてから再試行してください。";
      return fallback;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Restore session from localStorage (runs once on mount, client-only) ──
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserRaw = localStorage.getItem("user");
    const storedSessionId = localStorage.getItem("sessionId");

    if (storedToken) setToken(storedToken);
    if (storedSessionId) setSessionId(storedSessionId);

    if (storedUserRaw) {
      try {
        setUser(JSON.parse(storedUserRaw));
      } catch {
        // Corrupted data — wipe and start fresh
        clearAuthData();
      }
    }

    setLoading(false);
  }, []);

  const applyAuthResponse = useCallback(
    (response: LoginResponse | RegisterResponse) => {
      storeAuthData(response.token, response.user, response.session_id);
      setToken(response.token);
      setUser(response.user);
      setSessionId(response.session_id);
    },
    [],
  );

  const login = useCallback(
    async (idToken: string, accessToken?: string, redirectUrl?: string) => {
      setError(null);
      setLoading(true);
      try {
        const response = await authApi.login(idToken, accessToken, redirectUrl);
        applyAuthResponse(response);
      } catch (err) {
        const message = extractErrorMessage(err, "ログインに失敗しました");
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applyAuthResponse],
  );

  const register = useCallback(
    async (
      idToken: string,
      userData?: {
        username?: string;
        first_name?: string;
        last_name?: string;
        phone_number?: string;
        access_token?: string;
      },
    ) => {
      setError(null);
      setLoading(true);
      try {
        const response = await authApi.register(
          idToken,
          userData?.username,
          userData?.first_name,
          userData?.last_name,
          userData?.phone_number,
          userData?.access_token,
          "web",
        );
        applyAuthResponse(response);
      } catch (err) {
        const message = extractErrorMessage(err, "登録に失敗しました");
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applyAuthResponse],
  );

  const logout = useCallback(() => {
    authApi.logout();
    clearAuthData();
    setUser(null);
    setToken(null);
    setSessionId(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      sessionId,
      isAuthenticated: user !== null,
      loading,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [
      user,
      token,
      sessionId,
      loading,
      error,
      login,
      register,
      logout,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
