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

// App Loading Animation Component
const AppLoadingAnimation = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete(), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    setTimeout(() => setShowLogo(true), 300);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center z-50">
      <div className="text-center">
        <div className={`transform transition-all duration-1000 ${showLogo ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
          <div className="bg-white rounded-full p-8 shadow-2xl mb-6">
            <div className="text-6xl font-bold text-cyan-600">🚀</div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Impulsa</h1>
          <h2 className="text-2xl text-cyan-100 mb-8">Guayaquil</h2>
        </div>
        
        <div className="w-64 bg-white bg-opacity-20 rounded-full h-2 mb-4">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-white text-sm">Cargando tu experiencia emprendedora...</p>
      </div>
    </div>
  );
};

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

// Mission Detail View Component
const MissionDetailView = ({ mission, onBack, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
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
    onBack();
  };

  const renderVideoPlayer = (videoUrl) => {
    if (!videoUrl) return null;
    
    // Check if it's a YouTube URL
    const isYouTubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    
    return (
      <div className="mb-6">
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Video de la Misión</h4>
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="bg-cyan-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-cyan-700"
            >
              {showVideo ? 'Ocultar' : 'Ver Video'}
            </button>
          </div>
          
          {showVideo && (
            <div className="mt-4">
              {isYouTubeUrl ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={videoUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video de la Misión"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-4">
                    <PlayIcon />
                  </div>
                  <p className="text-gray-600 mb-4">Enlace de video externo</p>
                  <button
                    onClick={() => window.open(videoUrl, '_blank')}
                    className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700"
                  >
                    Abrir Video
                  </button>
                </div>
              )}
              
              {videoError && (
                <div className="text-center py-4">
                  <p className="text-red-600 mb-3">Error al cargar el video</p>
                  <button
                    onClick={() => window.open(videoUrl, '_blank')}
                    className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700"
                  >
                    Abrir en Nueva Ventana
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
    
    return (
      <div className="space-y-4">
        {renderVideoPlayer(mission.content?.video_url)}
        
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
          
          {guideUrl && (
            <a
              href={guideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DownloadIcon />
              <span>Descargar Guía</span>
            </a>
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
        {renderVideoPlayer(videoUrl)}
        
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-3">🎓 Consejo Experto</h4>
          
          {expertName && (
            <div className="mb-3">
              <p className="font-medium text-green-700">{expertName}</p>
              {expertTitle && <p className="text-green-600 text-sm">{expertTitle}</p>}
            </div>
          )}
          
          {keyPoints.length > 0 && (
            <div>
              <h5 className="font-medium text-green-700 mb-2">Puntos clave:</h5>
              <ul className="space-y-1">
                {keyPoints.map((point, index) => (
                  <li key={index} className="text-green-600 text-sm">• {point}</li>
                ))}
              </ul>
            </div>
          )}
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
          <p className="text-yellow-700 text-sm">
            • Necesitas al menos 70% de respuestas correctas para completar la misión
          </p>
          <p className="text-yellow-700 text-sm">
            • Si fallas, deberás esperar 7 días para intentar nuevamente
          </p>
          <p className="text-yellow-700 text-sm">
            • Lee cada pregunta cuidadosamente antes de responder
          </p>
        </div>
        
        {questions.map((question, index) => (
          <div key={index} className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-4">
              {index + 1}. {question.question}
            </h4>
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
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
        return (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-3">🎥 Crear Microvideo</h4>
            <div className="space-y-2 text-purple-700 text-sm">
              <p>• Duración máxima: {mission.content?.max_duration || 60} segundos</p>
              <p>• Temas a cubrir:</p>
              <ul className="ml-4 space-y-1">
                {(mission.content?.topics || []).map((topic, index) => (
                  <li key={index}>- {topic}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'practical_task':
        return (
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-3">💼 Tarea Práctica</h4>
            <div className="space-y-2 text-orange-700 text-sm">
              <p>• Tiempo límite: {mission.content?.deadline_hours || 48} horas</p>
              <p>• Secciones requeridas:</p>
              <ul className="ml-4 space-y-1">
                {(mission.content?.template_sections || []).map((section, index) => (
                  <li key={index}>- {section}</li>
                ))}
              </ul>
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
            IG
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
            IG
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

// Interactive Mission Path Component
const InteractiveMissionPath = ({ missions, onStart }) => {
  const pathPoints = missions.map((mission, index) => ({
    ...mission,
    x: 50 + (index % 2) * 40 + Math.random() * 10,
    y: 80 + (index * 150)
  }));

  return (
    <div className="relative bg-gradient-to-b from-cyan-50 to-blue-100 rounded-2xl p-4 min-h-[800px] overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-cyan-300 rounded-full animate-pulse delay-2000"></div>
      </div>

      {/* SVG Path */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#0284c7', stopOpacity: 0.8 }} />
          </linearGradient>
        </defs>
        
        {/* Path line */}
        <path
          d={`M 50 50 ${pathPoints.map(point => `L ${point.x} ${point.y}`).join(' ')}`}
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="6"
          strokeDasharray="20,10"
          className="animate-pulse"
        />
        
        {/* Connection lines */}
        {pathPoints.slice(0, -1).map((point, index) => (
          <line
            key={index}
            x1={`${point.x}%`}
            y1={point.y}
            x2={`${pathPoints[index + 1].x}%`}
            y2={pathPoints[index + 1].y}
            stroke="#0891b2"
            strokeWidth="4"
            strokeOpacity="0.6"
            strokeDasharray="10,5"
          />
        ))}
      </svg>

      {/* Mission Points */}
      <div className="relative z-10">
        {pathPoints.map((mission, index) => (
          <div
            key={mission.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110"
            style={{
              left: `${mission.x}%`,
              top: `${mission.y}px`
            }}
          >
            <div className={`relative ${
              mission.status === 'completed' ? 'completed-mission' :
              mission.status === 'available' ? 'available-mission' :
              'locked-mission'
            }`}>
              {/* Mission Circle */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 transition-all duration-300 ${
                mission.status === 'completed' ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-200' :
                mission.status === 'available' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-200 hover:shadow-xl hover:shadow-cyan-300' :
                'bg-gray-300 border-gray-400 text-gray-600'
              }`}>
                {mission.status === 'completed' ? '✓' : 
                 mission.status === 'available' ? index + 1 : '🔒'}
              </div>

              {/* Mission Card */}
              <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-xl p-4 shadow-xl border-2 w-64 ${
                mission.status === 'completed' ? 'border-green-200' :
                mission.status === 'available' ? 'border-cyan-200' :
                'border-gray-200'
              } transition-all duration-300 hover:shadow-2xl`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                    mission.status === 'completed' ? 'bg-green-100 text-green-600' :
                    mission.status === 'available' ? 'bg-cyan-100 text-cyan-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getMissionIcon(mission.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-sm">{mission.title}</h3>
                  </div>
                </div>
                
                <p className="text-gray-600 text-xs mb-3 line-clamp-2">{mission.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <StarIcon />
                    <span className="text-xs font-medium text-gray-700">{mission.points_reward}</span>
                  </div>
                  
                  {mission.status === 'available' && (
                    <button
                      onClick={() => onStart(mission)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
                    >
                      Iniciar
                    </button>
                  )}
                  
                  {mission.status === 'completed' && (
                    <span className="text-green-600 text-xs font-medium">✅ Completada</span>
                  )}
                  
                  {mission.status === 'locked' && (
                    <span className="text-gray-400 text-xs font-medium">🔒 Bloqueada</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mission Card Component
const MissionCard = ({ mission, onStart }) => {
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

  return (
    <div className={`mission-card bg-white border-2 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
      mission.status === 'completed' ? 'border-green-400' :
      mission.status === 'available' ? 'border-cyan-400' :
      'border-gray-300'
    }`}>
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
          <p className="text-gray-600 mb-4 line-clamp-2">{mission.description}</p>
          
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
                onClick={() => onStart(mission)}
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

// Admin Panel Component
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [missions, setMissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const { logout } = useAuth();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [missionsRes, usersRes, statsRes, achievementsRes] = await Promise.all([
        axios.get(`${API}/missions`),
        axios.get(`${API}/users`),
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/achievements`)
      ]);
      
      setMissions(missionsRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setAchievements(achievementsRes.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMission = () => {
    setEditingMission(null);
    setShowMissionModal(true);
  };

  const handleEditMission = (mission) => {
    setEditingMission(mission);
    setShowMissionModal(true);
  };

  const handleDeleteMission = async (missionId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta misión?')) {
      try {
        await axios.delete(`${API}/missions/${missionId}`);
        await loadAdminData();
      } catch (error) {
        console.error('Error deleting mission:', error);
      }
    }
  };

  const handleCreateAchievement = () => {
    setEditingAchievement(null);
    setShowAchievementModal(true);
  };

  const handleEditAchievement = (achievement) => {
    setEditingAchievement(achievement);
    setShowAchievementModal(true);
  };

  const handleDeleteAchievement = async (achievementId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este logro?')) {
      try {
        await axios.delete(`${API}/achievements/${achievementId}`);
        await loadAdminData();
      } catch (error) {
        console.error('Error deleting achievement:', error);
      }
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ProfileIcon />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Misiones</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_missions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <AchievementIcon />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Misiones Completadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_completed_missions}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <StarIcon />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Puntos Otorgados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_points_awarded}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <RewardIcon />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuarios Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Puntos</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Rango</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 5).map(user => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{user.nombre} {user.apellido}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.points}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
                      {user.rank.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMissions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Gestión de Misiones</h3>
        <button
          onClick={handleCreateMission}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 flex items-center space-x-2"
        >
          <PlusIcon />
          <span>Nueva Misión</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium text-gray-700">Título</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Tipo</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Puntos</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Posición</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {missions.map(mission => (
                <tr key={mission.id} className="border-b border-gray-100">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getMissionIcon(mission.type)}</div>
                      <div>
                        <div className="font-medium text-gray-900">{mission.title}</div>
                        <div className="text-sm text-gray-500">{mission.description.substring(0, 50)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {mission.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6">{mission.points_reward}</td>
                  <td className="py-4 px-6">{mission.position}</td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditMission(mission)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteMission(mission.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium text-gray-700">Usuario</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Emprendimiento</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Puntos</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Rango</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Misiones</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Registro</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">{user.nombre} {user.apellido}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-sm text-gray-500">C.I: {user.cedula}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">{user.nombre_emprendimiento}</td>
                  <td className="py-4 px-6">{user.points}</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
                      {user.rank.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6">{user.completed_missions.length}</td>
                  <td className="py-4 px-6">
                    {new Date(user.created_at).toLocaleDateString('es-EC')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Gestión de Logros</h3>
        <button
          onClick={handleCreateAchievement}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 flex items-center space-x-2"
        >
          <PlusIcon />
          <span>Nuevo Logro</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium text-gray-700">Logro</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Condición</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Requisitos</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {achievements.map(achievement => (
                <tr key={achievement.id} className="border-b border-gray-100">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <div className="font-medium text-gray-900">{achievement.title}</div>
                        <div className="text-sm text-gray-500">{achievement.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {achievement.condition.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      {achievement.points_required > 0 && (
                        <div className="text-sm text-gray-600">
                          📊 {achievement.points_required} puntos
                        </div>
                      )}
                      {achievement.missions_required > 0 && (
                        <div className="text-sm text-gray-600">
                          ✅ {achievement.missions_required} misiones
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditAchievement(achievement)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteAchievement(achievement.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('missions')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'missions'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Misiones
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'users'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'achievements'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Logros
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'missions' && renderMissions()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'achievements' && renderAchievements()}
      </div>

      {/* Mission Modal will be implemented here */}
      {showMissionModal && (
        <MissionModal
          mission={editingMission}
          onClose={() => setShowMissionModal(false)}
          onSave={loadAdminData}
        />
      )}
      
      {/* Achievement Modal */}
      {showAchievementModal && (
        <AchievementModal
          achievement={editingAchievement}
          onClose={() => setShowAchievementModal(false)}
          onSave={loadAdminData}
        />
      )}
    </div>
  );
};

// Mission Modal Component for Admin
const MissionModal = ({ mission, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: mission?.title || '',
    description: mission?.description || '',
    type: mission?.type || 'mini_quiz',
    points_reward: mission?.points_reward || 10,
    position: mission?.position || 1,
    content: mission?.content || {},
    requirements: mission?.requirements || []
  });
  const [loading, setLoading] = useState(false);

  // Plantillas predefinidas para cada tipo de misión
  const missionTemplates = {
    'mini_quiz': {
      title: 'Quiz: Fundamentos de [Tema]',
      description: 'Responde preguntas básicas sobre [tema específico]',
      points_reward: 30,
      content: {
        questions: [
          {
            question: "¿Cuál es el concepto principal de [tema]?",
            options: ["Opción A", "Opción B", "Opción C", "Opción D"],
            correct_answer: 0
          },
          {
            question: "¿Qué beneficios tiene [tema]?",
            options: ["Beneficio 1", "Beneficio 2", "Beneficio 3", "Beneficio 4"],
            correct_answer: 1
          }
        ]
      }
    },
    'microvideo': {
      title: 'Video: Tu experiencia con [Tema]',
      description: 'Graba un video corto sobre tu experiencia con [tema específico]',
      points_reward: 50,
      content: {
        instructions: "Graba un video de máximo 60 segundos explicando tu experiencia",
        max_duration: 60,
        topics: [
          "Tu experiencia personal",
          "Lecciones aprendidas",
          "Consejos para otros emprendedores",
          "Resultados obtenidos"
        ]
      }
    },
    'downloadable_guide': {
      title: 'Guía: [Tema] para Emprendedores',
      description: 'Descarga y revisa la guía completa sobre [tema específico]',
      points_reward: 40,
      content: {
        guide_url: "https://example.com/guia-[tema].pdf",
        topics: [
          "Conceptos básicos",
          "Pasos a seguir",
          "Herramientas necesarias",
          "Casos de éxito"
        ],
        completion_requirement: "Confirmar lectura completa y responder pregunta de verificación"
      }
    },
    'practical_task': {
      title: 'Tarea: Desarrolla tu [Tema]',
      description: 'Crea y desarrolla tu propio [tema específico] siguiendo la plantilla',
      points_reward: 80,
      content: {
        template_sections: [
          "Objetivo principal",
          "Análisis de la situación",
          "Plan de acción",
          "Cronograma",
          "Recursos necesarios",
          "Métricas de éxito"
        ],
        deadline_hours: 48,
        requirements: [
          "Completar todas las secciones",
          "Subir archivo en formato PDF",
          "Incluir evidencias o ejemplos"
        ]
      }
    },
    'expert_advice': {
      title: 'Consejo Experto: [Tema] por [Nombre Experto]',
      description: 'Aprende de la experiencia de expertos en [tema específico]',
      points_reward: 35,
      content: {
        expert_name: "Nombre del Experto",
        expert_title: "Título/Posición del Experto",
        video_url: "https://example.com/video-[tema].mp4",
        key_points: [
          "Punto clave 1",
          "Punto clave 2",
          "Punto clave 3",
          "Punto clave 4"
        ],
        resources: [
          "Recurso adicional 1",
          "Recurso adicional 2"
        ]
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mission) {
        await axios.put(`${API}/missions/${mission.id}`, formData);
      } else {
        await axios.post(`${API}/missions`, formData);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving mission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (newType) => {
    const template = missionTemplates[newType];
    if (template && !mission) { // Solo aplicar plantilla si es una misión nueva
      setFormData(prev => ({
        ...prev,
        type: newType,
        title: template.title,
        description: template.description,
        points_reward: template.points_reward,
        content: template.content
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        type: newType
      }));
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContentChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {mission ? 'Editar Misión' : 'Nueva Misión'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {!mission && (
            <p className="text-sm text-gray-600 mt-2">
              💡 Selecciona un tipo de misión y se aplicará automáticamente una plantilla que puedes personalizar
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Misión
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="mini_quiz">📝 Mini Quiz</option>
                <option value="microvideo">🎥 Microvideo</option>
                <option value="downloadable_guide">📚 Guía Descargable</option>
                <option value="practical_task">💼 Tarea Práctica</option>
                <option value="expert_advice">🎓 Consejo Experto</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              rows="3"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puntos de Recompensa
              </label>
              <input
                type="number"
                value={formData.points_reward}
                onChange={(e) => handleChange('points_reward', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posición en el Camino
              </label>
              <input
                type="number"
                value={formData.position}
                onChange={(e) => handleChange('position', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                min="1"
                required
              />
            </div>
          </div>

          {/* Contenido específico según el tipo */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Contenido Específico - {formData.type.replace('_', ' ').toUpperCase()}
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configuración de Contenido (JSON)
              </label>
              <textarea
                value={JSON.stringify(formData.content, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleChange('content', parsed);
                  } catch (error) {
                    // Ignore invalid JSON while typing
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
                rows="10"
                placeholder="Configuración en formato JSON..."
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Edita el contenido JSON según el tipo de misión. La plantilla se aplicó automáticamente.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <LoadingSpinner /> : (mission ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Achievement Modal Component for Admin
const AchievementModal = ({ achievement, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: achievement?.title || '',
    description: achievement?.description || '',
    icon: achievement?.icon || '🏆',
    condition: achievement?.condition || 'complete_missions',
    points_required: achievement?.points_required || 0,
    missions_required: achievement?.missions_required || 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (achievement) {
        await axios.put(`${API}/achievements/${achievement.id}`, formData);
      } else {
        await axios.post(`${API}/achievements`, formData);
      }
      await onSave();
      onClose();
    } catch (error) {
      console.error('Error saving achievement:', error);
      alert('Error al guardar el logro. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {achievement ? 'Editar Logro' : 'Crear Nuevo Logro'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icono
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="🏆"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condición
            </label>
            <select
              value={formData.condition}
              onChange={(e) => handleChange('condition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="complete_missions">Completar misiones</option>
              <option value="reach_points">Alcanzar puntos</option>
              <option value="complete_1_mission">Completar 1 misión</option>
              <option value="complete_5_missions">Completar 5 misiones</option>
              <option value="complete_10_missions">Completar 10 misiones</option>
              <option value="reach_100_points">Alcanzar 100 puntos</option>
              <option value="reach_500_points">Alcanzar 500 puntos</option>
              <option value="reach_1000_points">Alcanzar 1000 puntos</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puntos Requeridos
              </label>
              <input
                type="number"
                value={formData.points_required}
                onChange={(e) => handleChange('points_required', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Misiones Requeridas
              </label>
              <input
                type="number"
                value={formData.missions_required}
                onChange={(e) => handleChange('missions_required', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-md hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner /> : (achievement ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Mission Completion Modal (same as before but updated)
const MissionCompletionModal = ({ mission, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [videoFile, setVideoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuizAnswer = (questionIndex, answerIndex) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      let completionData = {};
      
      if (mission.type === 'mini_quiz') {
        completionData = { answers: quizAnswers };
      } else if (mission.type === 'microvideo') {
        completionData = { video_submitted: true };
      } else {
        completionData = { completed: true };
      }
      
      await onComplete(mission.id, completionData);
      onClose();
    } catch (error) {
      console.error('Error completing mission:', error);
      alert('Error al completar la misión. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMissionContent = () => {
    switch (mission.type) {
      case 'mini_quiz':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Responde las siguientes preguntas:</h3>
            {mission.content.questions?.map((question, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">{question.question}</h4>
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <label key={oIndex} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        value={oIndex}
                        onChange={() => handleQuizAnswer(qIndex, oIndex)}
                        className="w-4 h-4 text-cyan-600"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
        
      case 'microvideo':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Graba tu microvideo</h3>
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <h4 className="font-medium text-cyan-800 mb-2">Instrucciones:</h4>
              <p className="text-cyan-700 mb-4">{mission.content.instructions}</p>
              <div>
                <h5 className="font-medium text-cyan-800 mb-2">Temas a cubrir:</h5>
                <ul className="list-disc list-inside text-cyan-700">
                  {mission.content.topics?.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files[0])}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                <div className="text-6xl mb-4">🎥</div>
                <p className="text-gray-600">Haz clic aquí para subir tu video</p>
                <p className="text-sm text-gray-500 mt-2">Máximo {mission.content.max_duration} segundos</p>
              </label>
              {videoFile && (
                <p className="text-green-600 mt-4">✅ Video seleccionado: {videoFile.name}</p>
              )}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">¡Misión Especial!</h3>
            <p className="text-gray-600">Completa esta misión para ganar {mission.points_reward} puntos.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">{mission.title}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">{mission.description}</p>
        </div>
        
        <div className="p-6">
          {renderMissionContent()}
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? <LoadingSpinner /> : 'Completar Misión'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Profile Section Component
const ProfileSection = ({ user }) => {
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }

    setUploading(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target.result;
        
        // Upload to server
        await axios.put(`${API}/users/${user.id}/profile-picture`, {
          profile_picture: base64Image
        });
        
        // Refresh page to update user data
        window.location.reload();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Error al subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const ProfilePictureModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Cambiar Foto de Perfil</h3>
          <button
            onClick={() => setShowProfilePictureModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600">
              {user?.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                  {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar nueva imagen
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50"
            />
            <p className="text-sm text-gray-500 mt-1">
              Máximo 5MB. Formatos: JPG, PNG, GIF
            </p>
          </div>
          
          {uploading && (
            <div className="flex items-center justify-center">
              <LoadingSpinner />
              <span className="ml-2 text-sm text-gray-600">Subiendo imagen...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800">Mi Perfil</h3>
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600">
              {user?.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                  {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowProfilePictureModal(true)}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center hover:bg-cyan-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-800">{user?.nombre} {user?.apellido}</h4>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-gray-600">C.I: {user?.cedula}</p>
            <p className="text-cyan-600 font-medium">{user?.rank?.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-800">{user?.points || 0}</div>
            <div className="text-sm text-gray-600">Puntos Totales</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-800">{user?.completed_missions?.length || 0}</div>
            <div className="text-sm text-gray-600">Misiones Completadas</div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h5 className="font-bold text-gray-800 mb-2">Información del Emprendimiento</h5>
          <p className="text-gray-600 mb-4">{user?.nombre_emprendimiento}</p>
          
          <h5 className="font-bold text-gray-800 mb-2">Fecha de Registro</h5>
          <p className="text-gray-600">{user?.created_at ? new Date(user.created_at).toLocaleDateString('es-EC') : 'N/A'}</p>
        </div>
      </div>
      
      {showProfilePictureModal && <ProfilePictureModal />}
    </div>
  );
};

// Main App Component
function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [showAppLoading, setShowAppLoading] = useState(true);
  const { user, loading } = useAuth();

  const handleAppLoadingComplete = () => {
    setShowAppLoading(false);
  };

  if (showAppLoading) {
    return <AppLoadingAnimation onComplete={handleAppLoadingComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-2xl text-white mb-4 animate-pulse">
            IG
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Impulsa Guayaquil</h2>
          <p className="text-gray-600">Cargando...</p>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!user) {
    return showRegister ? (
      <RegisterForm onToggleLogin={() => setShowRegister(false)} />
    ) : (
      <LoginForm onToggleRegister={() => setShowRegister(true)} />
    );
  }

  // Admin Panel
  if (user.role === 'admin') {
    return <AdminPanel />;
  }

  // Regular User App
  return <UserApp />;
}

// User App Component
const UserApp = () => {
  const [currentTab, setCurrentTab] = useState('inicio');
  const [missions, setMissions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState(null);
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive' or 'list'
  const { user, logout } = useAuth();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      await loadData();
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [eligibleAchievementsRes, rewardsRes, eventsRes] = await Promise.all([
        axios.get(`${API}/achievements/eligible`),
        axios.get(`${API}/rewards`),
        axios.get(`${API}/events`)
      ]);
      
      setAchievements(eligibleAchievementsRes.data);
      setRewards(rewardsRes.data);
      setEvents(eventsRes.data);
      
      await loadMissions();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadMissions = async () => {
    if (!user) return;
    
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

  const handleCompleteMission = async (missionId, completionData) => {
    try {
      await axios.post(`${API}/missions/complete`, {
        mission_id: missionId,
        completion_data: completionData
      });
      
      await loadMissions();
      
      // Refresh user data
      window.location.reload();
      
    } catch (error) {
      console.error('Error completing mission:', error);
      throw error;
    }
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'inicio':
        return (
          <div className="space-y-6">
            {/* User Stats */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl overflow-hidden">
                    {user?.profile_picture ? (
                      <img 
                        src={user.profile_picture} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                        {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{user?.nombre} {user?.apellido}</h2>
                    <p className="text-cyan-100">{user?.rank?.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-cyan-100 text-sm">{user?.nombre_emprendimiento}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-white"
                >
                  Cerrar Sesión
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-2xl font-bold">{user?.points || 0}</div>
                  <div className="text-sm text-cyan-100">Puntos</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-2xl font-bold">{user?.completed_missions?.length || 0}</div>
                  <div className="text-sm text-cyan-100">Misiones</div>
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-800">Tu Camino Emprendedor</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('interactive')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewMode === 'interactive'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Vista Interactiva
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewMode === 'list'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Vista Lista
                </button>
              </div>
            </div>

            {/* Mission Path */}
            {viewMode === 'interactive' ? (
              <InteractiveMissionPath missions={missions} onStart={handleStartMission} />
            ) : (
              <div className="space-y-4">
                {missions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    onStart={handleStartMission}
                  />
                ))}
              </div>
            )}
          </div>
        );
        
      case 'logros':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Tus Logros</h3>
            <div className="grid gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-800">{achievement.title}</h4>
                      <p className="text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'recompensas':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Recompensas</h3>
            <div className="grid gap-4">
              {rewards.map((reward) => (
                <div key={reward.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800">{reward.title}</h4>
                      <p className="text-gray-600">{reward.description}</p>
                      <div className="mt-2 flex items-center space-x-1">
                        <StarIcon />
                        <span className="text-sm text-gray-700">{reward.points_cost} puntos</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (user?.points >= reward.points_cost) {
                          if (reward.external_url) {
                            window.open(reward.external_url, '_blank');
                          } else {
                            alert('Este premio no tiene enlace de canje configurado');
                          }
                        } else {
                          alert(`Necesitas ${reward.points_cost - (user?.points || 0)} puntos más para canjear esta recompensa`);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        user?.points >= reward.points_cost
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={user?.points < reward.points_cost}
                    >
                      Canjear
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'eventos':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Próximos Eventos</h3>
            <div className="grid gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-2">{event.title}</h4>
                  <p className="text-gray-600 mb-4">{event.description}</p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div>📍 {event.location}</div>
                    <div>📅 {new Date(event.date).toLocaleDateString('es-EC')}</div>
                    <div>👥 Organizado por {event.organizer}</div>
                  </div>
                  <button 
                    onClick={() => {
                      if (event.registration_url) {
                        window.open(event.registration_url, '_blank');
                      } else {
                        alert('Este evento no tiene enlace de registro configurado');
                      }
                    }}
                    className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-700"
                  >
                    Registrarse
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'mission-detail':
        return selectedMission ? (
          <MissionDetailView 
            mission={selectedMission} 
            onBack={() => setCurrentTab('inicio')}
            onComplete={handleCompleteMission}
          />
        ) : (
          <div>Misión no encontrada</div>
        );
        
      case 'perfil':
        return (
          <ProfileSection user={user} />
        );
        
      default:
        return <div>Contenido no encontrado</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-2xl text-white mb-4 animate-pulse">
            IG
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Impulsa Guayaquil</h2>
          <p className="text-gray-600">Cargando tu camino emprendedor...</p>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                IG
              </div>
              <h1 className="text-xl font-bold text-gray-800">Impulsa Guayaquil</h1>
            </div>
            <div className="flex items-center space-x-1">
              <StarIcon />
              <span className="font-medium text-gray-700">{user?.points || 0}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 pb-20">
        {renderTabContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="flex">
            {[
              { id: 'inicio', label: 'Inicio', icon: HomeIcon },
              { id: 'logros', label: 'Logros', icon: AchievementIcon },
              { id: 'recompensas', label: 'Recompensas', icon: RewardIcon },
              { id: 'eventos', label: 'Eventos', icon: EventIcon },
              { id: 'perfil', label: 'Perfil', icon: ProfileIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex-1 py-3 px-2 flex flex-col items-center space-y-1 ${
                  currentTab === tab.id 
                    ? 'text-cyan-600 bg-cyan-50' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <tab.icon />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Mission Modal */}
      {selectedMission && (
        <MissionCompletionModal
          mission={selectedMission}
          onClose={() => setSelectedMission(null)}
          onComplete={handleCompleteMission}
        />
      )}
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