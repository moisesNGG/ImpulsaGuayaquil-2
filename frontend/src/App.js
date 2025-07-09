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

  const value = {
    user,
    token,
    login,
    register,
    logout,
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

// Mission Detail View Component
const MissionDetailView = ({ mission, onBack, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showVideo, setShowVideo] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(mission.id, { 
        completion_time: new Date().toISOString(),
        quiz_answers: quizAnswers 
      });
    } catch (error) {
      console.error('Error completing mission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswer = (questionIndex, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const renderMissionContent = () => {
    switch (mission.type) {
      case 'microvideo':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-bold text-yellow-800 mb-2">📹 Instrucciones para el Video</h4>
              <p className="text-yellow-700">{mission.content?.instructions || 'Graba tu video siguiendo las instrucciones'}</p>
              {mission.content?.max_duration && (
                <p className="text-sm text-yellow-600 mt-2">⏱️ Duración máxima: {mission.content.max_duration} segundos</p>
              )}
            </div>
            
            {mission.content?.topics && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-800 mb-2">📝 Temas a cubrir:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  {mission.content.topics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-2">📱 Subir Video</h4>
              <input 
                type="file" 
                accept="video/*" 
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-2">Sube tu video aquí una vez que lo hayas grabado</p>
            </div>
          </div>
        );

      case 'downloadable_guide':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-bold text-green-800 mb-2">📚 Guía Descargable</h4>
              <p className="text-green-700 mb-4">Descarga y revisa la guía completa sobre {mission.title}</p>
              
              <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 flex items-center space-x-2">
                <DownloadIcon />
                <span>Descargar Guía PDF</span>
              </button>
            </div>
            
            {mission.content?.topics && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-800 mb-2">📖 Temas incluidos:</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  {mission.content.topics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-2">✅ Confirmación de Lectura</h4>
              <p className="text-gray-600 mb-3">{mission.content?.completion_requirement || 'Confirma que has leído la guía completa'}</p>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm text-gray-700">He leído y comprendido la guía completa</span>
              </label>
            </div>
          </div>
        );

      case 'mini_quiz':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-bold text-purple-800 mb-2">🧠 Mini Quiz</h4>
              <p className="text-purple-700">Responde las siguientes preguntas para completar esta misión</p>
            </div>
            
            {mission.content?.questions && mission.content.questions.map((question, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-3">{index + 1}. {question.question}</h4>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`question-${index}`}
                        value={optionIndex}
                        onChange={(e) => handleQuizAnswer(index, parseInt(e.target.value))}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'expert_advice':
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-bold text-indigo-800 mb-2">🎓 Consejo de Experto</h4>
              <p className="text-indigo-700">Aprende de la experiencia de nuestros expertos</p>
            </div>
            
            {mission.content?.expert_name && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">👨‍💼 {mission.content.expert_name}</h4>
                <p className="text-gray-600 mb-3">{mission.content.expert_title}</p>
                
                {mission.content?.video_url && (
                  <div className="mb-4">
                    <button 
                      onClick={() => setShowVideo(!showVideo)}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-medium hover:from-red-600 hover:to-red-700 flex items-center space-x-2"
                    >
                      <PlayIcon />
                      <span>{showVideo ? 'Ocultar Video' : 'Ver Video'}</span>
                    </button>
                    
                    {showVideo && (
                      <div className="mt-4 bg-black rounded-lg p-4">
                        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                          <div className="text-white text-center">
                            <PlayIcon />
                            <p className="mt-2">Video: {mission.content.expert_name}</p>
                            <p className="text-sm text-gray-300">URL: {mission.content.video_url}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {mission.content?.key_points && (
                  <div>
                    <h5 className="font-bold text-gray-800 mb-2">💡 Puntos Clave:</h5>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {mission.content.key_points.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'practical_task':
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-bold text-orange-800 mb-2">📝 Tarea Práctica</h4>
              <p className="text-orange-700">Completa esta tarea práctica para aplicar lo aprendido</p>
            </div>
            
            {mission.content?.template_sections && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">📋 Secciones del Template:</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                  {mission.content.template_sections.map((section, index) => (
                    <li key={index}>{section}</li>
                  ))}
                </ul>
                
                <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 flex items-center space-x-2">
                  <DownloadIcon />
                  <span>Descargar Template</span>
                </button>
              </div>
            )}
            
            {mission.content?.deadline_hours && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-bold text-red-800 mb-2">⏰ Tiempo Límite</h4>
                <p className="text-red-700">{mission.content.deadline_hours} horas para completar</p>
              </div>
            )}
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-2">📤 Subir Tarea</h4>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx" 
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-2">Sube tu tarea completada aquí</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2">📄 Contenido de la Misión</h4>
            <p className="text-gray-700">Contenido específico de la misión disponible aquí</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <BackIcon />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">{mission.title}</h2>
          <p className="text-gray-600">{mission.description}</p>
        </div>
        <div className="flex items-center space-x-1">
          <StarIcon />
          <span className="font-medium text-gray-700">{mission.points_reward}</span>
        </div>
      </div>

      {/* Mission Content */}
      <div className="space-y-4">
        {renderMissionContent()}
      </div>

      {/* Complete Button */}
      <div className="sticky bottom-0 bg-gradient-to-b from-cyan-50 to-blue-50 p-4 -mx-4 rounded-t-2xl">
        <button
          onClick={handleComplete}
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {loading ? <LoadingSpinner /> : (
            <>
              <CheckIcon />
              <span>Completar Misión</span>
            </>
          )}
        </button>
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {mission ? 'Editar Misión' : 'Nueva Misión'}
          </h2>
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
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="mini_quiz">Mini Quiz</option>
                <option value="microvideo">Microvideo</option>
                <option value="downloadable_guide">Guía Descargable</option>
                <option value="practical_task">Tarea Práctica</option>
                <option value="expert_advice">Consejo Experto</option>
                <option value="hidden_reward">Recompensa Oculta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                onChange={(e) => setFormData({...formData, points_reward: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posición
              </label>
              <input
                type="number"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido (JSON)
            </label>
            <textarea
              value={JSON.stringify(formData.content, null, 2)}
              onChange={(e) => {
                try {
                  const content = JSON.parse(e.target.value);
                  setFormData({...formData, content});
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
              placeholder='{"instructions": "Completa esta tarea..."}'
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner /> : (mission ? 'Actualizar' : 'Crear')}
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

// Main App Component
function App() {
  const [showRegister, setShowRegister] = useState(false);
  const { user, loading } = useAuth();

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
      const [achievementsRes, rewardsRes, eventsRes] = await Promise.all([
        axios.get(`${API}/achievements`),
        axios.get(`${API}/rewards`),
        axios.get(`${API}/events`)
      ]);
      
      setAchievements(achievementsRes.data);
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
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                    👤
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
                    <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-700">
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
                  <button className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-700">
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
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Mi Perfil</h3>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-4xl text-white">
                  {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
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
          </div>
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