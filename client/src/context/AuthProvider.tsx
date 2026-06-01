import { type ReactNode, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";

type User = {
  id: string;
  username: string;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("userProfile");
    return stored ? JSON.parse(stored) : null;
  });

  // Decode JWT and get expiration time
  const getTokenExpirationTime = (tokenString: string): number | null => {
    try {
      const payload = JSON.parse(atob(tokenString.split(".")[1]));
      return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch {
      return null;
    }
  };

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("userProfile", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");

    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const user = JSON.parse(localStorage.getItem("userProfile") || "{}");
      if (!user) {
        return;
      }

      const expirationTime = getTokenExpirationTime(token);
      if (!expirationTime) {
        return;
      }

      const now = Date.now();
      if (now >= expirationTime) {
        logout();
        return;
      }

      setUser(user);
    };

    checkAuth();

    const intervalId = setInterval(checkAuth, 60000); // Check every 60 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
