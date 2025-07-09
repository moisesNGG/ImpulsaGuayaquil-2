import React, { useState, useEffect } from 'react';
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Icons as React components
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

const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
  </div>
);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-400';
      case 'available':
        return 'bg-white border-cyan-400';
      case 'locked':
        return 'bg-gray-100 border-gray-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'available':
        return 'Disponible';
      case 'locked':
        return 'Bloqueada';
      default:
        return 'Desconocida';
    }
  };

  return (
    <div className={`mission-card ${getStatusColor(mission.status)} border-2 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-2xl">
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
                {getStatusText(mission.status)}
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
            
            {mission.status === 'completed' && (
              <div className="text-green-600 font-medium">✅ Completada</div>
            )}
            
            {mission.status === 'locked' && (
              <div className="text-gray-400 font-medium">🔒 Bloqueada</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MissionModal = ({ mission, onClose, onComplete }) => {
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
      // Simulate completion based on mission type
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
        
      case 'downloadable_guide':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Descarga y revisa la guía</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-medium text-blue-800 mb-4">Temas incluidos en la guía:</h4>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                {mission.content.topics?.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                📥 Descargar Guía
              </button>
            </div>
            <div className="border rounded-lg p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-cyan-600" />
                <span className="text-gray-700">He leído y revisado completamente la guía</span>
              </label>
            </div>
          </div>
        );
        
      case 'practical_task':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Completa tu plan de negocio</h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h4 className="font-medium text-purple-800 mb-4">Secciones requeridas:</h4>
              <ul className="list-disc list-inside text-purple-700 space-y-1">
                {mission.content.template_sections?.map((section, index) => (
                  <li key={index}>{section}</li>
                ))}
              </ul>
              <p className="text-purple-600 mt-4">
                ⏰ Tiempo sugerido: {mission.content.deadline_hours} horas
              </p>
            </div>
            <textarea
              className="w-full h-32 border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Escribe tu plan de negocio aquí..."
            />
          </div>
        );
        
      case 'expert_advice':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Consejo del Experto</h3>
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-2xl">
                  👨‍💼
                </div>
                <div>
                  <h4 className="font-bold text-orange-800">{mission.content.expert_name}</h4>
                  <p className="text-orange-600">{mission.content.expert_title}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  <PlayIcon />
                  <span className="ml-2 text-gray-600">Reproducir video</span>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-orange-800 mb-2">Puntos clave:</h5>
                <ul className="list-disc list-inside text-orange-700">
                  {mission.content.key_points?.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-cyan-600" />
                <span className="text-gray-700">He visto el video completo y tomado notas</span>
              </label>
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

function App() {
  const [currentTab, setCurrentTab] = useState('inicio');
  const [user, setUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      
      // Initialize sample data
      await axios.post(`${API}/initialize-data`);
      
      // Create or get user
      const userData = {
        name: "Emprendedor Guayaquileño",
        email: "emprendedor@impulsa.guayaquil.ec"
      };
      
      try {
        const userResponse = await axios.post(`${API}/users`, userData);
        setUser(userResponse.data);
      } catch (error) {
        // If user already exists, get the first user
        const usersResponse = await axios.get(`${API}/users`);
        if (usersResponse.data.length > 0) {
          setUser(usersResponse.data[0]);
        }
      }
      
      // Load initial data
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

  useEffect(() => {
    if (user) {
      loadMissions();
    }
  }, [user]);

  const handleStartMission = (mission) => {
    setSelectedMission(mission);
  };

  const handleCompleteMission = async (missionId, completionData) => {
    try {
      await axios.post(`${API}/missions/complete`, {
        mission_id: missionId,
        user_id: user.id,
        completion_data: completionData
      });
      
      // Refresh user data and missions
      const userResponse = await axios.get(`${API}/users/${user.id}`);
      setUser(userResponse.data);
      await loadMissions();
      
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
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user?.name}</h2>
                  <p className="text-cyan-100">{user?.rank?.replace('_', ' ').toUpperCase()}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
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

            {/* Mission Path */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Tu Camino Emprendedor</h3>
              <div className="space-y-4">
                {missions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    onStart={handleStartMission}
                  />
                ))}
              </div>
            </div>
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
        
      case 'perfil':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Mi Perfil</h3>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-4xl text-white">
                  👤
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800">{user?.name}</h4>
                  <p className="text-gray-600">{user?.email}</p>
                  <p className="text-cyan-600 font-medium">{user?.rank?.replace('_', ' ').toUpperCase()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-800">{user?.points || 0}</div>
                  <div className="text-sm text-gray-600">Puntos Totales</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-800">{user?.completed_missions?.length || 0}</div>
                  <div className="text-sm text-gray-600">Misiones Completadas</div>
                </div>
              </div>
              
              <div className="mt-6">
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
            🚀
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
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-3xl text-white mb-4 mx-auto">
              🚀
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Bienvenido a Impulsa Guayaquil!</h2>
            <p className="text-gray-600 mb-6">
              Embárcate en un viaje gamificado diseñado para impulsar tu espíritu emprendedor en la Perla del Pacífico.
            </p>
            <button 
              onClick={() => setShowWelcome(false)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700"
            >
              Comenzar Mi Camino
            </button>
          </div>
        </div>
      )}

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
        <MissionModal
          mission={selectedMission}
          onClose={() => setSelectedMission(null)}
          onComplete={handleCompleteMission}
        />
      )}
    </div>
  );
}

export default App;