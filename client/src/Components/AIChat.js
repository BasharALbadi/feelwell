import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Input, Button, Alert, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Card, CardBody, CardHeader, CardFooter, InputGroup, InputGroupText, Badge, Navbar, Nav, NavItem, NavLink, NavbarBrand, ListGroup, ListGroupItem, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import * as ENV from '../config/env';
import { FaPaperPlane, FaRobot, FaUser, FaInfoCircle, FaEllipsisV, FaTrash, FaSave, FaPlus, FaBars, FaTimes, FaArrowLeft, FaUserMd, FaCheck, FaBrain } from 'react-icons/fa';
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
  const [mentalHealthDropdown, setMentalHealthDropdown] = useState(false);

  // Toggle dropdown
  const toggle = () => setDropdownOpen(prevState => !prevState);
  const toggleNewChat = () => setNewChatDropdown(prevState => !prevState);
  const toggleSidebar = () => setShowSidebar(prevState => !prevState);
  const toggleMentalHealthDropdown = () => setMentalHealthDropdown(prevState => !prevState);

  // Array of mental health prompts
  const mentalHealthPrompts = [
    "I've been feeling anxious lately, what are some coping techniques?",
    "How can I manage stress better in my daily life?",
    "What are the symptoms of depression?",
    "I'm having trouble sleeping at night, what can help?",
    "How can I support a loved one who is struggling with mental health?",
    "What are mindfulness techniques for anxiety?",
    "How can I tell if I need professional mental health support?",
    "What's the difference between a psychologist and psychiatrist?",
    "Are there natural remedies for mood improvement?",
    "How does exercise affect mental health?"
  ];

  // Function to select a prompt and set it as the message
  const selectPrompt = (prompt) => {
    setMessage(prompt);
    toggleMentalHealthDropdown();
    // Focus on the input field after selecting a prompt
    document.querySelector('.chat-input input').focus();
  };

  // Fix the dependency array to avoid circular reference
  const loadUserConversationsFromAPI = useCallback(async () => {
    if (!user || !(user.id || user._id)) return;
    
    try {
      const userId = user.id || user._id;
      console.log("Fetching conversations for user:", userId);
      
      // First load the conversation list
      const response = await axios.get(`${ENV.SERVER_URL}/api/chat/conversations/user/${userId}`);
      
      if (response.data.conversations && response.data.conversations.length > 0) {
        console.log("Loaded conversations from API:", response.data.conversations);
        
        // Convert API conversations to local format
        const apiConversations = response.data.conversations.map(conv => ({
          id: conv._id,
          title: conv.title === 'New Conversation' && conv.messages && conv.messages.length > 1 
            ? (conv.messages[1].content.substring(0, 30) + (conv.messages[1].content.length > 30 ? '...' : ''))
            : (conv.title || 'New Conversation'),
          timestamp: new Date(conv.updatedAt || conv.createdAt)
        }));
        
        // Update saved conversations
        setSavedConversations(apiConversations);
        
        // Save to localStorage for offline access and persistence between refreshes
        if (user && user.email) {
          localStorage.setItem(`feelwell_conversations_${user.email}`, JSON.stringify(apiConversations));
        }
        
        // Load history for active conversation or first conversation
        let activeConvId = localStorage.getItem(`feelwell_active_conversation_${user.email}`);
        
        // If no active conversation saved or not in existing ones, use the first
        if (!activeConvId || !apiConversations.some(conv => conv.id === activeConvId)) {
          activeConvId = apiConversations[0].id;
          // Ensure we save the active conversation ID to localStorage
          localStorage.setItem(`feelwell_active_conversation_${user.email}`, activeConvId);
        }
        
        setActiveConversation(activeConvId);
        
        // Load messages for active conversation from API
        try {
          const messagesResponse = await axios.get(`${ENV.SERVER_URL}/api/chat/conversations/${activeConvId}`);
          
          if (messagesResponse.data && 
              messagesResponse.data.conversation && 
              messagesResponse.data.conversation.messages) {
            
            // Process messages to fix roles
            const messages = processMessages(messagesResponse.data.conversation.messages);
            
            console.log("Loaded messages with roles:", messages.map(m => m.role));
            
            // Update state with messages
            setChatHistory(messages);
            
            // Update localStorage with messages
            localStorage.setItem(`feelwell_chat_${user.email}_${activeConvId}`, JSON.stringify(messages));
          } else {
            throw new Error("No messages found for conversation");
          }
        } catch (msgError) {
          console.error("Error loading messages for conversation:", msgError);
          
          // Try to load from localStorage if server fails
          const localMessages = getChatMessages(user.email, activeConvId);
          
          if (localMessages.length > 0) {
            // Process messages from localStorage to ensure roles are correct
            const processedMessages = processMessages(localMessages);
            setChatHistory(processedMessages);
            
            // Update localStorage with fixed roles
            saveChatMessages(user.email, activeConvId, processedMessages);
          } else {
            // Use welcome message as backup
            const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
            const defaultMessages = [{
              role: 'assistant',
              content: welcomeMsg,
              timestamp: new Date()
            }];
            
            setChatHistory(defaultMessages);
            localStorage.setItem(`feelwell_chat_${user.email}_${activeConvId}`, 
              JSON.stringify(defaultMessages));
          }
        }
        
        return true; // API load was successful
      } else {
        console.log("No conversations found in API");
        return false; // No conversations found
      }
    } catch (error) {
      console.error("Error loading conversations from API:", error);
      return false; // API load failed
    }
  }, [user]);

  // Update the useEffect that loads conversations when user logs in
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      
      // Make sure we have a user ID and email
      const userId = user.id || user._id;
      const userEmail = user.email;
      
      if (!userId || !userEmail) {
        console.error("Missing user ID or email, cannot load conversations");
        return;
      }
      
      console.log("Loading conversations for user:", userEmail, userId);
      
      try {
        // Always attempt to load from API first (server is the source of truth)
        console.log("Fetching conversations directly from server for user:", userId);
        const apiResponse = await axios.get(`${ENV.SERVER_URL}/api/chat/conversations/user/${userId}`);
        
        if (apiResponse.data && apiResponse.data.conversations && apiResponse.data.conversations.length > 0) {
          const serverConversations = apiResponse.data.conversations;
          console.log("Successfully loaded conversations from server:", serverConversations.length);
          
          // Map server conversations to the format we use in the app
          const formattedConversations = serverConversations.map(conv => ({
            id: conv._id,
            title: conv.title || 'New Conversation',
            timestamp: new Date(conv.updatedAt || conv.createdAt)
          }));
          
          // Update state with server conversations
          setSavedConversations(formattedConversations);
          
          // Update localStorage with server data for offline access
          localStorage.setItem(`feelwell_conversations_${userEmail}`, JSON.stringify(formattedConversations));
          
          // Determine which conversation to set as active
          let activeId;
          
          // Try to use the active conversation from localStorage if it exists in the server data
          const savedActiveId = localStorage.getItem(`feelwell_active_conversation_${userEmail}`);
          if (savedActiveId && formattedConversations.some(c => c.id === savedActiveId)) {
            activeId = savedActiveId;
          } else {
            // Otherwise use the first conversation
            activeId = formattedConversations[0].id;
          }
          
          // Set the active conversation
          setActiveConversation(activeId);
          localStorage.setItem(`feelwell_active_conversation_${userEmail}`, activeId);
          
          // Load messages for the active conversation
          try {
            const messagesResponse = await axios.get(`${ENV.SERVER_URL}/api/chat/conversations/${activeId}`);
            
            if (messagesResponse.data && 
                messagesResponse.data.conversation && 
                messagesResponse.data.conversation.messages) {
              
              // Process messages to fix roles
              const messages = processMessages(messagesResponse.data.conversation.messages);
              
              console.log("Loaded messages with roles:", messages.map(m => m.role));
              
              // Update state with messages
              setChatHistory(messages);
              
              // Update localStorage with messages
              localStorage.setItem(`feelwell_chat_${userEmail}_${activeId}`, JSON.stringify(messages));
            } else {
              throw new Error("No messages found for conversation");
            }
          } catch (msgError) {
            console.error("Error loading messages for conversation:", msgError);
            
            // Try to load from localStorage if server fails
            const localMessages = getChatMessages(userEmail, activeId);
            
            if (localMessages.length > 0) {
              // Process messages from localStorage to ensure roles are correct
              const processedMessages = processMessages(localMessages);
              setChatHistory(processedMessages);
              
              // Update localStorage with fixed roles
              saveChatMessages(userEmail, activeId, processedMessages);
            } else {
              // Create a default welcome message
              const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
              const initialHistory = [{
                role: 'assistant',
                content: welcomeMsg,
                timestamp: new Date()
              }];
              
              setChatHistory(initialHistory);
              localStorage.setItem(`feelwell_chat_${userEmail}_${activeId}`, 
                JSON.stringify(initialHistory));
            }
          }
        } else {
          console.log("No conversations found on server, creating a new one");
          // Create a new conversation on the server
          await createNewServerConversation();
        }
      } catch (error) {
        console.error("Error loading conversations from server:", error);
        
        // Check if we have conversations in localStorage as a fallback
        const localConversations = getConversationsFromLocalStorage(userEmail);
        
        if (localConversations.length > 0) {
          console.log("Using local conversations as fallback");
          setSavedConversations(localConversations);
          
          const localActiveId = localStorage.getItem(`feelwell_active_conversation_${userEmail}`) || localConversations[0].id;
          setActiveConversation(localActiveId);
          
          const localMessages = getChatMessages(userEmail, localActiveId);
          if (localMessages.length > 0) {
            // Process messages from localStorage to ensure roles are correct
            const processedMessages = processMessages(localMessages);
            setChatHistory(processedMessages);
            
            // Update localStorage with fixed roles
            saveChatMessages(userEmail, localActiveId, processedMessages);
          } else {
            createDefaultWelcomeMessage(localActiveId);
          }
        } else {
          // Create a new conversation on the server
          await createNewServerConversation();
        }
      }
    };
    
    // Helper function to create a new conversation on the server
    const createNewServerConversation = async () => {
      try {
        const userId = user.id || user._id;
        
        if (!userId) {
          throw new Error("Missing user ID");
        }
        
        console.log("Creating new conversation on server with user ID:", userId);
        
        const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
        
        // First create conversation in database
        try {
          console.log("Creating conversation in database for user:", userId);
          
          // Data for the new conversation
          const conversationData = {
            userId: userId.toString().trim(), // Ensure proper ID format
            title: 'New Conversation',
            initialMessage: welcomeMsg
          };
          
          // Log user information from Redux store for debugging
          console.log("Full user object from state:", JSON.stringify(user, null, 2));
          
          // Create new conversation on server
          console.log("Sending request to:", `${ENV.SERVER_URL}/api/chat/conversations`);
          console.log("With data:", JSON.stringify(conversationData, null, 2));
          
          const createResponse = await axios.post(`${ENV.SERVER_URL}/api/chat/conversations`, conversationData, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (createResponse.data && createResponse.data.conversation) {
            const newConv = createResponse.data.conversation;
            console.log("Server response:", newConv);
            
            const conversationObj = {
              id: newConv._id,
              title: 'New Conversation',
              timestamp: new Date()
            };
            
            // Update state
            setSavedConversations([conversationObj]);
            setActiveConversation(newConv._id);
            
            // Set welcome message
            const initialHistory = [{
              role: 'assistant',
              content: welcomeMsg,
              timestamp: new Date()
            }];
            
            setChatHistory(initialHistory);
            
            // Update localStorage
            if (user.email) {
              localStorage.setItem(`feelwell_conversations_${user.email}`, JSON.stringify([conversationObj]));
              localStorage.setItem(`feelwell_active_conversation_${user.email}`, newConv._id);
              localStorage.setItem(`feelwell_chat_${user.email}_${newConv._id}`, JSON.stringify(initialHistory));
            }
            
            console.log("Created new conversation on server:", newConv._id);
            return true;
          } else {
            throw new Error("Failed to create conversation on server");
          }
        } catch (serverError) {
          console.error("Error creating conversation in database:", serverError);
          console.error("Error details:", serverError.response ? serverError.response.data : "No response data");
          
          // Generate temporary ID for local fallback
          const tempId = 'local_' + Date.now();
          
          // Create initial message for the fallback conversation
          const initialMessage = {
            role: 'assistant',
            content: welcomeMsg,
            timestamp: new Date()
          };
          
          // Fallback to client-side only if server fails
          console.log("Using fallback with local ID:", tempId);
          
          // Create the new conversation object with temporary ID
          const tempConversation = {
            id: tempId,
            title: 'New Conversation',
            timestamp: new Date()
          };
          
          // Create a copy of current conversations to add the new one
          const updatedConversations = [tempConversation, ...savedConversations];
          
          // Update localStorage with temporary ID
          if (user.email) {
            // Save welcome message
            localStorage.setItem(
              `feelwell_chat_${user.email}_${tempId}`, 
              JSON.stringify([initialMessage])
            );
            
            // Save updated conversation list
            localStorage.setItem(
              `feelwell_conversations_${user.email}`,
              JSON.stringify(updatedConversations)
            );
            
            // Set as active conversation
            localStorage.setItem(`feelwell_active_conversation_${user.email}`, tempId);
          }
          
          // Then update all state in a batch (help prevent partial renders)
          setSavedConversations(updatedConversations);
          setActiveConversation(tempId);
          setChatHistory([initialMessage]);
          
          // Mobile view handling
          if (isMobile) {
            setShowSidebar(false);
          }
          
          console.log("Created fallback conversation with local ID");
          toast.warning('Created conversation locally only. Some features may be limited.');
          return false;
        }
      } catch (error) {
        console.error("Error creating conversation on server:", error);
        // Check if error has response data for more details
        if (error.response) {
          console.error("Server error response:", error.response.data);
        }
        createLocalConversation();
        return false;
      }
    };
    
    // Helper function to create a local conversation as fallback
    const createLocalConversation = () => {
      const tempId = 'conv_' + Date.now();
      const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
      
      const tempConversation = {
        id: tempId,
        title: 'New Conversation',
        timestamp: new Date()
      };
      
      const initialHistory = [{
        role: 'assistant',
        content: welcomeMsg,
        timestamp: new Date()
      }];
      
      setSavedConversations([tempConversation]);
      setActiveConversation(tempId);
      setChatHistory(initialHistory);
      
      if (user && user.email) {
        localStorage.setItem(`feelwell_conversations_${user.email}`, JSON.stringify([tempConversation]));
        localStorage.setItem(`feelwell_active_conversation_${user.email}`, tempId);
        localStorage.setItem(`feelwell_chat_${user.email}_${tempId}`, JSON.stringify(initialHistory));
      }
      
      console.log("Created local conversation as fallback");
      toast.warning("Could not connect to server. Created a local conversation.");
    };
    
    // Helper function to create a default welcome message
    const createDefaultWelcomeMessage = (conversationId) => {
      const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
      const initialHistory = [{
        role: 'assistant',
        content: welcomeMsg,
        timestamp: new Date()
      }];
      
      setChatHistory(initialHistory);
      
      if (user && user.email) {
        localStorage.setItem(`feelwell_chat_${user.email}_${conversationId}`, JSON.stringify(initialHistory));
      }
    };
    
    if (user && (user.id || user._id)) {
      console.log("User is logged in, loading conversations");
      loadConversations();
    }
  }, [user, navigate]);

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
      
      localStorage.setItem(`feelwell_chat_${user.email}_${activeConversation}`, JSON.stringify(historyForStorage));
      localStorage.setItem(`feelwell_active_conversation_${user.email}`, activeConversation);
    }
  }, [chatHistory, user, activeConversation]);

  // Complete rewrite of startNewChat to fix disappearing conversations
  const startNewChat = useCallback(async () => {
    console.log("Creating new conversation...");
    
    try {
      if (!user || !(user.id || user._id)) {
        toast.error('You must be logged in to create a conversation');
        return;
      }
      
      const userId = user.id || user._id;
      console.log("User ID:", userId);
      
      // Generate a unique ID for the client-side (temporary)
      const tempId = 'conv_' + Date.now();
      
      // Create welcome message
      const welcomeMsg = "Hello! I'm your health assistant. How can I help you today? You can ask about symptoms, general health advice, or help with understanding your medications. Note that I provide general information only and don't replace your healthcare provider.";
      
      // Create initial message
      const initialMessage = {
        role: 'assistant',
        content: welcomeMsg,
        timestamp: new Date()
      };
      
      // First create conversation in database
      try {
        console.log("Creating conversation in database for user:", userId);
        
        // Data for the new conversation
        const conversationData = {
          userId: userId.toString().trim(), // Ensure proper ID format
          title: 'New Conversation',
          initialMessage: welcomeMsg
        };
        
        // Log user information from Redux store for debugging
        console.log("Full user object from state:", JSON.stringify(user, null, 2));
        
        // Create new conversation on server
        console.log("Sending request to:", `${ENV.SERVER_URL}/api/chat/conversations`);
        console.log("With data:", JSON.stringify(conversationData, null, 2));
        
        const createResponse = await axios.post(`${ENV.SERVER_URL}/api/chat/conversations`, conversationData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Server response:", createResponse);
        
        if (createResponse.data && createResponse.data.conversation) {
          // Get MongoDB ID assigned by server
          const serverId = createResponse.data.conversation._id;
          console.log("Created new conversation in database with ID:", serverId);
          
          // Create the new conversation object with server ID
          const newConversation = {
            id: serverId,
            title: 'New Conversation',
            timestamp: new Date()
          };
          
          // Create a copy of current conversations to add the new one
          const updatedConversations = [newConversation, ...savedConversations];
          
          // Update localStorage with server ID
          if (user.email) {
            // Save welcome message
            localStorage.setItem(
              `feelwell_chat_${user.email}_${serverId}`, 
              JSON.stringify([initialMessage])
            );
            
            // Save updated conversation list
            localStorage.setItem(
              `feelwell_conversations_${user.email}`,
              JSON.stringify(updatedConversations)
            );
            
            // Set as active conversation
            localStorage.setItem(`feelwell_active_conversation_${user.email}`, serverId);
          }
          
          // Then update all state in a batch (help prevent partial renders)
          setSavedConversations(updatedConversations);
          setActiveConversation(serverId);
          setChatHistory([initialMessage]);
          
          // Mobile view handling
          if (isMobile) {
            setShowSidebar(false);
          }
          
          console.log("New conversation created successfully with server ID");
          toast.success('New conversation created');
        } else {
          throw new Error("No conversation data returned from server");
        }
      } catch (serverError) {
        console.error("Error creating conversation in database:", serverError);
        console.error("Error details:", serverError.response ? serverError.response.data : "No response data");
        
        // Fallback to client-side only if server fails
        console.log("Using fallback with local ID:", tempId);
        
        // Create the new conversation object with temporary ID
        const tempConversation = {
          id: tempId,
          title: 'New Conversation',
          timestamp: new Date()
        };
        
        // Create a copy of current conversations to add the new one
        const updatedConversations = [tempConversation, ...savedConversations];
        
        // Update localStorage with temporary ID
        if (user.email) {
          // Save welcome message
          localStorage.setItem(
            `feelwell_chat_${user.email}_${tempId}`, 
            JSON.stringify([initialMessage])
          );
          
          // Save updated conversation list
          localStorage.setItem(
            `feelwell_conversations_${user.email}`,
            JSON.stringify(updatedConversations)
          );
          
          // Set as active conversation
          localStorage.setItem(`feelwell_active_conversation_${user.email}`, tempId);
        }
        
        // Then update all state in a batch (help prevent partial renders)
        setSavedConversations(updatedConversations);
        setActiveConversation(tempId);
        setChatHistory([initialMessage]);
        
        // Mobile view handling
        if (isMobile) {
          setShowSidebar(false);
        }
        
        console.log("Created fallback conversation with local ID");
        toast.warning('Created conversation locally only. Some features may be limited.');
      }
    } catch (error) {
      console.error("Error creating new conversation:", error);
      toast.error('Error creating new conversation');
    }
  }, [savedConversations, user, isMobile]);
  
  // Modified sendMessage function to ensure conversations are properly saved to server
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Make sure we have a user ID
      if (!user || !(user.id || user._id) || !user.email) {
        console.error("User not fully authenticated, cannot send message");
        setError("Please log in again to continue chatting");
        setIsLoading(false);
        return;
      }
      
      const userId = user.id || user._id;
      
      // Calculate what the next roles should be
      const userIndex = chatHistory.length;
      const aiIndex = userIndex + 1;
      
      console.log(`Sending new message: user index=${userIndex}, AI index=${aiIndex}`);
      
      // Prepare user message with EXPLICIT role
    const userMessage = {
        role: 'user', // Always 'user' for sent messages
        content: message,
        timestamp: new Date()
      };
      
      // Update local chat history with user message
      setChatHistory(prev => [...prev, userMessage]);
      
      // Clear input
    setMessage('');
      
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
          const savedConvs = getConversationsFromLocalStorage(user.email);
          const updatedConvs = savedConvs.map(conv => 
            conv.id === activeConversation 
              ? {...conv, title: shortTitle} 
              : conv
          );
          localStorage.setItem(`feelwell_conversations_${user.email}`, JSON.stringify(updatedConvs));
        }
      }
      
      // Si el ID de conversación no es un ObjectId MongoDB válido, crear una nueva
      if (!conversationId || conversationId.length !== 24) {
        console.log("Creating new conversation on server...");
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
        
        try {
          // Crear una nueva conversación
          const createResponse = await axios.post(`${ENV.SERVER_URL}/api/chat/conversations`, conversationData);
          
          if (createResponse.data && createResponse.data.conversation) {
            conversationId = createResponse.data.conversation._id;
            console.log("Created new conversation on server:", conversationId);
            
            // Actualizar ID de conversación activa
            setActiveConversation(conversationId);
            
            if (user.email) {
              localStorage.setItem(`feelwell_active_conversation_${user.email}`, conversationId);
            }
            
            // Agregar a lista de conversaciones
            const newConversation = {
              id: conversationId,
              title: createResponse.data.conversation.title,
              timestamp: new Date()
            };
            
            const updatedConversations = [newConversation, ...savedConversations];
            setSavedConversations(updatedConversations);
            
            if (user.email) {
              localStorage.setItem(`feelwell_conversations_${user.email}`, JSON.stringify(updatedConversations));
            }
          }
        } catch (error) {
          console.error("Error creating conversation on server:", error);
          // Continue with local conversation even if server fails
        }
      } else {
        // Add message to existing conversation
        try {
          await axios.post(`${ENV.SERVER_URL}/api/chat/conversations/${conversationId}/messages`, {
            role: 'user',
            content: message
          });
          console.log("User message added to server conversation:", conversationId);
        } catch (error) {
          console.error("Error saving message to server:", error);
        }
      }
      
      // Prepare API call to get AI response
      try {
        const response = await axios.post(`${ENV.SERVER_URL.replace('/api', '')}/chat`, {
          message
        });
        
        // Add AI response to local chat history
        if (response.data.response) {
          // Clean up response
          let cleanResponse = response.data.response;
          cleanResponse = cleanResponse.replace(/^Here's the response to:.*?\n?/i, '');
          cleanResponse = cleanResponse.trim();
          
          // Create AI message with EXPLICIT role
          const aiMessage = {
            role: 'assistant', // Always 'assistant' for AI responses
            content: cleanResponse,
            isTyping: true,
            timestamp: new Date()
          };
          
          console.log("Adding AI response with role 'assistant'");
          
          // Add AI message with typing animation
          setChatHistory(prev => [...prev, aiMessage]);
          setCurrentTypingIndex(chatHistory.length + 1);
          
          // Save AI response to server
          if (conversationId && conversationId.length === 24) {
            try {
              await axios.post(`${ENV.SERVER_URL}/api/chat/conversations/${conversationId}/messages`, {
          role: 'assistant',
                content: cleanResponse
              });
              console.log("AI response saved to server conversation:", conversationId);
            } catch (error) {
              console.error("Error saving AI response to server:", error);
            }
          }
          
          // Always save to localStorage
          if (user.email) {
            const currentHistory = [...chatHistory, userMessage, aiMessage];
            localStorage.setItem(`feelwell_chat_${user.email}_${activeConversation}`, 
              JSON.stringify(currentHistory.map(msg => ({...msg, isTyping: false}))));
          }
        }
      } catch (apiError) {
        console.error("Error getting AI response:", apiError);
        
        // Add error message to chat
        const errorMessage = {
          role: 'assistant',
          content: "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, errorMessage]);
        
        // Save to localStorage
        if (user.email) {
          const currentHistory = [...chatHistory, userMessage, errorMessage];
          localStorage.setItem(`feelwell_chat_${user.email}_${activeConversation}`, 
            JSON.stringify(currentHistory));
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error in sendMessage:", error);
      setIsLoading(false);
      setError("An error occurred while sending your message. Please try again.");
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
              // Process messages to fix roles
              const messages = processMessages(response.data.conversation.messages);
              
              console.log("Loaded messages with roles:", messages.map(m => m.role));
              
              // Update state with messages
              setChatHistory(messages);
              
              // Guardar también en localStorage para acceso offline
              if (user && user.email) {
                localStorage.setItem(`feelwell_chat_${user.email}_${conversationId}`, 
                  JSON.stringify(messages));
              }
              
              // También actualizar localStorage para mantener la conversación activa
              localStorage.setItem(`feelwell_active_conversation_${user.email}`, conversationId);
              
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
          const savedChatHistory = getChatMessages(user.email, conversationId);
          
          if (savedChatHistory && savedChatHistory.length > 0) {
            // Process messages from localStorage to ensure roles are correct
            const processedHistory = processMessages(savedChatHistory);
            setChatHistory(processedHistory);
            
            // Update localStorage with fixed roles
            saveChatMessages(user.email, conversationId, processedHistory);
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
            localStorage.setItem(`feelwell_chat_${user.email}_${conversationId}`, JSON.stringify([{
              role: 'assistant',
              content: welcomeMsg,
              timestamp: new Date()
            }]));
          }
          
          localStorage.setItem(`feelwell_active_conversation_${user.email}`, conversationId);
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
        localStorage.setItem(`feelwell_chat_${user.email}_${activeConversation}`, JSON.stringify(newHistory));
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
    
    // First delete from server if MongoDB ID
    if (convId && convId.length === 24) {
      try {
        axios.delete(`${ENV.SERVER_URL}/api/chat/conversations/${convId}`)
          .then(() => {
            console.log("Conversation deleted from server:", convId);
            proceedWithLocalDeletion();
            toast.success('Conversation deleted successfully');
          })
          .catch(err => {
            console.error("Error deleting from server:", err);
            // Still proceed with local deletion even if server fails
            proceedWithLocalDeletion();
            toast.warning('Conversation deleted locally but there was a server error');
          });
      } catch (error) {
        console.error("Error in delete operation:", error);
        proceedWithLocalDeletion();
        toast.warning('Conversation deleted locally but there was a server error');
      }
    } else {
      // For local-only conversations
      proceedWithLocalDeletion();
      toast.success('Conversation deleted successfully');
    }
    
    // Function to handle local deletion after server operation
    function proceedWithLocalDeletion() {
      // Check if this is the last conversation
      const isLastConversation = savedConversations.length === 1;
      
      // If it's the last conversation, create a new one first to prevent multiple creations
      if (isLastConversation) {
        console.log("This is the last conversation, creating a new one first");
        startNewChat();
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
          localStorage.removeItem(`feelwell_chat_${user.email}_${convId}`);
          localStorage.setItem(`feelwell_conversations_${user.email}`, JSON.stringify(updatedConversations));
        }
      }
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
      const chatData = getChatMessages(user.email, conversationId);
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

  // Function to process messages and apply role detection
  const processMessages = (messages) => {
    if (!messages || !Array.isArray(messages)) return [];
    
    return messages.map((msg, index) => {
      const messageObj = { ...msg };
      
      // FORCED ROLE ASSIGNMENT BY POSITION:
      // First message is always from the assistant
      // Then alternate user/assistant (odd indices = user, even indices = assistant)
      messageObj.role = index === 0 ? 'assistant' : (index % 2 === 1 ? 'user' : 'assistant');
      
      // Log any changes for debugging
      if (msg.role !== messageObj.role) {
        console.log(`Forced role in processMessages: "${msg.role || 'undefined'}" → "${messageObj.role}" at index ${index}`);
      }
      
      return {
        ...messageObj,
        timestamp: messageObj.timestamp || new Date(),
        isTyping: false
      };
    });
  };

  // Update localStorage key references
  const saveConversationsToLocalStorage = (userEmail, conversations) => {
    localStorage.setItem(`feelwell_conversations_${userEmail}`, JSON.stringify(conversations));
  };

  const getConversationsFromLocalStorage = (userEmail) => {
    return JSON.parse(localStorage.getItem(`feelwell_conversations_${userEmail}`)) || [];
  };

  const saveActiveConversation = (userEmail, conversationId) => {
    localStorage.setItem(`feelwell_active_conversation_${userEmail}`, conversationId);
  };

  const getActiveConversation = (userEmail) => {
    return localStorage.getItem(`feelwell_active_conversation_${userEmail}`);
  };

  const saveChatMessages = (userEmail, conversationId, messages) => {
    localStorage.setItem(`feelwell_chat_${userEmail}_${conversationId}`, JSON.stringify(messages));
  };

  const getChatMessages = (userEmail, conversationId) => {
    return JSON.parse(localStorage.getItem(`feelwell_chat_${userEmail}_${conversationId}`)) || [];
  };

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
              <h3 className="mb-0">FeelWell Health Assistant</h3>
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
              {chatHistory.map((chat, index) => {
                // MANDATORY ROLE OVERRIDE BASED ON POSITION:
                // First message always from assistant (welcome message)
                // Then user/assistant alternate (odd=user, even=assistant)
                // The first message (index 0) is always the assistant's welcome message
                const forcedRole = index === 0 ? 'assistant' : (index % 2 === 1 ? 'user' : 'assistant');
                
                // Use forced role instead of trying to detect
                let detectedRole = forcedRole;
                
                // Log any overrides for debugging
                if (chat.role !== forcedRole) {
                  console.log(`Force override: "${chat.role}" → "${forcedRole}" for message at index ${index}`);
                }
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  key={index}
                    className={`d-flex ${detectedRole === 'user' ? 'justify-content-end' : ''} mb-3`}
                >
                    {detectedRole !== 'user' && (
                    <div className="message-avatar me-2">
                      <FaRobot size={20} color="#2c7a7b" />
                    </div>
                  )}
                  
                  <div 
                      className={`message-bubble ${detectedRole === 'user' ? 'user-message' : 'assistant-message'}`}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '18px',
                      maxWidth: '75%',
                        backgroundColor: detectedRole === 'user' ? '#2c7a7b' : '#f7fafc',
                        color: detectedRole === 'user' ? 'white' : '#2d3748',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        borderBottomLeftRadius: detectedRole === 'user' ? '18px' : '4px',
                        borderBottomRightRadius: detectedRole === 'user' ? '4px' : '18px',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {detectedRole !== 'user' && chat.isTyping ? (
                        <TypingAnimation 
                          text={chat.formattedContent || convertMarkdownToHTML(chat.content)} 
                          onComplete={() => handleTypingComplete(index)}
                        />
                      ) : (
                        <div dangerouslySetInnerHTML={{ 
                          __html: detectedRole !== 'user' 
                            ? (chat.formattedContent || convertMarkdownToHTML(chat.content))
                            : chat.content 
                        }} />
                      )}
                  </div>
                  
                    {detectedRole === 'user' && (
                    <div className="message-avatar ms-2">
                      <FaUser size={20} color="#3182ce" />
                    </div>
                  )}
                  </motion.div>
                );
              })}
              
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
          
          <div className="chat-input-container">
            <div className="prompt-buttons d-flex justify-content-center mb-2">
              <Dropdown isOpen={mentalHealthDropdown} toggle={toggleMentalHealthDropdown} direction="up">
                <DropdownToggle color="info" outline className="prompt-button">
                  <FaBrain className="me-1" /> Mental Health Prompts
                </DropdownToggle>
                <DropdownMenu style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {mentalHealthPrompts.map((prompt, index) => (
                    <DropdownItem key={index} onClick={() => selectPrompt(prompt)}>
                      {prompt}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
            
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
    </div>
  );
};

export default AIChat; 