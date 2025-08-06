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

const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
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
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Background gradient animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-blue-50 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Misión Completada!</h2>
            <p className="text-gray-600 mb-6">Has ganado puntos increíbles</p>
            
            <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 mb-4 animate-pulse">
              +{Math.round(currentPoints)}
            </div>
            
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="text-yellow-500 animate-pulse">
                <StarIcon />
              </div>
              <span className="text-xl font-medium text-gray-700">puntos</span>
              <div className="text-yellow-500 animate-pulse">
                <StarIcon />
              </div>
            </div>
            
            {/* Animated progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(currentPoints / points) * 100}%` }}
              />
            </div>
            
            {/* Floating animation dots */}
            <div className="flex justify-center space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-bounce"
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
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-50 border-l-4 border-cyan-500 animate-slide-in">
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
              className="bg-cyan-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-cyan-700"
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
                    <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <PlayIcon />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">Video externo disponible</p>
                  <button
                    onClick={() => window.open(videoUrl, '_blank')}
                    className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700"
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
                    className="text-cyan-600 focus:ring-cyan-500"
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
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6">
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
              <p className="text-cyan-100 mt-1">{mission.description}</p>
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
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
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
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-3xl text-white mb-4 mx-auto">
            🚀
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Impulsa Guayaquil</h1>
          <p className="text-gray-600 mt-2">Iniciar Sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cédula
            </label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="1234567890"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : 'Iniciar Sesión'}
          </button>

          <div className="text-center">
            <p className="text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={onToggleRegister}
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Regístrate
              </button>
            </p>
          </div>

          <div className="text-center text-sm text-gray-500">
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
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Registro Exitoso!</h2>
          <p className="text-gray-600 mb-4">
            Tu cuenta ha sido creada correctamente. Redirigiendo al login...
          </p>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-3xl text-white mb-4 mx-auto">
            🚀
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Impulsa Guayaquil</h1>
          <p className="text-gray-600 mt-2">Crear Cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cédula
            </label>
            <input
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="1234567890"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Emprendimiento
            </label>
            <input
              type="text"
              name="nombre_emprendimiento"
              value={formData.nombre_emprendimiento}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : 'Crear Cuenta'}
          </button>

          <div className="text-center">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={onToggleLogin}
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Iniciar Sesión
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [currentTab, setCurrentTab] = useState('inicio');
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (user) {
      loadMissions();
    }
  }, [user]);

  const loadMissions = async () => {
    try {
      const response = await axios.get(`${API}/missions/${user.id}/with-status`);
      setMissions(response.data);
    } catch (error) {
      console.error('Error loading missions:', error);
    }
  };

  const handleStartMission = (mission) => {
    setSelectedMission(mission);
    setCurrentTab('mission-detail');
  };

  const handleBackFromMission = () => {
    setSelectedMission(null);
    setCurrentTab('inicio');
    // Reload missions to get updated status
    loadMissions();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
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

  const renderTabContent = () => {
    switch (currentTab) {
      case 'inicio':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 rounded-2xl">
              <h1 className="text-2xl font-bold mb-2">¡Hola, {user.nombre}!</h1>
              <p className="text-cyan-100">Continúa tu viaje emprendedor</p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-1">
                  <StarIcon />
                  <span className="font-medium">{user.points} puntos</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Rango: {user.rank.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <h2 className="text-xl font-bold text-gray-800">Tus Misiones</h2>
              {missions.map(mission => (
                <div
                  key={mission.id}
                  className={`bg-white border-2 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
                    mission.status === 'completed' ? 'border-green-400' :
                    mission.status === 'available' ? 'border-cyan-400' :
                    'border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                        mission.status === 'completed' ? 'bg-green-500 text-white' :
                        mission.status === 'available' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {getMissionIcon(mission.type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{mission.title}</h3>
                      <p className="text-gray-600 mb-4">{mission.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <StarIcon />
                            <span className="text-sm font-medium text-gray-700">{mission.points_reward} puntos</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mission.status === 'completed' ? 'bg-green-200 text-green-800' :
                            mission.status === 'available' ? 'bg-cyan-200 text-cyan-800' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {mission.status === 'completed' ? 'Completada' :
                             mission.status === 'available' ? 'Disponible' :
                             'Bloqueada'}
                          </span>
                        </div>
                        
                        {mission.status === 'available' && (
                          <button 
                            onClick={() => handleStartMission(mission)}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2"
                          >
                            <PlayIcon />
                            <span>Iniciar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'mission-detail':
        return selectedMission ? (
          <MissionDetailView 
            mission={selectedMission} 
            onBack={handleBackFromMission}
            onRefreshUser={refreshUser}
          />
        ) : (
          <div>Misión no encontrada</div>
        );
        
      case 'perfil':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <p className="text-gray-900">{user.nombre} {user.apellido}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Emprendimiento</label>
                <p className="text-gray-900">{user.nombre_emprendimiento}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Puntos</label>
                <p className="text-gray-900">{user.points}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Rango</label>
                <p className="text-gray-900">{user.rank.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Contenido no encontrado</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                🚀
              </div>
              <h1 className="text-xl font-bold text-gray-800">Impulsa Guayaquil</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Hola, {user.nombre}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.reload();
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['inicio', 'perfil'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setCurrentTab(tab);
                  if (tab !== 'mission-detail') {
                    setSelectedMission(null);
                  }
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentTab === tab
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
};

// Wrap the app with AuthProvider
const WrappedApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default WrappedApp;