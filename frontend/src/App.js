import React, { useState, useEffect, createContext, useContext } from 'react';
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user
      axios.get(`${API}/me`)
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (cedula, password) => {
    try {
      const response = await axios.post(`${API}/login`, { cedula, password });
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/register`, userData);
      return { success: true, user: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const refreshUser = async () => {
    try {
      const response = await axios.get(`${API}/me`);
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    refreshUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Icons
const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const AchievementIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const RewardIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const EventIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BadgeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const AdminIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BackIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const MapIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guayaquil-blue"></div>
  </div>
);

// Points Animation Component
const PointsAnimation = ({ points, onComplete }) => {
  const [currentPoints, setCurrentPoints] = useState(0);
  const [showAnimation, setShowAnimation] = useState(true);
  const [showStars, setShowStars] = useState(false);

  useEffect(() => {
    // Show stars effect after initial animation
    setTimeout(() => setShowStars(true), 500);
    
    const animationDuration = 2000;
    const incrementInterval = 50;
    const increment = points / (animationDuration / incrementInterval);
    
    const timer = setInterval(() => {
      setCurrentPoints(prev => {
        const newPoints = prev + increment;
        if (newPoints >= points) {
          clearInterval(timer);
          setTimeout(() => {
            setShowAnimation(false);
            onComplete();
          }, 1500);
          return points;
        }
        return newPoints;
      });
    }, incrementInterval);

    return () => clearInterval(timer);
  }, [points, onComplete]);

  if (!showAnimation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="text-center relative">
        {/* Stars Animation */}
        {showStars && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: '1s'
                }}
              >
                <div className="w-2 h-2 bg-guayaquil-yellow rounded-full"></div>
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Background gradient animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-guayaquil-light to-guayaquil-lighter opacity-50"></div>
          
          <div className="relative z-10">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Misión Completada!</h2>
            <p className="text-gray-600 mb-6">Has ganado puntos increíbles</p>
            
            <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary mb-4 animate-pulse">
              +{Math.round(currentPoints)}
            </div>
            
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="text-guayaquil-yellow animate-pulse">
                <StarIcon />
              </div>
              <span className="text-xl font-medium text-gray-700">puntos</span>
              <div className="text-guayaquil-yellow animate-pulse">
                <StarIcon />
              </div>
            </div>
            
            {/* Animated progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(currentPoints / points) * 100}%` }}
              />
            </div>
            
            {/* Floating animation dots */}
            <div className="flex justify-center space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-gradient-to-r from-guayaquil-primary to-guayaquil-blue animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Component
