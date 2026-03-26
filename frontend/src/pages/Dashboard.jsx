import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, Pen, Mic, BookOpen, Settings, Users, Book,
  ChevronRight, LogOut, Award, User as UserIcon, ChevronDown
} from 'lucide-react';
import { Card, Button, Header } from '../components/UI';
import { useAuth } from '../App';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {
      id: 'exam',
      title: 'Modus Prüfung',
      subtitle: 'Hören, Lesen, Schreiben, Sprechen',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      path: '/exam'
    },
    {
      id: 'grammar',
      title: 'Grammatik Übungen',
      subtitle: 'Verben, Pronomen, Satzbau',
      icon: Book,
      color: 'from-amber-500 to-amber-600',
      path: '/grammar'
    },
    {
      id: 'practice',
      title: 'Modus Übungen',
      subtitle: 'Themenbasierte Übungen',
      icon: Pen,
      color: 'from-emerald-500 to-emerald-600',
      path: '/practice'
    },
    {
      id: 'collaborative',
      title: 'Gemeinschaft',
      subtitle: 'Antworten & Kommentare',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      path: '/collaborative'
    }
  ];

  const examSections = [
    { id: 'hoeren', title: 'Hören', icon: Mic, desc: 'Video verstehen' },
    { id: 'lesen', title: 'Lesen', icon: BookOpen, desc: 'Texte lesen' },
    { id: 'schreiben', title: 'Schreiben', icon: Pen, desc: 'Texte schreiben' },
    { id: 'sprechen', title: 'Sprechen', icon: Mic, desc: 'Sprechen üben' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title="OPA H ACADEMIE" 
        username={user?.username}
        action={
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="px-3 py-2 text-sm font-medium border border-[var(--glass-border-strong)] bg-[var(--glass-bg-strong)] shadow-[var(--glass-shadow)] backdrop-blur-[calc(var(--glass-blur)+6px)] rounded-[var(--radius-sm)] hover:bg-[var(--glass-bg)] transition-all"
            >
              <span className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Compte</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-[var(--radius)] border border-[var(--glass-border-strong)] bg-[var(--glass-bg-strong)] shadow-[var(--glass-shadow-strong)] backdrop-blur-[calc(var(--glass-blur)+10px)] overflow-hidden"
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        }
      />

      <main className="flex-1 pt-16">
        <div className="container py-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-6" animate={false}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Willkommen</p>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {user?.username}
                  </h2>
                  <p className="text-[var(--text-secondary)] mt-1">
                    Deutsch A1 — Training, Prüfung, Fortschritt.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => navigate('/exam')}
                    icon={<Award className="w-5 h-5" />}
                  >
                    Prüfung starten
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/practice')}
                    icon={<Pen className="w-5 h-5" />}
                  >
                    Übungen
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="grid md:grid-cols-3 gap-4"
          >
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + index * 0.06 }}
              >
                <Card
                  hoverable
                  onClick={() => navigate(item.path)}
                  className="p-5"
                  animate={false}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`
                        w-12 h-12 rounded-[var(--radius-sm)]
                        bg-gradient-to-br ${item.color}
                        flex items-center justify-center
                        shadow-sm
                      `}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">{item.title}</h3>
                        <p className="text-sm text-[var(--text-muted)] mt-1">{item.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)] mt-1" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--secondary)]" />
                Prüfungsteile
              </h3>
              <button
                onClick={() => navigate('/exam')}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Alle anzeigen
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {examSections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 + index * 0.04 }}
                >
                  <Card
                    hoverable
                    onClick={() => navigate(`/exam/${section.id}`)}
                    className="p-4"
                    animate={false}
                  >
                    <section.icon className="w-6 h-6 mb-3 text-[var(--primary)]" />
                    <h4 className="font-semibold">{section.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{section.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
