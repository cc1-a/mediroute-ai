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
      <div className="flex flex-col min-h-screen" style={{ fontFamily: 'var(--font-retro)' }}>

        {/* ── RETRO NAV BAR ── */}
        {user && !isLoginPage && (
          <nav
            className="w-full flex items-center justify-between sticky top-0 z-50"
            style={{
              backgroundColor: 'var(--bg-panel)',
              padding: '8px 16px',
              boxShadow: '0 4px 0 var(--black)',
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              className="font-black"
              style={{ color: 'var(--btn-red)', fontSize: 24, letterSpacing: 4, textShadow: '2px 2px 0 var(--black)', fontFamily: 'var(--font-retro)', textDecoration: 'none' }}
            >
              🕷 MEDI<span style={{ color: 'var(--black)' }}>ROUTE</span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-2">
              {user.role === 'patient' && (
                <>
                  <Link href="/patient/dashboard" id="nav-dashboard">
                    <span className="retro-btn retro-btn-panel pixel-border" style={{ fontSize: 16, letterSpacing: 1 }}>DASHBOARD</span>
                  </Link>
                  <Link href="/patient/triage" id="nav-triage">
                    <span className="retro-btn retro-btn-green pixel-border" style={{ fontSize: 16, letterSpacing: 1 }}>TRIAGE</span>
                  </Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link href="/admin/queue" id="nav-queue">
                    <span className="retro-btn retro-btn-orange pixel-border" style={{ fontSize: 16, letterSpacing: 1 }}>QUEUE</span>
                  </Link>
                  <Link href="/admin/radar" id="nav-radar">
                    <span className="retro-btn retro-btn-red pixel-border" style={{ fontSize: 16, letterSpacing: 1, color: 'var(--white)' }}>RADAR</span>
                  </Link>
                </>
              )}
              {(user.role === 'doctor' || user.role === 'hospital') && (
                <>
                  <Link href="/doctor/dashboard" id="nav-doctor-dash">
                    <span className="retro-btn retro-btn-cyan pixel-border" style={{ fontSize: 16, letterSpacing: 1 }}>
                      {user.role === 'hospital' ? 'HOSPITAL' : 'DASHBOARD'}
                    </span>
                  </Link>
                  <Link href="/doctor/schedule" id="nav-schedule">
                    <span className="retro-btn retro-btn-panel pixel-border" style={{ fontSize: 16, letterSpacing: 1 }}>SCHEDULE</span>
                  </Link>
                </>
              )}
            </div>

            {/* User + Logout */}
            <div className="flex items-center gap-2">
              <span
                className="pixel-inset"
                style={{ backgroundColor: 'var(--map-bg)', color: 'rgba(255,255,255,0.6)', fontSize: 15, padding: '4px 10px', letterSpacing: 1, fontFamily: 'var(--font-retro)' }}
              >
                {user.name?.toUpperCase()}
              </span>
              <button
                id="logout-btn"
                onClick={logout}
                className="retro-btn retro-btn-red pixel-border"
                style={{ fontSize: 16, color: 'var(--white)' }}
              >
                LOGOUT
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
