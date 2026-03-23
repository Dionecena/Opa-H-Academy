import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, Pen, Mic, BookOpen, Settings, Users,
  ChevronRight, LogOut, Award
} from 'lucide-react';
import { Card, Button, Header } from '../components/UI';
import { useAuth } from '../App';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="px-3 py-2 text-sm font-medium border border-[var(--border)] bg-[var(--bg-card)] backdrop-blur rounded-[var(--radius-sm)] hover:bg-[var(--bg-input)] transition-all"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Admin
                </span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium border border-[var(--border)] bg-[var(--bg-card)] backdrop-blur rounded-[var(--radius-sm)] hover:bg-[var(--bg-input)] transition-all"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </span>
            </button>
          </div>
        }
      />

      <main className="flex-1">
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
