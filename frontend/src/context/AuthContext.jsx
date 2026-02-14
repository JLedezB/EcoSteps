// ==============================
// AuthContext.jsx
// Contexto global de autenticación
// - Mantiene el usuario en memoria (React state)
// - Persiste user en localStorage para que no se pierda al refrescar
// - Expone helpers setUser / logout
// ==============================

import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

const LS_USER_KEY = "ecosteps_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Cargar user guardado (si existe) al iniciar app
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      console.warn("AuthContext: no se pudo leer user de localStorage", e);
      localStorage.removeItem(LS_USER_KEY);
    }
  }, []);

  // Persistir user cada vez que cambie
  useEffect(() => {
    try {
      if (user) localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(LS_USER_KEY);
    } catch (e) {
      console.warn("AuthContext: no se pudo guardar user en localStorage", e);
    }
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_USER_KEY);
    // si guardas token/role en authSession:
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
