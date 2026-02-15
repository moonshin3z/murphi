import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, X, Send, Bot, User, Loader2,
  TrendingDown, TrendingUp, CheckSquare, CircleCheckBig, Target,
  DollarSign, Play, BookOpen, PiggyBank, Pencil, Trash2,
  ChevronDown, ChevronUp, Sparkles, Mic
} from 'lucide-react';
import api from '../../services/api';

function ActionCard({ action }) {
  if (!action.displayData || !action.success) return null;

  const configs = {
    transaction_created: {
      icon: action.displayData.type === 'expense' ? TrendingDown : TrendingUp,
      label: action.displayData.type === 'expense' ? 'Gasto registrado' : 'Ingreso registrado',
      detail: `Q${action.displayData.amount} - ${action.displayData.category}${action.displayData.description ? ` (${action.displayData.description})` : ''}`,
      colorClasses: action.displayData.type === 'expense'
        ? 'bg-red-500/10 border-red-500/30 text-red-400'
        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    },
    task_created: {
      icon: CheckSquare,
      label: 'Tarea creada',
      detail: `${action.displayData.title}${action.displayData.dueDate ? ` - ${action.displayData.dueDate}` : ''}`,
      colorClasses: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    },
    saving_goal_created: {
      icon: PiggyBank,
      label: 'Meta de ahorro creada',
      detail: `${action.displayData.name} - Q${action.displayData.targetAmount}`,
      colorClasses: 'bg-purple-500/10 border-purple-500/30 text-purple-400'
    },
    budget_set: {
      icon: DollarSign,
      label: 'Presupuesto actualizado',
      detail: `Q${action.displayData.amount} / ${action.displayData.period === 'monthly' ? 'mes' : 'semana'}`,
      colorClasses: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    },
    timer_started: {
      icon: Play,
      label: 'Temporizador iniciado',
      detail: `${action.displayData.title} (${action.displayData.category})`,
      colorClasses: 'bg-amber-500/10 border-amber-500/30 text-amber-400'
    },
    study_session_logged: {
      icon: BookOpen,
      label: 'Sesión de estudio registrada',
      detail: `${action.displayData.subject} - ${action.displayData.duration} min`,
      colorClasses: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    },
    task_completed: {
      icon: CircleCheckBig,
      label: 'Tarea completada',
      detail: `${action.displayData.title}${action.displayData.subject ? ` (${action.displayData.subject})` : ''}`,
      colorClasses: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    },
    task_uncompleted: {
      icon: CheckSquare,
      label: 'Tarea reabierta',
      detail: `${action.displayData.title}${action.displayData.subject ? ` (${action.displayData.subject})` : ''}`,
      colorClasses: 'bg-amber-500/10 border-amber-500/30 text-amber-400'
    },
    transaction_updated: {
      icon: Pencil,
      label: 'Transacción editada',
      detail: `Q${action.displayData.amount} - ${action.displayData.category}${action.displayData.description ? ` (${action.displayData.description})` : ''}`,
      colorClasses: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
    },
    transaction_deleted: {
      icon: Trash2,
      label: 'Transacción eliminada',
      detail: `Q${action.displayData.amount} - ${action.displayData.category}${action.displayData.description ? ` (${action.displayData.description})` : ''}`,
      colorClasses: 'bg-red-500/10 border-red-500/30 text-red-400'
    }
  };

  const config = configs[action.actionType];
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <div className={`mt-2 flex items-center gap-2.5 p-2.5 rounded-lg border ${config.colorClasses}`}>
      <IconComponent size={16} className="flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium">{config.label}</p>
        <p className="text-xs text-text-secondary truncate">{config.detail}</p>
      </div>
    </div>
  );
}

