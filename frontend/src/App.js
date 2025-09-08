import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
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

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="loading-dots">
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
    </div>
  </div>
);

// Points Animation Component
const PointsAnimation = ({ points, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="points-explosion">
      <div className="points-animation">
        +{points} ⭐
      </div>
    </div>
  );
};

// Login Component (Duolingo Style)
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
    <div className="auth-screen">
      <div className="auth-logo">🚀</div>
      <h1 className="auth-title">Impulsa Guayaquil</h1>
      <p className="auth-subtitle">Emprendimiento Gamificado</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label">Cédula</label>
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="form-input"
            placeholder="1234567890"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="Tu contraseña"
            required
          />
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? <LoadingSpinner /> : 'Iniciar Sesión'}
        </button>

        <div className="auth-toggle">
          <p>
            ¿No tienes cuenta?{' '}
            <button type="button" onClick={onToggleRegister}>
              Regístrate
            </button>
          </p>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--gray)' }}>
          <p>Demo Admin: 0000000000 / admin</p>
        </div>
      </form>
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
    password: '',
    ciudad: 'Guayaquil',
    cohorte: ''
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
      <div className="auth-screen">
        <div className="auth-logo">🎉</div>
        <h2 className="auth-title">¡Registro Exitoso!</h2>
        <p className="auth-subtitle">
          Tu cuenta ha sido creada correctamente. Redirigiendo al login...
        </p>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">🚀</div>
      <h1 className="auth-title">Crear Cuenta</h1>
      <p className="auth-subtitle">Únete a la comunidad emprendedora</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Apellido</label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Cédula</label>
          <input
            type="text"
            name="cedula"
            value={formData.cedula}
            onChange={handleChange}
            className="form-input"
            placeholder="1234567890"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nombre del Emprendimiento</label>
          <input
            type="text"
            name="nombre_emprendimiento"
            value={formData.nombre_emprendimiento}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Ciudad</label>
          <select
            name="ciudad"
            value={formData.ciudad}
            onChange={handleChange}
            className="form-select"
          >
            <option value="Guayaquil">Guayaquil</option>
            <option value="Quito">Quito</option>
            <option value="Cuenca">Cuenca</option>
            <option value="Machala">Machala</option>
            <option value="Manta">Manta</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? <LoadingSpinner /> : 'Crear Cuenta'}
        </button>

        <div className="auth-toggle">
          <p>
            ¿Ya tienes cuenta?{' '}
            <button type="button" onClick={onToggleLogin}>
              Inicia Sesión
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

