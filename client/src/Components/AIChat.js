import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Input, Button, Alert, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import * as ENV from '../config/env';
import { FaPaperPlane, FaRobot, FaUser, FaInfoCircle, FaEllipsisV, FaTrash, FaSave, FaPlus, FaBars, FaTimes, FaArrowLeft, FaUserMd, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

// Typing animation component
const TypingAnimation = ({ text, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const typingSpeed = 10; // milliseconds per batch
  const charsPerBatch = 3; // Process 3 characters at once
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        // Add multiple characters at once
        const endIndex = Math.min(currentIndex + charsPerBatch, text.length);
        const nextChunk = text.substring(currentIndex, endIndex);
        setDisplayText(prevText => prevText + nextChunk);
        setCurrentIndex(endIndex);
      }, typingSpeed);
      
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);
  
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: displayText }} />
      {currentIndex < text.length && <span className="typing-cursor"></span>}
    </>
  );
};

const AIChat = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.",
      formattedContent: "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.",
      isTyping: false
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [savedConversations, setSavedConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState('default');
  const [newChatDropdown, setNewChatDropdown] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [currentlyTyping, setCurrentlyTyping] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Toggle dropdown
  const toggle = () => setDropdownOpen(prevState => !prevState);
  const toggleNewChat = () => setNewChatDropdown(prevState => !prevState);
  const toggleSidebar = () => setShowSidebar(prevState => !prevState);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) {
        setShowSidebar(true);
      } else {
        setShowSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Load saved conversations from localStorage
  useEffect(() => {
    if (user && user.email) {
      // Load list of conversations
      const localSavedConversations = JSON.parse(localStorage.getItem(`medconnect_conversations_${user.email}`)) || [];
      
      // Si no hay conversaciones guardadas, crear una nueva por defecto
      if (localSavedConversations.length === 0) {
        const defaultConvId = 'conv_' + Date.now();
        const defaultConversation = {
          id: defaultConvId,
          title: 'New Conversation',
          timestamp: new Date()
        };
        
        // Guardar en localStorage
        localStorage.setItem(`medconnect_conversations_${user.email}`, JSON.stringify([defaultConversation]));
        localStorage.setItem(`medconnect_active_conversation_${user.email}`, defaultConvId);
        
        // Establecer como conversación activa
        setActiveConversation(defaultConvId);
        setSavedConversations([defaultConversation]);
        
        // Guardar el historial inicial
        const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
        const initialHistory = [
          {
            role: 'assistant',
            content: welcomeMsg,
            timestamp: new Date()
          }
        ];
        
        setChatHistory(initialHistory);
        localStorage.setItem(`medconnect_chat_${user.email}_${defaultConvId}`, JSON.stringify(initialHistory));
      } else {
        // Si hay conversaciones guardadas, establecer la lista y cargar la activa
        setSavedConversations(localSavedConversations);
        
        // Check if there's an active conversation
        const lastActiveConv = localStorage.getItem(`medconnect_active_conversation_${user.email}`);
        
        if (lastActiveConv) {
          setActiveConversation(lastActiveConv);
          
          // Load chat history for the active conversation
          const savedChatHistory = JSON.parse(localStorage.getItem(`medconnect_chat_${user.email}_${lastActiveConv}`));
          
          if (savedChatHistory && savedChatHistory.length > 0) {
            setChatHistory(savedChatHistory);
          }
        } else if (localSavedConversations.length > 0) {
          // If no active conversation but there are saved ones, set the first as active
          setActiveConversation(localSavedConversations[0].id);
          
          // Load chat history for this conversation
          const savedChatHistory = JSON.parse(localStorage.getItem(`medconnect_chat_${user.email}_${localSavedConversations[0].id}`));
          
          if (savedChatHistory && savedChatHistory.length > 0) {
            setChatHistory(savedChatHistory);
          }
        }
      }
    }
  }, [user]);

  // Prevent body scrolling when chat component mounts
  useEffect(() => {
    // Save original body style
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // Prevent scrolling on the body
    document.body.style.overflow = 'hidden';
    
    // Restore original scrolling when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    // Redirect if not logged in
    if (!user || !user.email) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);
  
  // Load chat history when it changes
  useEffect(() => {
    if (user && user.email && activeConversation) {
      const historyForStorage = chatHistory.map(msg => ({
        ...msg,
        isTyping: false // Always save as fully typed in localStorage
      }));
      
      localStorage.setItem(`medconnect_chat_${user.email}_${activeConversation}`, JSON.stringify(historyForStorage));
      localStorage.setItem(`medconnect_active_conversation_${user.email}`, activeConversation);
    }
  }, [chatHistory, user, activeConversation]);

  // Complete rewrite of startNewChat to fix disappearing conversations
  const startNewChat = useCallback(() => {
    console.log("Creating new conversation...");
    
    try {
      // Generate a unique ID for the new conversation
      const newConvId = 'conv_' + Date.now();
      console.log("New conversation ID:", newConvId);
      
      // Create welcome message
      const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
      
      // Create initial message
      const initialMessage = {
        role: 'assistant',
        content: welcomeMsg,
        timestamp: new Date()
      };
      
      // Create the new conversation object
      const newConversation = {
        id: newConvId,
        title: 'New Conversation',
        timestamp: new Date()
      };
      
      // Create a copy of current conversations to add the new one
      const updatedConversations = [newConversation, ...savedConversations];
      
      // First update localStorage (synchronous)
      if (user && user.email) {
        // Save welcome message
        localStorage.setItem(
          `medconnect_chat_${user.email}_${newConvId}`, 
          JSON.stringify([initialMessage])
        );
        
        // Save updated conversation list
        localStorage.setItem(
          `medconnect_conversations_${user.email}`,
          JSON.stringify(updatedConversations)
        );
        
        // Set as active conversation
        localStorage.setItem(`medconnect_active_conversation_${user.email}`, newConvId);
      }
      
      // Then update all state in a batch (help prevent partial renders)
      setSavedConversations(updatedConversations);
      setActiveConversation(newConvId);
      setChatHistory([initialMessage]);
      
      // Mobile view handling
      if (isMobile) {
        setShowSidebar(false);
      }
      
      console.log("New conversation created successfully");
      toast.success('New conversation created');
      
    } catch (error) {
      console.error("Error creating new conversation:", error);
      toast.error('Error creating new conversation');
    }
  }, [savedConversations, user, isMobile]);
  
  // Handle sending message and getting response
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Prepare user message
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      
      // Update local chat history with user message
      setChatHistory(prev => [...prev, userMessage]);
      
      // Guardar mensaje en la base de datos si el usuario está autenticado
      let conversationId = activeConversation;
      
      // Update conversation title if this is the first message in a conversation
      if (chatHistory.length === 1 && chatHistory[0].role === 'assistant') {
        // This is the first user message, use it to create a better title
        const shortTitle = message.length > 30 ? message.substring(0, 27) + '...' : message;
        
        // Update title in state
        setSavedConversations(prev => 
          prev.map(conv => 
            conv.id === activeConversation 
              ? {...conv, title: shortTitle} 
              : conv
          )
        );
        
        // Update title in localStorage
        if (user && user.email) {
          const savedConvs = JSON.parse(localStorage.getItem(`medconnect_conversations_${user.email}`)) || [];
          const updatedConvs = savedConvs.map(conv => 
            conv.id === activeConversation 
              ? {...conv, title: shortTitle} 
              : conv
          );
          localStorage.setItem(`medconnect_conversations_${user.email}`, JSON.stringify(updatedConvs));
        }
      }
      
      if (user && (user.id || user._id)) {
        const userId = user.id || user._id;
        
        // Verificar si ya existe una conversación en la base de datos
        try {
          // Si el ID de conversación no es un ObjectId MongoDB válido, crear una nueva
          if (!conversationId || conversationId.length !== 24) {
            // Determinar si esto debería ser una consulta médica
            const isMedicalConsultation = message.toLowerCase().includes('doctor') || 
                                         message.toLowerCase().includes('medical') || 
                                         message.toLowerCase().includes('appointment') ||
                                         message.toLowerCase().includes('consult');
            
            // Datos para la nueva conversación
            const conversationData = {
              userId,
              title: isMedicalConsultation ? 'Medical Consultation' : 'New Conversation',
              initialMessage: message,
              isMedicalConsultation: isMedicalConsultation
            };
            
            // Si el usuario es un paciente y menciona un doctor específico, intentar asociarlo
            if (user.role === 'patient' && isMedicalConsultation) {
              try {
                // Obtener historial de citas del usuario
                const appointmentsResponse = await axios.get(`${ENV.SERVER_URL}/api/appointments/user/${userId}`);
                
                if (appointmentsResponse.data && appointmentsResponse.data.length > 0) {
                  // Encontrar la cita más reciente confirmada
                  const recentAppointment = appointmentsResponse.data
                    .filter(app => app.status === 'confirmed')
                    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                  
                  if (recentAppointment && recentAppointment.doctor) {
                    // Asociar la conversación con el doctor de la cita más reciente
                    conversationData.doctorId = recentAppointment.doctor;
                    conversationData.appointmentId = recentAppointment._id;
                  }
                }
              } catch (error) {
                console.error("Error fetching appointments for chat association:", error);
              }
            }
            
            // Crear una nueva conversación
            const createResponse = await axios.post(`${ENV.SERVER_URL}/api/chat/conversations`, conversationData);
            
            if (createResponse.data && createResponse.data.conversation) {
              conversationId = createResponse.data.conversation._id;
              console.log("Created new conversation:", conversationId);
              
              // Actualizar ID de conversación activa
              setActiveConversation(conversationId);
              
              // Agregar a lista de conversaciones
              const newConversation = {
                id: conversationId,
                title: createResponse.data.conversation.title,
                timestamp: new Date()
              };
              
              setSavedConversations(prev => [newConversation, ...prev]);
            }
          } else {
            // Agregar mensaje a conversación existente
            await axios.post(`${ENV.SERVER_URL}/api/chat/conversations/${conversationId}/messages`, {
              role: 'user',
              content: message
            });
          }
        } catch (error) {
          console.error("Error saving message to database:", error);
          // Continuar con la conversación local incluso si falla la base de datos
        }
      }
      
      // Clear input
      setMessage('');
      
      // Prepare API call to get AI response
      const response = await axios.post(`${ENV.SERVER_URL.replace('/api', '')}/chat`, {
        message
      });
      
      // Add AI response to local chat history
      if (response.data.response) {
        // Remove any prefix like "Here's the response to: [message]"
        let cleanResponse = response.data.response;
        cleanResponse = cleanResponse.replace(/^Here's the response to:.*?\n?/i, '');
        cleanResponse = cleanResponse.trim();
        
        const aiMessage = {
          role: 'assistant',
          content: cleanResponse,
          isTyping: true,
          timestamp: new Date()
        };
        
        // Add AI message with typing animation
        setChatHistory(prev => [...prev, aiMessage]);
        setCurrentTypingIndex(chatHistory.length + 1);
        
        // Guardar respuesta de la IA en la base de datos
        if (user && (user.id || user._id) && conversationId && conversationId.length === 24) {
          try {
            await axios.post(`${ENV.SERVER_URL}/api/chat/conversations/${conversationId}/messages`, {
              role: 'assistant',
              content: cleanResponse
            });
          } catch (error) {
            console.error("Error saving AI response to database:", error);
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error processing message:", error);
      setIsLoading(false);
      
      // Add error message to chat
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      }]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle when a message finishes typing
  const handleTypingComplete = (index) => {
    setChatHistory(prev => 
      prev.map((msg, i) => 
        i === index ? { ...msg, isTyping: false } : msg
      )
    );
    setCurrentlyTyping(false);
    setCurrentTypingIndex(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendMessage();
  };
  
  const switchConversation = async (conversationId) => {
    if (activeConversation !== conversationId) {
      setActiveConversation(conversationId);
      
      try {
        // Primero intentar cargar mensajes de la API
        if (conversationId && conversationId.length === 24) {
          // Este es un ID de MongoDB válido, cargar de la API
          try {
            const response = await axios.get(`${ENV.SERVER_URL}/api/chat/conversations/${conversationId}`);
            
            if (response.data && response.data.conversation && response.data.conversation.messages) {
              // Actualizar el historial de chat con los mensajes de la API
              setChatHistory(response.data.conversation.messages);
              
              // Guardar también en localStorage para acceso offline
              if (user && user.email) {
                localStorage.setItem(`medconnect_chat_${user.email}_${conversationId}`, 
                  JSON.stringify(response.data.conversation.messages));
              }
              
              // También actualizar localStorage para mantener la conversación activa
              localStorage.setItem(`medconnect_active_conversation_${user.email}`, conversationId);
              
              console.log("Loaded conversation from API:", conversationId);
              
              // Si se cargó correctamente de la API, no necesitamos revisar localStorage
              if (isMobile) {
                setShowSidebar(false);
              }
              return;
            }
          } catch (error) {
            console.error("Error loading conversation from API:", error);
            // Si hay error, intentamos cargar de localStorage como respaldo
          }
        }
        
        // Si no se pudo cargar de la API o no es un ID de MongoDB válido, intentar cargar de localStorage
        if (user && user.email) {
          const savedChatHistory = JSON.parse(localStorage.getItem(`medconnect_chat_${user.email}_${conversationId}`));
          
          if (savedChatHistory && savedChatHistory.length > 0) {
            // Make sure all messages have the required properties
            const processedHistory = savedChatHistory.map(msg => ({
              ...msg,
              formattedContent: msg.formattedContent || convertMarkdownToHTML(msg.content),
              isTyping: false
            }));
            setChatHistory(processedHistory);
          } else {
            // Si no hay historial para esta conversación, iniciar con mensaje de bienvenida
            const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
            setChatHistory([
              {
                role: 'assistant',
                content: welcomeMsg,
                formattedContent: welcomeMsg,
                isTyping: false,
                timestamp: new Date()
              }
            ]);
            
            // Guardar este historial inicial en localStorage
            localStorage.setItem(`medconnect_chat_${user.email}_${conversationId}`, JSON.stringify([{
              role: 'assistant',
              content: welcomeMsg,
              timestamp: new Date()
            }]));
          }
          
          localStorage.setItem(`medconnect_active_conversation_${user.email}`, conversationId);
        }
      } catch (error) {
        console.error("Error switching conversation:", error);
        // En caso de error, iniciar con mensaje de bienvenida
        const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
        setChatHistory([
          {
            role: 'assistant',
            content: welcomeMsg,
            formattedContent: welcomeMsg,
            isTyping: false,
            timestamp: new Date()
          }
        ]);
      }
    }
    
    if (isMobile) {
      setShowSidebar(false);
    }
  };
  
  const clearConversation = () => {
    const confirmed = window.confirm("Are you sure you want to clear this conversation? This action cannot be undone.");
    
    if (confirmed) {
      const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
      const newHistory = [
        {
          role: 'assistant',
          content: welcomeMsg,
          formattedContent: welcomeMsg,
          isTyping: false
        }
      ];
      
      setChatHistory(newHistory);
      
      if (user && user.email) {
        localStorage.setItem(`medconnect_chat_${user.email}_${activeConversation}`, JSON.stringify(newHistory));
      }
    }
  };
  
  const handleDeleteClick = (convId, e) => {
    // Evitar propagación del evento
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    console.log("Delete button clicked for:", convId);
    
    // Confirmación
    if (!window.confirm("Are you sure you want to delete this conversation?")) {
      return; // El usuario canceló
    }
    
    // Check if this is the last conversation
    const isLastConversation = savedConversations.length === 1;
    
    // If it's the last conversation, create a new one first to prevent multiple creations
    if (isLastConversation) {
      console.log("This is the last conversation, creating a new one first");
      // Generate unique ID
      const newConvId = 'conv_' + Date.now();
      // Create welcome message
      const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
      // Create new conversation object
      const newConversation = {
        id: newConvId,
        title: 'New Conversation',
        timestamp: new Date()
      };
      
      // Save to localStorage
      if (user && user.email) {
        localStorage.setItem(
          `medconnect_chat_${user.email}_${newConvId}`, 
          JSON.stringify([{
            role: 'assistant',
            content: welcomeMsg,
            timestamp: new Date()
          }])
        );
        localStorage.setItem(
          `medconnect_conversations_${user.email}`,
          JSON.stringify([newConversation])
        );
        localStorage.setItem(`medconnect_active_conversation_${user.email}`, newConvId);
      }
      
      // Update state
      setSavedConversations([newConversation]);
      setActiveConversation(newConvId);
      setChatHistory([{
        role: 'assistant',
        content: welcomeMsg,
        timestamp: new Date()
      }]);
    } else {
      // For non-last conversations, proceed normally
      // Actualizar la UI inmediatamente
      const updatedConversations = savedConversations.filter(c => c.id !== convId);
      setSavedConversations(updatedConversations);
      
      // Cambiar a otra conversación si es necesario
      if (activeConversation === convId) {
        switchConversation(updatedConversations[0].id);
      }
      
      // Limpiar localStorage
      if (user && user.email) {
        localStorage.removeItem(`medconnect_chat_${user.email}_${convId}`);
        localStorage.setItem(`medconnect_conversations_${user.email}`, JSON.stringify(updatedConversations));
      }
    }
    
    // Si es un ID de MongoDB, eliminar del servidor también
    if (convId && convId.length === 24) {
      axios.delete(`${ENV.SERVER_URL}/api/chat/conversations/${convId}`)
        .then(() => {
          console.log("Conversation deleted from server:", convId);
          toast.success('Conversation deleted successfully');
        })
        .catch(err => {
          console.error("Error deleting from server:", err);
          toast.error('Conversation deleted locally but there was a server error');
        });
    } else {
      toast.success('Conversation deleted successfully');
    }
  };

  const formatDateToLocaleString = (dateString) => {
    if (!dateString) return "Invalid Date";
    
    try {
      const date = new Date(dateString);
      
      // Comprobar si la fecha es válida
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      
      // Formatear la fecha correctamente
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  const getConversationPreview = (conversationId) => {
    if (user && user.email) {
      const chatData = JSON.parse(localStorage.getItem(`medconnect_chat_${user.email}_${conversationId}`));
      if (chatData && chatData.length > 0) {
        const lastUserMessage = [...chatData].reverse().find(msg => msg.role === 'user');
        if (lastUserMessage) {
          return lastUserMessage.content.length > 30 
            ? lastUserMessage.content.substring(0, 30) + '...' 
            : lastUserMessage.content;
        }
      }
    }
    return "New conversation";
  };

  // Function to convert Markdown to HTML
  const convertMarkdownToHTML = (text) => {
    if (!text) return '';
    
    // Convert bold (**text**)
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert italic (*text*)
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert numbered lists (1. Item)
    formattedText = formattedText.replace(/(\d+)\.\s+([^\n]+)/g, '<span class="list-number">$1.</span> $2');
    
    // Convert bullet points (• Item)
    formattedText = formattedText.replace(/•\s+([^\n]+)/g, '<span class="list-bullet">•</span> $1');
    
    return formattedText;
  };

  // Fix the dependency array to avoid circular reference
  const loadUserConversationsFromAPI = useCallback(async () => {
    if (!user || !(user.id || user._id)) return;
    
    try {
      const userId = user.id || user._id;
      console.log("Fetching conversations for user:", userId);
      
      // Primero cargar la lista de conversaciones
      const response = await axios.get(`${ENV.SERVER_URL}/api/chat/conversations/user/${userId}`);
      
      if (response.data.conversations && response.data.conversations.length > 0) {
        console.log("Loaded conversations from API:", response.data.conversations);
        
        // Convertir las conversaciones de la API al formato local
        const apiConversations = response.data.conversations.map(conv => ({
          id: conv._id,
          title: conv.title === 'New Conversation' && conv.messages && conv.messages.length > 1 
            ? (conv.messages[1].content.substring(0, 30) + (conv.messages[1].content.length > 30 ? '...' : ''))
            : (conv.title || 'New Conversation'),
          timestamp: new Date(conv.updatedAt || conv.createdAt)
        }));
        
        // Actualizar las conversaciones guardadas
        setSavedConversations(apiConversations);
        
        // Guardar en localStorage para acceso offline
        localStorage.setItem(`medconnect_conversations_${user.email}`, JSON.stringify(apiConversations));
        
        // Cargar el historial de la conversación activa o la primera conversación
        let activeConvId = localStorage.getItem(`medconnect_active_conversation_${user.email}`);
        
        // Si no hay conversación activa guardada o no es una de las existentes, usar la primera
        if (!activeConvId || !apiConversations.some(conv => conv.id === activeConvId)) {
          activeConvId = apiConversations[0].id;
        }
        
        setActiveConversation(activeConvId);
        
        // Cargar los mensajes de la conversación activa desde la API
        try {
          const chatResponse = await axios.get(`${ENV.SERVER_URL}/api/chat/conversations/${activeConvId}`);
          
          if (chatResponse.data && chatResponse.data.conversation && chatResponse.data.conversation.messages) {
            console.log("Loaded active conversation messages:", activeConvId);
            
            // Asegurar que todos los mensajes tienen timestamp
            const messagesWithTimestamp = chatResponse.data.conversation.messages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp || new Date()
            }));
            
            setChatHistory(messagesWithTimestamp);
            
            // Guardar en localStorage
            localStorage.setItem(`medconnect_chat_${user.email}_${activeConvId}`, 
              JSON.stringify(messagesWithTimestamp));
          }
        } catch (error) {
          console.error("Error loading conversation messages:", error);
          // Usar mensaje de bienvenida como respaldo
          const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
          const defaultMessages = [{
          role: 'assistant',
            content: welcomeMsg,
            timestamp: new Date()
          }];
          
          setChatHistory(defaultMessages);
          localStorage.setItem(`medconnect_chat_${user.email}_${activeConvId}`, 
            JSON.stringify(defaultMessages));
        }
        
        // También actualizar localStorage para recordar la conversación activa
        localStorage.setItem(`medconnect_active_conversation_${user.email}`, activeConvId);
      } else {
        console.log("No conversations found in API, creating default");
        const defaultConvId = 'conv_' + Date.now();
        const defaultConversation = {
          id: defaultConvId,
          title: 'New Conversation',
          timestamp: new Date()
        };
        
        setSavedConversations([defaultConversation]);
        setActiveConversation(defaultConvId);
        
        // Guardar en localStorage
        localStorage.setItem(`medconnect_conversations_${user.email}`, JSON.stringify([defaultConversation]));
        localStorage.setItem(`medconnect_active_conversation_${user.email}`, defaultConvId);
        
        // Mensaje de bienvenida
        const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
        const initialHistory = [
          {
            role: 'assistant',
            content: welcomeMsg,
            timestamp: new Date()
          }
        ];
        
        setChatHistory(initialHistory);
        localStorage.setItem(`medconnect_chat_${user.email}_${defaultConvId}`, JSON.stringify(initialHistory));
      }
    } catch (error) {
      console.error("Error loading conversations from API:", error);
      // Si hay error, intentar cargar desde localStorage como respaldo
      const localSavedConversations = JSON.parse(localStorage.getItem(`medconnect_conversations_${user.email}`)) || [];
      
      if (localSavedConversations.length > 0) {
        setSavedConversations(localSavedConversations);
        
        // Cargar la conversación activa
        const activeConvId = localStorage.getItem(`medconnect_active_conversation_${user.email}`) || 
                            localSavedConversations[0].id;
                            
        setActiveConversation(activeConvId);
        
        // Cargar los mensajes
        const savedMessages = JSON.parse(localStorage.getItem(`medconnect_chat_${user.email}_${activeConvId}`));
        if (savedMessages && savedMessages.length > 0) {
          setChatHistory(savedMessages);
        }
      } else {
        // Create a new default conversation instead of calling startNewChat
        const defaultConvId = 'conv_' + Date.now();
        const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
        
        const defaultConversation = {
          id: defaultConvId,
          title: 'New Conversation',
          timestamp: new Date()
        };
        
        const initialMessage = {
        role: 'assistant',
          content: welcomeMsg,
          timestamp: new Date()
        };
        
        // Update localStorage
        localStorage.setItem(`medconnect_chat_${user.email}_${defaultConvId}`, 
          JSON.stringify([initialMessage]));
        localStorage.setItem(`medconnect_conversations_${user.email}`, 
          JSON.stringify([defaultConversation]));
        localStorage.setItem(`medconnect_active_conversation_${user.email}`, defaultConvId);
        
        // Update state
        setSavedConversations([defaultConversation]);
        setActiveConversation(defaultConvId);
        setChatHistory([initialMessage]);
      }
    }
  }, [user]);

  // Modificar el useEffect para usar la nueva función
  useEffect(() => {
    if (user && user.email) {
      // Intentar cargar conversaciones de la API primero
      loadUserConversationsFromAPI();
    }
  }, [user, loadUserConversationsFromAPI]);

  return (
    <div className="chat-page-wrapper">
      <div className="chat-layout">
        {/* Sidebar */}
        <motion.div 
          className={`chat-sidebar ${showSidebar ? 'show' : ''}`}
          initial={{ x: isMobile ? "-100%" : 0 }}
          animate={{ x: showSidebar ? 0 : (isMobile ? "-100%" : 0) }}
          transition={{ duration: 0.3 }}
        >
          <div className="sidebar-header">
            <div className="d-flex align-items-center">
              <FaRobot size={22} className="me-2" />
              <h4 className="mb-0">Health Assistant</h4>
            </div>
            {isMobile && (
              <Button 
                className="btn-close-sidebar"
                onClick={toggleSidebar} 
              >
                <FaTimes />
              </Button>
            )}
          </div>
          
          <Button 
            className="btn-new-conversation"
            onClick={startNewChat}
          >
            <FaPlus className="me-2" /> New Chat
          </Button>
          
          <div className="conversations-list">
            {savedConversations.length > 0 ? (
              savedConversations.map((conv) => (
                <div 
                  key={conv.id} 
                  className={`conversation-item ${activeConversation === conv.id ? 'active' : ''}`}
                  onClick={() => switchConversation(conv.id)}
                >
                  <div className="conversation-content">
                    <div className="conversation-title">
                      <FaRobot className="conversation-icon me-2" />
                      <div className="conversation-text">
                        <div className="conversation-name">{conv.title || 'New Conversation'}</div>
                        <div className="conversation-preview">{getConversationPreview(conv.id)}</div>
                      </div>
                    </div>
                    <div className="conversation-date">
                      {conv.timestamp ? formatDateToLocaleString(conv.timestamp) : 'Invalid Date'}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button 
                      className="btn-delete-conversation"
                      color="danger"
                      title="Delete conversation"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteClick(conv.id, e);
                      }}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-conversations">
                <p>No conversations yet. Start a new chat!</p>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Chat content */}
        <div className="chat-content">
          <div className="chat-header">
            <div className="d-flex align-items-center">
              {isMobile && (
                <Button 
                  className="btn-toggle-sidebar me-2"
                  onClick={toggleSidebar}
                >
                  <FaBars />
                </Button>
              )}
              <h3 className="mb-0">MedConnect Health Assistant</h3>
            </div>
            
            <div className="d-flex">
              <Button 
                className="btn-circle btn-sm me-2"
                onClick={clearConversation}
              >
                <FaTrash />
              </Button>
            </div>
          </div>
          
          <Alert color="info" className="chat-alert">
              <FaInfoCircle className="me-2" />
              <span className="small">
                This AI assistant provides general health information and guidance. 
                It's not a replacement for professional medical advice, diagnosis, or treatment.
                For medical emergencies, contact your healthcare provider or emergency services immediately.
              </span>
            </Alert>
            
            {error && <Alert color="danger">{error}</Alert>}
            
          <div className="chat-messages-wrapper">
            <div className="chat-messages">
              {chatHistory.map((chat, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  key={index}
                  className={`d-flex ${chat.role === 'assistant' ? '' : 'justify-content-end'} mb-3`}
                >
                  {chat.role === 'assistant' && (
                    <div className="message-avatar me-2">
                      <FaRobot size={20} color="#2c7a7b" />
                    </div>
                  )}
                  
                  <div 
                    className={`message-bubble ${chat.role === 'assistant' ? 'assistant-message' : 'user-message'}`}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '18px',
                      maxWidth: '75%',
                      backgroundColor: chat.role === 'assistant' ? '#f7fafc' : '#2c7a7b',
                      color: chat.role === 'assistant' ? '#2d3748' : 'white',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      borderBottomLeftRadius: chat.role === 'assistant' ? '4px' : '18px',
                      borderBottomRightRadius: chat.role === 'assistant' ? '18px' : '4px',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {chat.role === 'assistant' && chat.isTyping ? (
                      <TypingAnimation 
                        text={chat.formattedContent || convertMarkdownToHTML(chat.content)} 
                        onComplete={() => handleTypingComplete(index)}
                      />
                    ) : (
                      <div dangerouslySetInnerHTML={{ 
                        __html: chat.role === 'assistant' 
                          ? (chat.formattedContent || convertMarkdownToHTML(chat.content))
                          : chat.content 
                      }} />
                    )}
                  </div>
                  
                  {chat.role === 'user' && (
                    <div className="message-avatar ms-2">
                      <FaUser size={20} color="#3182ce" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="d-flex mb-3">
                  <div className="message-avatar me-2">
                    <FaRobot size={20} color="#2c7a7b" />
                  </div>
                  <div 
                    className="message-bubble assistant-message typing-indicator"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '18px',
                      borderBottomLeftRadius: '4px',
                      backgroundColor: '#f7fafc',
                      color: '#718096'
                    }}
                  >
                    <div className="typing-dots">
                      <span>.</span><span>.</span><span>.</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {user && user.role === 'patient' && (
            <div className="medical-consultation-button mb-3 text-center">
              <Button 
                color="primary" 
                outline
                className="mt-2"
                onClick={() => {
                  // Verificar si el usuario tiene citas confirmadas
                  axios.get(`${ENV.SERVER_URL}/api/appointments/user/${user.id || user._id}`)
                    .then(response => {
                      const confirmatedAppointments = response.data.filter(app => app.status === 'confirmed');
                      
                      if (confirmatedAppointments.length > 0) {
                        // Iniciar consulta médica
                        setMessage('I would like to start a medical consultation with my doctor.');
                        // Enviar el mensaje automáticamente
                        setTimeout(() => {
                          document.getElementById('send-button').click();
                        }, 100);
                        
                        toast.success('Starting a medical consultation with your doctor');
                      } else {
                        toast.error('You need to have a confirmed appointment with a doctor to start a medical consultation');
                      }
                    })
                    .catch(error => {
                      console.error("Error checking appointments:", error);
                      toast.error('Error checking your appointments. Please try again.');
                    });
                }}
              >
                <FaUserMd className="me-2" />
                Start Medical Consultation
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="chat-input">
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your health question..."
              disabled={false}
              />
              <Button 
              id="send-button"
                type="submit"
              color="primary" 
              className="send-button" 
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <FaPaperPlane />
              )}
              </Button>
            </form>
          </div>
      </div>
    </div>
  );
};

export default AIChat; 