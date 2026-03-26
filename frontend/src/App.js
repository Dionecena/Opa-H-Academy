import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ExamMode from './pages/ExamMode';
import PracticeMode from './pages/PracticeMode';
import AdminPanel from './pages/AdminPanel';
import Collaborative from './pages/Collaborative';
import GrammarExercises from './pages/GrammarExercises';

// Auth Context
export const AuthContext = createContext();

export const ThemeContext = createContext();

const isStandaloneMode = () => {
  try {
    // iOS Safari
    if (typeof window !== 'undefined' && window.navigator && window.navigator.standalone) return true;
    // Android/desktop
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(display-mode: standalone)').matches;
    }
  } catch (_) {}
  return false;
};

const isIOSDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua);
};

const InstallPwaToast = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) return;

    try {
      const key = 'opa_pwa_install_prompt_last_seen';
      const last = parseInt(localStorage.getItem(key) || '0', 10);
      const now = Date.now();
      // show at most once every 24h
      if (Number.isFinite(last) && now - last < 24 * 60 * 60 * 1000) return;

      localStorage.setItem(key, String(now));
    } catch (_) {}

    setVisible(true);
    const t = setTimeout(() => setVisible(false), 15000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const ios = isIOSDevice();
  return (
    <div className="fixed left-0 right-0 bottom-4 z-50 px-4">
      <div className="max-w-xl mx-auto bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-lg p-4 backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-sm">Installe l'app sur ton téléphone</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              Accès rapide, expérience plus fluide, et utilisable comme une app.
            </div>
            <div className="text-xs mt-2 space-y-1">
              {ios ? (
                <>
                  <div>1) Ouvre le site dans Safari</div>
                  <div>2) Bouton Partager</div>
                  <div>3) Ajouter à l'écran d'accueil</div>
                </>
              ) : (
                <>
                  <div>1) Ouvre le menu du navigateur (⋮)</div>
                  <div>2) Installer l'application / Ajouter à l'écran d'accueil</div>
                  <div>3) Confirmer</div>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-xs px-3 py-2 rounded-xl bg-[var(--glass-bg-strong)] border border-[var(--glass-border)]"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const saved = localStorage.getItem('opa_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('opa_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('opa_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('opa_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('opa_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// Admin Route
const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <InstallPwaToast />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/exam/*" 
              element={
                <ProtectedRoute>
                  <ExamMode />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/practice" 
              element={
                <ProtectedRoute>
                  <PracticeMode />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/grammar" 
              element={
                <ProtectedRoute>
                  <GrammarExercises />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/collaborative" 
              element={
                <ProtectedRoute>
                  <Collaborative />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
