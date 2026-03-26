export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = {
  // Users
  login: async (username) => {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return res.json();
  },

  getUser: async (username) => {
    const res = await fetch(`${API_BASE}/users/${username}`);
    return res.json();
  },

  // Exercises
  getExercises: async (type) => {
    const url = type ? `${API_BASE}/exercises?type=${type}` : `${API_BASE}/exercises`;
    const res = await fetch(url);
    return res.json();
  },

  getExercise: async (id) => {
    const res = await fetch(`${API_BASE}/exercises/${id}`);
    return res.json();
  },

  getSpeakingWords: async () => {
    const res = await fetch(`${API_BASE}/exercises/speaking/words`);
    return res.json();
  },

  getThemes: async () => {
    const res = await fetch(`${API_BASE}/exercises/themes/all`);
    return res.json();
  },

  // Grammar Exercises
  getGrammarExercises: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.theme) params.append('theme', filters.theme);
    if (filters.niveau) params.append('niveau', filters.niveau);
    if (filters.sous_theme) params.append('sous_theme', filters.sous_theme);
    if (filters.type) params.append('type', filters.type);
    if (Number.isFinite(filters.limit)) params.append('limit', String(filters.limit));
    if (Number.isFinite(filters.offset)) params.append('offset', String(filters.offset));
    
    const url = `${API_BASE}/grammar-exercises?${params.toString()}`;
    const res = await fetch(url);
    return res.json();
  },

  getGrammarExercise: async (uid) => {
    const res = await fetch(`${API_BASE}/grammar-exercises/${uid}`);
    return res.json();
  },

  // Submissions
  getSubmissions: async (context, username) => {
    let url = `${API_BASE}/submissions?`;
    if (context) url += `context=${context}&`;
    if (username) url += `username=${username}`;
    const res = await fetch(url);
    return res.json();
  },

  getSubmission: async (id) => {
    const res = await fetch(`${API_BASE}/submissions/${id}`);
    return res.json();
  },

  createTextSubmission: async (data) => {
    const res = await fetch(`${API_BASE}/submissions/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  createAudioSubmission: async (formData) => {
    const res = await fetch(`${API_BASE}/submissions/audio`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // Comments
  getComments: async (submissionId) => {
    const res = await fetch(`${API_BASE}/comments/submission/${submissionId}`);
    return res.json();
  },

  createComment: async (data) => {
    const res = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Admin
  getAdminStats: async (username, adminToken) => {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: {
        'x-username': username,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      }
    });
    return res.json();
  },

  getAdminThemes: async (username, adminToken) => {
    const res = await fetch(`${API_BASE}/admin/themes`, {
      headers: {
        'x-username': username,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      }
    });
    return res.json();
  },

  webauthnRegisterOptions: async (username, { platformOnly } = {}) => {
    const res = await fetch(`${API_BASE}/admin/webauthn/register/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-username': username
      },
      body: JSON.stringify({ platformOnly: Boolean(platformOnly) })
    });
    return res.json();
  },

  webauthnRegisterVerify: async (username, credential) => {
    const res = await fetch(`${API_BASE}/admin/webauthn/register/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-username': username
      },
      body: JSON.stringify(credential)
    });
    return res.json();
  },

  webauthnAuthOptions: async (username, { platformOnly } = {}) => {
    const res = await fetch(`${API_BASE}/admin/webauthn/auth/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-username': username
      },
      body: JSON.stringify({ platformOnly: Boolean(platformOnly) })
    });
    return res.json();
  },

  webauthnAuthVerify: async (username, assertion) => {
    const res = await fetch(`${API_BASE}/admin/webauthn/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-username': username
      },
      body: JSON.stringify(assertion)
    });
    return res.json();
  },

  addExercise: async (username, adminToken, data) => {
    const res = await fetch(`${API_BASE}/admin/exercises`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-username': username,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateExercise: async (username, adminToken, id, data) => {
    const res = await fetch(`${API_BASE}/admin/exercises/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-username': username,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteExercise: async (username, adminToken, id) => {
    const res = await fetch(`${API_BASE}/admin/exercises/${id}`, {
      method: 'DELETE',
      headers: {
        'x-username': username,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      }
    });
    return res.json();
  },

  addWord: async (username, adminToken, word) => {
    const res = await fetch(`${API_BASE}/admin/words`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-username': username,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      },
      body: JSON.stringify({ word })
    });
    return res.json();
  },

  getWords: async (username, adminToken) => {
    const res = await fetch(`${API_BASE}/admin/words`, {
      headers: {
        'x-username': username,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      }
    });
    return res.json();
  },

  deleteWord: async (username, adminToken, id) => {
    const res = await fetch(`${API_BASE}/admin/words/${id}`, {
      method: 'DELETE',
      headers: {
        'x-username': username,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      }
    });
    return res.json();
  },

  addTheme: async (username, adminToken, title) => {
    const res = await fetch(`${API_BASE}/admin/themes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-username': username,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      },
      body: JSON.stringify({ title })
    });
    return res.json();
  },

  deleteTheme: async (username, adminToken, id) => {
    const res = await fetch(`${API_BASE}/admin/themes/${id}`, {
      method: 'DELETE',
      headers: {
        'x-username': username,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      }
    });
    return res.json();
  },

  transferAdmin: async (username, adminToken, newUsername) => {
    const res = await fetch(`${API_BASE}/admin/transfer-admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-username': username,
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
      },
      body: JSON.stringify({ newUsername })
    });
    return res.json();
  }
};

export default api;
