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
  getAdminStats: async (username) => {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'x-username': username }
    });
    return res.json();
  },

  addExercise: async (username, data) => {
    const res = await fetch(`${API_BASE}/admin/exercises`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-username': username 
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateExercise: async (username, id, data) => {
    const res = await fetch(`${API_BASE}/admin/exercises/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-username': username
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteExercise: async (username, id) => {
    const res = await fetch(`${API_BASE}/admin/exercises/${id}`, {
      method: 'DELETE',
      headers: { 'x-username': username }
    });
    return res.json();
  },

  addWord: async (username, word) => {
    const res = await fetch(`${API_BASE}/admin/words`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-username': username 
      },
      body: JSON.stringify({ word })
    });
    return res.json();
  },

  getWords: async (username) => {
    const res = await fetch(`${API_BASE}/admin/words`, {
      headers: { 'x-username': username }
    });
    return res.json();
  },

  deleteWord: async (username, id) => {
    const res = await fetch(`${API_BASE}/admin/words/${id}`, {
      method: 'DELETE',
      headers: { 'x-username': username }
    });
    return res.json();
  },

  addTheme: async (username, title) => {
    const res = await fetch(`${API_BASE}/admin/themes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-username': username 
      },
      body: JSON.stringify({ title })
    });
    return res.json();
  },

  deleteTheme: async (username, id) => {
    const res = await fetch(`${API_BASE}/admin/themes/${id}`, {
      method: 'DELETE',
      headers: { 'x-username': username }
    });
    return res.json();
  },

  transferAdmin: async (username, newUsername) => {
    const res = await fetch(`${API_BASE}/admin/transfer-admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-username': username
      },
      body: JSON.stringify({ newUsername })
    });
    return res.json();
  }
};

export default api;