// Top Header Component
const TopHeader = ({ user }) => {
  return (
    <div className="top-header">
      <div className="header-content">
        <div className="logo-section">
          <div className="app-logo">🚀</div>
          <div className="app-title">Impulsa GYE</div>
        </div>
        <div className="user-stats">
          <div className="stat-item coins">
            <span>🪙</span>
            <span>{user?.coins || 0}</span>
          </div>
          <div className="stat-item points">
            <span>⭐</span>
            <span>{user?.points || 0}</span>
          </div>
          <div className="stat-item streak">
            <span>🔥</span>
            <span>{user?.current_streak || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bottom Navigation Component
const BottomNavigation = ({ currentTab, onTabChange, user }) => {
  const navItems = [
    { id: 'home', icon: '🏠', label: 'Inicio', className: 'nav-home' },
    { id: 'missions', icon: '🎯', label: 'Misiones', className: 'nav-missions' },
    { id: 'events', icon: '🎫', label: 'Eventos', className: 'nav-events' },
    { id: 'rewards', icon: '🎁', label: 'Premios', className: 'nav-rewards' },
    { id: 'profile', icon: '👤', label: 'Perfil', className: 'nav-profile' }
  ];

  return (
    <div className="bottom-nav">
      <div className="nav-container">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${item.className} ${currentTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <div className="nav-icon">{item.icon}</div>
            <div className="nav-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mission utility functions
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

// Mission Path Component (Duolingo Style)
const MissionPath = ({ user, onRefreshUser }) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState(null);

  useEffect(() => {
    loadMissions();
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

  const handleMissionClick = (mission) => {
    if (mission.status === 'AVAILABLE') {
      setSelectedMission(mission);
    }
  };

  if (selectedMission) {
    return (
      <MissionDetail
        mission={selectedMission}
        onBack={() => setSelectedMission(null)}
        onRefreshUser={onRefreshUser}
      />
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mission-path">
      <div className="path-container">
        {missions.map((mission, index) => (
          <div key={mission.id} className="mission-node">
            {index > 0 && (
              <div className={`path-line ${
                mission.status === 'COMPLETED' ? 'completed' : 
                mission.status === 'LOCKED' ? 'locked' : ''
              }`} />
            )}
            <div
              className={`mission-circle ${
                mission.status === 'AVAILABLE' ? `mission-available competence-${mission.competence_area}` :
                mission.status === 'COMPLETED' ? 'mission-completed' :
                mission.status === 'IN_REVIEW' ? 'mission-in-review' :
                'mission-locked'
              }`}
              onClick={() => handleMissionClick(mission)}
              style={{ cursor: mission.status === 'AVAILABLE' ? 'pointer' : 'default' }}
            >
              {getMissionIcon(mission.type)}
            </div>
            <div className="mission-info">
              <div className="mission-title">
                {mission.title.length > 20 ? mission.title.substring(0, 20) + '...' : mission.title}
              </div>
              <div className="mission-points">
                ⭐ {mission.points_reward} {mission.coins_reward > 0 && `🪙 ${mission.coins_reward}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mission Detail Component
const MissionDetail = ({ mission, onBack, onRefreshUser }) => {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const questions = mission.content?.questions || [];
  const isQuiz = mission.type === 'mini_quiz' && questions.length > 0;

  const handleAnswerSelect = (answerIndex) => {
    if (showFeedback) return;

    const correct = answerIndex === questions[currentQuestion].correct;
    setQuizAnswers(prev => ({ ...prev, [currentQuestion]: answerIndex }));
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const handleContinue = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowFeedback(false);
    } else {
      // Complete quiz
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      const completionData = {
        mission_id: mission.id,
        completion_data: {
          answers: quizAnswers
        }
      };
      
      const response = await axios.post(`/missions/${mission.id}/complete`, completionData);
      
      if (response.data.success) {
        setPointsEarned(response.data.points_awarded + response.data.coins_awarded);
        setShowPointsAnimation(true);
        
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

  if (showPointsAnimation) {
    return (
      <PointsAnimation
        points={pointsEarned}
        onComplete={handlePointsAnimationComplete}
      />
    );
  }

  if (!isQuiz) {
    // Non-quiz mission
    return (
      <div className="screen">
        <div className="card">
          <div className="card-header">
            <button onClick={onBack} className="btn btn-gray">← Volver</button>
          </div>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {getMissionIcon(mission.type)}
            </div>
            <h2 className="card-title">{mission.title}</h2>
            <p className="card-content" style={{ margin: '1rem 0' }}>
              {mission.description}
            </p>
            <div style={{ marginTop: '2rem' }}>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="btn btn-green"
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
              >
                {loading ? <LoadingSpinner /> : 'Completar Misión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz mission
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="quiz-screen">
      <div className="quiz-header">
        <div className="quiz-progress">
          <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <button onClick={onBack} className="btn btn-gray" style={{ alignSelf: 'flex-start' }}>
          ← Volver
        </button>
      </div>

      <div className="quiz-question">
        {question.question}
      </div>

      <div className="quiz-options">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={`quiz-option ${
              quizAnswers[currentQuestion] === index ? 'selected' : ''
            } ${
              showFeedback && index === question.correct ? 'correct' :
              showFeedback && quizAnswers[currentQuestion] === index && index !== question.correct ? 'incorrect' :
              ''
            }`}
            onClick={() => handleAnswerSelect(index)}
            disabled={showFeedback}
          >
            {option}
          </button>
        ))}
      </div>

      {showFeedback && (
        <div className={`quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? '¡Excelente! 🎉' : 'No es correcto 😅'}
        </div>
      )}

      <button
        className="quiz-continue"
        onClick={handleContinue}
        disabled={!showFeedback || loading}
      >
        {loading ? <LoadingSpinner /> : 'CONTINUAR'}
      </button>
    </div>
  );
};

// Other Screens (simplified for mobile)
const EventsScreen = ({ user }) => {
  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">🎫 Eventos</h1>
        <p className="screen-subtitle">Próximas oportunidades</p>
      </div>
      <div className="empty-state">
        <div className="empty-icon">📅</div>
        <div className="empty-title">No hay eventos próximos</div>
        <div className="empty-description">
          Mantente atento, pronto habrá nuevas oportunidades.
        </div>
      </div>
    </div>
  );
};

const RewardsScreen = ({ user }) => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const response = await axios.get('/rewards?available_only=true');
      setRewards(response.data);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAfford = (reward) => {
    return user.coins >= reward.coins_cost;
  };

  const handleRedeem = async (reward) => {
    if (!canAfford(reward)) return;

    try {
      const response = await axios.post(`/rewards/${reward.id}/redeem`);
      
      if (response.data.success) {
        alert(`¡Recompensa canjeada!\n\nCódigo: ${response.data.redemption_code}`);
        loadRewards();
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('Error al canjear recompensa');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">🎁 Recompensas</h1>
        <p className="screen-subtitle">Canjea tus monedas</p>
      </div>

      {rewards.map((reward) => {
        const affordable = canAfford(reward);
        
        return (
          <div key={reward.id} className="card">
            <div className="card-header">
              <h3 className="card-title">{reward.title}</h3>
              <div className="stat-item coins">
                <span>🪙</span>
                <span>{reward.coins_cost}</span>
              </div>
            </div>
            <div className="card-content">
              <p>{reward.description}</p>
              <p><strong>Valor:</strong> {reward.value}</p>
              {reward.partner_company && (
                <p><strong>Socio:</strong> {reward.partner_company}</p>
              )}
            </div>
            <button
              onClick={() => handleRedeem(reward)}
              disabled={!affordable}
              className={`btn ${affordable ? 'btn-green' : 'btn-gray'}`}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {affordable ? 'Canjear' : `Necesitas ${reward.coins_cost - user.coins} monedas más`}
            </button>
          </div>
        );
      })}
    </div>
  );
};

const ProfileScreen = ({ user }) => {
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <div className="screen">
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <div className="profile-name">{user.nombre} {user.apellido}</div>
        <div className="profile-business">{user.nombre_emprendimiento}</div>
        <div className="profile-stats">
          <div className="stat-block">
            <div className="stat-value">{user.points}</div>
            <div className="stat-label">Puntos</div>
          </div>
          <div className="stat-block">
            <div className="stat-value">{user.coins}</div>
            <div className="stat-label">Monedas</div>
          </div>
          <div className="stat-block">
            <div className="stat-value">{user.current_streak}</div>
            <div className="stat-label">Racha</div>
          </div>
          <div className="stat-block">
            <div className="stat-value">{user.completed_missions.length}</div>
            <div className="stat-label">Misiones</div>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button className="profile-action">
          <span>📊</span>
          <span>Mis Estadísticas</span>
        </button>
        <button className="profile-action">
          <span>🏆</span>
          <span>Mis Logros</span>
        </button>
        <button className="profile-action">
          <span>📋</span>
          <span>Mis Documentos</span>
        </button>
        <button className="profile-action">
          <span>⚙️</span>
          <span>Configuración</span>
        </button>
        <button 
          className="profile-action danger"
          onClick={() => setShowLogoutModal(true)}
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Cerrar Sesión</h3>
              <button 
                className="modal-close"
                onClick={() => setShowLogoutModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <p>¿Estás seguro que deseas cerrar sesión?</p>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-gray"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-pink"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [currentTab, setCurrentTab] = useState('missions');

  return (
    <AuthProvider>
      <div className="app">
        <AuthConsumer 
          isLogin={isLogin}
          setIsLogin={setIsLogin}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      </div>
    </AuthProvider>
  );
};

const AuthConsumer = ({ isLogin, setIsLogin, currentTab, setCurrentTab }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return isLogin ? (
      <LoginForm onToggleRegister={() => setIsLogin(false)} />
    ) : (
      <RegisterForm onToggleLogin={() => setIsLogin(true)} />
    );
  }

  const onRefreshUser = async () => {
    window.location.reload();
  };

  const renderCurrentScreen = () => {
    switch (currentTab) {
      case 'home':
      case 'missions':
        return <MissionPath user={user} onRefreshUser={onRefreshUser} />;
      case 'events':
        return <EventsScreen user={user} />;
      case 'rewards':
        return <RewardsScreen user={user} />;
      case 'profile':
        return <ProfileScreen user={user} />;
      default:
        return <MissionPath user={user} onRefreshUser={onRefreshUser} />;
    }
  };

  return (
    <div className="mobile-container">
      <TopHeader user={user} />
      {renderCurrentScreen()}
      <BottomNavigation 
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        user={user}
      />
    </div>
  );
};

export default App;