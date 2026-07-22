import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { AuthApi } from "../api/resources.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { user: me } = await AuthApi.me();
      setUser(me);
    } catch (error) {
      console.error("Failed to load user:", error);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = async (credentials) => {
    const { token, user: loggedIn } = await AuthApi.login(credentials);
    localStorage.setItem("token", token);
    setUser(loggedIn);
    return { token, user: loggedIn };
  };

  const register = async (data) => {
    const { token, user: created } = await AuthApi.register(data);
    localStorage.setItem("token", token);
    setUser(created);
    return { token, user: created };
  };

  const applyToken = async (token) => {
    localStorage.setItem("token", token);
    await loadCurrentUser();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    applyToken,
    loadCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
