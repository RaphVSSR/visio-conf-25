import React, {
  createContext,
  useEffect,
  useState,
  useRef,
  type FC,
  type PropsWithChildren,
} from "react";
import MessageClientAdapter from "services/MessageClientAdapter";
import { AuthSync } from "services/auth/AuthSync";
import type { AuthState, AuthContextType } from "services/auth/AuthSync.types";

export type {
  AuthUser,
  AuthState,
  AuthActions,
  AuthContextType,
} from "services/auth/AuthSync.types";

export const AuthContext = createContext<AuthContextType | null>(null);

const INITIAL_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  expiresAt: null,
  showExpiryWarning: false,
  loginRejected: false,
};

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const authRef = useRef<AuthSync | null>(null);

  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const authRef = useRef<AuthSync | null>(null);
  const socketRef = useRef<MessageClientAdapter | null>(null);

  useEffect(() => {
    const socket = new MessageClientAdapter(
      process.env.REACT_APP_BACKEND_API_URL || "http://localhost:3220",
    );
    socketRef.current = socket;
    authRef.current = new AuthSync(socket, setState);

    return () => {
      authRef.current?.destroy();
      authRef.current = null;
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    socket: socketRef.current,
    login: (email, password) => authRef.current?.login(email, password),
    register: (data) => authRef.current?.register(data),
    logout: () => authRef.current?.logout(),
    refreshSession: () => authRef.current?.refreshSession(),
    dismissExpiryWarning: () =>
      setState((prev) => ({ ...prev, showExpiryWarning: false })),
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
