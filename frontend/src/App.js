import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import axios from 'axios';
import './App.css';

// Get backend URL from environment
const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
axios.defaults.baseURL = `${API}/api`;

// Set up axios interceptor for auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Icons as components
const StarIcon = () => <span className="text-guayaquil-yellow">⭐</span>;
const BackIcon = () => <span>←</span>;
const PlayIcon = () => <span>▶️</span>;
const DownloadIcon = () => <span>📥</span>;
const UploadIcon = () => <span>📤</span>;
const QRIcon = () => <span>📱</span>;
const AdminIcon = () => <span>👨‍💼</span>;
const StatsIcon = () => <span>📊</span>;
const TrophyIcon = () => <span>🏆</span>;
const CoinIcon = () => <span>🪙</span>;
const EventIcon = () => <span>🎫</span>;
const RewardIcon = () => <span>🎁</span>;
const NotificationIcon = () => <span>🔔</span>;
const SettingsIcon = () => <span>⚙️</span>;
const DocumentIcon = () => <span>📋</span>;
const CalendarIcon = () => <span>📅</span>;
const UserIcon = () => <span>👤</span>;
const CompetenceIcon = () => <span>🎯</span>;
const EligibilityIcon = () => <span>✅</span>;
const SuggestionIcon = () => <span>💡</span>;
const LeagueIcon = () => <span>🏅</span>;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (cedula, password) => {
    try {
      const response = await axios.post('/login', { cedula, password });
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al iniciar sesión' 
      };
    }
  };

  const register = async (userData) => {
    try {
      await axios.post('/register', userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al registrar usuario' 
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      logout, 
      register, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utility Components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-1">
    <div className="loading-dots">
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
    </div>
  </div>
);

const PointsAnimation = ({ points, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="points-explosion">
      <div className="text-6xl font-bold text-guayaquil-yellow animate-bounce-in">
        +{points} <CoinIcon />
      </div>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="points-particle"
          style={{
            '--float-x': `${(Math.random() - 0.5) * 200}px`,
            '--float-y': `${-50 - Math.random() * 100}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
};

const EntrepreneurMascot = ({ message, position = "bottom-right" }) => {
  const [isVisible, setIsVisible] = useState(true);

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4'
  };

  if (!isVisible) return null;

  return (
    <div className={`${positionClasses[position]} z-50 mascot-container animate-slide-in`}>
      <div className="flex items-end space-x-3">
        <div className="mascot-speech-bubble">
          <p className="text-sm text-guayaquil-dark">{message}</p>
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        </div>
        <div className="mascot-avatar text-2xl animate-float">
          🚀
        </div>
      </div>
    </div>
  );
};

// Mission type helpers
const getMissionIcon = (type) => {
  const iconMap = {
    'microvideo': '🎥',
    'downloadable_guide': '📚',
    'mini_quiz': '❓',
    'practical_task': '💼',
    'expert_advice': '🎓',
    'hidden_reward': '🎁',
    'local_calendar': '📅',
    'stand_checklist': '📋',
    'pitch_simulator': '🎤',
    'process_guide': '⚙️',
    'document_upload': '📄',
    'networking_task': '🤝',
    'market_research': '🔍',
    'business_plan': '📊'
  };
  return iconMap[type] || '📝';
};

const getCompetenceIcon = (competence) => {
  const iconMap = {
    'legal': '⚖️',
    'ventas': '💰',
    'pitch': '🎤',
    'operaciones': '⚙️',
    'finanzas': '💹',
    'habilidades_blandas': '🧠',
    'marketing': '📈',
    'innovacion': '💡'
  };
  return iconMap[competence] || '🎯';
};

// Navigation Component
const Navigation = ({ currentTab, onTabChange, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await axios.get('/notifications?unread_only=true&limit=5');
      setNotifications(response.data);
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const isAdmin = user?.role === 'admin';

  const tabs = [
    { id: 'home', label: 'Inicio', icon: '🏠' },
    { id: 'missions', label: 'Misiones', icon: '🎯' },
    { id: 'events', label: 'Eventos', icon: '🎫' },
    { id: 'achievements', label: 'Logros', icon: '🏆' },
    { id: 'rewards', label: 'Recompensas', icon: '🎁' },
    { id: 'leagues', label: 'Ligas', icon: '🏅' },
    { id: 'profile', label: 'Perfil', icon: '👤' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: '👨‍💼' }] : [])
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-guayaquil-light">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-guayaquil-blue to-guayaquil-primary rounded-full flex items-center justify-center text-white font-bold">
              🚀
            </div>
            <div>
              <h1 className="text-xl font-bold text-guayaquil-dark">Impulsa Guayaquil</h1>
              <p className="text-xs text-guayaquil-text">Emprendimiento Gamificado</p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-guayaquil-lighter px-3 py-1 rounded-full">
              <CoinIcon />
              <span className="font-semibold text-guayaquil-dark">{user?.coins || 0}</span>
            </div>
            <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-1 rounded-full">
              <StarIcon />
              <span className="font-semibold text-yellow-800">{user?.points || 0}</span>
            </div>
            <div className="relative">
              <button className="relative p-2 rounded-full hover:bg-guayaquil-lighter">
                <NotificationIcon />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
                currentTab === tab.id
                  ? 'border-guayaquil-blue text-guayaquil-blue font-medium'
                  : 'border-transparent text-guayaquil-text hover:text-guayaquil-primary hover:border-guayaquil-light'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

// QR Generator Component
const QRGenerator = ({ user, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await axios.get('/events?upcoming_only=true');
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const generateQR = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/qr-token/generate', {
        event_id: selectedEvent || null
      });
      setQrData(response.data);
    } catch (error) {
      console.error('Error generating QR:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-guayaquil-dark">Generar QR de Estado</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {!qrData ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-guayaquil-text mb-2">
                Seleccionar Evento (Opcional)
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
              >
                <option value="">Estado General</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generateQR}
              disabled={loading}
              className="w-full bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner /> : 'Generar QR'}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <img
                src={qrData.qr_image}
                alt="QR Code"
                className="mx-auto rounded-lg shadow-lg"
                style={{ maxWidth: '250px' }}
              />
            </div>
            
            <div className="space-y-2 text-sm text-guayaquil-text">
              <p><strong>Estado:</strong> <span className={`px-2 py-1 rounded text-xs ${
                qrData.qr_token.status === 'eligible' ? 'bg-green-100 text-green-800' :
                qrData.qr_token.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {qrData.qr_token.status === 'eligible' ? 'Apto' :
                 qrData.qr_token.status === 'partial' ? 'Parcial' : 'No Apto'}
              </span></p>
              <p><strong>Válido por:</strong> {qrData.expires_in_minutes} minutos</p>
              <p><strong>Token:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{qrData.qr_token.token.substring(0, 8)}...</code></p>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => setQrData(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Generar Nuevo
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-guayaquil-blue text-white rounded-lg hover:bg-guayaquil-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Document Upload Component
const DocumentUpload = ({ user, onClose, onSuccess }) => {
  const [documentType, setDocumentType] = useState('ruc');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const documentTypes = [
    { value: 'ruc', label: 'RUC' },
    { value: 'pitch_video', label: 'Video de Pitch' },
    { value: 'business_plan', label: 'Plan de Negocio' },
    { value: 'financial_projection', label: 'Proyección Financiera' },
    { value: 'legal_documents', label: 'Documentos Legales' },
    { value: 'market_research', label: 'Investigación de Mercado' },
    { value: 'prototype', label: 'Prototipo' },
    { value: 'references', label: 'Referencias' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    if (expiryDate) {
      formData.append('expiry_date', expiryDate);
    }

    try {
      await axios.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onSuccess('Documento subido exitosamente. Será revisado por nuestro equipo.');
      onClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error al subir documento: ' + (error.response?.data?.detail || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-guayaquil-dark">Subir Documento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-guayaquil-text mb-2">
              Tipo de Documento
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
              required
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-guayaquil-text mb-2">
              Archivo
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png,.mp4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Formatos permitidos: PDF, JPG, PNG, MP4
            </p>
          </div>

          {documentType === 'ruc' && (
            <div>
              <label className="block text-sm font-medium text-guayaquil-text mb-2">
                Fecha de Vencimiento (Opcional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white py-2 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner /> : 'Subir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Events Component with Eligibility
const Events = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eligibilityData, setEligibilityData] = useState({});
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await axios.get('/events?upcoming_only=true');
      setEvents(response.data);
      
      // Load eligibility for each event
      for (const event of response.data) {
        try {
          const eligibilityResponse = await axios.get(`/events/${event.id}/eligibility/${user.id}`);
          setEligibilityData(prev => ({
            ...prev,
            [event.id]: eligibilityResponse.data
          }));
        } catch (error) {
          console.error(`Error loading eligibility for event ${event.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async (eventId) => {
    try {
      const response = await axios.get(`/events/${eventId}/suggestions/${user.id}`);
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const getEligibilityBadge = (eligibility) => {
    if (!eligibility) return { color: 'gray', text: 'Calculando...' };
    
    if (eligibility.status === 'eligible') {
      return { color: 'green', text: 'Apto' };
    } else if (eligibility.status === 'partial') {
      return { color: 'yellow', text: 'Parcial' };
    } else {
      return { color: 'red', text: 'No Apto' };
    }
  };

  const getEventTypeIcon = (eventType) => {
    const iconMap = {
      'feria': '🏪',
      'rueda_negocios': '💼',
      'capacitacion': '🎓',
      'networking': '🤝',
      'pitch_competition': '🎤'
    };
    return iconMap[eventType] || '🎫';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-guayaquil-lighter to-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (selectedEvent) {
    const eligibility = eligibilityData[selectedEvent.id];
    const badge = getEligibilityBadge(eligibility);

    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white p-6">
            <button
              onClick={() => setSelectedEvent(null)}
              className="mb-4 flex items-center space-x-2 hover:bg-white hover:bg-opacity-20 rounded-lg px-3 py-2 transition-colors"
            >
              <BackIcon />
              <span>Volver a Eventos</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{getEventTypeIcon(selectedEvent.event_type)}</div>
              <div>
                <h1 className="text-2xl font-bold">{selectedEvent.title}</h1>
                <p className="text-blue-100 mt-1">{selectedEvent.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span>📅 {new Date(selectedEvent.date).toLocaleDateString('es-EC')}</span>
                  <span>📍 {selectedEvent.location}</span>
                  {selectedEvent.capacity && <span>👥 {selectedEvent.capacity} cupos</span>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Eligibility Status */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-guayaquil-dark">Estado de Elegibilidad</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  badge.color === 'green' ? 'bg-green-100 text-green-800' :
                  badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {badge.text}
                </span>
              </div>
              
              {eligibility && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-guayaquil-text">Progreso</span>
                    <span className="text-sm font-medium">{eligibility.eligibility_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        badge.color === 'green' ? 'bg-green-500' :
                        badge.color === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${eligibility.eligibility_percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Missing Requirements */}
            {eligibility && eligibility.missing_requirements.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-guayaquil-dark">¿Qué me falta?</h3>
                  <button
                    onClick={() => loadSuggestions(selectedEvent.id)}
                    className="flex items-center space-x-2 text-guayaquil-blue hover:text-guayaquil-primary"
                  >
                    <SuggestionIcon />
                    <span>Ver Sugerencias</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {eligibility.missing_requirements.map((req, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-red-800">{req.rule_name}</h4>
                        <span className="text-sm text-red-600">{req.completion_percentage.toFixed(1)}%</span>
                      </div>
                      <p className="text-red-700 text-sm">{req.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-guayaquil-dark mb-4">Recomendaciones</h3>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {suggestion.type === 'mission' ? getMissionIcon(suggestion.type) : 
                           suggestion.type === 'document' ? DocumentIcon() : 
                           SuggestionIcon()}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-800">{suggestion.title}</h4>
                          <p className="text-blue-700 text-sm">{suggestion.description}</p>
                          {suggestion.type === 'mission' && (
                            <div className="flex items-center space-x-2 mt-2 text-xs text-blue-600">
                              <span>⏱️ {suggestion.estimated_time}min</span>
                              <span>⭐ {suggestion.points_reward}pts</span>
                              <span className={`px-2 py-1 rounded ${
                                suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                                suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {suggestion.priority === 'high' ? 'Alta Prioridad' :
                                 suggestion.priority === 'medium' ? 'Media Prioridad' : 'Baja Prioridad'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {selectedEvent.registration_url && (
                <a
                  href={selectedEvent.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white py-3 rounded-lg font-medium text-center hover:from-blue-600 hover:to-blue-700"
                >
                  Registrarse al Evento
                </a>
              )}
              <button className="px-6 py-3 border border-guayaquil-blue text-guayaquil-blue rounded-lg hover:bg-guayaquil-lighter">
                Compartir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🎫 Eventos</h1>
            <p className="text-blue-100 mt-1">Descubre oportunidades para hacer crecer tu negocio</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{events.length}</div>
            <div className="text-blue-100">eventos disponibles</div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const eligibility = eligibilityData[event.id];
          const badge = getEligibilityBadge(eligibility);
          
          return (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
            >
              {event.imagen_url && (
                <img
                  src={event.imagen_url}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">{getEventTypeIcon(event.event_type)}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    badge.color === 'green' ? 'bg-green-100 text-green-800' :
                    badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    badge.color === 'red' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {badge.text}
                  </span>
                </div>
                
                <h3 className="font-bold text-guayaquil-dark text-lg mb-2">{event.title}</h3>
                <p className="text-guayaquil-text text-sm mb-4">{event.description}</p>
                
                <div className="space-y-2 text-sm text-guayaquil-text">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon />
                    <span>{new Date(event.date).toLocaleDateString('es-EC')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📍</span>
                    <span>{event.location}</span>
                  </div>
                  {event.capacity && (
                    <div className="flex items-center space-x-2">
                      <span>👥</span>
                      <span>{event.capacity} cupos</span>
                    </div>
                  )}
                </div>

                {eligibility && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          badge.color === 'green' ? 'bg-green-500' :
                          badge.color === 'yellow' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${eligibility.eligibility_percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-guayaquil-text mt-1">
                      {eligibility.eligibility_percentage.toFixed(1)}% elegible
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-bold text-guayaquil-dark mb-2">No hay eventos próximos</h3>
          <p className="text-guayaquil-text">Mantente atento, pronto habrá nuevas oportunidades.</p>
        </div>
      )}

      {/* Mascot */}
      <EntrepreneurMascot
        message="¡Los eventos son una excelente oportunidad para hacer networking y aprender! Asegúrate de cumplir los requisitos para participar. 🎫"
        position="bottom-right"
      />
    </div>
  );
};

// Leagues Component
const Leagues = ({ user }) => {
  const [currentLeagues, setCurrentLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeagues();
  }, []);

  const loadLeagues = async () => {
    try {
      const response = await axios.get(`/leagues/current?ciudad=${user.ciudad}`);
      setCurrentLeagues(response.data);
    } catch (error) {
      console.error('Error loading leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async (leagueId) => {
    try {
      const response = await axios.get(`/leagues/${leagueId}/leaderboard`);
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const joinLeague = async (leagueId) => {
    try {
      await axios.post(`/leagues/${leagueId}/join`);
      loadLeagues(); // Reload leagues
    } catch (error) {
      console.error('Error joining league:', error);
      alert('Error al unirse a la liga: ' + (error.response?.data?.detail || 'Error desconocido'));
    }
  };

  const getLeagueIcon = (leagueType) => {
    const iconMap = {
      'bronce': '🥉',
      'plata': '🥈',
      'oro': '🥇',
      'diamante': '💎'
    };
    return iconMap[leagueType] || '🏅';
  };

  const getPositionIcon = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `${position}°`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-guayaquil-lighter to-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (selectedLeague) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white p-6">
            <button
              onClick={() => setSelectedLeague(null)}
              className="mb-4 flex items-center space-x-2 hover:bg-white hover:bg-opacity-20 rounded-lg px-3 py-2 transition-colors"
            >
              <BackIcon />
              <span>Volver a Ligas</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{getLeagueIcon(selectedLeague.league_type)}</div>
              <div>
                <h1 className="text-2xl font-bold">{selectedLeague.name}</h1>
                <p className="text-blue-100 mt-1">Liga {selectedLeague.league_type.toUpperCase()}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span>📅 {new Date(selectedLeague.start_date).toLocaleDateString('es-EC')} - {new Date(selectedLeague.end_date).toLocaleDateString('es-EC')}</span>
                  <span>👥 {leaderboard.length} participantes</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-semibold text-guayaquil-dark mb-4">Tabla de Posiciones</h3>
            
            <div className="space-y-3">
              {leaderboard.map((participant, index) => (
                <div 
                  key={participant.user.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    participant.user.id === user.id 
                      ? 'bg-guayaquil-lighter border-2 border-guayaquil-blue' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getPositionIcon(participant.position)}
                    </div>
                    <div>
                      <h4 className="font-medium text-guayaquil-dark">
                        {participant.user.nombre} {participant.user.apellido}
                      </h4>
                      <p className="text-sm text-guayaquil-text">{participant.user.emprendimiento}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-guayaquil-dark">{participant.weekly_xp} XP</div>
                    <div className="text-sm text-guayaquil-text">🔥 {participant.current_streak} días</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🏅 Ligas Competitivas</h1>
            <p className="text-blue-100 mt-1">Compite semanalmente con otros emprendedores</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{user.weekly_xp}</div>
            <div className="text-blue-100">XP esta semana</div>
          </div>
        </div>
      </div>

      {/* Current Leagues */}
      <div className="grid md:grid-cols-2 gap-6">
        {currentLeagues.map((league) => {
          const isParticipant = league.participants.includes(user.id);
          
          return (
            <div key={league.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{getLeagueIcon(league.league_type)}</div>
                  <div>
                    <h3 className="font-bold text-guayaquil-dark text-lg">{league.name}</h3>
                    <p className="text-guayaquil-text text-sm">Liga {league.league_type.toUpperCase()}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isParticipant ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isParticipant ? 'Participando' : 'Disponible'}
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-guayaquil-text mb-4">
                <div className="flex items-center space-x-2">
                  <CalendarIcon />
                  <span>{new Date(league.start_date).toLocaleDateString('es-EC')} - {new Date(league.end_date).toLocaleDateString('es-EC')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>👥</span>
                  <span>{league.participants.length} participantes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🏆</span>
                  <span>{league.rewards.length} recompensas</span>
                </div>
              </div>

              <div className="flex space-x-3">
                {isParticipant ? (
                  <button
                    onClick={() => {
                      setSelectedLeague(league);
                      loadLeaderboard(league.id);
                    }}
                    className="flex-1 bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white py-2 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700"
                  >
                    Ver Tabla
                  </button>
                ) : (
                  <button
                    onClick={() => joinLeague(league.id)}
                    className="flex-1 border-2 border-guayaquil-blue text-guayaquil-blue py-2 rounded-lg font-medium hover:bg-guayaquil-lighter"
                  >
                    Unirse
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {currentLeagues.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏅</div>
          <h3 className="text-xl font-bold text-guayaquil-dark mb-2">No hay ligas activas</h3>
          <p className="text-guayaquil-text">Las ligas se crean semanalmente. ¡Mantente atento!</p>
        </div>
      )}

      {/* Mascot */}
      <EntrepreneurMascot
        message="¡Las ligas son una forma divertida de competir y motivarte! Gana XP completando misiones para subir en el ranking. 🏆"
        position="bottom-right"
      />
    </div>
  );
};

// Enhanced Home Component
const Home = ({ user, onRefreshUser }) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState(null);
  const [missionsByCompetence, setMissionsByCompetence] = useState({});
  const [selectedCompetence, setSelectedCompetence] = useState('all');

  useEffect(() => {
    loadMissions();
    loadMissionsByCompetence();
  }, [user]);

  const loadMissions = async () => {
    try {
      const response = await axios.get(`/missions/${user.id}/with-status`);
      setMissions(response.data);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMissionsByCompetence = async () => {
    try {
      const response = await axios.get('/missions/by-competence');
      setMissionsByCompetence(response.data);
    } catch (error) {
      console.error('Error loading missions by competence:', error);
    }
  };

  const handleMissionClick = (mission) => {
    if (mission.status === 'AVAILABLE') {
      setSelectedMission(mission);
    }
  };

  if (selectedMission) {
    return (
      <MissionDetailView
        mission={selectedMission}
        onBack={() => setSelectedMission(null)}
        onRefreshUser={onRefreshUser}
      />
    );
  }

  const availableMissions = missions.filter(m => m.status === 'AVAILABLE');
  const completedMissions = missions.filter(m => m.status === 'COMPLETED');
  const inReviewMissions = missions.filter(m => m.status === 'IN_REVIEW');

  // Filter missions by competence
  const filteredMissions = selectedCompetence === 'all' 
    ? availableMissions 
    : availableMissions.filter(m => m.competence_area === selectedCompetence);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* User Stats Header */}
      <div className="bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">¡Hola, {user.nombre}!</h1>
            <p className="text-blue-100 mt-1">{user.nombre_emprendimiento}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{user.points}</div>
            <div className="text-blue-100">puntos totales</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{completedMissions.length}</div>
            <div className="text-blue-100 text-sm">Completadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{availableMissions.length}</div>
            <div className="text-blue-100 text-sm">Disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user.current_streak}</div>
            <div className="text-blue-100 text-sm">Racha Actual</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user.coins}</div>
            <div className="text-blue-100 text-sm">Monedas</div>
          </div>
        </div>
      </div>

      {/* Competence Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCompetence('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCompetence === 'all'
                ? 'bg-guayaquil-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas las Áreas
          </button>
          {Object.keys(missionsByCompetence).map((competence) => (
            <button
              key={competence}
              onClick={() => setSelectedCompetence(competence)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCompetence === competence
                  ? 'bg-guayaquil-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{getCompetenceIcon(competence)}</span>
              <span>{competence.replace('_', ' ').toUpperCase()}</span>
              <span className="text-xs opacity-75">({missionsByCompetence[competence].total})</span>
            </button>
          ))}
        </div>
      </div>

      {/* In Review Missions Alert */}
      {inReviewMissions.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⏳</span>
            <h3 className="font-medium text-yellow-800">
              Tienes {inReviewMissions.length} misión(es) pendiente(s) de revisión
            </h3>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Nuestro equipo está revisando tus evidencias. Te notificaremos cuando estén aprobadas.
          </p>
        </div>
      )}

      {/* Available Missions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-guayaquil-dark mb-4">
          Misiones Disponibles 
          {selectedCompetence !== 'all' && (
            <span className="text-lg font-normal text-guayaquil-text">
              - {selectedCompetence.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </h2>
        {loading ? (
          <LoadingSpinner />
        ) : filteredMissions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMissions.map((mission) => (
              <div
                key={mission.id}
                onClick={() => handleMissionClick(mission)}
                className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-guayaquil-blue cursor-pointer hover:shadow-xl transition-shadow mission-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{getMissionIcon(mission.type)}</div>
                  <div className="flex flex-col items-end space-y-1">
                    <div className="bg-guayaquil-yellow text-guayaquil-dark px-2 py-1 rounded-full text-sm font-bold">
                      {mission.points_reward} pts
                    </div>
                    {mission.coins_reward > 0 && (
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-bold">
                        {mission.coins_reward} <CoinIcon />
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-guayaquil-dark text-lg mb-2">{mission.title}</h3>
                <p className="text-guayaquil-text text-sm mb-4">{mission.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span>{getCompetenceIcon(mission.competence_area)}</span>
                    <span className="text-guayaquil-blue text-sm font-medium">
                      {mission.competence_area.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-guayaquil-text">
                    <span>⏱️</span>
                    <span>{mission.estimated_time}min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                    mission.difficulty_level <= 2 ? 'bg-green-100 text-green-800' :
                    mission.difficulty_level <= 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <span>{'★'.repeat(mission.difficulty_level)}</span>
                    <span>Nivel {mission.difficulty_level}</span>
                  </div>
                  <button className="bg-guayaquil-blue text-white px-4 py-2 rounded-lg text-sm hover:bg-guayaquil-primary">
                    Empezar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-guayaquil-dark mb-2">
              {selectedCompetence === 'all' 
                ? '¡Excelente trabajo!' 
                : `¡Completaste todas las misiones de ${selectedCompetence.replace('_', ' ')}!`
              }
            </h3>
            <p className="text-guayaquil-text">
              {selectedCompetence === 'all'
                ? 'Has completado todas las misiones disponibles.'
                : 'Prueba con otra área de competencia para seguir aprendiendo.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Progress by Competence */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-guayaquil-dark mb-4">Progreso por Área</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(missionsByCompetence).map(([competence, data]) => {
            const completedInArea = completedMissions.filter(m => m.competence_area === competence).length;
            const progressPercentage = (completedInArea / data.total) * 100;
            
            return (
              <div key={competence} className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-2xl">{getCompetenceIcon(competence)}</div>
                  <div>
                    <h4 className="font-medium text-guayaquil-dark text-sm">
                      {competence.replace('_', ' ').toUpperCase()}
                    </h4>
                    <p className="text-xs text-guayaquil-text">
                      {completedInArea}/{data.total} completadas
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-guayaquil-blue h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-guayaquil-text mt-1 text-center">
                  {progressPercentage.toFixed(0)}% completado
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Achievements */}
      <div>
        <h2 className="text-2xl font-bold text-guayaquil-dark mb-4">Logros Recientes</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {completedMissions.slice(-4).map((mission) => (
            <div key={mission.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">✅</div>
                <div>
                  <h4 className="font-semibold text-green-800 text-sm">{mission.title}</h4>
                  <p className="text-green-600 text-xs">
                    +{mission.points_reward} puntos
                    {mission.coins_reward > 0 && ` • +${mission.coins_reward} monedas`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mascot */}
      <EntrepreneurMascot
        message="¡Bienvenido a tu centro de control emprendedor! Completa misiones para ganar puntos y monedas. 🚀"
        position="bottom-right"
      />
    </div>
  );
};

// Enhanced Mission Detail View Component
const MissionDetailView = ({ mission, onBack, onRefreshUser }) => {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    checkCooldown();
  }, [mission]);

  const checkCooldown = async () => {
    try {
      const response = await axios.get(`/missions/${mission.id}/cooldown/${mission.user_id || 'current'}`);
      if (!response.data.can_attempt) {
        setCooldownInfo(response.data);
      }
    } catch (error) {
      console.error('Error checking cooldown:', error);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      // Handle evidence upload first if required
      if (mission.evidence_required && evidenceFile) {
        const formData = new FormData();
        formData.append('mission_id', mission.id);
        formData.append('description', evidenceDescription);
        formData.append('file', evidenceFile);
        
        await axios.post('/evidences/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      // Complete mission
      const completionData = {
        mission_id: mission.id,
        completion_data: {
          answers: quizAnswers,
          evidence_description: evidenceDescription
        }
      };
      
      const response = await axios.post(`/missions/${mission.id}/complete`, completionData);
      
      if (response.data.success) {
        setPointsEarned(response.data.points_awarded + response.data.coins_awarded);
        setShowPointsAnimation(true);
        
        // Show success message
        setTimeout(() => {
          onRefreshUser();
          onBack();
        }, 2500);
      } else {
        alert(response.data.message);
        if (response.data.status === 'pending_review') {
          onBack();
        }
      }
      
    } catch (error) {
      console.error('Error completing mission:', error);
      alert('Error al completar la misión: ' + (error.response?.data?.detail || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handlePointsAnimationComplete = () => {
    setShowPointsAnimation(false);
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    let videoId = null;
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('/embed/')[1]?.split('?')[0];
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const renderVideoPlayer = (videoUrl) => {
    if (!videoUrl) return null;
    
    const isYouTubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    const embedUrl = getYouTubeEmbedUrl(videoUrl);
    
    return (
      <div className="mb-6">
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Video de la Misión</h4>
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="bg-guayaquil-blue text-white px-3 py-1 rounded-lg text-sm hover:bg-guayaquil-primary"
            >
              {showVideo ? 'Ocultar Video' : 'Ver Video'}
            </button>
          </div>
          
          {showVideo && (
            <div className="mt-4">
              {isYouTubeUrl && embedUrl ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video de la Misión"
                  />
                </div>
              ) : (
                <div className="text-center bg-gray-200 rounded-lg p-8">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-guayaquil-blue rounded-full flex items-center justify-center mx-auto mb-3">
                      <PlayIcon />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">Video externo disponible</p>
                  <button
                    onClick={() => window.open(videoUrl, '_blank')}
                    className="bg-guayaquil-blue text-white px-4 py-2 rounded-lg hover:bg-guayaquil-primary"
                  >
                    Abrir Video en Nueva Ventana
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEvidenceUpload = () => {
    if (!mission.evidence_required) return null;
    
    return (
      <div className="mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3">📤 Subir Evidencia</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Descripción de la evidencia
              </label>
              <textarea
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Describe brevemente lo que has completado..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Archivo de evidencia
              </label>
              <input
                type="file"
                onChange={(e) => setEvidenceFile(e.target.files[0])}
                accept=".pdf,.jpg,.jpeg,.png,.mp4"
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-blue-600 mt-1">
                Formatos permitidos: PDF, JPG, PNG, MP4
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMissionContent = () => {
    const videoUrl = mission.content?.video_url;
    
    return (
      <div className="space-y-6">
        {videoUrl && renderVideoPlayer(videoUrl)}
        
        {mission.type === 'mini_quiz' && (
          <div className="space-y-6">
            {cooldownInfo && !cooldownInfo.can_attempt ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">⏰ Misión en Período de Espera</h4>
                <p className="text-red-600 mb-3">{cooldownInfo.message}</p>
                <p className="text-red-500 text-sm">
                  Puedes intentar nuevamente el: {new Date(cooldownInfo.retry_after).toLocaleDateString('es-EC')}
                </p>
              </div>
            ) : (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">📝 Quiz - Instrucciones</h4>
                  <div className="space-y-1 text-yellow-700 text-sm">
                    <p>• Necesitas al menos 70% de respuestas correctas para completar la misión</p>
                    <p>• Si fallas, deberás esperar 7 días para intentar nuevamente</p>
                    <p>• Lee cada pregunta cuidadosamente antes de responder</p>
                  </div>
                </div>
                
                {mission.content?.questions?.map((question, index) => (
                  <div key={index} className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-4">
                      {index + 1}. {question.question}
                    </h4>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={optionIndex}
                            checked={quizAnswers[index] === optionIndex}
                            onChange={() => setQuizAnswers(prev => ({ ...prev, [index]: optionIndex }))}
                            className="text-guayaquil-blue focus:ring-guayaquil-blue"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        
        {mission.type === 'downloadable_guide' && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-3">📚 Guía Descargable</h4>
            
            {mission.content?.topics && (
              <div className="mb-4">
                <h5 className="font-medium text-blue-700 mb-2">Temas incluidos:</h5>
                <ul className="space-y-1">
                  {mission.content.topics.map((topic, index) => (
                    <li key={index} className="text-blue-600 text-sm">• {topic}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {mission.content?.guide_url && (
              <a
                href={mission.content.guide_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <DownloadIcon />
                <span>Descargar Guía</span>
              </a>
            )}
          </div>
        )}
        
        {mission.type === 'expert_advice' && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-3">🎓 Consejo Experto</h4>
            
            {mission.content?.expert_name && (
              <div className="mb-3">
                <p className="font-medium text-green-700">{mission.content.expert_name}</p>
                {mission.content?.expert_title && <p className="text-green-600 text-sm">{mission.content.expert_title}</p>}
              </div>
            )}
            
            {mission.content?.key_points && (
              <div>
                <h5 className="font-medium text-green-700 mb-2">Puntos clave:</h5>
                <ul className="space-y-1">
                  {mission.content.key_points.map((point, index) => (
                    <li key={index} className="text-green-600 text-sm">• {point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {(mission.type === 'practical_task' || mission.type === 'document_upload' || mission.type === 'microvideo') && (
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-3">
              {mission.type === 'practical_task' ? '💼 Tarea Práctica' : 
               mission.type === 'document_upload' ? '📄 Subir Documento' :
               '🎥 Crear Microvideo'}
            </h4>
            
            <div className="space-y-2 text-orange-700 text-sm">
              {mission.content?.deadline_hours && (
                <p>• Tiempo límite: {mission.content.deadline_hours} horas</p>
              )}
              
              {mission.content?.template_sections && (
                <>
                  <p>• Secciones requeridas:</p>
                  <ul className="ml-4 space-y-1">
                    {mission.content.template_sections.map((section, index) => (
                      <li key={index}>- {section}</li>
                    ))}
                  </ul>
                </>
              )}
              
              {mission.content?.max_duration && (
                <p>• Duración máxima: {mission.content.max_duration} segundos</p>
              )}
              
              {mission.content?.topics && (
                <>
                  <p>• Temas a cubrir:</p>
                  <ul className="ml-4 space-y-1">
                    {mission.content.topics.map((topic, index) => (
                      <li key={index}>- {topic}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
        
        {renderEvidenceUpload()}
      </div>
    );
  };

  const canComplete = () => {
    if (cooldownInfo && !cooldownInfo.can_attempt) return false;
    
    if (mission.type === 'mini_quiz') {
      const questions = mission.content?.questions || [];
      return questions.length === Object.keys(quizAnswers).length;
    }
    
    if (mission.evidence_required && !mission.auto_approve) {
      return evidenceFile && evidenceDescription.trim();
    }
    
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {showPointsAnimation && (
        <PointsAnimation
          points={pointsEarned}
          onComplete={handlePointsAnimationComplete}
        />
      )}
      
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white p-6">
          <button
            onClick={onBack}
            className="mb-4 flex items-center space-x-2 hover:bg-white hover:bg-opacity-20 rounded-lg px-3 py-2 transition-colors"
          >
            <BackIcon />
            <span>Volver</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{getMissionIcon(mission.type)}</div>
            <div>
              <h1 className="text-2xl font-bold">{mission.title}</h1>
              <p className="text-blue-100 mt-1">{mission.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <StarIcon />
                  <span className="font-medium">{mission.points_reward} puntos</span>
                </div>
                {mission.coins_reward > 0 && (
                  <div className="flex items-center space-x-1">
                    <CoinIcon />
                    <span className="font-medium">{mission.coins_reward} monedas</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <CompetenceIcon />
                  <span className="font-medium">{mission.competence_area.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {renderMissionContent()}
          
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-500 space-y-1">
              <p>Tipo: {mission.type.replace('_', ' ').toUpperCase()}</p>
              <p>Dificultad: {'★'.repeat(mission.difficulty_level)} ({mission.difficulty_level}/5)</p>
              <p>Tiempo estimado: {mission.estimated_time} minutos</p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleComplete}
                disabled={!canComplete() || loading}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  canComplete() && !loading
                    ? 'bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white hover:from-blue-600 hover:to-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? <LoadingSpinner /> : 'Completar Misión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};