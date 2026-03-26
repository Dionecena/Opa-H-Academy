import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { 
  Plus, Trash2, Video, FileText,
  Users, MessageCircle, Pen, Youtube, X, UserCog, LogOut
} from 'lucide-react';
import { Card, Button, Header, Input, Badge, Collapsible } from '../components/UI';
import { useAuth } from '../App';
import api from '../config/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isMobile = (() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod/i.test(ua);
  })();
  
  const [stats, setStats] = useState({});
  const [words, setWords] = useState([]);
  const [themes, setThemes] = useState([]);
  const [exercises, setExercises] = useState([]);
  
  // Form states
  const [newWord, setNewWord] = useState('');
  const [newTheme, setNewTheme] = useState('');
  const [examVideoHoeren, setExamVideoHoeren] = useState('');
  const [examVideoLesen, setExamVideoLesen] = useState('');
  const [examVideoSchreiben, setExamVideoSchreiben] = useState('');
  const [savingExamVideos, setSavingExamVideos] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');

  const [adminToken, setAdminToken] = useState('');
  const [adminTokenExpiresAt, setAdminTokenExpiresAt] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  const clearAdminSession = () => {
    setAdminToken('');
    setAdminTokenExpiresAt('');
    try {
      sessionStorage.removeItem('adminSession');
    } catch (_) {}
  };

  const formatWebAuthnError = (err) => {
    const name = String(err?.name || '').trim();
    const msg = String(err?.message || '').trim();

    if (name === 'NotAllowedError') {
      return "Opération annulée ou expirée. Réessaie et valide la fenêtre système (FaceID/TouchID/PIN).";
    }
    if (name === 'InvalidStateError') {
      return "Cette passkey existe déjà sur cet appareil pour ce site. Utilise plutôt 'Déverrouiller Admin' ou supprime l'ancienne passkey.";
    }
    if (name === 'SecurityError') {
      return "Sécurité WebAuthn refusée. Vérifie que tu es sur http://localhost:3000 (ou HTTPS en production) et que l'origine correspond.";
    }
    if (name === 'NotSupportedError') {
      return "Ton navigateur/appareil ne supporte pas les passkeys/WebAuthn.";
    }

    if (msg) {
      // Avoid showing the long W3C URL
      return msg.split(' See: https://www.w3.org/TR/webauthn-2/#sctn-privacy-considerations-client.')[0];
    }
    return 'Erreur passkey';
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      try {
        const saved = JSON.parse(sessionStorage.getItem('adminSession') || 'null');
        if (saved?.token && saved?.expiresAt) {
          if (new Date(saved.expiresAt).getTime() > Date.now()) {
            setAdminToken(saved.token);
            setAdminTokenExpiresAt(saved.expiresAt);
          } else {
            sessionStorage.removeItem('adminSession');
          }
        }
      } catch (_) {
        try {
          sessionStorage.removeItem('adminSession');
        } catch (_) {}
      }
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin' && adminToken) {
      loadData();
    }
    // eslint-disable-next-line
  }, [adminToken]);

  const buildExamTemplate = (sectionId) => {
    if (sectionId === 'hoeren') {
      return {
        section: 'hoeren',
        teils: {
          teil1: Array.from({ length: 6 }).map((_, i) => ({
            id: `h-t1-${i + 1}`,
            number: i + 1,
            type: 'mcq',
            question: '',
            options: ['A', 'B', 'C']
          })),
          teil2: Array.from({ length: 4 }).map((_, i) => ({
            id: `h-t2-${i + 7}`,
            number: i + 7,
            type: 'truefalse',
            question: '',
            options: ['Richtig', 'Falsch']
          })),
          teil3: Array.from({ length: 5 }).map((_, i) => ({
            id: `h-t3-${i + 11}`,
            number: i + 11,
            type: 'mcq',
            question: '',
            options: ['A', 'B', 'C']
          }))
        }
      };
    }

    return {
      section: 'lesen',
      texts: {
        teil1: '',
        teil2: '',
        teil3: ''
      },
      teils: {
        teil1: Array.from({ length: 5 }).map((_, i) => ({
          id: `l-t1-${i + 1}`,
          number: i + 1,
          type: 'truefalse',
          question: '',
          options: ['Richtig', 'Falsch']
        })),
        teil2: Array.from({ length: 5 }).map((_, i) => ({
          id: `l-t2-${i + 6}`,
          number: i + 6,
          type: 'ab',
          question: '',
          options: ['A', 'B']
        })),
        teil3: Array.from({ length: 5 }).map((_, i) => ({
          id: `l-t3-${i + 11}`,
          number: i + 11,
          type: 'truefalse',
          question: '',
          options: ['Richtig', 'Falsch']
        }))
      }
    };
  };

  const loadData = async () => {
    if (!adminToken) return;

    const [statsData, wordsData, themesData, exercisesData] = await Promise.all([
      api.getAdminStats(user.username, adminToken),
      api.getWords(user.username, adminToken),
      api.getAdminThemes(user.username, adminToken),
      api.getExercises('exam')
    ]);

    if (statsData?.error && (String(statsData.error).includes('verrouill') || String(statsData.error).includes('expir'))) {
      clearAdminSession();
      return;
    }
    
    setStats(statsData);
    setWords(wordsData);
    setThemes(themesData);
    setExercises(exercisesData);

    const bySection = {
      hoeren: exercisesData.find(ex => ex?.questions?.section === 'hoeren'),
      lesen: exercisesData.find(ex => ex?.questions?.section === 'lesen'),
      schreiben: exercisesData.find(ex => ex?.questions?.section === 'schreiben')
    };
    setExamVideoHoeren(bySection.hoeren?.videoUrl || '');
    setExamVideoLesen(bySection.lesen?.videoUrl || '');
    setExamVideoSchreiben(bySection.schreiben?.videoUrl || '');
  };

  const upsertExamVideo = async ({ section, url, existing }) => {
    const payload = {
      title: `${section} Video`,
      type: 'exam',
      videoUrl: url,
      questions: section === 'schreiben' ? { section: 'schreiben' } : (existing?.questions || buildExamTemplate(section)),
      content: existing?.content || null
    };

    if (existing?.id) {
      return api.updateExercise(user.username, adminToken, existing.id, payload);
    }
    return api.addExercise(user.username, adminToken, payload);
  };

  const handleSaveExamVideos = async () => {
    setSavingExamVideos(true);
    try {
      const existingHoeren = exercises.find(ex => ex?.questions?.section === 'hoeren');
      const existingLesen = exercises.find(ex => ex?.questions?.section === 'lesen');
      const existingSchreiben = exercises.find(ex => ex?.questions?.section === 'schreiben');

      await Promise.all([
        upsertExamVideo({ section: 'hoeren', url: examVideoHoeren, existing: existingHoeren }),
        upsertExamVideo({ section: 'lesen', url: examVideoLesen, existing: existingLesen }),
        upsertExamVideo({ section: 'schreiben', url: examVideoSchreiben, existing: existingSchreiben })
      ]);

      await loadData();
    } finally {
      setSavingExamVideos(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    await api.addWord(user.username, adminToken, newWord.trim());
    setNewWord('');
    loadData();
  };

  const handleDeleteWord = async (id) => {
    await api.deleteWord(user.username, adminToken, id);
    loadData();
  };

  const handleAddTheme = async () => {
    if (!newTheme.trim()) return;
    await api.addTheme(user.username, adminToken, newTheme.trim());
    setNewTheme('');
    loadData();
  };

  const handleDeleteTheme = async (id) => {
    await api.deleteTheme(user.username, adminToken, id);
    loadData();
  };

  const handleTransferAdmin = async () => {
    if (!newAdminUsername.trim()) return;
    
    setTransferring(true);
    setTransferError('');
    
    try {
      const result = await api.transferAdmin(user.username, adminToken, newAdminUsername.trim());
      
      if (result.error) {
        setTransferError(result.error);
      } else {
        // Logout current user and redirect to login
        localStorage.removeItem('user');
        navigate('/');
      }
    } catch (err) {
      setTransferError('Erreur lors du transfert');
    } finally {
      setTransferring(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setRegistering(true);
    setUnlockError('');
    try {
      const options = await api.webauthnRegisterOptions(user.username, { platformOnly: isMobile });
      if (options?.error) {
        setUnlockError(options.error);
        return;
      }
      const attResp = await startRegistration(options);
      const result = await api.webauthnRegisterVerify(user.username, attResp);
      if (result?.error) {
        setUnlockError(result.error);
      }
    } catch (err) {
      setUnlockError(formatWebAuthnError(err));
    } finally {
      setRegistering(false);
    }
  };

  const handleUnlockAdmin = async () => {
    setUnlocking(true);
    setUnlockError('');
    try {
      const options = await api.webauthnAuthOptions(user.username, { platformOnly: isMobile });
      if (options?.error) {
        setUnlockError(options.error);
        return;
      }

      const authResp = await startAuthentication(options);
      const result = await api.webauthnAuthVerify(user.username, authResp);
      if (result?.error) {
        setUnlockError(result.error);
        return;
      }

      if (result?.token && result?.expiresAt) {
        setAdminToken(result.token);
        setAdminTokenExpiresAt(result.expiresAt);
        sessionStorage.setItem('adminSession', JSON.stringify({ token: result.token, expiresAt: result.expiresAt }));
      } else {
        setUnlockError('Réponse invalide');
      }
    } catch (err) {
      setUnlockError(formatWebAuthnError(err));
    } finally {
      setUnlocking(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-[var(--danger)]">Zugriff verweigert</p>
        </Card>
      </div>
    );
  }

  if (!adminToken) {
    return (
      <div className="min-h-screen">
        <Header
          title="Admin"
          subtitle="Déverrouillage requis"
          onBack={() => navigate('/dashboard')}
        />

        <main className="max-w-4xl mx-auto px-4 pb-10">
          <Card className="p-6">
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Pour accéder aux fonctions admin, déverrouille avec une passkey (FaceID/TouchID/PIN).
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleUnlockAdmin}
                loading={unlocking}
                fullWidth
              >
                Déverrouiller Admin
              </Button>
              <Button
                variant="outline"
                onClick={handleRegisterPasskey}
                loading={registering}
                fullWidth
              >
                Enregistrer une passkey
              </Button>
            </div>
            {unlockError && (
              <p className="text-sm text-[var(--danger)] mt-3">{unlockError}</p>
            )}
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title="Admin Panel" 
        back={() => navigate('/dashboard')}
      />

      <main className="flex-1 p-4 pt-16">
        <div className="max-w-4xl mx-auto mb-4">
          <Card className="p-4 flex items-center justify-between" animate={false}>
            <div className="text-sm text-[var(--text-muted)]">
              Session admin active jusqu'à {adminTokenExpiresAt ? new Date(adminTokenExpiresAt).toLocaleString() : '...'}
            </div>
            <Button variant="outline" onClick={clearAdminSession}>
              Verrouiller
            </Button>
          </Card>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <Card className="p-3 text-center" animate={false}>
            <Users className="w-6 h-6 mx-auto mb-1 text-[var(--primary)]" />
            <p className="text-xl font-bold">{stats.users || 0}</p>
            <p className="text-xs text-[var(--text-muted)]">Benutzer</p>
          </Card>
          <Card className="p-3 text-center" animate={false}>
            <FileText className="w-6 h-6 mx-auto mb-1 text-[var(--secondary)]" />
            <p className="text-xl font-bold">{stats.submissions || 0}</p>
            <p className="text-xs text-[var(--text-muted)]">Einträge</p>
          </Card>
          <Card className="p-3 text-center" animate={false}>
            <MessageCircle className="w-6 h-6 mx-auto mb-1 text-[var(--accent)]" />
            <p className="text-xl font-bold">{stats.comments || 0}</p>
            <p className="text-xs text-[var(--text-muted)]">Kommentare</p>
          </Card>
        </motion.div>

        {/* Videos Exam */}
        <Collapsible 
          title="Liens vidéos (Exam)" 
          icon={<Video className="w-5 h-5 text-[var(--primary)]" />}
          className="mb-4"
        >
          <div className="space-y-3">
            <Input
              placeholder="Lien vidéo Hören"
              value={examVideoHoeren}
              onChange={(e) => setExamVideoHoeren(e.target.value)}
              icon={<Youtube className="w-4 h-4" />}
            />
            <Input
              placeholder="Lien vidéo Lesen"
              value={examVideoLesen}
              onChange={(e) => setExamVideoLesen(e.target.value)}
              icon={<Youtube className="w-4 h-4" />}
            />
            <Input
              placeholder="Lien vidéo Schreiben"
              value={examVideoSchreiben}
              onChange={(e) => setExamVideoSchreiben(e.target.value)}
              icon={<Youtube className="w-4 h-4" />}
            />

            <Button fullWidth onClick={handleSaveExamVideos} loading={savingExamVideos}>
              Enregistrer
            </Button>
          </div>
        </Collapsible>

        {/* Speaking Words */}
        <Collapsible 
          title="Wörter (Sprechen)" 
          icon={<Pen className="w-5 h-5 text-[var(--secondary)]" />}
          className="mb-4"
        >
          <div className="space-y-4">
            {/* Add Word Form */}
            <div className="flex gap-2">
              <Input
                placeholder="Neues Wort"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
              />
              <Button onClick={handleAddWord}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Words List */}
            <div className="flex flex-wrap gap-2">
              {words.map(word => (
                <Badge 
                  key={word.id} 
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[var(--danger)]"
                  onClick={() => handleDeleteWord(word.id)}
                >
                  {word.word}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
              {words.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">
                  Keine Wörter
                </p>
              )}
            </div>
          </div>
        </Collapsible>

        {/* Themes */}
        <Collapsible 
          title="Themen (Übungen)" 
          icon={<FileText className="w-5 h-5 text-[var(--accent)]" />}
        >
          <div className="space-y-4">
            {/* Add Theme Form */}
            <div className="flex gap-2">
              <Input
                placeholder="Neues Thema"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTheme()}
              />
              <Button onClick={handleAddTheme}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Themes List */}
            <div className="space-y-2">
              {themes.map(theme => (
                <div 
                  key={theme.id}
                  className="flex items-center justify-between p-3 bg-[var(--bg-input)] rounded-lg"
                >
                  <span>{theme.title}</span>
                  <button
                    onClick={() => handleDeleteTheme(theme.id)}
                    className="p-2 text-[var(--danger)] hover:bg-[var(--danger)]/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {themes.length === 0 && (
                <p className="text-center text-sm text-[var(--text-muted)] py-4">
                  Keine Themen
                </p>
              )}
            </div>
          </div>
        </Collapsible>

        {/* Transfer Admin */}
        <Collapsible 
          title="Admin übertragen" 
          icon={<UserCog className="w-5 h-5 text-[var(--danger)]" />}
          className="mt-4"
        >
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">
              Transférez les droits d'admin à un autre utilisateur. Vous serez déconnecté.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Nouveau pseudo admin"
                value={newAdminUsername}
                onChange={(e) => setNewAdminUsername(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleTransferAdmin()}
              />
              <Button 
                variant="outline" 
                onClick={handleTransferAdmin}
                loading={transferring}
                disabled={!newAdminUsername.trim()}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
            {transferError && (
              <p className="text-sm text-[var(--danger)]">{transferError}</p>
            )}
          </div>
        </Collapsible>
      </main>
    </div>
  );
};

export default AdminPanel;
