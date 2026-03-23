import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pen, ChevronLeft, Send, Check, BookOpen, Volume2, Mic, RotateCcw } from 'lucide-react';
import { Card, Button, Header, Input, Badge, EmptyState, Tabs, Modal } from '../components/UI';
import { useAuth } from '../App';
import api from '../config/api';
import AudioRecorder from '../components/AudioRecorder';

const PracticeMode = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState('schreiben');
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [answers, setAnswers] = useState({});
  const [activeTeil, setActiveTeil] = useState('teil1');
  const [speakingWords, setSpeakingWords] = useState({ word1: null, word2: null });
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  
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
    loadSubmissions();
    setAnswers({});
    setActiveTeil('teil1');
    setPublishSuccess(false);
    setIsPublishOpen(false);

    if (activeSection === 'schreiben') {
      loadThemes();
    } else {
      loadExercises();
      if (activeSection === 'sprechen') {
        loadSpeakingWords();
      }
    }
  }, [activeSection]);

  const toYouTubeEmbedUrl = (url) => {
    if (!url) return null;

    const match = url.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    const id = match ? match[1] : null;

    const base = id
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : url;

    const hasQuery = base.includes('?');
    const params = 'playsinline=1&rel=0&modestbranding=1';
    return `${base}${hasQuery ? '&' : '?'}${params}`;
  };

  const loadExercises = async () => {
    const data = await api.getExercises('exam');
    setExercises(data);
    if (data.length > 0) {
      const match = data.find(ex => {
        const q = ex?.questions;
        return q && typeof q === 'object' && q.section === activeSection;
      });
      setCurrentExercise(match || null);
    } else {
      setCurrentExercise(null);
    }
  };

  const loadSpeakingWords = async () => {
    const w = await api.getSpeakingWords();
    setSpeakingWords({ word1: w?.word1 ?? null, word2: w?.word2 ?? null });
  };

  const getSectionQuestions = () => {
    const exQuestions = currentExercise?.questions;
    if (exQuestions && typeof exQuestions === 'object' && exQuestions.teils) {
      return exQuestions;
    }
    return { teils: { teil1: [], teil2: [], teil3: [] }, texts: {} };
  };

  const teilTabsBySection = {
    hoeren: [
      { id: 'teil1', label: 'Teil 1 (1–6)' },
      { id: 'teil2', label: 'Teil 2 (7–10)' },
      { id: 'teil3', label: 'Teil 3 (11–15)' }
    ],
    lesen: [
      { id: 'teil1', label: 'Teil 1 (1–5)' },
      { id: 'teil2', label: 'Teil 2 (6–10)' },
      { id: 'teil3', label: 'Teil 3 (11–15)' }
    ]
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const publishAnswers = async () => {
    const q = getSectionQuestions();
    const teils = q?.teils || {};
    const teilOrder = ['teil1', 'teil2', 'teil3'];
    const rows = [];

    teilOrder.forEach(teilId => {
      const list = teils[teilId] || [];
      list
        .slice()
        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
        .forEach(item => {
          const value = answers[item.id];
          if (value === undefined || value === null || value === '') return;
          rows.push(`${item.number}) ${value}`);
        });
    });

    const content = rows.length > 0
      ? `Mes réponses (${activeSection})\n${rows.join('\n')}`
      : `Mes réponses (${activeSection})\n(Aucune réponse)`;

    await api.createTextSubmission({
      username: user.username,
      context: activeSection,
      content
    });

    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 3000);
    loadSubmissions();
  };

  const loadThemes = async () => {
    const data = await api.getThemes();
    setThemes(data);
  };

  const loadSubmissions = async () => {
    const data = await api.getSubmissions(activeSection, user.username);
    setSubmissions(data);
  };

  const handleSubmit = async () => {
    if (!text.trim() || !selectedTheme || activeSection !== 'schreiben') return;
    
    setLoading(true);
    await api.createTextSubmission({
      username: user.username,
      context: activeSection,
      content: `[${selectedTheme.title}] ${text}`
    });
    
    setText('');
    setLoading(false);
    setSuccess(true);
    loadSubmissions();
    
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleAudioSend = async (blob) => {
    const formData = new FormData();
    formData.append('audio', blob);
    formData.append('username', user.username);
    formData.append('context', 'sprechen');
    await api.createAudioSubmission(formData);
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 3000);
    loadSubmissions();
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
        ) : activeSection === 'sprechen' ? (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Sprechen</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Üben Sie laut zu sprechen und teilen Sie Ihre Aufnahme.
              </p>

              <div className="flex gap-3 mb-4">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {speakingWords.word1 || '...'}
                </Badge>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {speakingWords.word2 || '...'}
                </Badge>
              </div>

              <AudioRecorder onSend={(blob) => handleAudioSend(blob)} />

              <Button
                variant="ghost"
                fullWidth
                className="mt-4"
                onClick={loadSpeakingWords}
                icon={<RotateCcw className="w-5 h-5" />}
              >
                Neue Wörter
              </Button>
            </Card>

            {publishSuccess && (
              <Card className="p-4 bg-[var(--accent)]/20 border-[var(--accent)]">
                <p className="text-[var(--accent)] font-medium text-center">
                  ✓ Erfolgreich eingereicht!
                </p>
              </Card>
            )}

            <div>
              <h3 className="font-semibold mb-3">Ihre Aufnahmen</h3>
              {submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.map(sub => (
                    <Card key={sub.id} className="p-4">
                      <p className="text-sm text-[var(--text-muted)] mb-2">
                        {formatDate(sub.createdAt)}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">Audio</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Mic}
                  title="Noch keine Aufnahmen"
                  description="Enregistrez votre première réponse pour la partager."
                />
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs
              tabs={activeSection === 'hoeren' ? teilTabsBySection.hoeren : teilTabsBySection.lesen}
              activeTab={activeTeil}
              onChange={setActiveTeil}
            />

            {currentExercise?.videoUrl ? (
              <Card className="overflow-hidden p-0" animate={false}>
                <div className="aspect-video w-full">
                  <iframe
                    src={toYouTubeEmbedUrl(currentExercise.videoUrl)}
                    className="w-full h-full"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center" animate={false}>
                <Volume2 className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" />
                <p className="text-[var(--text-secondary)]">Keine YouTube Video gesetzt</p>
              </Card>
            )}

            {activeSection === 'lesen' && (
              <Card className="p-4" animate={false}>
                <h3 className="font-semibold mb-3">Text</h3>
                <p className="whitespace-pre-wrap text-[var(--text-secondary)]">
                  {getSectionQuestions()?.texts?.[activeTeil] || currentExercise?.content || ''}
                </p>
              </Card>
            )}

            <div className="space-y-3">
              {(getSectionQuestions()?.teils?.[activeTeil] || []).map((q) => (
                <Card key={q.id} className="p-4" animate={false}>
                  <p className="font-medium mb-3">{q.number}. {q.question}</p>

                  {q.type === 'mcq' && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(q.id, opt)}
                          className={
                            `w-full p-3 rounded-lg text-left transition-colors ` +
                            (answers[q.id] === opt
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--bg-input)] hover:bg-[var(--border)]')
                          }
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {(q.type === 'truefalse' || q.type === 'ab') && (
                    <div className="flex gap-3">
                      {(q.options || []).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(q.id, opt)}
                          className={
                            `flex-1 p-3 rounded-lg transition-colors ` +
                            (answers[q.id] === opt
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--bg-input)] hover:bg-[var(--border)]')
                          }
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button fullWidth variant="ghost" onClick={() => setIsPublishOpen(true)}>
                Publier
              </Button>
              <Button fullWidth variant="outline" onClick={() => setAnswers({})} icon={<RotateCcw className="w-5 h-5" />}>
                Reset
              </Button>
            </div>

            {publishSuccess && (
              <Card className="p-4 bg-[var(--accent)]/20 border-[var(--accent)]">
                <p className="text-[var(--accent)] font-medium text-center">
                  ✓ Publié dans la communauté !
                </p>
              </Card>
            )}

            <Modal
              isOpen={isPublishOpen}
              onClose={() => setIsPublishOpen(false)}
              title="Publier mes réponses"
              size="md"
            >
              <div className="space-y-4">
                <Card className="p-4" animate={false}>
                  <p className="text-sm text-[var(--text-muted)]">
                    Vos réponses seront partagées dans Gemeinschaft → {activeSection}.
                  </p>
                </Card>
                <div className="flex gap-3">
                  <Button fullWidth variant="ghost" onClick={() => setIsPublishOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    fullWidth
                    onClick={async () => {
                      await publishAnswers();
                      setIsPublishOpen(false);
                    }}
                  >
                    Publier
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        )}
      </main>
    </div>
  );
};

export default PracticeMode;
