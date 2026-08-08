"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

type UserContextType = {
  user: any;
  login: (user: any) => void;
  logout: () => void;
};

const AuthContext = createContext<UserContextType>({ user: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("spider_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoaded(true);
  }, []);

  const login = (userData: any) => {
    localStorage.setItem("spider_user", JSON.stringify(userData));
    setUser(userData);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("spider_user");
    setUser(null);
    router.push("/login");
  };

  if (!isLoaded) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="flex flex-col min-h-screen">
        {user && pathname !== "/login" && (
          <nav className="p-4 glass-panel border-b border-white/10 flex justify-between items-center z-50">
            <span className="font-bold text-white uppercase tracking-widest text-sm">WebRoute</span>
            <div className="flex gap-4 items-center">
              <span className="text-gray-300 text-sm">Logged in as <strong className="text-white">{user.name}</strong> ({user.role})</span>
              <button onClick={logout} className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/50 rounded hover:bg-red-600 hover:text-white transition text-xs font-bold">LOGOUT</button>
            </div>
          </nav>
        )}
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
