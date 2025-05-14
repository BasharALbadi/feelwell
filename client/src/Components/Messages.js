import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, CardBody, Button, Badge, Spinner, Input, FormGroup } from 'reactstrap';
import { FaEnvelope, FaUser, FaReply, FaSearch, FaFilter, FaCalendarAlt, FaTrash, FaExclamationTriangle, FaUserMd, FaEnvelopeOpen } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getApiUrl } from '../config';

const Messages = () => {
  // Get user from Redux state using the correct path
  const userData = useSelector((state) => state.users.user);
  
  // Define userIdToUse at component level so it's accessible to all functions
  const userIdToUse = userData?._id || userData?.id || '';
  
  // State variables
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [messageType, setMessageType] = useState('received'); // received, all
  
  // Load messages on component mount
  useEffect(() => {
    loadMessages();
  }, [userData]);
  
  // Function to load messages from server
  const loadMessages = async () => {
    if (!userData) {
      setLoading(false);
      return;
    }
    
    const userId = userData._id || userData.id;
    if (!userId) {
      setLoading(false);
      toast.error('User ID is missing. Please log in again.');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading messages for user ID:', userId);
      console.log('Current user data:', {
        id: userId,
        name: userData.fullname || userData.name,
        email: userData.email,
        type: userData.userType
      });
      
      // Use either patient ID or email for fetching
      let endpoint;
      
      // If we have an email and not a valid MongoDB ObjectId, use an alternative endpoint
      if (userData.email && (!userId || userId.length !== 24)) {
        endpoint = getApiUrl(`api/messages/patient/byEmail/${userData.email}`);
        console.log('Using email endpoint instead:', endpoint);
      } else {
        endpoint = getApiUrl(`api/messages/patient/${userId}`);
      }
      
      const response = await axios.get(endpoint);
      
      if (response.data && response.data.messages) {
        console.log('Messages loaded successfully:', response.data.messages.length);
        
        // CRITICAL DEBUG: This helps understand the message structure
        console.log('===== CRITICAL DEBUG =====');
        console.log('First message sample:', response.data.messages.length > 0 ? response.data.messages[0] : 'No messages');
        
        // Debugging: examine message sender status
        console.log('IMPORTANT - Message details for debugging:');
        
        // Clean up doctor names in the message data
        const messagesWithCleanNames = response.data.messages.map(msg => {
          // Only clean names if the message is from a doctor
          if (String(msg.senderId) !== String(userId) && msg.senderName) {
            return {
              ...msg,
              senderName: formatDoctorName(msg.senderName)
            };
          }
          return msg;
        });
        
        messagesWithCleanNames.forEach((msg, idx) => {
          // We have inverted the logic to use receiverId instead of senderId
          // The problem is that we were using senderId to determine if a message is sent by the current user,
          // but in our case, we need to use receiverId instead
          const isSentByDoc = String(msg.receiverId) === String(userId);
          const isReceived = String(msg.senderId) !== String(userId);
          
          console.log(`Message ${idx + 1}:`, {
            content: msg.content.substring(0, 30) + '...',
            fromDoctor: isSentByDoc ? 'SENT BY DOCTOR' : 'SENT BY PATIENT',
            receivedMessage: isReceived ? 'RECEIVED' : 'SENT',
            senderName: msg.senderName,
            receiverName: msg.receiverName,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            currentUserId: userId,
            comparison: `${msg.senderId} === ${userId} = ${String(msg.senderId) === String(userId)}`
          });
        });
        
        // Sort messages by date (newest first)
        const sortedMessages = messagesWithCleanNames.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setMessages(sortedMessages);
      } else {
        console.log('No messages found');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error.response?.data || error.message || error);
      toast.error('Failed to load messages: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to mark message as read
  const markAsRead = async (messageId) => {
    try {
      await axios.put(getApiUrl(`api/messages/${messageId}/read`));
      
      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId ? { ...msg, read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  // Function to handle viewing a message
  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setShowReplyForm(false);
    setReplyContent('');
    
    // If message is unread, mark it as read
    if (!message.read) {
      markAsRead(message._id);
    }
  };
  
  // Function to send reply
  const sendReply = async () => {
    if (!replyContent.trim() || !selectedMessage) return;
    
    if (!userData) {
      toast.error('User information is missing. Please log in again.');
      return;
    }
    
    // Check if we have a valid userIdToUse
    if (!userIdToUse) {
      toast.error('User ID is missing. Please log in again.');
      return;
    }
    
    try {
      console.log('User data from Redux:', {
        id: userData._id,
        name: userData.fullname || userData.name,
        email: userData.email,
        type: userData.userType
      });
      
      console.log('Selected message details:', {
        id: selectedMessage._id,
        from: selectedMessage.senderName,
        senderId: selectedMessage.senderId,
        receiverId: selectedMessage.receiverId,
        date: selectedMessage.createdAt
      });
      
      // IMPORTANT: في الرد، المرسل هو المريض والمستقبل هو الطبيب (مرسل الرسالة الأصلية)
      // المرسل: المستخدم الحالي (المريض)
      const senderId = String(userIdToUse);
      // المستقبل: مرسل الرسالة الأصلية (الطبيب)
      const receiverId = String(selectedMessage.senderId);
      
      // Clean doctor name before sending
      const doctorName = formatDoctorName(selectedMessage.senderName) || 'Doctor';
      
      console.log('Sending reply with data:', {
        senderId,
        receiverId,
        content: replyContent.substring(0, 30) + (replyContent.length > 30 ? '...' : ''),
        senderType: 'patient',
        messageType: 'direct',
        senderName: userData.fullname || userData.name || 'Patient',
        receiverName: doctorName
      });
      
      // Send the message with correct sender/receiver information
      const response = await axios.post(getApiUrl('api/messages/send'), {
        senderId,
        receiverId,
        content: replyContent,
        senderType: 'patient',
        messageType: 'direct',
        senderName: userData.fullname || userData.name || 'Patient',
        receiverName: doctorName,
        inReplyTo: selectedMessage._id
      });
      
      console.log('Message send response:', response.data);
      
      toast.success('Reply sent successfully!');
      setReplyContent('');
      setShowReplyForm(false);
      
      // Wait a moment before reloading messages to give the server time to process
      setTimeout(() => {
        loadMessages();
      }, 500);
    } catch (error) {
      console.error('Error sending reply:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error details:', error.response?.data);
      toast.error('Failed to send reply: ' + errorMessage);
    }
  };
  
  // Function to delete message
  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await axios.delete(getApiUrl(`api/messages/${messageId}`));
      
      // Remove message from state
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
      
      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage(null);
      }
      
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };
  
  // Function to filter messages
  const filteredMessages = messages.filter(message => {
    // Apply search term filter
    const matchesSearch = 
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.senderName && message.senderName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply read/unread filter
    const matchesReadFilter = 
      filter === 'all' || 
      (filter === 'unread' && !message.read) || 
      (filter === 'read' && message.read);
    
    // Apply message type filter (received vs all)
    const matchesTypeFilter = 
      messageType === 'all' || 
      (messageType === 'received' && String(message.senderId) !== String(userIdToUse));
    
    return matchesSearch && matchesReadFilter && matchesTypeFilter;
  });
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Helper function to format doctor name - remove duplicate "Dr." prefixes
  const formatDoctorName = (name) => {
    if (!name) return 'Unknown';
    
    // الحل النهائي: بسيط وفعال لمعالجة تكرار Dr في أسماء الأطباء
    
    // 1. إزالة جميع أنواع Dr/Doctor من الاسم
    const originalName = name;
    const nameWithoutPrefix = name
      .replace(/\bDr\.\s*/gi, '')  // إزالة Dr. متبوعة بمسافة
      .replace(/\bDr\s*/gi, '')    // إزالة Dr متبوعة بمسافة
      .replace(/\bDoctor\s*/gi, '') // إزالة Doctor متبوعة بمسافة
      .replace(/^\s+|\s+$/g, '');  // إزالة المسافات في البداية والنهاية
    
    // 2. إذا كان الاسم يحتوي على Dr، أضف Dr. واحدة فقط في البداية
    const hasDrPrefix = /\b(Dr\.?|Doctor)\b/i.test(originalName);
    const finalName = hasDrPrefix ? `Dr. ${nameWithoutPrefix}` : nameWithoutPrefix;
    
    // تنظيف المسافات المزدوجة
    const cleanedName = finalName.replace(/\s{2,}/g, ' ').trim();
    
    // سجل للتشخيص
    if (name !== cleanedName) {
      console.log(`Doctor name cleaned: "${name}" -> "${cleanedName}"`);
    }
    
    return cleanedName;
  };
  
  // Add custom CSS styles for the messages
  const customStyles = `
    .message-list-card {
      height: 600px;
      overflow-y: auto;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .message-detail-card {
      height: 600px;
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .message-detail-body {
      flex-grow: 1;
      overflow-y: auto;
    }
    
    .message-item {
      display: flex;
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .message-item.active {
      background-color: #f8f9fa;
      border-left: 3px solid #007bff;
    }
    
    .message-item-avatar {
      position: relative;
      margin-right: 15px;
    }
    
    .avatar-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #f1f1f1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .unread-badge {
      position: absolute;
      top: 0;
      right: 0;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #dc3545;
    }
    
    .message-item-content {
      flex-grow: 1;
      min-width: 0;
    }
    
    .message-item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    
    .sender-name {
      margin-bottom: 0;
      font-weight: 600;
    }
    
    .message-date {
      color: #6c757d;
    }
    
    .message-preview {
      margin-bottom: 0;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .search-box {
      position: relative;
    }
    
    .search-icon {
      position: absolute;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      color: #6c757d;
    }
    
    .sent-message {
      background-color: rgba(33, 150, 243, 0.1) !important;
      border-right: 3px solid #2196f3 !important;
    }
    
    .received-message {
      background-color: #ffffff;
      border-left: 3px solid #9e9e9e;
    }
    
    .sent-message .message-preview {
      color: #2196f3;
    }
    
    .you-sent {
      color: #2196f3;
    }
    
    .you-sent:after {
      content: " \\2192"; /* Right arrow */
      display: inline-block;
    }
    
    .message-content {
      white-space: pre-wrap;
      line-height: 1.6;
    }
    
    .doctor-avatar {
      background-color: rgba(10, 138, 94, 0.1);
      color: #0a8a5e;
    }
    
    .patient-avatar {
      background-color: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }
    
    .message-direction {
      font-size: 0.8rem;
      color: #6c757d;
      margin-left: 5px;
    }
    
    .direction-sent {
      color: #2196f3;
    }
    
    .direction-received {
      color: #0a8a5e;
    }
    
    .message-preview-container {
      display: flex;
      align-items: center;
    }
    
    .message-preview-direction {
      margin-right: 5px;
      font-size: 12px;
    }
    
    .message-preview-sent {
      color: #2196f3;
    }
    
    .message-preview-received {
      color: #0a8a5e;
    }
    
    /* Add responsive styling */
    @media (max-width: 768px) {
      .message-list-card, .message-detail-card {
        height: 450px;
      }
    }
  `;

  // Helper function to render direction indicator
  const renderDirectionIndicator = (message) => {
    // تحديد ما إذا كانت الرسالة مرسلة من المستخدم الحالي أم لا
    // إذا كان senderId يساوي معرف المستخدم الحالي، فهذا يعني أن الرسالة مرسلة من المستخدم
    const isSentByMe = String(message.senderId) === String(userIdToUse);
    
    return (
      <span className={`message-direction ${isSentByMe ? 'direction-sent' : 'direction-received'}`}>
        {isSentByMe ? '↑ Sent' : '↓ Received'}
      </span>
    );
  };

  // Include styles at the top
  const CustomStyles = () => {
    return `
      /* User message indication */
      .you-sent {
        color: #3498db;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
      }
      
      /* Direction indicators */
      .message-direction {
        font-size: 0.75rem;
        padding: 0.15rem 0.4rem;
        border-radius: 12px;
        margin-left: 0.5rem;
        font-weight: bold;
      }
      
      .direction-sent {
        background-color: rgba(52, 152, 219, 0.15);
        color: #3498db;
      }
      
      .direction-received {
        background-color: rgba(46, 204, 113, 0.15);
        color: #2ecc71;
      }
      
      /* Mini direction indicators within message content */
      .direction-mini {
        display: inline-block;
        width: 18px;
        height: 18px;
        line-height: 18px;
        text-align: center;
        border-radius: 50%;
        margin-right: 5px;
        font-weight: bold;
      }
      
      .direction-mini.sent {
        background-color: rgba(52, 152, 219, 0.15);
        color: #3498db;
      }
      
      .direction-mini.received {
        background-color: rgba(46, 204, 113, 0.15);
        color: #2ecc71;
      }
      
      .message-detail-date {
        display: flex;
        align-items: center;
        color: #666;
        font-size: 0.8rem;
        margin-top: 3px;
      }
      
      .message-detail-sender {
        display: flex;
        align-items: center;
      }
      
      .message-detail-footer {
        margin-top: 1rem;
        display: flex;
        justify-content: flex-end;
      }
      
      .mark-read-btn {
        background-color: transparent;
        border: 1px solid #28a745;
        color: #28a745;
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s;
      }
      
      .mark-read-btn:hover {
        background-color: #28a745;
        color: white;
      }
      
      .avatar-circle-large {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        margin-right: 12px;
      }
    `;
  };

  return (
    <Container className="mt-4 mb-5">
      <style>{customStyles}</style>
      <style>{CustomStyles()}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-4 d-flex align-items-center">
          <FaEnvelope className="me-2 text-primary" /> Messages
        </h2>
        
        <Row>
          {/* Message list column */}
          <Col md={5} lg={4}>
            <Card className="message-list-card mb-3">
              <CardBody className="p-0">
                <div className="message-filters p-3 border-bottom">
                  <FormGroup className="mb-2">
                    <div className="search-box">
                      <Input
                        type="text"
                        placeholder="Search messages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control"
                      />
                      <FaSearch className="search-icon" />
                    </div>
                  </FormGroup>
                  
                  <div className="filter-buttons d-flex">
                    <Button 
                      color={filter === 'all' ? 'primary' : 'light'}
                      size="sm" 
                      className="me-2"
                      onClick={() => setFilter('all')}
                    >
                      All
                    </Button>
                    <Button 
                      color={filter === 'unread' ? 'primary' : 'light'}
                      size="sm" 
                      className="me-2"
                      onClick={() => setFilter('unread')}
                    >
                      Unread
                      {messages.filter(m => !m.read).length > 0 && (
                        <Badge color="danger" pill className="ms-1">
                          {messages.filter(m => !m.read).length}
                        </Badge>
                      )}
                    </Button>
                    <Button 
                      color={filter === 'read' ? 'primary' : 'light'}
                      size="sm"
                      onClick={() => setFilter('read')}
                    >
                      Read
                    </Button>
                  </div>
                  
                  {/* Add message type filter buttons */}
                  <div className="filter-buttons d-flex mt-2">
                    <Button 
                      color={messageType === 'received' ? 'info' : 'light'}
                      size="sm" 
                      className="me-2"
                      onClick={() => setMessageType('received')}
                    >
                      <FaEnvelopeOpen className="me-1" /> Received Messages
                    </Button>
                    <Button 
                      color={messageType === 'all' ? 'info' : 'light'}
                      size="sm"
                      onClick={() => setMessageType('all')}
                    >
                      <FaEnvelope className="me-1" /> All Messages
                    </Button>
                  </div>
                </div>
                
                <div className="message-items">
                  {loading ? (
                    <div className="text-center p-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading messages...</p>
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="text-center p-5">
                      <FaEnvelope size={40} className="text-muted mb-3" />
                      <h5>No messages found</h5>
                      <p className="text-muted">
                        {messages.length === 0 
                          ? "You don't have any messages yet."
                          : "No messages match your current filters."}
                      </p>
                    </div>
                  ) : (
                    filteredMessages.map((message) => (
                      <motion.div
                        key={message._id}
                        className={`message-item 
                          ${selectedMessage && selectedMessage._id === message._id ? 'active' : ''} 
                          ${!message.read ? 'unread' : ''}
                          ${String(message.senderId) === String(userIdToUse) ? 'sent-message' : 'received-message'}`}
                        onClick={() => handleViewMessage(message)}
                        whileHover={{ backgroundColor: "rgba(0,123,255,0.05)" }}
                      >
                        <div className="message-item-avatar">
                          <div className={`avatar-circle ${String(message.senderId) === String(userIdToUse) ? 'patient-avatar' : 'doctor-avatar'}`}>
                            {String(message.senderId) === String(userIdToUse) ? <FaUser /> : <FaUserMd />}
                          </div>
                          {!message.read && message.senderId !== userIdToUse && <span className="unread-badge"></span>}
                        </div>
                        <div className="message-item-content">
                          <div className="message-item-header">
                            <h6 className="sender-name">
                              {String(message.senderId) === String(userIdToUse) ? 
                                <span className="you-sent">You</span> : 
                                formatDoctorName(message.senderName)
                              }
                            </h6>
                            {renderDirectionIndicator(message)}
                            <small className="message-date">
                              {formatDate(message.createdAt)}
                            </small>
                          </div>
                          <div className="message-preview-container">
                            <span className={`direction-mini ${String(message.senderId) === String(userIdToUse) ? 'sent' : 'received'}`}>
                              {String(message.senderId) === String(userIdToUse) ? '→' : '←'}
                            </span>
                            <p className="message-preview">
                              {message.content.length > 100 
                                ? `${message.content.substring(0, 100)}...` 
                                : message.content}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          </Col>
          
          {/* Message detail column */}
          <Col md={7} lg={8}>
            <Card className="message-detail-card">
              <CardBody className="p-0">
                {!selectedMessage ? (
                  <div className="text-center p-5">
                    <FaEnvelope size={60} className="text-muted mb-3" />
                    <h4>Select a message to read</h4>
                    <p className="text-muted">
                      Click on a message from the list to view its contents
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="message-detail-header p-3 border-bottom">
                      <div className="d-flex justify-content-between">
                        <div className="d-flex align-items-center">
                          <div className={`avatar-circle me-2 ${String(selectedMessage.senderId) === String(userIdToUse) ? 'patient-avatar' : 'doctor-avatar'}`}>
                            {String(selectedMessage.senderId) === String(userIdToUse) ? <FaUser size={24} /> : <FaUserMd size={24} />}
                          </div>
                          <div>
                            <h5 className="mb-0 d-flex align-items-center">
                              {String(selectedMessage.senderId) === String(userIdToUse) ? 
                                <span className="you-sent">You</span> : 
                                formatDoctorName(selectedMessage.senderName)
                              }
                              {renderDirectionIndicator(selectedMessage)}
                            </h5>
                            <div className="message-detail-date">
                              <FaCalendarAlt className="me-1" size={12} />
                              {formatDate(selectedMessage.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Button 
                            color="link" 
                            className="text-danger p-0 ms-2"
                            onClick={() => deleteMessage(selectedMessage._id)}
                            title="Delete message"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="message-detail-body p-4">
                      <div className="message-content mb-4">
                        {selectedMessage.content}
                      </div>
                      
                      {selectedMessage.urgency === 'high' && (
                        <div className="alert alert-warning d-flex align-items-center">
                          <FaExclamationTriangle className="me-2" />
                          This message has been marked as important by your doctor.
                        </div>
                      )}
                      
                      {/* Debug info to see why Reply button doesn't appear */}
                      {console.log("Debug Reply Button:", {
                        userIdToUse: userIdToUse,
                        selectedMessageReceiverId: selectedMessage?.receiverId,
                        selectedMessageSenderId: selectedMessage?.senderId,
                        comparison: `${selectedMessage?.senderId} === ${userIdToUse} = ${String(selectedMessage?.senderId) === String(userIdToUse)}`,
                        showButtonBasedOnReceiver: String(selectedMessage?.receiverId) === String(userIdToUse),
                        showButtonBasedOnSender: String(selectedMessage?.senderId) !== String(userIdToUse),
                        senderName: selectedMessage?.senderName,
                        userType: userData?.userType,
                        typeCheck: userData?.userType === 'patient' && selectedMessage?.senderName?.includes('Dr')
                      })}
                      
                      <div className="message-actions mt-4">
                        {/* Always show reply button */}
                        <Button
                          color="primary"
                          className="d-flex align-items-center"
                          onClick={() => setShowReplyForm(!showReplyForm)}
                        >
                          <FaReply className="me-2" /> Reply
                        </Button>
                      </div>
                      
                      {showReplyForm && (
                        <div className="reply-form mt-4">
                          <FormGroup>
                            <Input
                              type="textarea"
                              rows="4"
                              placeholder="Type your reply here..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="mb-3"
                            />
                          </FormGroup>
                          <div className="d-flex">
                            <Button 
                              color="secondary" 
                              className="me-2"
                              onClick={() => setShowReplyForm(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              color="primary"
                              onClick={sendReply}
                              disabled={!replyContent.trim()}
                            >
                              Send Reply
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </motion.div>
      <ToastContainer />
    </Container>
  );
};

export default Messages; 