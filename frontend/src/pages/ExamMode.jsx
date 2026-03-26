import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mic, BookOpen, Pen, RotateCcw, Volume2
} from 'lucide-react';
import { Card, Button, Header, Tabs, Input, Badge, Modal } from '../components/UI';
import AudioRecorder from '../components/AudioRecorder';
import { useAuth } from '../App';
import api from '../config/api';

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

const ExamMode = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeSection, setActiveSection] = useState(section || 'hoeren');
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [speakingWords, setSpeakingWords] = useState({
    teil2: { word1: null, word2: null },
    teil3: { word1: null, word2: null }
  });
  const [schreibenText1, setSchreibenText1] = useState('');
  const [schreibenText2, setSchreibenText2] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [activeTeil, setActiveTeil] = useState('teil1');
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [videoMountKey, setVideoMountKey] = useState(0);

  const tabs = [
    { id: 'hoeren', label: 'Hören' },
    { id: 'lesen', label: 'Lesen' },
    { id: 'schreiben', label: 'Schreiben' },
    { id: 'sprechen', label: 'Sprechen' }
  ];

  useEffect(() => {
    loadExercises();
    if (activeSection === 'sprechen') {
      loadSpeakingWords();
    }
    setActiveTeil('teil1');
    setAnswers({});
    setScore(null);
    setIsSummaryOpen(false);
  }, [activeSection]);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => {
      setIsMobile(e.matches);
      setVideoMountKey((k) => k + 1);
    };

    setIsMobile(mql.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }

    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  const loadExercises = async () => {
    const data = await api.getExercises('exam');
    setExercises(data);
    if (data.length > 0) {
      const match = data.find(ex => {
        const q = ex?.questions;
        return q && typeof q === 'object' && q.section === activeSection;
      });
      setCurrentExercise(match || data[0]);
    } else {
      setCurrentExercise(null);
    }
  };

  const loadSpeakingWords = async () => {
    const w2 = await api.getSpeakingWords();

    let w3 = await api.getSpeakingWords();
    let attempts = 0;
    while (
      attempts < 5 &&
      w3 && w2 &&
      (w3.word1 === w2.word1 || w3.word1 === w2.word2 || w3.word2 === w2.word1 || w3.word2 === w2.word2)
    ) {
      w3 = await api.getSpeakingWords();
      attempts += 1;
    }

    setSpeakingWords({
      teil2: { word1: w2?.word1 ?? null, word2: w2?.word2 ?? null },
      teil3: { word1: w3?.word1 ?? null, word2: w3?.word2 ?? null }
    });
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const getDefaultExam = (sectionId) => {
    if (sectionId === 'hoeren') {
      return {
        teils: {
          teil1: Array.from({ length: 6 }).map((_, i) => ({
            id: `h-t1-${i + 1}`,
            number: i + 1,
            type: 'mcq',
            options: ['A', 'B', 'C'],
            question: `Teil 1 — Frage ${i + 1}`
          })),
          teil2: Array.from({ length: 4 }).map((_, i) => ({
            id: `h-t2-${i + 7}`,
            number: i + 7,
            type: 'truefalse',
            options: ['Richtig', 'Falsch'],
            question: `Teil 2 — Aussage ${i + 7}`
          })),
          teil3: Array.from({ length: 5 }).map((_, i) => ({
            id: `h-t3-${i + 11}`,
            number: i + 11,
            type: 'mcq',
            options: ['A', 'B', 'C'],
            question: `Teil 3 — Frage ${i + 11}`
          }))
        }
      };
    }

    if (sectionId === 'lesen') {
      return {
        teils: {
          teil1: Array.from({ length: 5 }).map((_, i) => ({
            id: `l-t1-${i + 1}`,
            number: i + 1,
            type: 'truefalse',
            options: ['Richtig', 'Falsch'],
            question: `Teil 1 — Aussage ${i + 1}`
          })),
          teil2: Array.from({ length: 5 }).map((_, i) => ({
            id: `l-t2-${i + 6}`,
            number: i + 6,
            type: 'ab',
            options: ['A', 'B'],
            question: `Teil 2 — Frage ${i + 6}`
          })),
          teil3: Array.from({ length: 5 }).map((_, i) => ({
            id: `l-t3-${i + 11}`,
            number: i + 11,
            type: 'truefalse',
            options: ['Richtig', 'Falsch'],
            question: `Teil 3 — Aussage ${i + 11}`
          }))
        }
      };
    }

    return { teils: { teil1: [], teil2: [], teil3: [] } };
  };

  const getSectionQuestions = () => {
    const defaultExam = getDefaultExam(activeSection);
    const exQuestions = currentExercise?.questions;

    if (exQuestions && typeof exQuestions === 'object' && exQuestions.teils) {
      return exQuestions;
    }

    return defaultExam;
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

  const allAnswersSummary = useMemo(() => {
    if (activeSection !== 'hoeren' && activeSection !== 'lesen') return [];
    const q = getSectionQuestions();
    const teils = q?.teils || {};

    const teilOrder = ['teil1', 'teil2', 'teil3'];
    const rows = [];

    teilOrder.forEach(teilId => {
      const list = teils[teilId] || [];
      if (list.length === 0) return;
      list
        .slice()
        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
        .forEach(item => {
          const value = answers[item.id];
          if (value === undefined || value === null || value === '') return;
          rows.push({ number: item.number, value, teilId });
        });
    });

    return rows;
  }, [activeSection, activeTeil, currentExercise, answers]);

  const openSummary = () => {
    setIsSummaryOpen(true);
  };

  const resetQuiz = () => {
    setAnswers({});
    setScore(null);
    setIsSummaryOpen(false);
  };

  const handleSchreibenSubmit = async () => {
    // Submit Teil 1
    if (schreibenText1.trim()) {
      await api.createTextSubmission({
        username: user.username,
        context: 'schreiben',
        content: `Teil 1: ${schreibenText1}`
      });
    }
    
    // Submit Teil 2
    if (schreibenText2.trim()) {
      await api.createTextSubmission({
        username: user.username,
        context: 'schreiben',
        content: `Teil 2: ${schreibenText2}`
      });
    }
    
    setSchreibenText1('');
    setSchreibenText2('');
    setSubmissionSuccess(true);
    setTimeout(() => setSubmissionSuccess(false), 3000);
  };

  const handleAudioSend = async (blob, duration, teil) => {
    const formData = new FormData();
    formData.append('audio', blob);
    formData.append('username', user.username);
    formData.append('context', 'sprechen');
    
    await api.createAudioSubmission(formData);
    setSubmissionSuccess(true);
    setTimeout(() => setSubmissionSuccess(false), 3000);
  };

  const renderQuestion = (q) => (
    <Card key={q.id} className="p-4">
      <p className="font-medium mb-3">{q.number}. {q.question}</p>

      {q.type === 'mcq' && (
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(q.id, opt)}
              className={`
                w-full p-3 rounded-lg text-left transition-colors
                ${answers[q.id] === opt
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg-input)] hover:bg-[var(--border)]'}
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {(q.type === 'truefalse' || q.type === 'ab') && (
        <div className="flex gap-3">
          {q.options.map(opt => (
            <button
              key={opt}
              onClick={() => handleAnswer(q.id, opt)}
              className={`
                flex-1 p-3 rounded-lg transition-colors
                ${answers[q.id] === opt
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg-input)] hover:bg-[var(--border)]'}
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </Card>
  );

  const renderTeilBlock = (title) => {
    const q = getSectionQuestions();
    const list = q?.teils?.[activeTeil] || [];

    const answeredCount = list.filter(x => {
      const v = answers[x.id];
      return v !== undefined && v !== null && v !== '';
    }).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge>{activeTeil.toUpperCase()}</Badge>
        </div>

        {list.map(renderQuestion)}

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-muted)]">In diesem Teil beantwortet</p>
              <p className="text-lg font-semibold">{answeredCount}/{list.length}</p>
            </div>
            <Button variant="ghost" onClick={openSummary}>
              Alle Antworten
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  // Shared video component - iframe on all devices (stays in platform)
  const renderVideoSection = () => {
    if (!currentExercise?.videoUrl) {
      return (
        <Card className="p-6 text-center">
          <Volume2 className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-[var(--text-secondary)]">
            Keine YouTube Video gesetzt (Admin kann eins hinzufügen)
          </p>
        </Card>
      );
    }

    const embedUrl = toYouTubeEmbedUrl(currentExercise.videoUrl);

    return (
      <Card className="overflow-hidden p-0 relative z-20 pointer-events-auto" animate={false}>
        <div className="aspect-video w-full relative pointer-events-auto">
          <iframe
            key={`${embedUrl}-${isMobile ? 'm' : 'd'}-${videoMountKey}`}
            src={embedUrl}
            className="w-full h-full relative z-20 pointer-events-auto"
            style={{ pointerEvents: 'auto' }}
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Card>
    );
  };

  const renderHoeren = () => {
    const teilTabs = teilTabsBySection.hoeren;

    return (
      <div className="space-y-4">
        <Tabs
          tabs={teilTabs}
          activeTab={activeTeil}
          onChange={(id) => {
            setActiveTeil(id);
            setScore(null);
          }}
        />

        <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0 md:isolate">
          <div className="order-2 md:order-1 relative z-10">
            {renderTeilBlock('Hören — Fragen')}
          </div>

          <div className="order-1 md:order-2 self-start relative z-30">
            {renderVideoSection()}
          </div>
        </div>
      </div>
    );
  };

  const renderLesen = () => {
    const teilTabs = teilTabsBySection.lesen;
    const q = getSectionQuestions();
    const teilText = q?.texts?.[activeTeil];

    return (
      <div className="space-y-4">
        <Tabs
          tabs={teilTabs}
          activeTab={activeTeil}
          onChange={(id) => {
            setActiveTeil(id);
            setScore(null);
          }}
        />

        <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0 md:isolate">
          <div className="order-2 md:order-1 relative z-10">
            {renderTeilBlock('Lesen — Fragen')}
          </div>

          <div className="order-1 md:order-2 self-start space-y-4 relative z-30">
            {renderVideoSection()}
            {(teilText || currentExercise?.content) && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Text:</h3>
                <p className="whitespace-pre-wrap text-[var(--text-secondary)]">
                  {teilText || currentExercise.content}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSchreiben = () => (
    <div className="space-y-4">
      <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
        <div className="order-2 md:order-1 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Teil 1: 5 Fragen beantworten</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Beantworten Sie die 5 Fragen.
            </p>

            <div className="space-y-3">
              <Input
                placeholder="1) Antwort"
                value={answers['s-t1-1'] || ''}
                onChange={(e) => handleAnswer('s-t1-1', e.target.value)}
              />
              <Input
                placeholder="2) Antwort"
                value={answers['s-t1-2'] || ''}
                onChange={(e) => handleAnswer('s-t1-2', e.target.value)}
              />
              <Input
                placeholder="3) Antwort"
                value={answers['s-t1-3'] || ''}
                onChange={(e) => handleAnswer('s-t1-3', e.target.value)}
              />
              <Input
                placeholder="4) Antwort"
                value={answers['s-t1-4'] || ''}
                onChange={(e) => handleAnswer('s-t1-4', e.target.value)}
              />
              <Input
                placeholder="5) Antwort"
                value={answers['s-t1-5'] || ''}
                onChange={(e) => handleAnswer('s-t1-5', e.target.value)}
              />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Teil 2: Schriftlicher Ausdruck</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Schreiben Sie einen kurzen Text.
            </p>

            <Input
              multiline
              rows={6}
              placeholder="Ihr Text..."
              value={schreibenText2}
              onChange={(e) => setSchreibenText2(e.target.value)}
            />

            <p className="text-xs text-[var(--text-muted)] mt-2">
              {schreibenText2.split(/\s+/).filter(w => w).length} Wörter
            </p>
          </Card>
        </div>

        <div className="order-1 md:order-2 self-start">
          {renderVideoSection()}
        </div>
      </div>

      {submissionSuccess && (
        <Card className="p-4 bg-[var(--accent)]/20 border-[var(--accent)]">
          <p className="text-[var(--accent)] font-medium text-center">
            ✓ Erfolgreich eingereicht!
          </p>
        </Card>
      )}

      <Button
        fullWidth
        onClick={async () => {
          const teil1 = [1, 2, 3, 4, 5]
            .map(i => `${i}) ${answers[`s-t1-${i}`] || ''}`)
            .join('\n');
          setSchreibenText1(teil1);
          await handleSchreibenSubmit();
          setAnswers({});
        }}
        disabled={
          !(
            (answers['s-t1-1'] || '').trim() ||
            (answers['s-t1-2'] || '').trim() ||
            (answers['s-t1-3'] || '').trim() ||
            (answers['s-t1-4'] || '').trim() ||
            (answers['s-t1-5'] || '').trim() ||
            schreibenText2.trim()
          )
        }
      >
        Einreichen
      </Button>
    </div>
  );

  const renderSprechen = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Teil 1: Vorstellung</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Stellen Sie sich vor (Name, Alter, Wohnort).
        </p>
        <AudioRecorder onSend={(blob) => handleAudioSend(blob, 0, 1)} />
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Teil 2: Frage stellen</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Stellen Sie eine Frage mit diesen Wörtern:
        </p>
        
        <div className="flex gap-3 mb-4">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {speakingWords.teil2.word1 || '...'}
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {speakingWords.teil2.word2 || '...'}
          </Badge>
        </div>
        
        <AudioRecorder onSend={(blob) => handleAudioSend(blob, 0, 2)} />
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Teil 3: Bitte äußern</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Machen Sie eine Bitte mit diesen Wörtern:
        </p>
        
        <div className="flex gap-3 mb-4">
          <Badge variant="primary" className="text-lg px-4 py-2">
            {speakingWords.teil3.word1 || '...'}
          </Badge>
          <Badge variant="primary" className="text-lg px-4 py-2">
            {speakingWords.teil3.word2 || '...'}
          </Badge>
        </div>
        
        <AudioRecorder onSend={(blob) => handleAudioSend(blob, 0, 3)} />
      </Card>

      {submissionSuccess && (
        <Card className="p-4 bg-[var(--accent)]/20 border-[var(--accent)]">
          <p className="text-[var(--accent)] font-medium text-center">
            ✓ Audio erfolgreich eingereicht!
          </p>
        </Card>
      )}

      <Button 
        variant="ghost" 
        fullWidth 
        onClick={loadSpeakingWords}
        icon={<RotateCcw className="w-5 h-5" />}
      >
        Neue Wörter
      </Button>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'hoeren': return renderHoeren();
      case 'lesen': return renderLesen();
      case 'schreiben': return renderSchreiben();
      case 'sprechen': return renderSprechen();
      default: return renderHoeren();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title="Prüfung" 
        back={() => navigate('/dashboard')}
        username={user?.username}
      />

      <div className="p-4">
        <Tabs
          tabs={tabs}
          activeTab={activeSection}
          onChange={setActiveSection}
        />
      </div>

      <main className="flex-1 p-4 pt-16">
        {renderContent()}
      </main>

      <Modal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        title="Mes réponses"
        size="md"
      >
        {(activeSection === 'hoeren' || activeSection === 'lesen') ? (
          <div className="space-y-4">
            {allAnswersSummary.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-[var(--text-muted)]">
                  Aucune réponse cochée pour le moment.
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {allAnswersSummary.map((row) => (
                  <div
                    key={`${row.teilId}-${row.number}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border)]"
                  >
                    <span className="font-medium">{row.number}</span>
                    <span className="text-[var(--text-secondary)]">→</span>
                    <span className="font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button fullWidth variant="ghost" onClick={() => setIsSummaryOpen(false)}>
                Fermer
              </Button>
              <Button fullWidth variant="danger" onClick={resetQuiz} icon={<RotateCcw className="w-5 h-5" />}>
                Recommencer
              </Button>
            </div>
          </div>
        ) : (
          <Card className="p-4">
            <p className="text-sm text-[var(--text-muted)]">Récap disponible uniquement pour Hören et Lesen.</p>
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default ExamMode;
