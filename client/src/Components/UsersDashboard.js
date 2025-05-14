import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, CardBody, CardTitle, Button, ListGroup, ListGroupItem, Badge, Input, InputGroup, Form } from 'reactstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDoctors } from '../Features/UserSlice';
import { motion } from 'framer-motion';
import { 
  FaHeartbeat, 
  FaNotesMedical, 
  FaBookMedical, 
  FaFileMedical, 
  FaProcedures, 
  FaMedkit, 
  FaSmile, 
  FaMeh, 
  FaFrown, 
  FaSadTear, 
  FaRobot, 
  FaChevronRight, 
  FaUserMd,
  FaStar,
  FaCalendarAlt,
  FaComments,
  FaEnvelope,
  FaBell,
  FaUserCircle,
  FaHospital,
  FaPhone,
  FaMapMarkerAlt,
  FaVideo,
  FaExclamationCircle,
  FaCommentMedical,
  FaSearch,
  FaStethoscope,
  FaCalendarCheck,
  FaRegClock,
  FaRegCalendarAlt
} from 'react-icons/fa';
import AppointmentModal from './AppointmentModal';
import axios from 'axios';
import * as ENV from '../config/env';

const UsersDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.users.user);
  const { doctors, doctorsLoading, doctorsError } = useSelector((state) => state.users);
  const [selectedMood, setSelectedMood] = useState(null);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'message',
      text: 'Dr. Sarah Johnson sent you a new message',
      time: '15 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'appointment',
      text: 'Upcoming appointment with Dr. Robert Chen tomorrow at 10:00 AM',
      time: '2 hours ago',
      read: true
    },
    {
      id: 3,
      type: 'result',
      text: 'Your blood test results are now available',
      time: '1 day ago',
      read: true
    }
  ]);

  const [recentMessages, setRecentMessages] = useState([]);
  
  // Add function to load messages
  const loadMessages = async () => {
    if (!user || !user.id) return;
    
    try {
      const response = await axios.get(`${ENV.SERVER_URL}/api/messages/patient/${user.id}`);
      
      if (response.data && response.data.messages) {
        // Get only the 5 most recent messages
        const recentOnes = response.data.messages
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(msg => ({
            id: msg._id,
            doctor: msg.senderName || 'Doctor',
            preview: msg.content.length > 60 ? `${msg.content.substring(0, 60)}...` : msg.content,
            time: new Date(msg.createdAt).toLocaleDateString(),
            image: '/default-avatar.png', // Default doctor image
            unread: !msg.read
          }));
          
        setRecentMessages(recentOnes);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Set some default messages if API call fails
      setRecentMessages([
        {
          id: 1,
          doctor: "Dr. John Smith",
          preview: "Your recent blood test results are normal. No further action needed.",
          time: "Today",
          image: "/doctor1.jpg",
          unread: true
        },
        {
          id: 2,
          doctor: "Dr. Sarah Johnson",
          preview: "Please remember to take your medication as prescribed during our last visit.",
          time: "Yesterday",
          image: "/doctor2.jpg",
          unread: false
        }
      ]);
    }
  };
  
  // Add missing loadUserInfo function
  const loadUserInfo = () => {
    // This function would typically load additional user info from the server
    // For now, it's just a placeholder since it's referenced but not defined
    console.log('Loading user info for:', user?.name);
    // You can implement actual user info loading logic here if needed
  };
  
  // Update useEffect to load messages
  useEffect(() => {
    if (user) {
      // Load user's info
      loadUserInfo();
      // Load messages
      loadMessages();
    }
  }, [user]);

  const [resources, setResources] = useState([
    {
      id: 1,
      title: "Maintaining Heart Health",
      description: "Essential tips for cardiovascular health and preventing heart disease",
      type: "article",
      icon: <FaHeartbeat />
    },
    {
      id: 2,
      title: "Diabetes Management",
      description: "Comprehensive guide to managing diabetes effectively",
      type: "guide",
      icon: <FaNotesMedical />
    },
    {
      id: 3,
      title: "Healthy Nutrition Basics",
      description: "Fundamentals of balanced nutrition for optimal health",
      type: "exercise",
      icon: <FaBookMedical />
    },
    {
      id: 4,
      title: "COVID-19 Prevention",
      description: "Latest guidelines on preventing COVID-19 infection",
      type: "article",
      icon: <FaFileMedical />
    }
  ]);

  const [recommendations, setRecommendations] = useState([
    {
      id: 1,
      title: "Monthly Health Check",
      description: "Schedule your comprehensive health assessment",
      type: "appointment",
      icon: <FaProcedures />
    },
    {
      id: 2,
      title: "Medication Reminder",
      description: "Set up alerts for your prescription medications",
      type: "reminder",
      icon: <FaMedkit />
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Load appointments for the user
  const [userAppointments, setUserAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Function to load user's appointments from the API
  const loadUserAppointments = useCallback(() => {
    if (user && (user.id || user._id)) {
      const userId = user.id || user._id;
      setLoadingAppointments(true);
      
      // Get upcoming appointments (confirmed or scheduled)
      axios.get(`${ENV.SERVER_URL}/appointments?userId=${userId}&status=confirmed,scheduled`)
        .then(response => {
          console.log('User appointments loaded:', response.data);
          if (response.data && response.data.appointments) {
            // Sort by date and time
            const sortedAppointments = response.data.appointments.sort((a, b) => {
              const dateA = new Date(`${a.date} ${a.time}`);
              const dateB = new Date(`${b.date} ${b.time}`);
              return dateA - dateB;
            });
            
            setUserAppointments(sortedAppointments);
          } else {
            setUserAppointments([]);
          }
        })
        .catch(error => {
          console.error('Error loading user appointments:', error);
          setUserAppointments([]);
        })
        .finally(() => {
          setLoadingAppointments(false);
        });
    }
  }, [user]);

  // Load appointments when component mounts or user changes
  useEffect(() => {
    loadUserAppointments();
  }, [loadUserAppointments]);

  useEffect(() => {
    // If no user is logged in or user is not a regular user, redirect to login
    if (!user || !user.email || user.userType === 'doctor') {
      navigate('/login');
    }
    
    // Fetch doctors from the backend when component mounts
    dispatch(fetchDoctors());
  }, [user, navigate, dispatch]);

  const handleMoodSelection = (mood) => {
    setSelectedMood(mood);
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setModalOpen(true);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const cardHoverVariants = {
    hover: { 
      y: -10, 
      boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 10 
      } 
    }
  };

  // Generate random hospital names and availability for display purposes
  const getRandomHospital = () => {
    const hospitals = [
      'Central Medical Center',
      'National Healthcare Institute',
      'Community General Hospital',
      'Medical Specialists Group',
      'Regional Medical Center'
    ];
    return hospitals[Math.floor(Math.random() * hospitals.length)];
  };
  
  const getRandomAvailability = () => {
    const availability = [
      'Available Today',
      'Available Tomorrow',
      'Next Available: Mon',
      'Next Available: Tue',
      'Available This Week'
    ];
    return availability[Math.floor(Math.random() * availability.length)];
  };

  // Helper function to format doctor name - remove duplicate "Dr." prefixes
  const formatDoctorName = (name) => {
    if (!name) return 'Unknown';
    
    // إزالة جميع أنواع Dr/Doctor من الاسم
    const originalName = name;
    const nameWithoutPrefix = name
      .replace(/\bDr\.\s*/gi, '')  // إزالة Dr. متبوعة بمسافة
      .replace(/\bDr\s*/gi, '')    // إزالة Dr متبوعة بمسافة
      .replace(/\bDoctor\s*/gi, '') // إزالة Doctor متبوعة بمسافة
      .replace(/^\s+|\s+$/g, '');  // إزالة المسافات في البداية والنهاية
    
    // إذا كان الاسم يحتوي على Dr، أضف Dr. واحدة فقط في البداية
    const hasDrPrefix = /\b(Dr\.?|Doctor)\b/i.test(originalName);
    const finalName = hasDrPrefix ? `Dr. ${nameWithoutPrefix}` : nameWithoutPrefix;
    
    // تنظيف المسافات المزدوجة
    const cleanedName = finalName.replace(/\s{2,}/g, ' ').trim();
    
    return cleanedName;
  };

  return (
    <Container fluid className="dashboard-container py-4">
      <Row className="mb-4">
        <Col>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="dashboard-welcome"
          >
            <div className="dashboard-header">
              <div>
                <h1 className="gradient-text mb-2">Welcome back, {user?.name || 'User'}</h1>
                <p className="lead text-secondary">Your personal health dashboard</p>
              </div>
              <motion.div 
                className="notification-bell"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaBell size={24} />
                <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
              </motion.div>
            </div>
          </motion.div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-4">
          <Link to="/chat" className="text-decoration-none">
            <motion.div
              className="quick-access-card bg-primary text-white"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="quick-access-icon">
                <FaRobot size={36} />
              </div>
              <div className="quick-access-content">
                <h4>AI Health Assistant</h4>
                <p>Get instant health guidance</p>
              </div>
              <div className="quick-access-arrow">
                <FaChevronRight size={20} />
              </div>
            </motion.div>
          </Link>
        </Col>
        <Col md={6} lg={3} className="mb-4">
          <Link to="/messages" className="text-decoration-none">
            <motion.div
              className="quick-access-card bg-info text-white"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="quick-access-icon">
                <FaComments size={36} />
              </div>
              <div className="quick-access-content">
                <h4>Doctor Messages</h4>
                <p>View your conversations</p>
              </div>
              <Badge color="light" pill className="message-badge">
                {recentMessages.filter(m => m.unread).length}
              </Badge>
              <div className="quick-access-arrow">
                <FaChevronRight size={20} />
              </div>
            </motion.div>
          </Link>
        </Col>
        <Col md={6} lg={3} className="mb-4">
          <Link to="/appointments" className="text-decoration-none">
            <motion.div
              className="quick-access-card bg-success text-white"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="quick-access-icon">
                <FaCalendarAlt size={36} />
              </div>
              <div className="quick-access-content">
                <h4>Appointments</h4>
                <p>Schedule & manage visits</p>
              </div>
              <div className="quick-access-arrow">
                <FaChevronRight size={20} />
              </div>
            </motion.div>
          </Link>
        </Col>
        <Col md={6} lg={3} className="mb-4">
          <Link to="/profile" className="text-decoration-none">
            <motion.div
              className="quick-access-card bg-secondary text-white"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="quick-access-icon">
                <FaUserCircle size={36} />
              </div>
              <div className="quick-access-content">
                <h4>My Profile</h4>
                <p>View health records</p>
              </div>
              <div className="quick-access-arrow">
                <FaChevronRight size={20} />
              </div>
            </motion.div>
          </Link>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={8} className="mb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="dashboard-card h-100 doctor-list-card">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="card-title-icon mb-0">
                    <FaUserMd className="text-primary me-2" />
                    Available Doctors
                  </h3>
                  <Link to="/doctors">
                    <Button color="link" className="text-primary p-0">
                      View all <FaChevronRight size={12} className="ms-1" />
                    </Button>
                  </Link>
                </div>
                
                {doctorsLoading ? (
                  <div className="text-center py-4">
                    <div className="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                    <p className="mt-2">Loading doctors...</p>
                  </div>
                ) : doctorsError ? (
                  <div className="text-center py-4 text-danger">
                    <FaExclamationCircle size={40} className="mb-3" />
                    <p>Unable to load doctors. Please try again later.</p>
                    <p className="text-muted small">{JSON.stringify(doctorsError)}</p>
                  </div>
                ) : doctors && doctors.length > 0 ? (
                  <div className="doctors-grid">
                    {doctors.map((doctor, index) => {
                      const randomHospital = getRandomHospital();
                      const randomAvailability = getRandomAvailability();
                      const rating = (4.5 + Math.random() * 0.5).toFixed(1);
                      const reviews = Math.floor(50 + Math.random() * 100);
                      const isOnline = Math.random() > 0.5;
                      const imageIndex = Math.floor(Math.random() * 70);
                      const imageGender = Math.random() > 0.5 ? 'men' : 'women';
                      
                      return (
                        <motion.div
                          key={doctor._id || index}
                          className="doctor-card"
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          custom={index}
                          transition={{ delay: 0.1 * index }}
                          whileHover="hover"
                        >
                          <div className="doctor-status">
                            {isOnline ? 
                              <span className="online-badge">● Online now</span> : 
                              <span className="offline-badge">● Offline</span>
                            }
                          </div>
                          
                          <div className="doctor-image-wrapper">
                            <img 
                              src={`https://randomuser.me/api/portraits/${imageGender}/${imageIndex}.jpg`} 
                              alt={doctor.name} 
                              className="doctor-image" 
                            />
                          </div>
                          
                          <div className="doctor-info">
                            <h4>{formatDoctorName(doctor.name)}</h4>
                            <p className="doctor-specialty">{doctor.specialization || 'General Practitioner'}</p>
                            <div className="doctor-rating">
                              <FaStar className="star-icon" />
                              <span className="rating-score">{rating}</span>
                              <span className="rating-count">({reviews} reviews)</span>
                            </div>
                            <div className="doctor-location">
                              <FaHospital size={12} className="me-1" />
                              <span>{randomHospital}</span>
                            </div>
                          </div>
                          
                          <div className="doctor-actions">
                            <motion.button 
                              className="btn-circle btn-message"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => navigate(`/messages/${doctor._id}`)}
                            >
                              <FaEnvelope size={16} />
                            </motion.button>
                            
                            <motion.button 
                              className="btn-circle btn-call"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FaPhone size={16} />
                            </motion.button>
                            
                            <motion.button 
                              className="btn-circle btn-video"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FaVideo size={16} />
                            </motion.button>
                          </div>
                          
                          <motion.button 
                            className="button btn-book"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleBookAppointment(doctor)}
                          >
                            Book Appointment
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FaUserMd size={40} className="mb-3 text-muted" />
                    <p>No doctors available at the moment.</p>
                    <p className="text-muted small">Check back later or contact support.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </Col>

        <Col lg={4} className="mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="h-100"
          >
            <Card className="dashboard-card mood-card h-100">
              <CardBody>
                <CardTitle tag="h4" className="card-title-icon">
                  <FaHeartbeat className="text-primary me-2" />
                  How are you feeling today?
                </CardTitle>
                <div className="mood-container my-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`mood-btn ${selectedMood === 'good' ? 'mood-selected' : ''}`}
                    onClick={() => handleMoodSelection('good')}
                  >
                    <FaSmile size={24} className="mood-icon" />
                    <span>Good</span>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`mood-btn ${selectedMood === 'okay' ? 'mood-selected' : ''}`}
                    onClick={() => handleMoodSelection('okay')}
                  >
                    <FaMeh size={24} className="mood-icon" />
                    <span>Okay</span>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`mood-btn ${selectedMood === 'low' ? 'mood-selected' : ''}`}
                    onClick={() => handleMoodSelection('low')}
                  >
                    <FaFrown size={24} className="mood-icon" />
                    <span>Low</span>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`mood-btn ${selectedMood === 'struggling' ? 'mood-selected' : ''}`}
                    onClick={() => handleMoodSelection('struggling')}
                  >
                    <FaSadTear size={24} className="mood-icon" />
                    <span>Struggling</span>
                  </motion.div>
                </div>

                {selectedMood && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mood-recommendation"
                  >
                    <p>
                      {selectedMood === 'good' && "That's great! Keep up your healthy habits."}
                      {selectedMood === 'okay' && "Remember to take breaks when you need them."}
                      {selectedMood === 'low' && "Consider talking with one of our doctors about how you're feeling."}
                      {selectedMood === 'struggling' && "We're here to support you. Schedule a consultation with one of our mental health specialists."}
                    </p>
                  </motion.div>
                )}
                
                <div className="text-center mt-4">
                  <Link to="/chat">
                    <motion.button
                      className="button button-primary button-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaRobot className="me-2" /> Consult AI Health Assistant
                    </motion.button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={12} lg={6} className="mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="dashboard-card h-100">
              <CardBody>
                <CardTitle tag="h4" className="card-title-icon">
                  <FaNotesMedical className="text-primary me-2" />
                  Doctor Recommendations
                </CardTitle>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="message-list"
                >
                  {recentMessages.map((message, index) => (
                    <motion.div 
                      key={message.id}
                      variants={itemVariants}
                      whileHover={{ 
                        x: 5, 
                        backgroundColor: "rgba(44, 122, 123, 0.05)"
                      }}
                      className="message-item"
                    >
                      <div className="message-avatar">
                        <img src={message.image} alt={message.doctor} />
                        {message.unread && <span className="unread-indicator"></span>}
                      </div>
                      <div className="message-content">
                        <h5>{message.doctor}</h5>
                        <p className="mb-0">{message.preview}</p>
                        <small className="text-muted">{message.time}</small>
                      </div>
                      <div className="message-action">
                        <motion.button 
                          className="btn-circle btn-sm"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FaChevronRight size={12} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}

                  <Link to="/messages" className="view-all-link">
                    <motion.button
                      className="button button-outline button-sm w-100 mt-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      View All Messages
                    </motion.button>
                  </Link>
                </motion.div>
              </CardBody>
            </Card>
          </motion.div>
        </Col>

        <Col md={12} lg={6} className="mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="dashboard-card h-100">
              <CardBody>
                <CardTitle tag="h4" className="card-title-icon">
                  <FaBookMedical className="text-primary me-2" />
                  Recent Health Articles
                </CardTitle>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {resources.slice(0, 3).map((item, index) => (
                    <motion.div 
                      key={item.id} 
                      variants={itemVariants}
                      whileHover={{ 
                        x: 5, 
                        backgroundColor: "rgba(44, 122, 123, 0.05)"
                      }}
                      className="resource-item"
                    >
                      <div className="resource-item-icon">
                        {item.icon}
                      </div>
                      <div className="resource-item-content">
                        <h5>{item.title}</h5>
                        <p className="mb-0 text-muted">{item.description}</p>
                        <div className="resource-meta">
                          <span className="resource-type">{item.type}</span>
                          <span className="resource-time">5 min read</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <Link to="/resources" className="view-all-link">
                    <motion.button
                      className="button button-outline button-sm w-100 mt-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Browse All Resources
                    </motion.button>
                  </Link>
                </motion.div>
              </CardBody>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={12} lg={6} className="mb-4">
          <Card className="dashboard-card">
            <CardBody>
              <CardTitle tag="h5">
                <FaCalendarCheck className="me-2 text-primary" />
                <span>Upcoming Appointments</span>
              </CardTitle>
              <ListGroup>
                {loadingAppointments ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : userAppointments.length > 0 ? (
                  userAppointments.map((appointment) => (
                    <ListGroupItem key={appointment._id} className="appointment-item">
                      <div className="appointment-date">
                        <div className="date-box">
                          <span className="month">
                            {new Date(appointment.date).toLocaleString('default', { month: 'short' })}
                          </span>
                          <span className="day">
                            {new Date(appointment.date).getDate()}
                          </span>
                        </div>
                        <span className="time">
                          <FaRegClock className="me-1" /> {appointment.time}
                        </span>
                      </div>
                      <div className="appointment-details">
                        <div className="doctor-name">
                          <FaUserMd className="me-1" /> Dr. {appointment.doctor}
                        </div>
                        <div className="appointment-type">
                          {appointment.type}
                        </div>
                        <Badge 
                          color={appointment.status === 'confirmed' ? 'success' : 'primary'} 
                          className="status-badge"
                        >
                          {appointment.status === 'confirmed' ? 'Confirmed' : 'Scheduled'}
                        </Badge>
                      </div>
                    </ListGroupItem>
                  ))
                ) : (
                  <div className="text-center py-3">
                    <p className="mb-0">You don't have any upcoming appointments.</p>
                    <small className="text-muted">Book an appointment with one of our doctors.</small>
                  </div>
                )}
              </ListGroup>
              <div className="mt-3 text-center">
                <Link to="/appointments" className="text-decoration-none">
                  <Button outline color="primary" className="w-100">
                    <FaRegCalendarAlt className="me-2" />
                    View All Appointments
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col md={12} lg={6} className="mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="dashboard-card h-100">
              <CardBody>
                <CardTitle tag="h4" className="card-title-icon">
                  <FaBookMedical className="text-primary me-2" />
                  Recent Health Articles
                </CardTitle>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {resources.slice(0, 3).map((item, index) => (
                    <motion.div 
                      key={item.id} 
                      variants={itemVariants}
                      whileHover={{ 
                        x: 5, 
                        backgroundColor: "rgba(44, 122, 123, 0.05)"
                      }}
                      className="resource-item"
                    >
                      <div className="resource-item-icon">
                        {item.icon}
                      </div>
                      <div className="resource-item-content">
                        <h5>{item.title}</h5>
                        <p className="mb-0 text-muted">{item.description}</p>
                        <div className="resource-meta">
                          <span className="resource-type">{item.type}</span>
                          <span className="resource-time">5 min read</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <Link to="/resources" className="view-all-link">
                    <motion.button
                      className="button button-outline button-sm w-100 mt-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Browse All Resources
                    </motion.button>
                  </Link>
                </motion.div>
              </CardBody>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={modalOpen}
        toggle={toggleModal}
        doctor={selectedDoctor}
      />
    </Container>
  );
};

export default UsersDashboard; 