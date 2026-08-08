"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

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
    const stored = localStorage.getItem("mediroute_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoaded(true);
  }, []);

  const login = (userData: any) => {
    localStorage.setItem("mediroute_user", JSON.stringify(userData));
    setUser(userData);
    // Role-based redirect after login
    if (userData.role === 'patient') router.push('/patient/dashboard');
    else if (userData.role === 'admin') router.push('/admin/queue');
    else if (userData.role === 'doctor' || userData.role === 'hospital') router.push('/doctor/dashboard');
    else router.push('/');
  };

  const logout = () => {
    localStorage.removeItem("mediroute_user");
    setUser(null);
    router.push("/login");
  };

  if (!isLoaded) return null;

  const isLoginPage = pathname === "/login";

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="flex flex-col min-h-screen">
        {user && !isLoginPage && (
          <nav className="w-full border-b border-white/10 bg-black/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50">
            <Link href="/" className="font-black text-xl tracking-tighter text-white">
              MEDI<span className="text-red-600">ROUTE</span>
            </Link>

            <div className="flex items-center gap-6 text-sm font-bold">
              {user.role === 'patient' && (
                <>
                  <Link href="/patient/dashboard" className="text-gray-400 hover:text-white transition">Dashboard</Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link href="/admin/queue" className="text-gray-400 hover:text-white transition">Review Queue</Link>
                  <Link href="/admin/radar" className="text-gray-400 hover:text-white transition">Outbreak Radar</Link>
                </>
              )}
              {(user.role === 'doctor' || user.role === 'hospital') && (
                <>
                  <Link href="/doctor/dashboard" className="text-gray-400 hover:text-white transition">
                    {user.role === 'hospital' ? 'Hospital Dashboard' : 'My Dashboard'}
                  </Link>
                  <Link href="/doctor/schedule" className="text-gray-400 hover:text-white transition">Schedule</Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:block">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 border border-white/20 hover:border-white/50 hover:bg-white/10 text-white rounded-xl transition text-xs font-bold uppercase tracking-wider"
              >
                Logout
              </button>
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
