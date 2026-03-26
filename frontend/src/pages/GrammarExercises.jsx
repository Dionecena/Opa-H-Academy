import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight, Eye, EyeOff, Filter, RotateCcw, GraduationCap } from 'lucide-react';
import { Card, Button, Header } from '../components/UI';
import { useAuth } from '../App';
import api from '../config/api';

const GrammarExercises = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [textAnswers, setTextAnswers] = useState({});
  const [filterOptionsLoaded, setFilterOptionsLoaded] = useState(false);
  const [filterMeta, setFilterMeta] = useState([]);
  const [filters, setFilters] = useState({
    theme: '',
    niveau: '',
    sous_theme: ''
  });
  const [availableThemes, setAvailableThemes] = useState([]);
  const [availableNiveaux, setAvailableNiveaux] = useState([]);
  const [availableSousThemes, setAvailableSousThemes] = useState([]);

  // Charger les options de filtres une seule fois (non filtrées)
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Charger les exercices (filtrés)
  useEffect(() => {
    loadExercises();
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      const pageSize = 200;
      let offset = 0;
      let all = [];
      // Pagination: l'API limite à 50 par défaut, donc on récupère tout.
      while (true) {
        const chunk = await api.getGrammarExercises({ limit: pageSize, offset });
        const arr = Array.isArray(chunk) ? chunk : [];
        all = all.concat(arr);
        if (arr.length < pageSize) break;
        offset += pageSize;
        if (offset > 20000) break;
      }

      const data = all;

      const meta = (Array.isArray(data) ? data : []).map(ex => ({
        theme: ex?.theme || '',
        niveau: ex?.niveau || '',
        sous_theme: ex?.sous_theme || ''
      }));
      setFilterMeta(meta);

      const themes = [...new Set(data.map(ex => ex.theme))].filter(Boolean).sort();
      const niveaux = [...new Set(data.map(ex => ex.niveau))].filter(Boolean).sort();
      const sousThemes = [...new Set(data.map(ex => ex.sous_theme))].filter(Boolean).sort();

      setAvailableThemes(themes);
      setAvailableNiveaux(niveaux);
      setAvailableSousThemes(sousThemes);
      setFilterOptionsLoaded(true);
    } catch (error) {
      console.error('Erreur chargement options filtres:', error);
    }
  };

  const optionMatchesFilters = (candidate, partialFilters) => {
    return filterMeta.some(m => {
      if (partialFilters.theme && m.theme !== partialFilters.theme) return false;
      if (partialFilters.niveau && m.niveau !== partialFilters.niveau) return false;
      if (partialFilters.sous_theme && m.sous_theme !== partialFilters.sous_theme) return false;
      if (candidate.theme && m.theme !== candidate.theme) return false;
      if (candidate.niveau && m.niveau !== candidate.niveau) return false;
      if (candidate.sous_theme && m.sous_theme !== candidate.sous_theme) return false;
      return true;
    });
  };

  const loadExercises = async () => {
    setLoading(true);
    try {
      const data = await api.getGrammarExercises(filters);
      setExercises(data);
      setCurrentIndex(0);
      setShowAnswer(false);
      setSelectedAnswers({});
      setTextAnswers({});
    } catch (error) {
      console.error('Erreur chargement exercices:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentExercise = exercises[currentIndex];

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setSelectedAnswers({});
      setTextAnswers({});
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
      setSelectedAnswers({});
      setTextAnswers({});
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSelectedAnswers({});
    setTextAnswers({});
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };

      if (key !== 'theme' && next.theme) {
        const themeOk = optionMatchesFilters({ theme: next.theme }, { niveau: next.niveau, sous_theme: next.sous_theme });
        if (!themeOk) next.theme = '';
      }

      if (key !== 'niveau' && next.niveau) {
        const niveauOk = optionMatchesFilters({ niveau: next.niveau }, { theme: next.theme, sous_theme: next.sous_theme });
        if (!niveauOk) next.niveau = '';
      }

      if (key !== 'sous_theme' && next.sous_theme) {
        const stOk = optionMatchesFilters({ sous_theme: next.sous_theme }, { theme: next.theme, niveau: next.niveau });
        if (!stOk) next.sous_theme = '';
      }

      return next;
    });
  };

  const clearFilters = () => {
    setFilters({ theme: '', niveau: '', sous_theme: '' });
  };

  const handleSelectAnswer = (qIndex, option) => {
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const isCorrectAnswer = (option, question) => {
    return option === question.reponse;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Grammatik Übungen"
        back={() => navigate('/dashboard')}
        username={user?.username}
      />

      <main className="flex-1 p-3 pt-16">
        {/* Filtres */}
        <Card className="p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-[var(--primary)]" />
            <span className="font-medium text-sm">Filter</span>
            {(filters.theme || filters.niveau || filters.sous_theme) && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-[var(--primary)] font-medium px-2 py-1 rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {/* Filtre Thème */}
            <select
              value={filters.theme}
              onChange={(e) => handleFilterChange('theme', e.target.value)}
              className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[var(--radius-sm)] px-3 py-3 text-sm min-h-[44px]"
            >
              <option value="">Alle Themen</option>
              {availableThemes.map(theme => (
                <option
                  key={theme}
                  value={theme}
                  disabled={
                    Boolean(filters.niveau || filters.sous_theme)
                    && !optionMatchesFilters({ theme }, { niveau: filters.niveau, sous_theme: filters.sous_theme })
                  }
                >
                  {theme}
                </option>
              ))}
            </select>

            {/* Filtre Niveau */}
            <select
              value={filters.niveau}
              onChange={(e) => handleFilterChange('niveau', e.target.value)}
              className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[var(--radius-sm)] px-3 py-3 text-sm min-h-[44px]"
            >
              <option value="">Alle Niveaus</option>
              {availableNiveaux.map(niveau => (
                <option
                  key={niveau}
                  value={niveau}
                  disabled={
                    Boolean(filters.theme || filters.sous_theme)
                    && !optionMatchesFilters({ niveau }, { theme: filters.theme, sous_theme: filters.sous_theme })
                  }
                >
                  {niveau}
                </option>
              ))}
            </select>

            {/* Filtre Sous-thème */}
            <select
              value={filters.sous_theme}
              onChange={(e) => handleFilterChange('sous_theme', e.target.value)}
              className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[var(--radius-sm)] px-3 py-3 text-sm min-h-[44px]"
            >
              <option value="">Alle Unterthemen</option>
              {availableSousThemes.map(st => (
                <option
                  key={st}
                  value={st}
                  disabled={
                    Boolean(filters.theme || filters.niveau)
                    && !optionMatchesFilters({ sous_theme: st }, { theme: filters.theme, niveau: filters.niveau })
                  }
                >
                  {st}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Compteur et navigation */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <GraduationCap className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
            <span className="text-sm text-[var(--text-secondary)] truncate">
              {exercises.length > 0 ? (
                <>{currentIndex + 1}/{exercises.length}</>
              ) : (
                <>Keine Übungen</>
              )}
            </span>
          </div>
          
          {exercises.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-3 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-strong)] disabled:opacity-30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === exercises.length - 1}
                className="p-3 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-strong)] disabled:opacity-30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleReset}
                className="p-3 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-strong)] text-[var(--text-muted)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Zurück zum Anfang"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Affichage de l'exercice */}
        {currentExercise ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentExercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-3">
                {/* En-tête de l'exercice */}
                <div className="mb-3 pb-3 border-b border-[var(--glass-border)]">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium rounded-lg">
                      {currentExercise.theme}
                    </span>
                    {currentExercise.sous_theme && (
                      <span className="px-2 py-1 bg-[var(--secondary)]/10 text-[var(--secondary)] text-xs font-medium rounded-lg">
                        {currentExercise.sous_theme}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-medium rounded-lg">
                      {currentExercise.niveau}
                    </span>
                    <span className="px-2 py-1 bg-[var(--glass-bg)] text-[var(--text-muted)] text-xs rounded-lg">
                      {currentExercise.difficulty}
                    </span>
                  </div>
                  
                  <h2 className="font-semibold text-base leading-snug">{currentExercise.consigne}</h2>
                </div>

                {/* Questions */}
                <div className="space-y-3">
                  {currentExercise.questions?.map((question, qIndex) => (
                    <div key={qIndex} className="border-b border-[var(--glass-border)] pb-3 last:border-0 last:pb-0">
                      <p className="font-medium mb-2 text-sm leading-relaxed">
                        <span className="text-[var(--primary)] font-semibold">{qIndex + 1}.</span> {question.question}
                      </p>
                      
                      {question.options && question.options.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {question.options.map((option, oIndex) => {
                            const isSelected = selectedAnswers[qIndex] === option;
                            const isCorrect = isCorrectAnswer(option, question);
                            const showResult = showAnswer && isCorrect;
                            const showWrong = showAnswer && isSelected && !isCorrect;
                            
                            return (
                              <button
                                key={oIndex}
                                onClick={() => !showAnswer && handleSelectAnswer(qIndex, option)}
                                disabled={showAnswer}
                                className={`
                                  p-3 rounded-xl text-left text-sm transition-all min-h-[48px]
                                  ${showResult 
                                    ? 'bg-green-500/20 border-2 border-green-500' 
                                    : showWrong
                                      ? 'bg-red-500/20 border-2 border-red-500'
                                      : isSelected
                                        ? 'bg-[var(--primary)]/20 border-2 border-[var(--primary)]'
                                        : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] active:bg-[var(--primary)]/10'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 rounded-lg bg-[var(--glass-bg-strong)] flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {String.fromCharCode(65 + oIndex)}
                                  </span>
                                  <span className="flex-1 break-words">{option}</span>
                                  {showResult && <span className="text-green-500 text-lg flex-shrink-0">✓</span>}
                                  {showWrong && <span className="text-red-500 text-lg flex-shrink-0">✗</span>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        // Question sans options (type ordre ou texte libre) - champ de saisie
                        <div className="space-y-2">
                          <textarea
                            value={textAnswers[qIndex] || ''}
                            onChange={(e) => setTextAnswers(prev => ({ ...prev, [qIndex]: e.target.value }))}
                            placeholder="Schreiben Sie Ihre Antwort..."
                            disabled={showAnswer}
                            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-3 py-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] disabled:opacity-60"
                          />
                          {showAnswer && (
                            <div className="bg-[var(--glass-bg)] rounded-xl p-3 border border-[var(--glass-border)]">
                              <p className="text-xs text-[var(--text-muted)] mb-1 font-medium">Musterlösung:</p>
                              <p className="font-medium text-green-600 text-sm">{question.reponse}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bouton Voir réponse */}
                <div className="mt-4 pt-3 border-t border-[var(--glass-border)]">
                  <Button
                    onClick={() => setShowAnswer(!showAnswer)}
                    variant={showAnswer ? "outline" : "primary"}
                    fullWidth
                    size="lg"
                    icon={showAnswer ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  >
                    {showAnswer ? 'Verbergen' : 'Antwort anzeigen'}
                  </Button>
                  
                  {showAnswer && currentExercise?.questions?.some((_, idx) => selectedAnswers[idx] !== undefined) && (
                    <div className="mt-3 p-3 rounded-xl text-center text-sm font-medium bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                      {(() => {
                        const total = currentExercise.questions?.filter(q => Array.isArray(q.options) && q.options.length > 0).length || 0;
                        const answered = Object.keys(selectedAnswers).length;
                        const correct = (currentExercise.questions || []).reduce((acc, q, idx) => {
                          if (!Array.isArray(q.options) || q.options.length === 0) return acc;
                          const sel = selectedAnswers[idx];
                          if (sel === undefined) return acc;
                          return acc + (isCorrectAnswer(sel, q) ? 1 : 0);
                        }, 0);

                        if (total === 0) return <span className="text-[var(--text-muted)]">Antworten angezeigt.</span>;
                        return (
                          <>
                            <span className={correct === total ? 'text-green-500' : 'text-[var(--text-secondary)]'}>
                              {correct}/{total} richtig
                            </span>
                            {answered < total && (
                              <span className="text-[var(--text-muted)]"> (nur {answered} beantwortet)</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        ) : (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
            <h3 className="font-semibold text-lg mb-2">Keine Übungen gefunden</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              Versuchen Sie andere Filter oder fügen Sie neue Übungen hinzu.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Filter zurücksetzen
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default GrammarExercises;
