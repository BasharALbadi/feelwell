import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardBody, Input, Button, Spinner } from 'reactstrap';
import { FaUser, FaRobot, FaPaperPlane, FaUserMd } from 'react-icons/fa';
import axios from 'axios';
import { getApiUrl } from '../config';
import { filterThinkingContent } from '../utils/chatConfig';

const ChatComponent = ({ 
  chatId, 
  recipient = null, 
  onSendMessage = null, 
  messageHistory = [],
  isConsultation = false
}) => {
  const user = useSelector((state) => state.users.user);
  const [messages, setMessages] = useState(messageHistory || []);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Filter thinking content when messages change
  useEffect(() => {
    async function filterMessages() {
      const userType = user?.userType || 'patient';
      const filteredMessages = await filterThinkingContent(messageHistory || messages, userType);
      setMessages(filteredMessages);
    }
    
    filterMessages();
  }, [messageHistory, user]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const newMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      fromUser: true
    };
    
    // Add message to UI immediately
    setMessages([...messages, newMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      if (onSendMessage) {
        // Use custom handler if provided
        await onSendMessage(inputMessage);
      } else if (chatId) {
        // Default behavior: send to conversation API
        await axios.post(getApiUrl(`api/chat/conversations/${chatId}/message`), {
          content: inputMessage,
          userId: user.id || user._id
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const getMessageSender = (message) => {
    if (message.fromDoctor) {
      return 'Doctor';
    } else if (message.fromUser) {
      return user ? (user.fullname || user.name || 'You') : 'You';
    } else if (message.role === 'user') {
      return 'You';
    } else if (message.role === 'assistant') {
      return isConsultation ? 'AI Assistant' : (recipient?.name || 'Recipient');
    }
    return message.senderName || 'Unknown';
  };
  
  const renderMessageAvatar = (message) => {
    if (message.fromDoctor || (message.senderType === 'doctor')) {
      return (
        <div className="avatar-circle bg-success text-white">
          <FaUserMd size={16} />
        </div>
      );
    } else if (message.fromUser || message.role === 'user') {
      return (
        <div className="avatar-circle bg-primary text-white">
          <FaUser size={16} />
        </div>
      );
    } else {
      return (
        <div className="avatar-circle bg-info text-white">
          <FaRobot size={16} />
        </div>
      );
    }
  };
  
  return (
    <div className="chat-container">
      <div className="chat-messages" style={{ height: '400px', overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div className="text-center text-muted py-5">
            <FaRobot size={32} className="mb-3" />
            <p>No messages yet. Send one to start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`chat-message ${message.fromUser || message.role === 'user' ? 'user-message' : 'ai-message'} mb-3`}
            >
              <div className="message-wrapper d-flex">
                <div className="message-avatar me-2">
                  {renderMessageAvatar(message)}
                </div>
                <div className="message-content">
                  <div className={`message-bubble p-3 rounded-3 ${
                    message.fromUser || message.role === 'user' 
                      ? 'bg-primary text-white' 
                      : message.fromDoctor 
                        ? 'bg-success text-white' 
                        : 'bg-white'
                  }`}>
                    <div className="message-sender mb-1 fw-bold">
                      {getMessageSender(message)}
                    </div>
                    <div className="message-text">{message.content}</div>
                  </div>
                  <div className="message-info">
                    <small className="text-muted">
                      {new Date(message.timestamp || message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container mt-3">
        <div className="d-flex">
          <Input
            type="textarea"
            rows="2"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-grow-1 me-2"
          />
          <Button
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="d-flex align-items-center justify-content-center"
            style={{ width: '50px' }}
          >
            {isLoading ? <Spinner size="sm" /> : <FaPaperPlane />}
          </Button>
        </div>
      </div>
      
      <style>
        {`
          .chat-container {
            display: flex;
            flex-direction: column;
          }
          
          .chat-messages {
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
          
          .message-wrapper {
            max-width: 90%;
          }
          
          .user-message .message-wrapper {
            margin-left: auto;
          }
          
          .ai-message .message-wrapper {
            margin-right: auto;
          }
          
          .avatar-circle {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .message-content {
            max-width: 100%;
          }
          
          .message-bubble {
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
          
          .message-info {
            margin-top: 4px;
            padding-left: 8px;
          }
        `}
      </style>
    </div>
  );
};

export default ChatComponent; 