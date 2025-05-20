import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, CardBody, CardHeader, CardTitle, Table, Button,
  Modal, ModalHeader, ModalBody, ModalFooter, Alert, Badge, Nav, NavItem, NavLink,
  TabContent, TabPane, Form, FormGroup, Label, Input, Spinner, 
  ListGroup, ListGroupItem, Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import { 
  FaUserMd, FaCalendarAlt, FaBell, FaEnvelope, FaComments, FaTimesCircle, 
  FaCheckCircle, FaChartLine, FaUserInjured, FaRegCalendarAlt, FaCalendarCheck, 
  FaThumbsUp, FaClock, FaClipboardList, FaPhone, FaVideo, FaExclamationTriangle, 
  FaRedoAlt, FaUser, FaRobot, FaBookMedical, FaNotesMedical, FaLink, FaFileMedical,
  FaFileAlt, FaStickyNote, FaHistory, FaFlask
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SERVER_URL, getApiUrl } from '../config';

const DoctorsDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
  const [activeTab, setActiveTab] = useState('appointments');
  const [realAppointments, setRealAppointments] = useState([]);
  
  // حالة النافذة المنبثقة لتأكيد الموعد
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  
  // Funciones y estados para la lista de chats
  const [patientChats, setPatientChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  
  // Chat modal
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const toggleChatModal = () => setChatModalOpen(!chatModalOpen);
  
  // Añadir estado para la respuesta del doctor
  const [doctorResponse, setDoctorResponse] = useState('');
  
  // Añadir estados para gestionar la visualización de pacientes y conversaciones
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientConversations, setPatientConversations] = useState([]);
  const [selectedPatientModal, setSelectedPatientModal] = useState(false);
  
  // استبدال الدالة sendDirectMessage بنسخة أكثر تطوراً باستخدام Modal
  // إضافة حالة للنافذة المنبثقة الخاصة بالرسائل
  const [messageModal, setMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [messagePatient, setMessagePatient] = useState(null);
  const [messageTemplate, setMessageTemplate] = useState('default');
  
  // إضافة حالة جديدة لإظهار قائمة الرسائل السابقة
  const [showPreviousMessages, setShowPreviousMessages] = useState(false);
  const [previousMessages, setPreviousMessages] = useState([]);
  const [messageLoading, setMessageLoading] = useState(false);
  
  // إضافة حالة جديدة للرسائل الواردة
  const [incomingMessages, setIncomingMessages] = useState([]);
  const [loadingIncomingMessages, setLoadingIncomingMessages] = useState(false);

  // إضافة داله لتحميل الرسائل الواردة للطبيب
  const loadIncomingMessages = useCallback(() => {
    if (!user || !(user.id || user._id)) {
      console.error('User ID missing in loadIncomingMessages');
      return;
    }
    
    setLoadingIncomingMessages(true);
    const doctorId = user.id || user._id;
    
    console.log('Loading messages for doctor ID:', doctorId);
    
    // Test the API endpoint directly first
    axios.get(getApiUrl(`api/messages`))
      .then(() => {
        console.log('API endpoint /api/messages is accessible');
        
        // Now try to get the doctor's messages
        return axios.get(getApiUrl(`api/messages/doctor/${doctorId}`));
      })
      .then(response => {
        console.log("Incoming messages API response:", response.status, response.statusText);
        console.log("Full response data:", response.data);
        
        if (response.data && response.data.messages) {
          console.log(`Received ${response.data.messages.length} messages from server`);
          
          // إذا كانت هناك رسائل، اطبع عينة منها
          if (response.data.messages.length > 0) {
            console.log('Sample messages:');
            response.data.messages.slice(0, 3).forEach((msg, index) => {
              console.log(`Message ${index + 1}:`, {
                from: msg.senderName,
                to: msg.receiverName,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                content: msg.content.substring(0, 30) + '...',
                date: msg.createdAt
              });
            });
          } else {
            console.log('No messages found in server response even though response was successful');
          }
          
          // ترتيب الرسائل حسب التاريخ (الأحدث أولاً)
          setIncomingMessages(response.data.messages.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          ));
          
          // إذا لم تكن هناك رسائل، أظهر رسالة للمستخدم
          if (response.data.messages.length === 0) {
            toast.info('No messages found. This could be normal if no one has sent you messages yet.');
          }
        } else {
          console.log('No messages found in response or invalid response format:', response.data);
          toast.warn('No messages found in the response. The API endpoint might not be returning data in the expected format.');
          setIncomingMessages([]);
        }
      })
      .catch(error => {
        console.error("Error loading incoming messages:", error);
        
        // تفاصيل أكثر للخطأ
        if (error.response) {
          console.error("Server response:", error.response.status, error.response.statusText);
          console.error("Response data:", error.response.data);
          toast.error(`Failed to load messages: ${error.response.status} ${error.response.statusText}`);
        } else if (error.request) {
          console.error("No response received from server");
          toast.error("Server did not respond. Check your connection.");
        } else {
          console.error("Error details:", error.message);
          toast.error(`Error: ${error.message}`);
        }
        
        // محاولة بديلة للحصول على الرسائل باستخدام نقطة نهاية مختلفة
        console.log('Trying alternative API endpoint for doctor messages...');
        axios.get(getApiUrl(`api/messages/doctor-received/${doctorId}`))
          .then(altResponse => {
            console.log('Alternative endpoint response:', altResponse.data);
            if (altResponse.data && altResponse.data.messages) {
              setIncomingMessages(altResponse.data.messages.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
              ));
              toast.success('Messages loaded using alternative method');
            }
          })
          .catch(altError => {
            console.error('Alternative endpoint also failed:', altError);
            setIncomingMessages([]);
          });
      })
      .finally(() => {
        setLoadingIncomingMessages(false);
      });
  }, [user, toast]);

  // تحميل الرسائل الواردة عند فتح القسم
  useEffect(() => {
    if (activeTab === 'messages') {
      loadIncomingMessages();
    }
  }, [activeTab, loadIncomingMessages]);
  
  // Load real appointments from localStorage
  useEffect(() => {
    loadAppointments();
    
    // معالجة اسم الطبيب في بيانات المستخدم
    if (user?.fullname || user?.name) {
      document.title = `Dashboard | Dr. ${formatDoctorName(user.fullname || user.name).replace(/^Dr\.\s*/i, '')}`;
    }
  }, [user]);
  
  // Function to load appointments
  const loadAppointments = () => {
    if (user && (user.id || user._id)) {
      const doctorId = user.id || user._id;
      
      // Cargar todas las citas sin filtrar por estado
      axios.get(getApiUrl(`appointments?doctorId=${doctorId}`))
        .then(response => {
          console.log("Appointments:", response.data);
          const sortedAppointments = response.data.appointments.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
          });
          setRealAppointments(sortedAppointments);
        })
        .catch(error => {
          console.error("Error loading appointments:", error);
          toast.error("Failed to load appointments");
        });
    }
  };
  
  // Function to handle appointment confirmation
  const handleConfirmAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await axios.put(getApiUrl(`appointments/${selectedAppointment._id}`), {
        status: 'confirmed',
        confirmedAt: new Date()
      });
      
      console.log("Appointment confirmed:", response.data);
      toast.success("Appointment confirmed successfully!");
      
      // Close confirmation modal
      setConfirmModal(false);
      
      // Reload appointments to refresh the lists
      loadAppointments();
    } catch (error) {
      console.error("Error confirming appointment:", error);
      toast.error("Failed to confirm appointment");
    }
  };
  
  // Handle reschedule appointment (just a placeholder for now)
  const handleRescheduleAppointment = (id) => {
    alert('Reschedule functionality would be implemented here');
  };
  
  // Function to handle cancelling an appointment
  const handleCancelAppointment = async (appointmentId) => {
    try {
      const response = await axios.put(`${SERVER_URL}/appointments/${appointmentId}`, {
        status: 'cancelled'
      });
      
      console.log("Appointment cancelled:", response.data);
      toast.success("Appointment cancelled successfully");
      
      // Reload appointments to refresh the lists
      loadAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  useEffect(() => {
    // Redirect if not logged in or not a doctor
    if (!user || !user.email || user.userType !== 'doctor') {
      navigate('/login');
    }
  }, [user, navigate]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <Badge className="status-badge status-active">Active</Badge>;
      case 'scheduled':
        return <Badge className="status-badge status-scheduled">Scheduled</Badge>;
      case 'inactive':
        return <Badge className="status-badge status-inactive">Inactive</Badge>;
      case 'confirmed':
        return <Badge className="status-badge status-active">Confirmed</Badge>;
      case 'cancelled':
        return <Badge className="status-badge status-inactive">Cancelled</Badge>;
      case 'completed':
        return <Badge className="status-badge status-completed">Completed</Badge>;
      default:
        return <Badge className="status-badge">Unknown</Badge>;
    }
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

  // فتح النافذة المنبثقة لتأكيد الموعد
  const openConfirmModal = (appointment) => {
    setSelectedAppointment(appointment);
    setDoctorNotes('');
    setSendEmailNotification(true);
    setConfirmModal(true);
  };
  
  // إغلاق النافذة المنبثقة
  const closeConfirmModal = () => {
    setConfirmModal(false);
    setSelectedAppointment(null);
    setDoctorNotes('');
  };

  // Añadir la función loadPatientChats si no existe o mejorarla si ya existe
  const loadPatientChats = useCallback(() => {
    if (!user || !(user.id || user._id)) return;
    
    setLoadingChats(true);
    const doctorId = user.id || user._id;
    
    // Obtener las consultas médicas asociadas al doctor
    axios.get(getApiUrl(`api/chat/conversations/doctor/${doctorId}`))
      .then(response => {
        console.log("Doctor consultations loaded:", response.data);
        if (response.data && response.data.conversations) {
          setPatientChats(response.data.conversations);
        } else {
          setPatientChats([]);
        }
      })
      .catch(error => {
        console.error("Error loading patient consultations:", error);
        toast.error("Failed to load patient consultations");
        setPatientChats([]);
      })
      .finally(() => {
        setLoadingChats(false);
      });
  }, [user]);

  // Añadir un useEffect para cargar las consultas cuando se active la pestaña
  useEffect(() => {
    if (activeTab === 'consultations') {
      loadPatientChats();
    }
  }, [activeTab, loadPatientChats]);

  // Function to process messages and apply correct roles
  const processMessages = (messages) => {
    if (!messages || !Array.isArray(messages)) return [];
    
    return messages.map((msg, index) => {
      const messageObj = { ...msg };
      
      // FIXED ROLE ASSIGNMENT BY POSITION:
      // First message is always from assistant (welcome message)
      // Then alternate user/assistant (odd user, even assistant)
      messageObj.role = index === 0 ? 'assistant' : (index % 2 === 1 ? 'user' : 'assistant');
      
      // If a message has fromDoctor flag, ensure its role is assistant
      if (messageObj.fromDoctor) {
        messageObj.role = 'assistant';
      }
      
      // Log for debugging
      if (msg.role !== messageObj.role) {
        console.log(`Forced role in doctor dashboard: "${msg.role || 'undefined'}" → "${messageObj.role}" at index ${index}`);
      }
      
      return {
        ...messageObj,
        timestamp: messageObj.timestamp || new Date()
      };
    });
  };

  // Añadir o actualizar la función loadChatMessages si no existe
  const loadChatMessages = async (chatId) => {
    try {
      setChatMessages([]);
      setSelectedChat(null);
      
      const response = await axios.get(getApiUrl(`api/chat/conversations/${chatId}`));
      
      if (response.data && response.data.conversation) {
        setSelectedChat(response.data.conversation);
        
        // Process messages to ensure correct roles
        const processedMessages = processMessages(response.data.conversation.messages || []);
        console.log("Processed messages with roles:", processedMessages.map(m => m.role));
        
        setChatMessages(processedMessages);
        setChatModalOpen(true);
      } else {
        toast.error("Could not load conversation");
      }
    } catch (error) {
      console.error("Error loading chat messages:", error);
      toast.error("Error loading conversation details");
    }
  };

  // Función para enviar respuesta médica al paciente
  const sendMedicalResponse = async () => {
    if (!doctorResponse.trim() || !selectedChat?._id) {
      toast.error('Please enter a response message');
      return;
    }
    
    console.log("Sending medical response to:", selectedChat._id);
    console.log("Doctor ID:", user._id);
    console.log("Response content length:", doctorResponse.length);
    
    try {
      // Crear el objeto de mensaje que será enviado al servidor
      const messagePayload = {
        content: doctorResponse,
        doctorId: user._id,
        // Asegurar que role esté definido explícitamente
        role: 'assistant'
      };
      
      console.log("Sending message payload:", messagePayload);
      
      const response = await axios.post(
        getApiUrl(`api/chat/conversations/${selectedChat._id}/doctor-response`),
        messagePayload
      );
      
      console.log("Server response:", response.data);
      
      if (response.data.success) {
        // Crear un nuevo mensaje con role explícito
        const newMessage = {
          role: 'assistant', // Always assistant for doctor's messages
          content: doctorResponse,
          timestamp: new Date(),
          fromDoctor: true
        };
        
        console.log("Created new message for chat history:", newMessage);
        
        // Apply message processing to maintain consistency
        const updatedMessages = processMessages([...chatMessages, newMessage]);
        setChatMessages(updatedMessages);
        
        // Log first few messages after update for debugging
        console.log("First 3 processed messages:", 
          updatedMessages.slice(0, 3).map(m => ({role: m.role, content: m.content.substring(0, 20) + '...'}))
        );
        
        setDoctorResponse(''); // Limpiar el formulario
        toast.success('Response sent successfully');
        
        // Actualizar el estado de la conversación
        if (selectedChat.status !== 'closed') {
          setSelectedChat({
            ...selectedChat,
            status: 'in-progress'
          });
        }
      } else {
        toast.error('Server reported an issue sending the response');
      }
    } catch (error) {
      console.error('Error sending medical response:', error);
      
      // Mostrar mensaje de error con más detalles
      let errorMessage = 'Failed to send response';
      if (error.response) {
        // La solicitud fue hecha y el servidor respondió con un código de estado
        // que no está en el rango 2xx
        console.error("Server response error:", error.response.status, error.response.data);
        errorMessage = `Error ${error.response.status}: ${error.response.data.message || 'Server error'}`;
      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        console.error("No response received:", error.request);
        errorMessage = 'No response from server. Check connection.';
      } else {
        // Ocurrió un error al configurar la solicitud
        console.error("Request setup error:", error.message);
        errorMessage = `Request error: ${error.message}`;
      }
      
      toast.error(errorMessage);
    }
  };

  // Función para cerrar la consulta médica
  const closeConsultation = async () => {
    if (!selectedChat?._id) return;
    
    // أولاً، إرسال الرد إذا كان هناك نص
    if (doctorResponse.trim()) {
      try {
        const response = await axios.post(
          getApiUrl(`api/chat/conversations/${selectedChat._id}/doctor-response`),
          {
            content: doctorResponse,
            doctorId: user._id
          }
        );
        
        if (response.data.success) {
          // إضافة الرسالة محلياً مع role صحيح
          const newMessage = {
            role: 'assistant', // Always assistant for doctor messages
            content: doctorResponse,
            timestamp: new Date(),
            fromDoctor: true
          };
          
          // Apply message processing to maintain consistency
          const updatedMessages = processMessages([...chatMessages, newMessage]);
          setChatMessages(updatedMessages);
          
          setDoctorResponse(''); // تنظيف النموذج
          toast.success('Response sent successfully');
        }
      } catch (error) {
        console.error('Error sending medical response:', error);
        toast.error('Failed to send response');
        return; // إيقاف العملية إذا فشل الإرسال
      }
    }
    
    // ثانياً، إكمال/إغلاق المحادثة
    const confirmClose = window.confirm(
      'Are you sure you want to complete this consultation?'
    );
    
    if (!confirmClose) return;
    
    try {
      const response = await axios.put(
        getApiUrl(`api/chat/conversations/${selectedChat._id}/status`),
        {
          status: 'closed',
          doctorId: user._id
        }
      );
      
      if (response.data.success) {
        toast.success('Consultation completed successfully');
        setSelectedChat({
          ...selectedChat,
          status: 'closed'
        });
        
        // تحديث قائمة المحادثات
        loadPatientChats();
      }
    } catch (error) {
      console.error('Error closing consultation:', error);
      toast.error('Failed to complete consultation');
    }
  };

  // Update the loadDoctorPatients function to include more patient information
  const loadDoctorPatients = useCallback(() => {
    if (!user || !(user.id || user._id)) return;
    
    setLoadingPatients(true);
    const doctorId = user.id || user._id;
    
    console.log('Loading patients for doctor ID:', doctorId);
    
    // First get the appointments to identify patients
    axios.get(getApiUrl(`appointments?doctorId=${doctorId}`))
      .then(response => {
        console.log("Doctor appointments loaded:", response.data);
        if (response.data && response.data.appointments && response.data.appointments.length > 0) {
          // Extract unique patient info directly from appointments
          const uniquePatients = [];
          const patientIds = new Set();
          
          response.data.appointments.forEach(appointment => {
            const patientId = appointment.userId || appointment.user;
            if (!patientIds.has(patientId) && patientId) {
              patientIds.add(patientId);
              
              // Create a patient record from appointment data
              uniquePatients.push({
                _id: patientId,
                id: patientId,
                fullname: appointment.patient,
                name: appointment.patient,
                email: appointment.email || 'Email not provided',
                phone: appointment.phone || 'Not provided',
                appointmentCount: 1,
                lastAppointment: appointment.date,
                status: 'active'
              });
            } else if (patientId) {
              // Update existing patient with additional appointment info
              const existingPatient = uniquePatients.find(p => (p._id === patientId || p.id === patientId));
              if (existingPatient) {
                existingPatient.appointmentCount += 1;
                // Update last appointment if this one is more recent
                const currentLastDate = new Date(existingPatient.lastAppointment);
                const newDate = new Date(appointment.date);
                if (newDate > currentLastDate) {
                  existingPatient.lastAppointment = appointment.date;
                }
              }
            }
          });
          
          setPatients(uniquePatients);
          console.log(`Loaded ${uniquePatients.length} unique patients`);
        } else {
          console.log("No appointments found");
          setPatients([]);
        }
      })
      .catch(error => {
        console.error("Error fetching doctor appointments:", error);
        toast.error("Error loading your patients");
        setPatients([]);
      })
      .finally(() => {
        setLoadingPatients(false);
      });
  }, [user]);

  // Update useEffect to load patients when the "patients" tab is active
  useEffect(() => {
    if (activeTab === 'patients' || activeTab === 'appointments') {
      loadDoctorPatients();
    }
  }, [activeTab, loadDoctorPatients]);

  // Función para cargar las conversaciones de un paciente específico
  const loadPatientConversations = (patientId) => {
    if (!patientId) return;
    
    axios.get(getApiUrl(`api/chat/conversations/user/${patientId}`))
      .then(response => {
        if (response.data && response.data.conversations) {
          setPatientConversations(response.data.conversations);
        } else {
          setPatientConversations([]);
        }
      })
      .catch(error => {
        console.error("Error loading patient conversations:", error);
        toast.error("Error loading patient chat history");
        setPatientConversations([]);
      });
  };

  // Función para ver los detalles de un paciente
  const viewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    loadPatientConversations(patient._id || patient.id);
    setSelectedPatientModal(true);
  };

  // Añadir el modal para ver los detalles del paciente y sus conversaciones
  const renderPatientDetailsModal = () => {
  return (
      <Modal isOpen={selectedPatientModal} toggle={() => setSelectedPatientModal(false)} size="lg">
        <ModalHeader toggle={() => setSelectedPatientModal(false)} className="border-0 pb-0">
          <div className="d-flex align-items-center">
            <div className="patient-avatar me-3">
              <FaUserInjured size={36} className="text-primary p-1 rounded-circle bg-light" />
            </div>
            <div>
              <h4 className="mb-0">{selectedPatient?.fullname || selectedPatient?.name || 'Patient Details'}</h4>
              <small className="text-muted d-flex align-items-center">
                <FaEnvelope className="me-1" size={12} /> {selectedPatient?.email}
              </small>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="pt-0">
          {selectedPatient ? (
            <div className="patient-profile">
              <div className="d-flex justify-content-end mb-3">
                <Button 
                  color="primary"
                  onClick={() => sendDirectMessage(selectedPatient)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FaEnvelope size={14} /> Send Message
                </Button>
              </div>
              <div className="profile-card mb-4 p-3 border rounded bg-light">
                <Row>
                  <Col md={6}>
                    <div className="info-section">
                      <h6 className="section-title text-primary border-bottom pb-2 mb-3">
                        <FaUser className="me-2" />Patient Information
                      </h6>
                      <div className="info-item mb-2">
                        <span className="info-label">Name:</span>
                        <span className="info-value">{selectedPatient.fullname || selectedPatient.name}</span>
                      </div>
                      <div className="info-item mb-2">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{selectedPatient.email}</span>
                      </div>
                      <div className="info-item mb-2">
                        <span className="info-label">Phone:</span>
                        <span className="info-value">{selectedPatient.phone || 'Not provided'}</span>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="appointment-section">
                      <h6 className="section-title text-primary border-bottom pb-2 mb-3">
                        <FaCalendarAlt className="me-2" />Appointment History
                      </h6>
                      <div className="info-item mb-2">
                        <span className="info-label">Total Appointments:</span>
                        <span className="info-value">
                          <Badge color="primary" pill>{selectedPatient.appointmentCount || 0}</Badge>
                        </span>
                      </div>
                      <div className="info-item mb-2">
                        <span className="info-label">Last Appointment:</span>
                        <span className="info-value">
                          {selectedPatient.lastAppointment ? 
                            new Date(selectedPatient.lastAppointment).toLocaleDateString() : 
                            <Badge color="secondary" pill>None</Badge>
                          }
                        </span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
              
              <div className="conversations-section">
                <h6 className="section-title text-primary border-bottom pb-2 mb-3">
                  <FaComments className="me-2" />Chat Conversations
                </h6>
                
                {patientConversations.length === 0 ? (
                  <Alert color="info" className="text-center">
                    <FaRobot size={24} className="mb-2" />
                    <div>No chat conversations found for this patient.</div>
                  </Alert>
                ) : (
                  <div className="conversation-list">
                    {patientConversations.map(convo => (
                      <div 
                        key={convo._id} 
                        className="conversation-item p-3 mb-2 border rounded shadow-sm d-flex justify-content-between align-items-center"
                        onClick={() => loadChatMessages(convo._id)}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          backgroundColor: '#f8f9fa'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eaecef'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      >
                        <div>
                          <h6 className="mb-1 text-primary">
                            <FaRobot className="me-2" size={14} />
                            {convo.title || 'Untitled Conversation'}
                          </h6>
                          <small className="text-muted d-flex align-items-center">
                            <FaRegCalendarAlt className="me-1" size={12} />
                            {new Date(convo.updatedAt || convo.createdAt).toLocaleString()}
                          </small>
                        </div>
                        <div>
                          <Badge 
                            color={convo.status === 'closed' ? 'success' : convo.status === 'in-progress' ? 'warning' : 'info'}
                            pill
                            className="px-3 py-2"
                          >
                            {convo.status || 'open'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Alert color="warning">No patient selected.</Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setSelectedPatientModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    );
  };

  // Modificar la función renderPatients para mostrar la lista de pacientes
  const renderPatients = () => {
    return (
      <Card className="shadow">
        <CardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Your Patients</h5>
          <Button color="primary" size="sm" onClick={loadDoctorPatients}>
            <FaRedoAlt className="me-1" /> Refresh
          </Button>
        </CardHeader>
        <CardBody>
          {loadingPatients ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading patients...</p>
            </div>
          ) : patients.length === 0 ? (
            <Alert color="info">
              You don't have any patients yet. They will appear here once they book an appointment with you.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Email</th>
                  <th>Appointments</th>
                  <th>Last Visit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient, index) => (
                  <tr key={patient._id || patient.id}>
                    <td>{patient.fullname || patient.name}</td>
                    <td>{patient.email}</td>
                    <td>{patient.appointmentCount || 0}</td>
                    <td>{patient.lastAppointment ? new Date(patient.lastAppointment).toLocaleDateString() : 'None'}</td>
                    <td>
                      <Button 
                        color="primary" 
                        size="sm"
                        onClick={() => viewPatientDetails(patient)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    );
  };

  // Modificar renderizador de la sección de citas para mostrar todas en una lista
  const renderAppointmentsContent = () => {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h5 className="section-title mb-4">
          <FaCalendarAlt className="me-2" />
          Appointments
        </h5>
        
        <div className="table-responsive">
          <Table hover className="appointments-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {realAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="empty-state">
                      <FaCalendarAlt size={40} className="mb-3 text-muted" />
                      <h6>No appointments found</h6>
                      <p className="text-muted">When patients book appointments, they will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                realAppointments.map((appointment, idx) => (
                  <motion.tr 
                    key={appointment._id}
                    initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ backgroundColor: "rgba(44, 122, 123, 0.05)" }}
                  >
                    <td>
                      <div 
                        className="patient-name"
                        style={{ cursor: 'pointer', color: '#2c7a7b', textDecoration: 'underline' }}
                        onClick={() => viewPatientDetails({
                          id: appointment.userId,
                          _id: appointment.userId,
                          fullname: appointment.patient,
                          email: appointment.email || 'Email not provided'
                        })}
                      >
                        {appointment.patient || appointment.referenceNumber}
            </div>
                    </td>
                    <td>{appointment.date}</td>
                    <td>{appointment.time}</td>
                    <td>{appointment.type}</td>
                    <td>{getStatusBadge(appointment.status)}</td>
                    <td>
                      <div className="action-buttons">
                        {appointment.status === 'scheduled' && (
                          <>
                            <Button 
                              color="danger" 
                              size="sm" 
                              onClick={() => handleCancelAppointment(appointment._id)}
                              title="Cancel Appointment"
                            >
                              <FaTimesCircle />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </motion.div>
    );
  };

  // 1. تحديث قسم المحادثات (Consultations) بتصميم جديد مع بطاقات بدلاً من الجدول
  {activeTab === 'consultations' && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="consultations-container"
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="section-title mb-0">
          <FaComments className="me-2" />
          Medical Consultations
        </h5>
        <Button 
          color="primary" 
          size="sm"
          onClick={loadPatientChats}
          className="d-flex align-items-center"
        >
          <FaRedoAlt className="me-2" />
          Refresh
        </Button>
      </div>
      
      {loadingChats ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading consultations...</p>
        </div>
      ) : patientChats.length === 0 ? (
        <div className="empty-state text-center py-5">
          <div className="empty-icon">
            <FaComments size={48} className="text-muted mb-3" />
          </div>
          <h5>No Consultations Yet</h5>
          <p className="text-muted">When patients start medical consultations, they will appear here.</p>
        </div>
      ) : (
        <Row className="consultation-cards">
          {patientChats.map((chat, idx) => (
            <Col lg={4} md={6} className="mb-4" key={chat._id}>
              <Card 
                className="consultation-card shadow-sm h-100"
                onClick={() => loadChatMessages(chat._id)}
                style={{ cursor: 'pointer' }}
              >
                <CardBody>
                  <div className="d-flex justify-content-between mb-3">
                    <Badge
                      color={
                        chat.status === 'closed'
                          ? 'success'
                          : chat.status === 'in-progress'
                          ? 'warning'
                          : 'info'
                      }
                      pill
                      className="px-3 py-2"
                    >
                      {chat.status || 'open'}
                    </Badge>
                    <small className="text-muted">
                      {new Date(chat.updatedAt || chat.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  
                  <div className="d-flex align-items-center mb-3">
                    <div className="patient-avatar me-3">
                      <div className="avatar-circle bg-primary">
                        <FaUser className="text-white" />
                      </div>
                    </div>
                    <div>
                      <h6 className="mb-0">{chat.patientName || 'Unknown Patient'}</h6>
                      <small className="text-muted">Patient</small>
                    </div>
                  </div>
                  
                  <h6 className="consultation-title">
                    {chat.title || 'Medical Consultation'}
                  </h6>
                  
                  <p className="consultation-preview text-muted">
                    {chat.lastMessage || 'Click to view this consultation and provide medical advice.'}
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="message-count">
                      <FaComments className="me-1 text-primary" />
                      <small>{chat.messageCount || 'No'} messages</small>
                    </div>
                    <Button
                      color="primary"
                      size="sm"
                      className="view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadChatMessages(chat._id);
                      }}
                    >
                      <FaComments className="me-1" /> View
                    </Button>
                  </div>
                </CardBody>
              </Card>
          </Col>
          ))}
        </Row>
      )}
      </motion.div>
  )}

  // 2. تحديث نافذة المحادثة بتصميم جديد أكثر تفاعلية
  <Modal isOpen={chatModalOpen} toggle={toggleChatModal} size="xl" className="chat-modal" backdrop="static">
    <ModalHeader toggle={toggleChatModal} className="border-0 bg-gradient-primary text-white">
      <div className="d-flex align-items-center justify-content-between w-100">
        <div className="d-flex align-items-center">
          {selectedChat && selectedChat.patientName && (
            <div className="patient-avatar me-3">
              <div className="avatar-circle bg-white text-primary">
                <FaUser size={18} />
              </div>
            </div>
          )}
          <div>
            <h5 className="mb-0">
              {selectedChat ? 
                `Consultation with ${selectedChat.patientName || 'Patient'}` : 
                'Medical Consultation'
              }
            </h5>
            <div className="d-flex align-items-center mt-1">
              {selectedChat && (
                <>
                  <Badge
                    color={
                      selectedChat.status === 'closed'
                        ? 'success'
                        : selectedChat.status === 'in-progress'
                        ? 'warning'
                        : 'info'
                    }
                    pill
                    className="me-2"
                  >
                    {selectedChat.status || 'open'}
                  </Badge>
                  <small className="text-white-50">
                    Started {selectedChat.createdAt ? new Date(selectedChat.createdAt).toLocaleDateString() : 'recently'}
                  </small>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalHeader>
    <ModalBody className="chat-modal-body p-0">
      {selectedChat ? (
        <div className="chat-container h-100 d-flex flex-column">
          <div className="chat-messages p-3 flex-grow-1" style={{ maxHeight: '60vh', overflowY: 'auto', backgroundColor: '#f5f7f9' }}>
            {chatMessages.length === 0 ? (
              <div className="empty-chat text-center py-5">
                <FaComments size={48} className="text-muted mb-3" />
                <h5>No messages yet</h5>
                <p className="text-muted">There are no messages in this consultation.</p>
              </div>
            ) : (
              <>
                <div className="chat-date-separator">
                  <span>Consultation started {selectedChat.createdAt ? new Date(selectedChat.createdAt).toLocaleDateString() : 'recently'}</span>
                </div>
                {chatMessages.map((msg, index) => {
                  // Check if we need to add a date separator
                  const showDateSeparator = index > 0 && 
                    new Date(msg.timestamp).toDateString() !== new Date(chatMessages[index-1].timestamp).toDateString();
                  
                  // Use role to determine message display
                  const isUserMessage = msg.role === 'user';
                  const isDoctorMessage = msg.role === 'assistant' && msg.fromDoctor;
                  const isAIMessage = msg.role === 'assistant' && !msg.fromDoctor;
                  
                  return (
                    <React.Fragment key={index}>
                      {showDateSeparator && (
                        <div className="chat-date-separator">
                          <span>{new Date(msg.timestamp).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div 
                        className={`chat-message mb-3 ${isUserMessage ? 'user-message' : 'ai-message'}`}
                      >
                        <div className="message-wrapper d-flex">
                          <div className="message-avatar me-2">
                            {isUserMessage ? (
                              <div className="avatar-circle bg-primary text-white">
                                <FaUser size={16} />
                              </div>
                            ) : isDoctorMessage ? (
                              <div className="avatar-circle bg-success text-white">
                                <FaUserMd size={16} />
                              </div>
                            ) : (
                              <div className="avatar-circle bg-info text-white">
                                <FaRobot size={16} />
                              </div>
                            )}
                          </div>
                          <div className="message-content">
                            <div className={`message-bubble p-3 rounded-3 ${
                              isUserMessage ? 'bg-primary text-white' : 
                              isDoctorMessage ? 'bg-success text-white' : 
                              'bg-white'
                            }`}>
                              <div className="message-text">{msg.content}</div>
                            </div>
                            <div className="message-info">
                              <small className="text-muted">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                {isDoctorMessage && <span className="ms-2 badge bg-light text-dark">Doctor's Response</span>}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </div>
          
          <div className="chat-input-container p-3 border-top" style={{ backgroundColor: '#fff' }}>
            {selectedChat.status === 'closed' ? (
              <Alert color="success" className="mb-0">
                <div className="d-flex align-items-center">
                  <FaCheckCircle className="me-2" size={24} />
                  <div>
                    <strong>This consultation has been closed.</strong>
                    <p className="mb-0">Thank you for providing your medical advice.</p>
                  </div>
                </div>
              </Alert>
            ) : (
              <Form className="chat-form">
                <FormGroup className="mb-2">
                  <Label for="doctorResponse" className="medical-response-label">
                    <FaUserMd className="me-1" /> Medical Response
                  </Label>
                  <Input 
                    type="textarea" 
                    id="doctorResponse"
                    rows="4" 
                    placeholder="Enter your medical diagnosis, opinion, or recommendations..."
                    value={doctorResponse}
                    onChange={(e) => setDoctorResponse(e.target.value)}
                    className="chat-input"
                  />
                </FormGroup>
                <div className="chat-actions d-flex justify-content-between align-items-center">
                  <div className="response-tips">
                    <Badge color="light" className="me-1 cursor-pointer response-tip" onClick={() => setDoctorResponse(doctorResponse + "Based on your symptoms, I recommend ")}>+ Recommendation</Badge>
                    <Badge color="light" className="me-1 cursor-pointer response-tip" onClick={() => setDoctorResponse(doctorResponse + "Please schedule an in-person appointment for a thorough examination.")}>+ Visit</Badge>
                    <Badge color="light" className="cursor-pointer response-tip" onClick={() => setDoctorResponse(doctorResponse + "Your test results indicate ")}>+ Results</Badge>
                  </div>
                  <div>
                    <Button 
                      color="primary" 
                      className="me-2"
                      onClick={closeConsultation}
                      disabled={selectedChat?.status === 'closed'}
                    >
                      <FaCheckCircle className="me-2" /> Submit
                    </Button>
                    <Button 
                      color="light" 
                      onClick={toggleChatModal}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </Form>
            )}
          </div>
        </div>
      ) : (
        <Alert color="warning" className="m-3">No consultation selected.</Alert>
      )}
    </ModalBody>
  </Modal>

  // 3. Add new styles for the redesigned chat interface
  const chatNewStyle = `
    .consultation-card {
      transition: all 0.3s ease;
      border: none;
      overflow: hidden;
    }
    
    .consultation-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
    }
    
    .avatar-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .consultation-title {
      font-weight: 600;
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .consultation-preview {
      height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    
    .consultation-card .card-body {
      display: flex;
      flex-direction: column;
    }
    
    .empty-state {
      padding: 30px;
      border-radius: 10px;
      background-color: #f8f9fa;
    }
    
    .empty-icon {
      background-color: #e9ecef;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    
    .chat-date-separator {
      text-align: center;
      margin: 20px 0;
      position: relative;
    }
    
    .chat-date-separator:before {
      content: "";
      height: 1px;
      background-color: #dee2e6;
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      z-index: 1;
    }
    
    .chat-date-separator span {
      background-color: #f5f7f9;
      padding: 0 15px;
      position: relative;
      z-index: 2;
      color: #6c757d;
      font-size: 0.8rem;
    }
    
    .medical-response-label {
      font-weight: 600;
      color: #2c7a7b;
    }
    
    .message-content {
      display: flex;
      flex-direction: column;
      max-width: 80%;
    }
    
    .message-info {
      margin-top: 4px;
      padding-left: 12px;
    }
    
    .cursor-pointer {
      cursor: pointer;
    }
    
    .response-tip {
      transition: all 0.2s ease;
    }
    
    .response-tip:hover {
      background-color: #e9ecef;
    }
    
    .bg-gradient-primary {
      background: linear-gradient(135deg, #2c7a7b 0%, #3182ce 100%);
    }
  `;

  // Define the missing avatarCircleStyle constant
  const avatarCircleStyle = `
    .avatar-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .info-label {
      font-weight: bold;
      margin-right: 5px;
    }

    .message-bubble {
      max-width: 85%;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .user-message .message-wrapper {
      justify-content: flex-end;
      margin-left: 15%;
    }

    .ai-message .message-wrapper {
      justify-content: flex-start;
      margin-right: 15%;
    }
  `;

  // Define the missing chatStyle constant
  const chatStyle = `
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .chat-messages {
      flex-grow: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e0 transparent;
    }
    
    .chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    
    .chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .chat-messages::-webkit-scrollbar-thumb {
      background-color: #cbd5e0;
      border-radius: 3px;
    }
    
    .chat-input-container {
      background-color: #fff;
    }
    
    .chat-form {
      width: 100%;
    }
    
    .chat-input {
      width: 100%;
      resize: none;
      border-radius: 8px;
      border: 1px solid #ced4da;
      padding: 10px;
      font-size: 14px;
    }
    
    .chat-actions {
      width: 100%;
    }

    .chat-modal .modal-content {
      height: 90vh;
      max-height: 700px;
    }
    
    .chat-modal .modal-body {
      padding: 0;
      display: flex;
      flex-direction: column;
    }
  `;

  // 4. Update the main style section
  <style>
    {avatarCircleStyle}
    {chatStyle}
    {chatNewStyle}
  </style>

  // Function to test connection between doctor and patient
  const testConnection = (patient) => {
    if (!user || !patient) {
      toast.error("Missing user or patient data");
      return;
    }

    const doctorId = user?.id || user?._id;
    const doctorEmail = user?.email;
    const patientId = patient?.id || patient?._id;
    const patientEmail = patient?.email;
    
    // Show testing toast
    toast.info("Testing connection...", { autoClose: false, toastId: "connection-test" });
    
    console.log("Testing connection with:", {
      doctorId,
      doctorEmail,
      patientId,
      patientEmail
    });
    
    // Test a simple GET request first to check server connectivity
    axios.get(getApiUrl('api/messages')).then(response => {
      console.log("Server is reachable:", response.status);
      
      // Now try a direct API call to messages route with multiple identifiers
      axios.post(getApiUrl('api/messages/send'), {
        // Sender (doctor) information - provide multiple identifiers
        senderId: doctorId,
        senderEmail: doctorEmail,
        senderName: user?.fullname || user?.name,
        senderType: "doctor",
        
        // Receiver (patient) information - provide multiple identifiers
        receiverId: patientId,
        receiverEmail: patientEmail,
        receiverName: patient?.fullname || patient?.name,
        
        // Message content
        content: "This is a test message",
        messageType: "test",
        
        // Required role field for message validation
        role: "assistant"
      })
      .then(response => {
        console.log("Test message sent successfully:", response.data);
        toast.dismiss("connection-test");
        toast.success("Connection test passed! Message sent successfully.");
      })
      .catch(error => {
        console.error("Test message failed:", error);
        
        // Try with the alternative email-based route
        if (doctorEmail && patientEmail) {
          console.log("Trying alternative method using email identifiers...");
          
          axios.post(getApiUrl('api/messages/send-by-email'), {
            senderEmail: doctorEmail,
            senderName: user?.fullname || user?.name,
            senderType: "doctor",
            
            receiverEmail: patientEmail,
            receiverName: patient?.fullname || patient?.name,
            
            content: "This is a test message sent using email identifiers",
            messageType: "test",
            role: "assistant"
          })
          .then(altResponse => {
            console.log("Alternative test message sent successfully:", altResponse.data);
            toast.dismiss("connection-test");
            toast.success("Connection test passed using alternative method!");
          })
          .catch(altError => {
            console.error("Alternative test message failed:", altError);
            toast.dismiss("connection-test");
            toast.error(`Connection test failed with both methods. Check console for details.`);
            
            // Log all identifiers for debugging
            console.error("All available identifiers:", {
              doctor: {
                id: doctorId,
                email: doctorEmail,
                name: user?.fullname || user?.name
              },
              patient: {
                id: patientId, 
                email: patientEmail,
                name: patient?.fullname || patient?.name
              }
            });
          });
        } else {
          toast.dismiss("connection-test");
          toast.error(`Connection test failed: ${error.response?.data?.message || error.message}`);
        }
      });
    })
    .catch(error => {
      console.error("Server connection failed:", error);
      toast.dismiss("connection-test");
      toast.error(`Could not connect to server: ${error.message}`);
    });
  };

  // Update the sendDirectMessage function to implement test connection first
  const sendDirectMessage = (patient) => {
    // Set the patient to target
    setMessagePatient(patient);
    setMessageContent(`Hello ${patient.fullname || patient.name}, I'm Dr. ${user?.fullname || user?.name}.`);
    setMessageTemplate('default');
    setPreviousMessages([]);
    setShowPreviousMessages(false);
    
    // Test connection first
    testConnection(patient);
    
    // Close patient details modal and open message modal
    setSelectedPatientModal(false);
    setMessageModal(true);
    
    // Load previous messages with this patient
    loadPreviousMessages(patient.id || patient._id);
  };

  // دالة تحميل الرسائل السابقة
  const loadPreviousMessages = (patientId) => {
    if (!patientId || !user) return;
    
    setMessageLoading(true);
    axios.get(getApiUrl(`api/messages/between/${user.id || user._id}/${patientId}`))
      .then(response => {
        if (response.data && response.data.messages) {
          setPreviousMessages(response.data.messages);
        } else {
          setPreviousMessages([]);
        }
      })
      .catch(error => {
        console.error('Error loading previous messages:', error);
        setPreviousMessages([]);
      })
      .finally(() => {
        setMessageLoading(false);
      });
  };

  // تحسين دالة تنسيق اسم الطبيب
  const formatDoctorName = (name) => {
    if (!name) return 'Doctor';
    
    // إزالة المحارف الخاصة التي قد تسبب مشاكل في HTML أو JSON
    let formattedName = name.replace(/["'&<>]/g, '');
    
    // التأكد من عدم تكرار "Dr." في بداية الاسم
    if (!formattedName.startsWith('Dr.') && !formattedName.startsWith('Dr ')) {
      formattedName = `Dr. ${formattedName}`;
    }
    
    // في السابق كان هناك استبدال للنقطة بـ \\. وهذا مربك - نحذفه
    // formattedName = formattedName.replace(/\./g, '\\.');
    
    return formattedName;
  };

  // إضافة المزيد من قوالب الرسائل
  const selectMessageTemplate = (template) => {
    const patientName = messagePatient?.fullname || messagePatient?.name;
    // استخدام الدالة الجديدة لتنظيف اسم الطبيب
    const doctorName = formatDoctorName(user?.fullname || user?.name);
    
    switch(template) {
      case 'appointment':
        setMessageContent(`Hello ${patientName},
I would like to remind you of your upcoming appointment on [DATE] at [TIME].
Please arrive 15 minutes before your appointment and bring any previous medical reports.
Dr. ${doctorName}`);
        break;
      case 'followup':
        setMessageContent(`Hello ${patientName},
I hope you are doing well. I would like to check on your health condition after your last visit.
Have you noticed any improvement in symptoms? Have you been following the prescribed treatment?
Dr. ${doctorName}`);
        break;
      case 'results':
        setMessageContent(`Hello ${patientName},
I have received your test results and would like to discuss them with you.
Please schedule an appointment to see me at the clinic or call me at [PHONE NUMBER].
Dr. ${doctorName}`);
        break;
      case 'prescription':
        setMessageContent(`Hello ${patientName},
I have sent a new prescription to the pharmacy. You can collect your medication from any pharmacy using your ID number.
Medication instructions:
- [FIRST MEDICATION]: [USAGE INSTRUCTIONS] 
- [SECOND MEDICATION]: [USAGE INSTRUCTIONS]
If you experience any side effects, please contact me immediately.
Dr. ${doctorName}`);
        break;
      case 'lab':
        setMessageContent(`Hello ${patientName},
Please complete the following tests:
1. [FIRST TEST NAME]
2. [SECOND TEST NAME]
3. [THIRD TEST NAME]
You can have these tests at any accredited laboratory, and please bring the results to your next visit.
Dr. ${doctorName}`);
        break;
      case 'emergency':
        setMessageContent(`Hello ${patientName},
Based on the information you provided, I advise you to go to the nearest emergency room immediately. These symptoms require urgent medical evaluation.
I will be available for inquiries, but please do not delay visiting the emergency room.
Dr. ${doctorName}`);
        break;
      default:
        setMessageContent(`Hello ${patientName}, I'm Dr. ${doctorName}.`);
    }
    
    setMessageTemplate(template);
  };

  // دالة إرسال الرسالة
  const submitDirectMessage = () => {
    if (!messageContent.trim() || !messagePatient) {
      toast.error("Please enter a message and select a recipient");
      return;
    }
    
    // استخدام دالة formatDoctorName لتنظيف اسم الطبيب
    const cleanDoctorName = formatDoctorName(user?.fullname || user?.name || 'Doctor');
    
    // احصل على معرفات بديلة للطبيب والمريض للتأكد من أن الخادم يمكنه العثور عليهما
    const doctorId = user?.id || user?._id;
    const patientId = messagePatient?.id || messagePatient?._id;
    const patientEmail = messagePatient?.email; // استخدام البريد الإلكتروني كبديل إضافي
    
    console.log('Attempting to send message with this information:', {
      doctorId: doctorId,
      patientId: patientId,
      patientEmail: patientEmail,
      doctorName: cleanDoctorName,
      patientName: messagePatient?.fullname || messagePatient?.name || 'Patient'
    });
    
    // محاولة إرسال رسالة بكل المعلومات الممكنة للعثور على المستخدمين
    axios.post(getApiUrl('api/messages/send'), {
      // معلومات المرسل (الطبيب)
      senderId: doctorId,
      senderEmail: user?.email,
      senderName: cleanDoctorName,
      senderType: 'doctor',
      
      // معلومات المستقبل (المريض)
      receiverId: patientId,
      receiverEmail: patientEmail,
      receiverName: messagePatient?.fullname || messagePatient?.name || 'Patient',
      
      // معلومات الرسالة
      content: messageContent,
      messageType: 'direct',
      role: 'assistant', // إضافة الدور الإلزامي للرسالة
      
      // حقول إضافية قد تساعد في العثور على المستخدمين
      doctorId: doctorId,
      patientId: patientId
    })
    .then(response => {
      console.log('Message sent successfully:', response.data);
      toast.success('Message sent successfully');
      // إغلاق النافذة بعد الإرسال
      setMessageModal(false);
      setMessageContent('');
    })
    .catch(error => {
      console.error('Failed to send message:', error);
      
      // سجل تفاصيل أكثر حول الخطأ
      let errorDetails = '';
      if (error.response) {
        console.error('Server response data:', error.response.data);
        console.error('Server response status:', error.response.status);
        errorDetails = error.response.data.message || error.response.statusText;
      }
      
      // جرب طريقة بديلة إذا فشلت الطريقة الأولى
      if (error.response && error.response.status === 404 && error.response.data.message.includes('not found')) {
        toast.info('Trying alternative method to send message...');
        
        // استخدم الطريقة البديلة التي تعتمد على البريد الإلكتروني بدلاً من المعرفات
        axios.post(getApiUrl('api/messages/send-by-email'), {
          senderEmail: user?.email,
          senderName: cleanDoctorName,
          senderType: 'doctor',
          
          receiverEmail: patientEmail,
          receiverName: messagePatient?.fullname || messagePatient?.name,
          
          content: messageContent,
          messageType: 'direct',
          role: 'assistant'
        })
        .then(response => {
          console.log('Message sent via alternative method:', response.data);
          toast.success('Message sent successfully (alternative method)');
          setMessageModal(false);
          setMessageContent('');
        })
        .catch(altError => {
          console.error('Alternative method failed:', altError);
          toast.error(`Could not send message using any method: ${errorDetails || altError.message || 'Unknown error'}`);
        });
      } else {
        // عرض رسالة خطأ مفصلة
        toast.error(`Failed to send message: ${errorDetails || error.message || 'Unknown error'}`);
      }
    });
  };

  // إضافة أنماط CSS للمسنجر المطور
  const messageStyle = `
    .message-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .doctor-message {
      background-color: #e3f2fd;
      border-right: 3px solid #2196f3;
      text-align: right;
      margin-left: 20%;
    }
    
    .patient-message {
      background-color: #f5f5f5;
      border-left: 3px solid #9e9e9e;
      text-align: left;
      margin-right: 20%;
    }
    
    .message-item {
      transition: all 0.2s ease;
    }
    
    .message-item:hover {
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .template-tabs .badge {
      transition: all 0.3s ease;
    }
    
    .template-tabs .badge:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .bg-gradient-primary {
      background: linear-gradient(135deg, #2c7a7b 0%, #3182ce 100%);
    }
  `;

  // إضافة محتوى علامة تبويب الرسائل الواردة
  const renderMessagesContent = () => {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="section-title mb-0">
            <FaEnvelope className="me-2" />
            Incoming Messages
          </h5>
          <Button 
            color="primary" 
            size="sm"
            onClick={loadIncomingMessages}
            className="d-flex align-items-center"
          >
            <FaRedoAlt className="me-2" />
            Refresh
          </Button>
        </div>
        
        {loadingIncomingMessages ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading messages...</span>
            </div>
            <p className="mt-2">Loading messages...</p>
          </div>
        ) : incomingMessages.length === 0 ? (
          <div className="empty-state text-center py-5">
            <div className="empty-icon">
              <FaEnvelope size={48} className="text-muted mb-3" />
            </div>
            <h5>No Messages Yet</h5>
            <p className="text-muted">When patients send you messages, they will appear here.</p>
          </div>
        ) : (
          <div className="messages-list">
            {incomingMessages.map(message => (
              <motion.div
                key={message._id}
                className={`message-card p-3 mb-3 rounded ${!message.read ? 'bg-light border-start border-4 border-primary' : 'border'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="message-sender d-flex align-items-center">
                    <div className="sender-avatar me-2">
                      <FaUser size={20} className="text-primary bg-light p-1 rounded-circle" />
                    </div>
                    <div>
                      <h6 className="mb-0">{message.senderName || 'Patient'}</h6>
                      <small className="text-muted">
                        {new Date(message.createdAt).toLocaleString()}
                      </small>
                    </div>
                  </div>
                  <div>
                    {!message.read && (
                      <Badge color="primary" pill>New</Badge>
                    )}
                  </div>
                </div>
                <div className="message-content">
                  <p>{message.content}</p>
                </div>
                <div className="message-actions mt-2 d-flex justify-content-between">
                  <Button 
                    color="primary" 
                    size="sm"
                    onClick={() => {
                      // Find the patient and open reply modal
                      const patient = patients.find(p => p._id === message.senderId);
                      if (patient) {
                        sendDirectMessage(patient);
                      } else {
                        // If patient not in list, create temporary object
                        sendDirectMessage({
                          _id: message.senderId,
                          id: message.senderId,
                          fullname: message.senderName,
                          name: message.senderName,
                          email: 'Not available'
                        });
                      }
                    }}
                  >
                    Reply
                  </Button>
                  {!message.read && (
                    <Button 
                      color="secondary" 
                      size="sm"
                      onClick={() => {
                        // Mark message as read
                        axios.put(getApiUrl(`api/messages/${message._id}/read`))
                          .then(() => {
                            // Update local list
                            setIncomingMessages(prevMessages => 
                              prevMessages.map(msg => 
                                msg._id === message._id ? {...msg, read: true} : msg
                              )
                            );
                            toast.success('Message marked as read');
                          })
                          .catch(error => {
                            console.error('Error marking message as read:', error);
                            toast.error('Failed to mark message as read');
                          });
                      }}
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="dashboard-container">
      <style>{avatarCircleStyle}</style>
      <style>{chatStyle}</style>
      <style>{chatNewStyle}</style>
      <style>{messageStyle}</style>
      <Container fluid>
        <Row>
          <Col lg="12">
            <div className="dashboard-header mb-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.5 }}
                className="d-flex align-items-center"
              >
                <div className="doctor-avatar me-3">
                  <FaUserMd size={40} className="avatar-icon" />
                </div>
                <div>
                  <h4 className="doctor-name mb-0"> {user ? user.fullname || user.name : 'User'}</h4>
                  <p className="doctor-specialty mb-0">{user && user.specialty || 'General Medicine'}</p>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              className="dashboard-main-content" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-sm mb-4">
                <CardBody>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Row className="mb-4">
          <Col>
            <Card className="stats-card">
              <CardBody>
                <CardTitle tag="h4" className="card-title-icon mb-4">
                  <FaChartLine className="me-2 text-primary" />
                  Performance Overview
                </CardTitle>
                <Row>
                  <Col md={3} className="mb-4 mb-md-0">
                    <motion.div 
                      className="stat-item"
                      whileHover={{ y: -5 }}
                    >
                      <div className="stat-icon">
                        <FaUserInjured />
                      </div>
                      <h2>{patients.filter(p => p.status === 'active').length}</h2>
                      <p>Active Patients</p>
                    </motion.div>
                  </Col>
                  <Col md={3} className="mb-4 mb-md-0">
                    <motion.div 
                      className="stat-item"
                      whileHover={{ y: -5 }}
                    >
                      <div className="stat-icon">
                        <FaRegCalendarAlt />
                      </div>
                                  <h2>{realAppointments.length}</h2>
                      <p>Upcoming Appointments</p>
                    </motion.div>
                  </Col>
                  <Col md={3} className="mb-4 mb-md-0">
                    <motion.div 
                      className="stat-item"
                      whileHover={{ y: -5 }}
                    >
                      <div className="stat-icon">
                        <FaCalendarCheck />
                      </div>
                      <h2>12</h2>
                      <p>Sessions This Week</p>
                    </motion.div>
                  </Col>
                  <Col md={3}>
                    <motion.div 
                      className="stat-item"
                      whileHover={{ y: -5 }}
                    >
                      <div className="stat-icon">
                        <FaThumbsUp />
                      </div>
                      <h2>85%</h2>
                      <p>Patient Satisfaction</p>
                    </motion.div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Row>
          <Col>
            <Card className="dashboard-card">
              <CardBody>
                <div className="tabs-container">
                  <Nav tabs className="custom-tabs">
                    <NavItem>
                        <NavLink
                        className={activeTab === 'appointments' ? 'active' : ''}
                        onClick={() => setActiveTab('appointments')}
                        >
                        <FaCalendarAlt className="me-2" />
                        Appointments
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                        className={activeTab === 'consultations' ? 'active' : ''}
                        onClick={() => setActiveTab('consultations')}
                        >
                        <FaComments className="me-2" />
                        Consultations
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                        className={activeTab === 'patients' ? 'active' : ''}
                        onClick={() => setActiveTab('patients')}
                        >
                        <FaUserInjured className="me-2" />
                        Patients
                        </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={activeTab === 'messages' ? 'active' : ''}
                        onClick={() => setActiveTab('messages')}
                      >
                        <FaEnvelope className="me-2" />
                        Messages 
                        {incomingMessages.filter(msg => !msg.read).length > 0 && (
                          <Badge 
                            color="danger" 
                            pill 
                            className="ms-1 badge-notification"
                          >
                            {incomingMessages.filter(msg => !msg.read).length}
                          </Badge>
                        )}
                      </NavLink>
                    </NavItem>
                  </Nav>
                </div>

                <div className="tab-content mt-4">
                              {activeTab === 'appointments' && (
                    <motion.div
                                  key="appointments"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                                  {renderAppointmentsContent()}
                    </motion.div>
                  )}

                              {activeTab === 'consultations' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                                  className="consultations-container"
                    >
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="section-title mb-0">
                                      <FaComments className="me-2" />
                                      Medical Consultations
                        </h5>
                                    <Button 
                                      color="primary" 
                                      size="sm"
                                      onClick={loadPatientChats}
                                      className="d-flex align-items-center"
                                    >
                                      <FaRedoAlt className="me-2" />
                                      Refresh
                                    </Button>
                      </div>
                                  
                                  {loadingChats ? (
                                    <div className="text-center py-5">
                                      <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                      </div>
                                      <p className="mt-2">Loading consultations...</p>
                                    </div>
                                  ) : patientChats.length === 0 ? (
                                    <div className="empty-state text-center py-5">
                                      <div className="empty-icon">
                                        <FaComments size={48} className="text-muted mb-3" />
                                      </div>
                                      <h5>No Consultations Yet</h5>
                                      <p className="text-muted">When patients start medical consultations, they will appear here.</p>
                                    </div>
                                  ) : (
                                    <Row className="consultation-cards">
                                      {patientChats.map((chat, idx) => (
                                        <Col lg={4} md={6} className="mb-4" key={chat._id}>
                                          <Card 
                                            className="consultation-card shadow-sm h-100"
                                            onClick={() => loadChatMessages(chat._id)}
                                            style={{ cursor: 'pointer' }}
                                          >
                                            <CardBody>
                                              <div className="d-flex justify-content-between mb-3">
                                                <Badge
                                                  color={
                                                    chat.status === 'closed'
                                                      ? 'success'
                                                      : chat.status === 'in-progress'
                                                      ? 'warning'
                                                      : 'info'
                                                  }
                                                  pill
                                                  className="px-3 py-2"
                                                >
                                                  {chat.status || 'open'}
                                                </Badge>
                                                <small className="text-muted">
                                                  {new Date(chat.updatedAt || chat.createdAt).toLocaleDateString()}
                                                </small>
                                              </div>
                                              
                                              <div className="d-flex align-items-center mb-3">
                                                <div className="patient-avatar me-3">
                                                  <div className="avatar-circle bg-primary">
                                                    <FaUser className="text-white" />
                                                  </div>
                                                </div>
                                                <div>
                                                  <h6 className="mb-0">{chat.patientName || 'Unknown Patient'}</h6>
                                                  <small className="text-muted">Patient</small>
                                                </div>
                                              </div>
                                              
                                              <h6 className="consultation-title">
                                                {chat.title || 'Medical Consultation'}
                                              </h6>
                                              
                                              <p className="consultation-preview text-muted">
                                                {chat.lastMessage || 'Click to view this consultation and provide medical advice.'}
                                              </p>
                                              
                                              <div className="d-flex justify-content-between align-items-center mt-3">
                                                <div className="message-count">
                                                  <FaComments className="me-1 text-primary" />
                                                  <small>{chat.messageCount || 'No'} messages</small>
                                                </div>
                                                <Button
                                                  color="primary"
                                                  size="sm"
                                                  className="view-btn"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    loadChatMessages(chat._id);
                                                  }}
                                                >
                                                  <FaComments className="me-1" /> View
                                                </Button>
                                  </div>
                                            </CardBody>
                                          </Card>
                                        </Col>
                            ))}
                                    </Row>
                                  )}
                    </motion.div>
                  )}

                  {activeTab === 'patients' && (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="section-title mb-0">
                          <FaUserInjured className="me-2" />
                          Your Patients
                      </h5>
                        <Button 
                          color="primary" 
                          size="sm"
                          onClick={loadDoctorPatients}
                          className="d-flex align-items-center"
                        >
                          <FaRedoAlt className="me-2" />
                          Refresh
                        </Button>
                      </div>
                      
                      {loadingPatients ? (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2">Loading patients...</p>
                        </div>
                      ) : patients.length === 0 ? (
                        <Alert color="info">
                          <div className="text-center py-4">
                            <FaUserInjured size={40} className="mb-3 text-muted" />
                            <h5>No patients found</h5>
                            <p className="text-muted">You don't have any patients yet. They will appear here once they book appointments with you.</p>
                          </div>
                        </Alert>
                      ) : (
                      <Row>
                          {patients.map((patient, index) => (
                            <Col md={6} lg={4} key={patient._id || patient.id || index} className="mb-4">
                              <Card className="patient-card h-100 shadow-sm">
                              <CardBody>
                                  <div className="d-flex align-items-center mb-3">
                                    <div className="patient-avatar me-3">
                                      <div className="avatar-circle bg-primary text-white">
                                        <FaUser size={24} />
                                </div>
                                    </div>
                                    <div>
                                      <h5 className="mb-0">{patient.fullname || patient.name}</h5>
                                      <small className="text-muted d-flex align-items-center">
                                        <FaEnvelope className="me-1" size={12} /> {patient.email}
                                      </small>
                                      {patient.phone && (
                                        <small className="text-muted d-flex align-items-center mt-1">
                                          <FaPhone className="me-1" size={12} /> {patient.phone}
                                        </small>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="patient-stats d-flex mb-3">
                                    <div className="stat me-3">
                                      <Badge color="info" pill className="px-3 py-2">
                                        <FaCalendarAlt className="me-1" /> 
                                        {patient.appointmentCount || 0} Appointments
                                      </Badge>
                                    </div>
                                    <div className="stat">
                                      <Badge color="light" pill className="px-3 py-2 text-muted">
                                        <FaRegCalendarAlt className="me-1" />
                                        Last: {patient.lastAppointment ? new Date(patient.lastAppointment).toLocaleDateString() : 'N/A'}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="patient-actions d-flex justify-content-between mt-3">
                                    <Button 
                                      color="primary" 
                                      size="sm"
                                      onClick={() => viewPatientDetails(patient)}
                                      className="flex-fill me-2"
                                    >
                                      <FaUser className="me-1" /> View Details
                                    </Button>
                                    <Button 
                                      color="outline-primary" 
                                      size="sm"
                                      onClick={() => sendDirectMessage(patient)}
                                      className="flex-fill"
                                    >
                                      <FaEnvelope className="me-1" /> Message
                                    </Button>
                                  </div>
                              </CardBody>
                            </Card>
                        </Col>
                          ))}
                        </Row>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'messages' && (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {renderMessagesContent()}
                          </motion.div>
                  )}
                                </div>
                              </CardBody>
                            </Card>
                        </Col>
                      </Row>
                    </motion.div>
              </CardBody>
            </Card>
            </motion.div>
          </Col>
        </Row>
    </Container>
      
      {/* نافذة تأكيد الموعد */}
      <Modal isOpen={confirmModal} toggle={closeConfirmModal} size="md">
        <ModalHeader toggle={closeConfirmModal}>
          <FaCheckCircle className="text-success me-2" /> Confirm Appointment
        </ModalHeader>
        <ModalBody>
          {selectedAppointment && (
            <div>
              <div className="appointment-details mb-4">
                <h6 className="mb-3">Appointment Details:</h6>
                <p>
                  <strong>Patient:</strong> {selectedAppointment.patient || selectedAppointment.referenceNumber}
                </p>
                <p>
                  <strong>Date:</strong> {selectedAppointment.date}
                </p>
                <p>
                  <strong>Time:</strong> {selectedAppointment.time}
                </p>
                <p>
                  <strong>Type:</strong> {selectedAppointment.type}
                </p>
                {selectedAppointment.notes && (
                  <p>
                    <strong>Patient Notes:</strong> {selectedAppointment.notes}
                  </p>
                )}
              </div>
              
              <Form>
                <FormGroup>
                  <Label for="doctorNotes">
                    <FaStickyNote className="me-2" />
                    Add notes for the patient (optional):
                  </Label>
                  <Input
                    type="textarea"
                    id="doctorNotes"
                    rows="4"
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Enter any instructions, preparation details or other information the patient should know..."
                  />
                </FormGroup>
                
                <FormGroup check className="mb-3">
                  <Label check>
                    <Input 
                      type="checkbox" 
                      checked={sendEmailNotification}
                      onChange={() => setSendEmailNotification(!sendEmailNotification)}
                    />{' '}
                    <FaEnvelope className="me-1" /> 
                    Send email notification to patient
                  </Label>
                </FormGroup>
              </Form>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={closeConfirmModal}>
            Cancel
          </Button>
          <Button color="success" onClick={handleConfirmAppointment}>
            <FaCheckCircle className="me-1" /> Confirm Appointment
          </Button>
        </ModalFooter>
      </Modal>
      
      {/* Modal para ver conversaciones */}
      <Modal isOpen={chatModalOpen} toggle={toggleChatModal} size="xl" className="chat-modal" backdrop="static">
        <ModalHeader toggle={toggleChatModal} className="border-0 bg-gradient-primary text-white">
          <div className="d-flex align-items-center justify-content-between w-100">
            <div className="d-flex align-items-center">
              {selectedChat && selectedChat.patientName && (
                <div className="patient-avatar me-3">
                  <div className="avatar-circle bg-white text-primary">
                    <FaUser size={18} />
                  </div>
                </div>
              )}
              <div>
                <h5 className="mb-0">
                  {selectedChat ? 
                    `Consultation with ${selectedChat.patientName || 'Patient'}` : 
                    'Medical Consultation'
                  }
                </h5>
                <div className="d-flex align-items-center mt-1">
                  {selectedChat && (
                    <>
                      <Badge
                        color={
                          selectedChat.status === 'closed'
                            ? 'success'
                            : selectedChat.status === 'in-progress'
                            ? 'warning'
                            : 'info'
                        }
                        pill
                        className="me-2"
                      >
                        {selectedChat.status || 'open'}
                      </Badge>
                      <small className="text-white-50">
                        Started {selectedChat.createdAt ? new Date(selectedChat.createdAt).toLocaleDateString() : 'recently'}
                      </small>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="chat-modal-body p-0">
          {selectedChat ? (
            <div className="chat-container h-100 d-flex flex-column">
              <div className="chat-messages p-3 flex-grow-1" style={{ maxHeight: '60vh', overflowY: 'auto', backgroundColor: '#f5f7f9' }}>
                {chatMessages.length === 0 ? (
                  <div className="empty-chat text-center py-5">
                    <FaComments size={48} className="text-muted mb-3" />
                    <h5>No messages yet</h5>
                    <p className="text-muted">There are no messages in this consultation.</p>
                  </div>
                ) : (
                  <>
                    <div className="chat-date-separator">
                      <span>Consultation started {selectedChat.createdAt ? new Date(selectedChat.createdAt).toLocaleDateString() : 'recently'}</span>
                    </div>
                    {chatMessages.map((msg, index) => {
                      // Check if we need to add a date separator
                      const showDateSeparator = index > 0 && 
                        new Date(msg.timestamp).toDateString() !== new Date(chatMessages[index-1].timestamp).toDateString();
                      
                      // Use role to determine message display
                      const isUserMessage = msg.role === 'user';
                      const isDoctorMessage = msg.role === 'assistant' && msg.fromDoctor;
                      const isAIMessage = msg.role === 'assistant' && !msg.fromDoctor;
                      
                      return (
                        <React.Fragment key={index}>
                          {showDateSeparator && (
                            <div className="chat-date-separator">
                              <span>{new Date(msg.timestamp).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div 
                            className={`chat-message mb-3 ${isUserMessage ? 'user-message' : 'ai-message'}`}
                          >
                            <div className="message-wrapper d-flex">
                              <div className="message-avatar me-2">
                                {isUserMessage ? (
                                  <div className="avatar-circle bg-primary text-white">
                                    <FaUser size={16} />
                                  </div>
                                ) : isDoctorMessage ? (
                                  <div className="avatar-circle bg-success text-white">
                                    <FaUserMd size={16} />
                                  </div>
                                ) : (
                                  <div className="avatar-circle bg-info text-white">
                                    <FaRobot size={16} />
                                  </div>
                                )}
                              </div>
                              <div className="message-content">
                                <div className={`message-bubble p-3 rounded-3 ${
                                  isUserMessage ? 'bg-primary text-white' : 
                                  isDoctorMessage ? 'bg-success text-white' : 
                                  'bg-white'
                                }`}>
                                  <div className="message-text">{msg.content}</div>
                                </div>
                                <div className="message-info">
                                  <small className="text-muted">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    {isDoctorMessage && <span className="ms-2 badge bg-light text-dark">Doctor's Response</span>}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </div>
              
              <div className="chat-input-container p-3 border-top" style={{ backgroundColor: '#fff' }}>
                {selectedChat.status === 'closed' ? (
                  <Alert color="success" className="mb-0">
                    <div className="d-flex align-items-center">
                      <FaCheckCircle className="me-2" size={24} />
                      <div>
                        <strong>This consultation has been closed.</strong>
                        <p className="mb-0">Thank you for providing your medical advice.</p>
                      </div>
                    </div>
                  </Alert>
                ) : (
                  <Form className="chat-form">
                    <FormGroup className="mb-2">
                      <Label for="doctorResponse" className="medical-response-label">
                        <FaUserMd className="me-1" /> Medical Response
                      </Label>
                      <Input 
                        type="textarea" 
                        id="doctorResponse"
                        rows="4" 
                        placeholder="Enter your medical diagnosis, opinion, or recommendations..."
                        value={doctorResponse}
                        onChange={(e) => setDoctorResponse(e.target.value)}
                        className="chat-input"
                      />
                    </FormGroup>
                    <div className="chat-actions d-flex justify-content-between align-items-center">
                      <div className="response-tips">
                        <Badge color="light" className="me-1 cursor-pointer response-tip" onClick={() => setDoctorResponse(doctorResponse + "Based on your symptoms, I recommend ")}>+ Recommendation</Badge>
                        <Badge color="light" className="me-1 cursor-pointer response-tip" onClick={() => setDoctorResponse(doctorResponse + "Please schedule an in-person appointment for a thorough examination.")}>+ Visit</Badge>
                        <Badge color="light" className="cursor-pointer response-tip" onClick={() => setDoctorResponse(doctorResponse + "Your test results indicate ")}>+ Results</Badge>
                      </div>
                      <div>
                        <Button 
                          color="primary" 
                          className="me-2"
                          onClick={closeConsultation}
                          disabled={selectedChat?.status === 'closed'}
                        >
                          <FaCheckCircle className="me-2" /> Submit
                        </Button>
                        <Button 
                          color="light" 
                          onClick={toggleChatModal}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </Form>
                )}
              </div>
            </div>
          ) : (
            <Alert color="warning" className="m-3">No consultation selected.</Alert>
          )}
        </ModalBody>
      </Modal>

      {renderPatientDetailsModal()}

      {/* إضافة مكون Modal لواجهة إرسال الرسائل */}
      <Modal isOpen={messageModal} toggle={() => setMessageModal(false)} size="lg">
        <ModalHeader toggle={() => setMessageModal(false)} className="bg-gradient-primary text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <FaEnvelope className="me-2" /> 
            <span>Send Direct Message</span>
          </div>
          {previousMessages.length > 0 && (
            <Button 
              color="light" 
              size="sm" 
              onClick={() => setShowPreviousMessages(!showPreviousMessages)}
              className="ms-2"
            >
              {showPreviousMessages ? 'Hide Previous Messages' : 'Show Previous Messages'} ({previousMessages.length})
            </Button>
          )}
        </ModalHeader>
        <ModalBody className="p-0">
          {messagePatient && (
            <div className="message-container">
              <div className="recipient-info p-3 border-bottom">
                <div className="d-flex align-items-center">
                  <div className="recipient-avatar me-3">
                    <div className="avatar-circle bg-primary text-white">
                      <FaUser size={16} />
                    </div>
                  </div>
                  <div>
                    <h6 className="mb-0">Recipient: {messagePatient.fullname || messagePatient.name}</h6>
                    <small className="text-muted">{messagePatient.email}</small>
                  </div>
                </div>
              </div>
              
              {showPreviousMessages && (
                <div className="previous-messages p-3 border-bottom bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <h6 className="mb-3 d-flex align-items-center">
                    <FaHistory className="me-2" /> Previous Messages
                  </h6>
                  
                  {messageLoading ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 small text-muted">Loading messages...</p>
                    </div>
                  ) : previousMessages.length === 0 ? (
                    <p className="text-muted text-center py-2">No previous messages with this patient</p>
                  ) : (
                    <div className="messages-list">
                      {previousMessages.map((msg, idx) => (
                        <div key={idx} className={`message-item mb-2 p-2 rounded ${msg.senderType === 'doctor' ? 'doctor-message' : 'patient-message'}`}>
                          <div className="message-header d-flex justify-content-between align-items-center mb-1">
                            <small className="sender-info">
                              {msg.senderType === 'doctor' ? 'You' : messagePatient.fullname || messagePatient.name}
                            </small>
                            <small className="message-time text-muted">
                              {new Date(msg.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                          <div className="message-body">{msg.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="message-form p-3">
                <div className="message-templates mb-3">
                  <Label className="d-block mb-2">Choose a message template:</Label>
                  <div className="template-tabs">
                    <div className="d-flex flex-wrap">
                      <Badge
                        color={messageTemplate === 'default' ? 'primary' : 'light'}
                        className="me-2 mb-2 p-2 cursor-pointer"
                        onClick={() => selectMessageTemplate('default')}
                        style={{ cursor: 'pointer' }}
                      >
                        <FaEnvelope className="me-1" /> Default Message
                      </Badge>
                      <Badge
                        color={messageTemplate === 'appointment' ? 'primary' : 'light'}
                        className="me-2 mb-2 p-2 cursor-pointer"
                        onClick={() => selectMessageTemplate('appointment')}
                        style={{ cursor: 'pointer' }}
                      >
                        <FaCalendarAlt className="me-1" /> Appointment Reminder
                      </Badge>
                      <Badge
                        color={messageTemplate === 'followup' ? 'primary' : 'light'}
                        className="me-2 mb-2 p-2 cursor-pointer"
                        onClick={() => selectMessageTemplate('followup')}
                        style={{ cursor: 'pointer' }}
                      >
                        <FaClipboardList className="me-1" /> Follow-up
                      </Badge>
                      <Badge
                        color={messageTemplate === 'results' ? 'primary' : 'light'}
                        className="me-2 mb-2 p-2 cursor-pointer"
                        onClick={() => selectMessageTemplate('results')}
                        style={{ cursor: 'pointer' }}
                      >
                        <FaFileAlt className="me-1" /> Test Results
                      </Badge>
                      <Badge
                        color={messageTemplate === 'prescription' ? 'primary' : 'light'}
                        className="me-2 mb-2 p-2 cursor-pointer"
                        onClick={() => selectMessageTemplate('prescription')}
                        style={{ cursor: 'pointer' }}
                      >
                        <FaFileMedical className="me-1" /> Prescription
                      </Badge>
                      <Badge
                        color={messageTemplate === 'lab' ? 'primary' : 'light'}
                        className="me-2 mb-2 p-2 cursor-pointer"
                        onClick={() => selectMessageTemplate('lab')}
                        style={{ cursor: 'pointer' }}
                      >
                        <FaFlask className="me-1" /> Lab Request
                      </Badge>
                      <Badge
                        color={messageTemplate === 'emergency' ? 'primary' : 'light'}
                        className="me-2 mb-2 p-2 cursor-pointer"
                        onClick={() => selectMessageTemplate('emergency')}
                        style={{ cursor: 'pointer' }}
                      >
                        <FaExclamationTriangle className="me-1" /> Emergency
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <FormGroup>
                  <Label for="messageContent" className="fw-bold">Message Content:</Label>
                  <Input
                    type="textarea"
                    id="messageContent"
                    rows="6"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="mb-3"
                  />
                </FormGroup>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="secondary" onClick={() => setMessageModal(false)}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={submitDirectMessage}
            disabled={!messageContent.trim() || !messagePatient}
            className="d-flex align-items-center justify-content-center"
            style={{ gap: '6px', padding: '8px 16px' }}
          >
            <FaEnvelope size={14} /> Send
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default DoctorsDashboard; 