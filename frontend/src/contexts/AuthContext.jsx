import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

const API_BASE = "http://localhost:5000/api";

// Configure axios defaults
axios.defaults.baseURL = API_BASE;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor for auth header
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Verify token is still valid by getting user info
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      // We can try to fetch users (which requires auth) to verify token
      await axios.get("/users");
      // If successful, token is valid - user info should be stored locally
      const userData = localStorage.getItem("user");
      const companyData = localStorage.getItem("company");
      if (userData) setUser(JSON.parse(userData));
      if (companyData) setCompany(JSON.parse(companyData));
    } catch (error) {
      // Token is invalid, clear everything
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post("/auth/login", { email, password });
      const { token, user: userData, company: companyData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("company", JSON.stringify(companyData));

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(userData);
      setCompany(companyData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const signup = async (formData) => {
    try {
      const response = await axios.post("/auth/signup", formData);
      const { token, user: userData, company: companyData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("company", JSON.stringify(companyData));

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(userData);
      setCompany(companyData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Signup failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("company");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setCompany(null);
  };

  const value = {
    user,
    company,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