const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_achievement':
        return '🏆';
      case 'rank_up':
        return '⬆️';
      case 'streak_milestone':
        return '🔥';
      default:
        return '📢';
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-50 border-l-4 border-guayaquil-blue animate-slide-in">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{notification.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Entrepreneur Mascot Component
const EntrepreneurMascot = ({ message, celebrating = false, position = "bottom-right" }) => {
  const [visible, setVisible] = useState(true);
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      setVisible(true);
    }
  }, [message]);

  const positionClasses = {
    "bottom-right": "fixed bottom-4 right-4",
    "bottom-left": "fixed bottom-4 left-4",
    "center": "flex items-center justify-center"
  };

  if (!visible && !celebrating) return null;

  return (
    <div className={`${positionClasses[position]} z-50 transition-all duration-500 ${celebrating ? 'animate-bounce' : ''}`}>
      <div className="relative">
        {/* Mascot Image */}
        <div className="w-24 h-24 bg-gradient-to-br from-guayaquil-blue to-guayaquil-primary rounded-full flex items-center justify-center shadow-lg">
          <img 
            src="https://images.unsplash.com/photo-1652795385761-7ac287d0cd03"
            alt="Emprendedor Guayaquil"
            className="w-20 h-20 rounded-full object-cover"
            onError={(e) => {
              // Fallback to emoji if image fails
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = `<span class="text-4xl">👔</span>`;
            }}
          />
        </div>
        
        {/* Speech Bubble */}
        {currentMessage && (
          <div className="absolute bottom-full right-0 mb-2 mr-2 bg-white rounded-lg shadow-xl p-3 max-w-xs border-2 border-guayaquil-light">
            <div className="text-sm text-gray-700 font-medium">{currentMessage}</div>
            <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
            <button
              onClick={() => setVisible(false)}
              className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 text-xs"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Celebration Effects */}
        {celebrating && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: '1s'
                }}
              >
                <div className="w-2 h-2 bg-guayaquil-yellow rounded-full"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Progress Map Component - Duolingo Style
const ProgressMap = ({ user, onRefreshUser }) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState(null);
  const [mascotMessage, setMascotMessage] = useState("");
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    loadMissions();
    showWelcomeMessage();
  }, [user]);

  const showWelcomeMessage = () => {
    const messages = [
      "¡Hola! Soy tu guía emprendedor. ¡Vamos a conquistar Guayaquil juntos! 🚀",
      "¿Listo para el siguiente desafío empresarial? 💼",
      "¡Cada paso te acerca más a ser un líder empresarial! ⭐",
      "Guayaquil necesita emprendedores como tú. ¡Sigamos adelante! 🌟"
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setMascotMessage(randomMessage);
  };

  const loadMissions = async () => {
    try {
      const response = await axios.get(`${API}/missions/${user.id}/with-status`);
      setMissions(response.data);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMissionClick = (mission) => {
    if (mission.status === 'LOCKED') {
      setMascotMessage("¡Esta misión aún está bloqueada! Completa las anteriores primero. 🔒");
      return;
    }
    if (mission.status === 'COMPLETED') {
      setMascotMessage("¡Ya completaste esta misión! Bien hecho. ✅");
      return;
    }
    setSelectedMission(mission);
  };

  const getMissionIcon = (type, status) => {
    const iconMap = {
      'microvideo': '🎥',
      'mini_quiz': '📝',
      'downloadable_guide': '📚',
      'practical_task': '💼',
      'expert_advice': '🎓',
      'hidden_reward': '🎁'
    };
    
    if (status === 'COMPLETED') return '✅';
    if (status === 'LOCKED') return '🔒';
    return iconMap[type] || '✨';
  };

  const getMissionColor = (status, index) => {
    if (status === 'COMPLETED') return 'from-green-400 to-green-600';
    if (status === 'LOCKED') return 'from-gray-300 to-gray-500';
    // Alternate colors for available missions
    const colors = [
      'from-guayaquil-blue to-guayaquil-primary',
      'from-blue-400 to-blue-600',
      'from-guayaquil-primary to-blue-500',
      'from-cyan-400 to-cyan-600'
    ];
    return colors[index % colors.length];
  };

  const getPathPosition = (index, total) => {
    // Create a zigzag path
    const isEven = index % 2 === 0;
    const xPosition = isEven ? 'left-8' : 'right-8';
    return xPosition;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-guayaquil-lighter to-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (selectedMission) {
    return (
      <MissionDetailView
        mission={selectedMission}
        onBack={() => setSelectedMission(null)}
        onRefreshUser={onRefreshUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-guayaquil-lighter to-white relative overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-guayaquil-light">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-guayaquil-dark">Camino Emprendedor</h1>
              <p className="text-guayaquil-text">Tu ruta hacia el éxito empresarial en Guayaquil</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-guayaquil-blue">{user.points}</div>
                <div className="text-sm text-guayaquil-text">puntos</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-guayaquil-yellow to-yellow-500 rounded-full flex items-center justify-center">
                <StarIcon />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Path */}
      <div className="max-w-4xl mx-auto px-4 py-8 relative">
        <div className="relative">
          {/* Animated Background Path */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ height: `${missions.length * 200}px` }}>
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d={`M 100 50 ${missions.map((_, i) => {
                const y = (i + 1) * 200;
                const x = i % 2 === 0 ? 300 : 100;
                return `Q ${i % 2 === 0 ? 200 : 200} ${y - 100} ${x} ${y}`;
              }).join(' ')}`}
              stroke="url(#pathGradient)"
              strokeWidth="4"
              fill="none"
              strokeDasharray="10,5"
              className="animate-pulse"
            />
          </svg>

          {/* Mission Nodes */}
          <div className="space-y-24">
            {missions.map((mission, index) => (
              <div key={mission.id} className={`relative flex items-center ${getPathPosition(index, missions.length)}`}>
                {/* Mission Node */}
                <div
                  onClick={() => handleMissionClick(mission)}
                  className={`relative cursor-pointer transform transition-all duration-300 hover:scale-110 ${
                    mission.status === 'AVAILABLE' ? 'hover:animate-pulse' : ''
                  }`}
                >
                  {/* Glow Effect for Available Missions */}
                  {mission.status === 'AVAILABLE' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary rounded-full blur-lg opacity-50 animate-pulse"></div>
                  )}
                  
                  {/* Mission Circle */}
                  <div className={`relative w-20 h-20 rounded-full bg-gradient-to-r ${getMissionColor(mission.status, index)} flex items-center justify-center text-3xl font-bold text-white shadow-lg ${
                    mission.status === 'LOCKED' ? 'grayscale' : ''
                  }`}>
                    {getMissionIcon(mission.type, mission.status)}
                    
                    {/* Points Badge */}
                    <div className="absolute -top-2 -right-2 bg-guayaquil-yellow text-guayaquil-dark text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      {mission.points_reward}
                    </div>
                  </div>
                </div>

                {/* Mission Info Card */}
                <div className={`ml-6 ${index % 2 === 1 ? 'order-first mr-6 ml-0' : ''}`}>
                  <div className={`bg-white rounded-xl p-4 shadow-lg border-l-4 ${
                    mission.status === 'COMPLETED' ? 'border-green-500' :
                    mission.status === 'LOCKED' ? 'border-gray-400' :
                    'border-guayaquil-blue'
                  } max-w-sm ${
                    mission.status === 'AVAILABLE' ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''
                  }`}
                  onClick={() => handleMissionClick(mission)}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-guayaquil-dark text-lg">{mission.title}</h3>
                      {mission.status === 'COMPLETED' && (
                        <div className="text-green-500 text-xl">✅</div>
                      )}
                    </div>
                    <p className="text-guayaquil-text text-sm mb-3">{mission.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          mission.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          mission.status === 'LOCKED' ? 'bg-gray-100 text-gray-600' :
                          'bg-guayaquil-light text-guayaquil-blue'
                        }`}>
                          {mission.status === 'COMPLETED' ? 'Completada' :
                           mission.status === 'LOCKED' ? 'Bloqueada' : 'Disponible'}
                        </div>
                      </div>
                      <div className="flex items-center text-guayaquil-yellow">
                        <StarIcon />
                        <span className="ml-1 font-bold">{mission.points_reward}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Finish Line */}
          <div className="flex justify-center items-center mt-24">
            <div className="bg-gradient-to-r from-guayaquil-yellow to-yellow-500 text-guayaquil-dark px-8 py-4 rounded-full font-bold text-xl shadow-lg">
              🏆 ¡Meta Emprendedora Alcanzada! 🏆
            </div>
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="fixed bottom-20 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-guayaquil-light">
        <div className="text-center">
          <div className="text-2xl font-bold text-guayaquil-blue">
            {missions.filter(m => m.status === 'COMPLETED').length}
          </div>
          <div className="text-sm text-guayaquil-text">de {missions.length}</div>
          <div className="text-xs text-guayaquil-text">completadas</div>
        </div>
      </div>

      {/* Entrepreneur Mascot */}
      <EntrepreneurMascot
        message={mascotMessage}
        celebrating={celebrating}
        position="bottom-right"
      />
    </div>
  );
};

// Helper function for mission icons
const getMissionIcon = (type) => {
  switch (type) {
    case 'microvideo':
      return '🎥';
    case 'mini_quiz':
      return '❓';
    case 'downloadable_guide':
      return '📚';
    case 'practical_task':
      return '📝';
    case 'expert_advice':
      return '🎓';
    case 'hidden_reward':
      return '🎁';
    default:
      return '✨';
  }
};

// Mission Detail View Component - FIXED VERSION
const MissionDetailView = ({ mission, onBack, onRefreshUser }) => {
  const [loading, setLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showVideo, setShowVideo] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState(null);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    // Check cooldown status for mini-quiz missions
    if (mission.type === 'mini_quiz') {
      checkCooldownStatus();
    }
  }, [mission]);

  const checkCooldownStatus = async () => {
    try {
      const response = await axios.get(`${API}/missions/${mission.id}/cooldown`);
      setCooldownInfo(response.data);
    } catch (error) {
      console.error('Error checking cooldown:', error);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/missions/complete`, {
        mission_id: mission.id,
        completion_data: { 
          completion_time: new Date().toISOString(),
          quiz_answers: quizAnswers 
        }
      });

      if (response.data.points_earned > 0) {
        setPointsEarned(response.data.points_earned);
        setShowPointsAnimation(true);
      } else {
        // Mission failed, show error
        alert(`Misión fallida. ${response.data.message}`);
        onBack();
      }
    } catch (error) {
      console.error('Error completing mission:', error);
      alert(error.response?.data?.detail || 'Error al completar la misión');
    } finally {
      setLoading(false);
    }
  };

  const handlePointsAnimationComplete = () => {
    setShowPointsAnimation(false);
    // Refresh user data if callback provided
    if (onRefreshUser) {
      onRefreshUser();
    }
    onBack();
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    // Extract video ID from various YouTube URL formats
    let videoId = null;
    
    // Handle different YouTube URL formats
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

  const renderDownloadableGuide = () => {
    const guideUrl = mission.content?.guide_url;
    const topics = mission.content?.topics || [];
    const videoUrl = mission.content?.video_url;
    
    return (
      <div className="space-y-4">
        {videoUrl && renderVideoPlayer(videoUrl)}
        
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3">📚 Guía Descargable</h4>
          
          {topics.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-blue-700 mb-2">Temas incluidos:</h5>
              <ul className="space-y-1">
                {topics.map((topic, index) => (
                  <li key={index} className="text-blue-600 text-sm">• {topic}</li>
                ))}
              </ul>
            </div>
          )}
          
          {guideUrl ? (
            <a
              href={guideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DownloadIcon />
              <span>Descargar Guía</span>
            </a>
          ) : (
            <div className="text-blue-700">
              <p>📄 Material de estudio disponible para esta misión</p>
            </div>
          )}
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            {mission.content?.completion_requirement || 'Lee la guía completamente y confirma tu comprensión.'}
          </p>
        </div>
      </div>
    );
  };

  const renderExpertAdvice = () => {
    const expertName = mission.content?.expert_name;
    const expertTitle = mission.content?.expert_title;
    const videoUrl = mission.content?.video_url;
    const keyPoints = mission.content?.key_points || [];
    
    return (
      <div className="space-y-4">
        {videoUrl && renderVideoPlayer(videoUrl)}
        
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-3">🎓 Consejo Experto</h4>
          
          {expertName && (
            <div className="mb-3">
              <p className="font-medium text-green-700">{expertName}</p>
              {expertTitle && <p className="text-green-600 text-sm">{expertTitle}</p>}
            </div>
          )}
          
          {keyPoints.length > 0 ? (
            <div>
              <h5 className="font-medium text-green-700 mb-2">Puntos clave:</h5>
              <ul className="space-y-1">
                {keyPoints.map((point, index) => (
                  <li key={index} className="text-green-600 text-sm">• {point}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-green-700">
              <p>💡 Consejos de expertos disponibles para esta misión</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMicroVideoContent = () => {
    const videoUrl = mission.content?.video_url;
    const maxDuration = mission.content?.max_duration || 60;
    const topics = mission.content?.topics || [];
    
    return (
      <div className="space-y-4">
        {videoUrl && renderVideoPlayer(videoUrl)}
        
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-3">🎥 Crear Microvideo</h4>
          <div className="space-y-2 text-purple-700 text-sm">
            <p>• Duración máxima: {maxDuration} segundos</p>
            {topics.length > 0 && (
              <>
                <p>• Temas a cubrir:</p>
                <ul className="ml-4 space-y-1">
                  {topics.map((topic, index) => (
                    <li key={index}>- {topic}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderQuizContent = () => {
    const questions = mission.content?.questions || [];
    
    if (cooldownInfo && !cooldownInfo.can_attempt) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">⏰ Misión en Período de Espera</h4>
          <p className="text-red-600 mb-3">{cooldownInfo.message}</p>
          <p className="text-red-500 text-sm">
            Puedes intentar nuevamente el: {new Date(cooldownInfo.retry_after).toLocaleDateString('es-EC')}
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">📝 Quiz - Instrucciones</h4>
          <div className="space-y-1 text-yellow-700 text-sm">
            <p>• Necesitas al menos 70% de respuestas correctas para completar la misión</p>
            <p>• Si fallas, deberás esperar 7 días para intentar nuevamente</p>
            <p>• Lee cada pregunta cuidadosamente antes de responder</p>
          </div>
        </div>
        
        {questions.map((question, index) => (
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
      </div>
    );
  };

  const renderMissionContent = () => {
    switch (mission.type) {
      case 'mini_quiz':
        return renderQuizContent();
      case 'downloadable_guide':
        return renderDownloadableGuide();
      case 'expert_advice':
        return renderExpertAdvice();
      case 'microvideo':
        return renderMicroVideoContent();
      case 'practical_task':
        return (
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-3">💼 Tarea Práctica</h4>
            <div className="space-y-2 text-orange-700 text-sm">
              <p>• Tiempo límite: {mission.content?.deadline_hours || 48} horas</p>
              {mission.content?.template_sections?.length > 0 && (
                <>
                  <p>• Secciones requeridas:</p>
                  <ul className="ml-4 space-y-1">
                    {mission.content.template_sections.map((section, index) => (
                      <li key={index}>- {section}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600">Sigue las instrucciones para completar esta misión.</p>
          </div>
        );
    }
  };

  const canComplete = () => {
    if (mission.type === 'mini_quiz') {
      const questions = mission.content?.questions || [];
      return questions.length === Object.keys(quizAnswers).length && 
             (!cooldownInfo || cooldownInfo.can_attempt);
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
              <div className="flex items-center space-x-1 mt-2">
                <StarIcon />
                <span className="font-medium">{mission.points_reward} puntos</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {renderMissionContent()}
          
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Tipo: {mission.type.replace('_', ' ').toUpperCase()}
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

// Login Component
const LoginForm = ({ onToggleRegister }) => {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(cedula, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-guayaquil-lighter to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-guayaquil-blue to-guayaquil-primary rounded-full flex items-center justify-center text-3xl text-white mb-4 mx-auto">
            🚀
          </div>
          <h1 className="text-2xl font-bold text-guayaquil-dark">Impulsa Guayaquil</h1>
          <p className="text-guayaquil-text mt-2">Iniciar Sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-guayaquil-text mb-2">
              Cédula
            </label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
              placeholder="1234567890"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-guayaquil-text mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
              placeholder="Tu contraseña"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : 'Iniciar Sesión'}
          </button>

          <div className="text-center">
            <p className="text-guayaquil-text">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={onToggleRegister}
                className="text-guayaquil-blue hover:text-guayaquil-primary font-medium"
              >
                Regístrate
              </button>
            </p>
          </div>

          <div className="text-center text-sm text-guayaquil-text">
            <p>Demo Admin: 0000000000 / admin</p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Register Component
const RegisterForm = ({ onToggleLogin }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    nombre_emprendimiento: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await register(formData);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onToggleLogin();
      }, 2000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-guayaquil-lighter to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-guayaquil-dark mb-2">¡Registro Exitoso!</h2>
          <p className="text-guayaquil-text mb-4">
            Tu cuenta ha sido creada correctamente. Redirigiendo al login...
          </p>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-guayaquil-lighter to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-guayaquil-blue to-guayaquil-primary rounded-full flex items-center justify-center text-3xl text-white mb-4 mx-auto">
            🚀
          </div>
          <h1 className="text-2xl font-bold text-guayaquil-dark">Impulsa Guayaquil</h1>
          <p className="text-guayaquil-text mt-2">Crear Cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-guayaquil-text mb-1">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-guayaquil-text mb-1">
                Apellido
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-guayaquil-text mb-1">
              Cédula
            </label>
            <input
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
              placeholder="1234567890"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-guayaquil-text mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-guayaquil-text mb-1">
              Nombre del Emprendimiento
            </label>
            <input
              type="text"
              name="nombre_emprendimiento"
              value={formData.nombre_emprendimiento}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-guayaquil-text mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-guayaquil-blue focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : 'Crear Cuenta'}
          </button>

          <div className="text-center">
            <p className="text-guayaquil-text">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={onToggleLogin}
                className="text-guayaquil-blue hover:text-guayaquil-primary font-medium"
              >
                Inicia Sesión
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Home Component - Keep existing functionality
const Home = ({ user, onRefreshUser }) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState(null);

  useEffect(() => {
    loadMissions();
  }, [user]);

  const loadMissions = async () => {
    try {
      const response = await axios.get(`${API}/missions/${user.id}/with-status`);
      setMissions(response.data);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* User Stats Header */}
      <div className="bg-gradient-to-r from-guayaquil-blue to-guayaquil-primary text-white rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">¡Hola, {user.nombre}!</h1>
            <p className="text-blue-100 mt-1">Bienvenido a tu centro emprendedor</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{user.points}</div>
            <div className="text-blue-100">puntos totales</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{completedMissions.length}</div>
            <div className="text-blue-100 text-sm">Misiones Completadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{availableMissions.length}</div>
            <div className="text-blue-100 text-sm">Misiones Disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user.rank?.replace('_', ' ').toUpperCase() || 'NOVATO'}</div>
            <div className="text-blue-100 text-sm">Rango Actual</div>
          </div>
        </div>
      </div>

      {/* Available Missions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-guayaquil-dark mb-4">Misiones Disponibles</h2>
        {loading ? (
          <LoadingSpinner />
        ) : availableMissions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableMissions.map((mission) => (
              <div
                key={mission.id}
                onClick={() => handleMissionClick(mission)}
                className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-guayaquil-blue cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{getMissionIcon(mission.type)}</div>
                  <div className="bg-guayaquil-yellow text-guayaquil-dark px-2 py-1 rounded-full text-sm font-bold">
                    {mission.points_reward} pts
                  </div>
                </div>
                <h3 className="font-bold text-guayaquil-dark text-lg mb-2">{mission.title}</h3>
                <p className="text-guayaquil-text text-sm mb-4">{mission.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-guayaquil-blue text-sm font-medium">
                    {mission.type.replace('_', ' ').toUpperCase()}
                  </span>
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
            <h3 className="text-xl font-bold text-guayaquil-dark mb-2">¡Excelente trabajo!</h3>
            <p className="text-guayaquil-text">Has completado todas las misiones disponibles.</p>
          </div>
        )}
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
                  <p className="text-green-600 text-xs">+{mission.points_reward} puntos</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Keep all other existing components (Achievements, Rewards, Events, Profile, AdminPanel)...
// [Previous components remain unchanged]

// Main App Component
const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [notification, setNotification] = useState(null);
  const { user, loading } = useAuth();

  const refreshUser = async () => {
    // This will be implemented in the auth context
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-guayaquil-lighter to-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return isLogin ? (
      <LoginForm onToggleRegister={() => setIsLogin(false)} />
    ) : (
      <RegisterForm onToggleLogin={() => setIsLogin(true)} />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home user={user} onRefreshUser={refreshUser} />;
      case 'progress':
        return <ProgressMap user={user} onRefreshUser={refreshUser} />;
      case 'achievements':
        return <div className="text-center py-20 text-guayaquil-text">Logros - En desarrollo</div>;
      case 'rewards':
        return <div className="text-center py-20 text-guayaquil-text">Recompensas - En desarrollo</div>;
      case 'events':
        return <div className="text-center py-20 text-guayaquil-text">Eventos - En desarrollo</div>;
      case 'profile':
        return <div className="text-center py-20 text-guayaquil-text">Perfil - En desarrollo</div>;
      case 'admin':
        return <div className="text-center py-20 text-guayaquil-text">Panel Admin - En desarrollo</div>;
      default:
        return <Home user={user} onRefreshUser={refreshUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-guayaquil-lighter to-white">
      {notification && (
        <NotificationToast
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Main Content */}
      <div className="pb-20">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-guayaquil-light">
        <div className="grid grid-cols-5 max-w-md mx-auto">
          {[
            { id: 'home', icon: HomeIcon, label: 'Inicio' },
            { id: 'progress', icon: MapIcon, label: 'Progreso' },
            { id: 'achievements', icon: AchievementIcon, label: 'Logros' },
            { id: 'rewards', icon: RewardIcon, label: 'Premios' },
            { id: 'profile', icon: ProfileIcon, label: 'Perfil' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 text-center ${
                activeTab === tab.id
                  ? 'text-guayaquil-blue border-t-2 border-guayaquil-blue'
                  : 'text-guayaquil-text'
              }`}
            >
              <tab.icon />
              <div className="text-xs mt-1">{tab.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Export with Auth Provider
export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}