import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pen, Send, Check, BookOpen, Clock, Headphones, Book, Mic } from 'lucide-react';
import { Card, Button, Header, Input, EmptyState, Tabs } from '../components/UI';
import { useAuth } from '../App';
import api from '../config/api';

const PracticeMode = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState('schreiben');
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  const tabs = [
    { id: 'hoeren', label: 'Hören' },
    { id: 'lesen', label: 'Lesen' },
    { id: 'schreiben', label: 'Schreiben' },
    { id: 'sprechen', label: 'Sprechen' }
  ];

  useEffect(() => {
    if (activeSection === 'schreiben') {
      loadThemes();
      loadSubmissions();
    }
  }, [activeSection]);

  const loadThemes = async () => {
    const data = await api.getThemes();
    setThemes(data);
  };

  const loadSubmissions = async () => {
    const data = await api.getSubmissions('practice', user.username);
    setSubmissions(data);
  };

  const handleSubmit = async () => {
    if (!text.trim() || !selectedTheme) return;
    
    setLoading(true);
    await api.createTextSubmission({
      username: user.username,
      context: 'practice',
      content: `[${selectedTheme.title}] ${text}`
    });
    
    setText('');
    setLoading(false);
    setSuccess(true);
    loadSubmissions();
    
    setTimeout(() => setSuccess(false), 3000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPlaceholder = (icon: React.ReactNode, title: string, description: string) => (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="p-8 text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-[var(--text-muted)] mb-4">{description}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
          <Clock className="w-4 h-4" />
          <span>Bientôt disponible</span>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title="Übungen" 
        back={() => navigate('/dashboard')}
        username={user?.username}
      />

      <div className="p-4">
        <Tabs tabs={tabs} activeTab={activeSection} onChange={setActiveSection} />
      </div>

      <main className="flex-1 p-4 pt-0">
        {activeSection === 'schreiben' ? (
          <>
            {/* Theme Selection */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                Thema wählen
              </h3>
              
              {themes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {themes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme)}
                      className={`
                        px-4 py-2 rounded-full text-sm font-medium transition-colors
                        ${selectedTheme?.id === theme.id 
                          ? 'bg-[var(--primary)] text-white' 
                          : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--border)]'}
                      `}
                    >
                      {theme.title}
                    </button>
                  ))}
                </div>
              ) : (
                <Card className="p-4 text-center">
                  <p className="text-[var(--text-muted)]">
                    Keine Themen verfügbar
                  </p>
                </Card>
              )}
            </div>

            {/* Writing Area */}
            {selectedTheme && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">{selectedTheme.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    Schreiben Sie einen kurzen Text zu diesem Thema.
                  </p>
                  
                  <Input
                    multiline
                    rows={6}
                    placeholder="Ihr Text hier..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    {text.split(/\s+/).filter(w => w).length} Wörter
                  </p>
                </Card>

                {success && (
                  <Card className="p-4 mt-4 bg-[var(--accent)]/20 border-[var(--accent)]">
                    <p className="text-[var(--accent)] font-medium text-center flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Erfolgreich eingereicht!
                    </p>
                  </Card>
                )}

                <Button
                  fullWidth
                  className="mt-4"
                  onClick={handleSubmit}
                  disabled={!text.trim() || loading}
                  loading={loading}
                  icon={<Send className="w-5 h-5" />}
                >
                  Einreichen
                </Button>
              </motion.div>
            )}

            {/* Previous Submissions */}
            <div>
              <h3 className="font-semibold mb-3">Ihre Texte</h3>
              
              {submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.map(sub => (
                    <Card key={sub.id} className="p-4">
                      <p className="text-sm text-[var(--text-muted)] mb-2">
                        {formatDate(sub.createdAt)}
                      </p>
                      <p className="whitespace-pre-wrap">{sub.content}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Pen}
                  title="Noch keine Texte"
                  description="Wählen Sie ein Thema und schreiben Sie Ihren ersten Text."
                />
              )}
            </div>
          </>
        ) : activeSection === 'hoeren' ? (
          renderPlaceholder(
            <Headphones className="w-8 h-8 text-[var(--primary)]" />,
            'Hören Übungen',
            'Pratiquez votre compréhension orale avec des exercices audio interactifs.'
          )
        ) : activeSection === 'lesen' ? (
          renderPlaceholder(
            <Book className="w-8 h-8 text-[var(--primary)]" />,
            'Lesen Übungen',
            'Améliorez votre compréhension écrite avec des textes et questions.'
          )
        ) : (
          renderPlaceholder(
            <Mic className="w-8 h-8 text-[var(--primary)]" />,
            'Sprechen Übungen',
            'Entraînez-vous à parler et enregistrez vos réponses.'
          )
        )}
      </main>
    </div>
  );
};

export default PracticeMode;
