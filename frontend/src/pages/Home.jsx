import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Loader } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { useAuth } from '../App';
import api from '../config/api';

const Home = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || username.trim().length < 2) {
      setError('Mindestens 2 Zeichen erforderlich');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const user = await api.login(username.trim());
      login(user);
      navigate('/dashboard');
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Logo & Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] backdrop-blur flex items-center justify-center shadow-[var(--shadow)]">
            <GraduationCap className="w-10 h-10 text-[var(--text-primary)]" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">OPA H ACADEMIE</h1>
        <p className="text-[var(--text-secondary)]">Deutsch lernen - Niveau A1</p>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
      >
        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold text-center mb-6">
              Willkommen!
            </h2>
            
            <div className="mb-6">
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="Ihr Benutzername eingeben"
                error={error}
                autoFocus
              />
              <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
                Kein Passwort erforderlich
              </p>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={loading}
              loading={loading}
              icon={!loading && <ArrowRight className="w-5 h-5" />}
            >
              Starten
            </Button>
          </form>
        </Card>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm"
      >
        <div className="text-center p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
          <div className="text-2xl mb-2">📝</div>
          <p className="text-sm text-[var(--text-secondary)]">Prüfungsvorbereitung</p>
        </div>
        <div className="text-center p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
          <div className="text-2xl mb-2">🎤</div>
          <p className="text-sm text-[var(--text-secondary)]">Sprechen üben</p>
        </div>
        <div className="text-center p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
          <div className="text-2xl mb-2">👥</div>
          <p className="text-sm text-[var(--text-secondary)]">Kollaborativ</p>
        </div>
        <div className="text-center p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
          <div className="text-2xl mb-2">📱</div>
          <p className="text-sm text-[var(--text-secondary)]">Mobile-first</p>
        </div>
      </motion.div>

      {/* Footer */}
      <p className="mt-8 text-xs text-[var(--text-muted)]">
        © 2024 OPA H ACADEMIE
      </p>
    </div>
  );
};

export default Home;