export default function ChatMurphi({ mode = 'floating' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const hasSpeechSupport = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const toggleVoice = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    // Pedir permiso y liberar el stream antes de usar Speech API
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch {
      return;
    }

    // Pequeño delay para que el navegador libere el mic
    await new Promise(r => setTimeout(r, 200));

    const recognition = new SpeechRecognition();
    recognition.lang = 'es';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Parar grabación si está activa
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    if (mode === 'inline') {
      setIsExpanded(true);
    }

    try {
      const history = messages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await api.post('/api/ai/chat', { message: userMessage, history });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        actions: response.data.actions || []
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error. ¿Puedes intentar de nuevo?'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    '¿Cuánto gasté este mes?',
    'Gasté Q50 en comida',
    'Crear tarea: estudiar',
    '¿Cómo puedo ahorrar más?'
  ];

  const handleQuickQuestion = (q) => {
    setInput(q);
    if (mode === 'inline') {
      inputRef.current?.focus();
    }
  };

  // Shared message rendering
  const renderMessages = () => (
    <>
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <div className="w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-purple-400" />
            </div>
          )}
          <div className={`max-w-[75%]`}>
            <div
              className={`p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-ocean-500 text-white rounded-br-md'
                  : 'bg-dark-elevated text-text-primary border border-dark-border rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.actions && msg.actions.length > 0 && (
              <div className="space-y-1.5 mt-1.5">
                {msg.actions
                  .filter(a => a.success && a.displayData)
                  .map((action, idx) => (
                    <ActionCard key={idx} action={action} />
                  ))}
              </div>
            )}
          </div>
          {msg.role === 'user' && (
            <div className="w-8 h-8 bg-ocean-500/20 border border-ocean-500/30 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-ocean-400" />
            </div>
          )}
        </div>
      ))}
      {loading && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center">
            <Bot size={16} className="text-purple-400" />
          </div>
          <div className="bg-dark-elevated p-3 rounded-2xl rounded-bl-md border border-dark-border">
            <Loader2 size={16} className="animate-spin text-purple-400" />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </>
  );

  // ── INLINE MODE (Dashboard) ──
  if (mode === 'inline') {
    return (
      <div className="mb-5">
        {/* Input Bar - Always visible */}
        <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden"
          style={{ borderImage: 'linear-gradient(to right, rgba(168,85,247,0.4), rgba(56,189,248,0.4)) 1' }}
        >
          {/* Expanded messages area */}
          {isExpanded && messages.length > 0 && (
            <>
              <div className="max-h-[400px] overflow-y-auto p-4 space-y-4 bg-dark-bg/50">
                {renderMessages()}
              </div>
              <div className="border-t border-dark-border">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-text-muted hover:text-text-secondary transition"
                >
                  <ChevronUp size={14} />
                  Minimizar
                </button>
              </div>
            </>
          )}

          {/* Input area */}
          <div className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-500/15 border border-purple-500/25 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles size={18} className="text-purple-400" />
              </div>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => { if (messages.length > 0) setIsExpanded(true); }}
                  placeholder={isListening ? 'Escuchando...' : 'Escribe algo... "gasté Q50 en comida"'}
                  className={`w-full px-4 py-2.5 bg-dark-bg border rounded-full text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition ${isListening ? 'border-red-500/50 pr-9' : !input.trim() && hasSpeechSupport ? 'pr-9 border-dark-border' : 'border-dark-border'}`}
                  disabled={loading}
                />
                {(!input.trim() || isListening) && hasSpeechSupport && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-purple-400 transition"
                  >
                    <Mic size={15} className={isListening ? 'text-red-400 animate-pulse' : ''} />
                  </button>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-2.5 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                style={{ boxShadow: input.trim() && !loading ? '0 0 12px rgba(138, 43, 226, 0.4)' : 'none' }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Suggestion chips - visible when no messages or collapsed */}
          {(!isExpanded || messages.length === 0) && (
            <div className="px-3 pb-3 -mt-1">
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-xs px-3 py-1.5 bg-dark-bg hover:bg-dark-elevated rounded-full text-text-secondary hover:text-text-primary border border-dark-border transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Collapsed indicator - show when there are messages but collapsed */}
        {!isExpanded && messages.length > 0 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-text-muted hover:text-text-secondary transition"
          >
            <ChevronDown size={14} />
            Ver conversación ({messages.length} mensajes)
          </button>
        )}
      </div>
    );
  }

  // ── FLOATING MODE (other pages) ──
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-500 to-ocean-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 z-50 ${isOpen ? 'hidden' : ''}`}
        style={{ boxShadow: '0 0 20px rgba(138, 43, 226, 0.3)' }}
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[340px] sm:w-96 h-[500px] bg-dark-surface rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-dark-border">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500/20 to-ocean-500/20 border-b border-dark-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center">
                <Bot size={22} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Murphi</h3>
                <p className="text-xs text-text-muted">Tu asistente IA</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-dark-elevated rounded-lg transition text-text-muted hover:text-text-primary"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-bg">
            {messages.length === 0 && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-purple-400" />
                </div>
                <div className="max-w-[75%]">
                  <div className="p-3 rounded-2xl bg-dark-elevated text-text-primary border border-dark-border rounded-bl-md">
                    <p className="text-sm whitespace-pre-wrap">¡Hola! Soy Murphi, tu asistente personal. Puedo ayudarte con tus finanzas y productividad. Prueba decirme cosas como "gasté Q50 en comida" o "crea tarea: estudiar cálculo". ¿En qué te puedo ayudar?</p>
                  </div>
                </div>
              </div>
            )}
            {renderMessages()}
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-4 py-3 border-t border-dark-border bg-dark-surface">
              <p className="text-xs text-text-muted mb-2">Sugerencias:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-xs px-3 py-1.5 bg-dark-elevated hover:bg-dark-border rounded-full text-text-secondary hover:text-text-primary border border-dark-border transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-dark-border bg-dark-surface">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? 'Escuchando...' : 'Escribe tu mensaje...'}
                  className={`w-full px-4 py-2.5 bg-dark-bg border rounded-full text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition ${isListening ? 'border-red-500/50 pr-9' : !input.trim() && hasSpeechSupport ? 'pr-9 border-dark-border' : 'border-dark-border'}`}
                  disabled={loading}
                />
                {(!input.trim() || isListening) && hasSpeechSupport && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-purple-400 transition"
                  >
                    <Mic size={15} className={isListening ? 'text-red-400 animate-pulse' : ''} />
                  </button>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-2.5 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: input.trim() && !loading ? '0 0 12px rgba(138, 43, 226, 0.4)' : 'none' }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
