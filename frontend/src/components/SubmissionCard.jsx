import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, User, Clock, Volume2, Play, Pause, ChevronDown } from 'lucide-react';
import { Card, Badge, Input, Button } from './UI';
import api, { API_BASE } from '../config/api';
import { useAuth } from '../App';

const SubmissionCard = ({ submission, onCommentAdded }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { user } = useAuth();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadComments = async () => {
    if (!showComments) {
      const data = await api.getComments(submission.id);
      setComments(data);
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    const comment = await api.createComment({
      submissionId: submission.id,
      username: user.username,
      content: newComment.trim()
    });
    
    setComments([...comments, comment]);
    setNewComment('');
    setLoading(false);
    
    if (onCommentAdded) {
      onCommentAdded(submission.id, comments.length + 1);
    }
  };

  const togglePlay = () => {
    const audio = document.getElementById(`audio-${submission.id}`);
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const contextLabels = {
    hoeren: 'Hören',
    lesen: 'Lesen',
    sprechen: 'Sprechen',
    schreiben: 'Schreiben'
  };

  return (
    <Card className="mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="font-medium">{submission.username}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">{contextLabels[submission.context] || submission.context}</Badge>
          <Badge>{submission.type === 'audio' ? 'Audio' : 'Text'}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        {submission.type === 'audio' ? (
          <div className="bg-[var(--bg-input)] rounded-lg p-3">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary-light)] transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Audioaufnahme</span>
                </div>
              </div>
            </div>
            <audio
              id={`audio-${submission.id}`}
              src={submission.content.startsWith('http') ? submission.content : `${API_BASE.replace(/\/api\/?$/, '')}${submission.content}`}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        ) : (
          <div className="bg-[var(--bg-input)] rounded-lg p-3">
            <p className="text-[var(--text-primary)] whitespace-pre-wrap">{submission.content}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Clock className="w-4 h-4" />
          <span>{formatDate(submission.createdAt)}</span>
        </div>
        
        <button
          onClick={loadComments}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{submission._count?.comments || 0}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showComments ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              {/* Comment Input */}
              <div className="flex gap-2 mb-4">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Kommentar hinzufügen..."
                  className="flex-1"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || loading}
                  size="md"
                >
                  Senden
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.map(comment => (
                  <div
                    key={comment.id}
                    className="bg-[var(--bg-input)] rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-[var(--text-muted)]" />
                      <span className="text-sm font-medium">{comment.username}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-center text-sm text-[var(--text-muted)] py-4">
                    Noch keine Kommentare
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default SubmissionCard;
