import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ChevronLeft, Filter } from 'lucide-react';
import { Card, Header, Tabs, EmptyState } from '../components/UI';
import SubmissionCard from '../components/SubmissionCard';
import { useAuth } from '../App';
import api from '../config/api';

const Collaborative = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'Alle' },
    { id: 'hoeren', label: 'Hören' },
    { id: 'lesen', label: 'Lesen' },
    { id: 'schreiben', label: 'Schreiben' },
    { id: 'sprechen', label: 'Sprechen' }
  ];

  useEffect(() => {
    loadSubmissions();
  }, [activeFilter]);

  const loadSubmissions = async () => {
    setLoading(true);
    const context = activeFilter === 'all' ? null : activeFilter;
    const data = await api.getSubmissions(context);
    setSubmissions(data);
    setLoading(false);
  };

  const handleCommentAdded = (submissionId, newCount) => {
    setSubmissions(prev => 
      prev.map(s => 
        s.id === submissionId 
          ? { ...s, _count: { comments: newCount } }
          : s
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title="Gemeinschaft" 
        back={() => navigate('/dashboard')}
        username={user?.username}
      />

      <div className="p-4">
        <Tabs
          tabs={filters}
          activeTab={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      <main className="flex-1 p-4 pt-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : submissions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {submissions.map((sub, index) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SubmissionCard 
                  submission={sub} 
                  onCommentAdded={handleCommentAdded}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState
            icon={Users}
            title="Keine Einträge"
            description="Es gibt noch keine Einträge in dieser Kategorie."
          />
        )}
      </main>
    </div>
  );
};

export default Collaborative;
