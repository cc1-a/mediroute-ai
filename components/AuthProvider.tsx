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
          <nav className="w-full max-w-6xl mx-auto p-6 flex justify-between items-center z-50">
            <div className="flex items-center gap-8">
              <span className="font-black text-2xl text-white tracking-tighter cursor-pointer" onClick={() => router.push('/')}>
                <span style={{ color: 'var(--spidey-red)' }}>WEB</span>ROUTE
              </span>
              
              <div className="hidden md:flex gap-6 text-sm font-bold tracking-wider uppercase text-gray-300">
                <a href="/" className="hover:text-white hover:border-b-2 border-red-600 pb-1 transition-all">Home</a>
                <a href="/" className="hover:text-white hover:border-b-2 border-red-600 pb-1 transition-all">About us</a>
                {user.role === 'patient' && (
                  <a href="/patient/triage" className="hover:text-white hover:border-b-2 border-red-600 pb-1 transition-all">Triage</a>
                )}
                {user.role === 'admin' && (
                  <a href="/admin/queue" className="hover:text-white hover:border-b-2 border-red-600 pb-1 transition-all">Queue</a>
                )}
                {(user.role === 'doctor' || user.role === 'hospital') && (
                  <a href="/doctor/dashboard" className="hover:text-white hover:border-b-2 border-red-600 pb-1 transition-all">Dashboard</a>
                )}
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest"><strong className="text-white">{user.name}</strong></span>
              <button onClick={logout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-500/30">LOGOUT</button>
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
