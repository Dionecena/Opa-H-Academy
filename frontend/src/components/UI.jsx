import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronDown, ChevronUp, Play, Pause, Square, 
  Send, MessageCircle, User, Clock, Volume2, FileText,
  Check, AlertCircle, Loader, Plus, Trash2, Settings, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../App';

// Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  onClick,
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'bg-[var(--primary)] text-white hover:brightness-110 shadow-sm',
    secondary: 'bg-[var(--secondary)] text-white hover:brightness-110 shadow-sm',
    accent: 'bg-[var(--accent)] text-white hover:brightness-110 shadow-sm',
    danger: 'bg-[var(--danger)] text-white hover:brightness-110 shadow-sm',
    ghost: 'bg-transparent hover:bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] backdrop-blur',
    outline: 'bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] backdrop-blur'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-[var(--radius)]
        font-medium
        flex items-center justify-center gap-2
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30
        active:scale-[0.99]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? <Loader className="w-5 h-5 animate-spin" /> : icon}
      {children}
    </motion.button>
  );
};

// Card Component
export const Card = ({ 
  children, 
  className = '', 
  onClick,
  hoverable = false,
  animate = true,
  ...props 
}) => {
  const Component = animate ? motion.div : 'div';
  
  return (
    <Component
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      className={`
        bg-[var(--glass-bg-strong)]
        rounded-[var(--radius)]
        p-4
        border border-[var(--glass-border-strong)]
        shadow-[var(--glass-shadow-strong)]
        backdrop-blur-[calc(var(--glass-blur)+6px)]
        relative overflow-hidden
        after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:rounded-[inherit]
        after:bg-[radial-gradient(900px_240px_at_20%_0%,var(--glass-highlight),transparent_55%),radial-gradient(700px_240px_at_90%_20%,rgba(37,99,235,0.14),transparent_55%)]
        after:opacity-90 after:mix-blend-soft-light
        ${hoverable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--glass-shadow)] transition-all' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
};

// Input Component
export const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
  rows = 4,
  error,
  icon,
  className = '',
  ...props
}) => {
  const inputClass = `
    w-full
    bg-[var(--glass-bg)]
    border border-[var(--glass-border)]
    rounded-[var(--radius-sm)]
    px-4 py-3
    text-[var(--text-primary)]
    placeholder-[var(--text-muted)]
    focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)]
    transition-all
    shadow-[var(--glass-shadow)]
    backdrop-blur-[var(--glass-blur)]
    ${error ? 'border-[var(--danger)]' : ''}
    ${icon ? 'pl-10' : ''}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {icon}
          </span>
        )}
        {multiline ? (
          <textarea
            className={inputClass}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            {...props}
          />
        ) : (
          <input
            type={type}
            className={inputClass}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            {...props}
          />
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
};

// Modal Component
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[95vw]'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`
              ${sizes[size]}
              w-full
              bg-[var(--glass-bg-strong)]
              rounded-[var(--radius)]
              border border-[var(--glass-border-strong)]
              shadow-[var(--glass-shadow-strong)]
              backdrop-blur-[calc(var(--glass-blur)+8px)]
              max-h-[90vh]
              overflow-hidden
              relative
              after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:rounded-[inherit]
              after:bg-[radial-gradient(900px_240px_at_20%_0%,var(--glass-highlight),transparent_55%),radial-gradient(700px_240px_at_90%_20%,rgba(37,99,235,0.14),transparent_55%)]
              after:opacity-90 after:mix-blend-soft-light
            `}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-[var(--bg-input)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Collapsible Section
export const Collapsible = ({ title, children, defaultOpen = false, icon }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-input)] transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-[var(--bg-dark)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Badge Component
export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-[var(--bg-input)] text-[var(--text-primary)]',
    primary: 'bg-[var(--primary)] text-white',
    secondary: 'bg-[var(--secondary)] text-white',
    success: 'bg-[var(--accent)] text-white',
    danger: 'bg-[var(--danger)] text-white'
  };

  return (
    <span className={`
      ${variants[variant]}
      px-2 py-1
      text-xs font-medium
      rounded-full
      ${className}
    `}>
      {children}
    </span>
  );
};

// Loading Spinner
export const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizes[size]} border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin`} />
  );
};

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {Icon && <Icon className="w-16 h-16 text-[var(--text-muted)] mb-4" />}
    <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">{title}</h3>
    {description && (
      <p className="text-[var(--text-muted)] mb-4">{description}</p>
    )}
    {action}
  </div>
);

// Header Component
export const Header = ({ title, subtitle, back, action, username }) => (
  <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--glass-bg)] border-b border-[var(--glass-border)] shadow-[var(--glass-shadow)] backdrop-blur-[calc(var(--glass-blur)+6px)]">
    <div className="flex items-center justify-between h-14 px-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {back && (
          <button 
            onClick={back}
            className="p-2 -ml-2 hover:bg-[var(--bg-input)] rounded-lg transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-base truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <ThemeToggle />
        {username && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <User className="w-4 h-4" />
            <span className="truncate max-w-[100px]">{username}</span>
          </div>
        )}
        {action}
      </div>
    </div>
  </header>
);

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="
        w-10 h-10
        inline-flex items-center justify-center
        rounded-[var(--radius-sm)]
        border border-[var(--glass-border-strong)]
        bg-[var(--glass-bg-strong)]
        shadow-[var(--glass-shadow)]
        backdrop-blur-[calc(var(--glass-blur)+6px)]
        hover:bg-[var(--glass-bg)]
        transition-all
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25
      "
      aria-label="Changer le thème"
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};

// Tabs Component
export const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex gap-1 p-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[var(--radius)] overflow-x-auto shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)] relative overflow-hidden">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`
          flex-1 min-w-fit
          px-4 py-2.5
          rounded-[var(--radius-sm)]
          font-medium
          text-sm
          whitespace-nowrap
          transition-all
          ${activeTab === tab.id
            ? 'bg-[var(--glass-bg-strong)] text-[var(--text-primary)] shadow-[var(--glass-shadow)] border border-[var(--glass-border-strong)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-strong)]'
          }
        `}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

// Toast/Alert Component
export const Toast = ({ message, type = 'info', onClose }) => {
  const types = {
    info: { bg: 'bg-blue-500/20', border: 'border-blue-500', icon: AlertCircle },
    success: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', icon: Check },
    error: { bg: 'bg-red-500/20', border: 'border-red-500', icon: AlertCircle }
  };

  const { bg, border, icon: Icon } = types[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        ${bg} ${border}
        border
        rounded-[var(--radius)]
        p-4
        flex items-center gap-3
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default {
  Button,
  Card,
  Input,
  Modal,
  Collapsible,
  Badge,
  Spinner,
  EmptyState,
  Header,
  Tabs,
  Toast
};
