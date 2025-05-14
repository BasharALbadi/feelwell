import ChatModel from '../Models/ChatModel.js';
import Message from '../Models/Message.js';
import Conversation from '../Models/Conversation.js';
import User from '../Models/User.js';
import fs from 'fs';
import path from 'path';

// Helper function to read chat config from data.txt
const readChatConfig = () => {
  try {
    const dataPath = path.join(__dirname, '../../data.txt');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    
    // Find JSON content between curly braces
    const jsonMatch = fileContent.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const jsonContent = jsonMatch[0];
      return JSON.parse(jsonContent);
    }
  } catch (error) {
    console.error('Error reading chat config:', error);
  }
  
  // Default config if file can't be read
  return {
    showThinking: false,
    debugMode: false,
    chatSettings: {
      separateThinking: true,
      logThinkingToConsole: false,
      showThinkingToAdmin: false,
      saveThinkingHistory: false
    }
  };
};

// Helper to extract and separate thinking content
const processAIResponse = (content) => {
  const config = readChatConfig();
  
  // If we're not separating thinking, return the content as is
  if (!config.chatSettings.separateThinking) {
    return { 
      displayContent: content,
      thinkingContent: null
    };
  }
  
  // Look for <thinking> tags in the content
  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/g;
  const matches = content.match(thinkingRegex);
  
  if (!matches) {
    return {
      displayContent: content,
      thinkingContent: null
    };
  }
  
  // Extract thinking content and remove it from display content
  let thinkingContent = [];
  matches.forEach(match => {
    const extractedThinking = match.replace(/<thinking>|<\/thinking>/g, '').trim();
    thinkingContent.push(extractedThinking);
  });
  
  // Remove thinking tags from display content
  let displayContent = content.replace(thinkingRegex, '').trim();
  
  // Log thinking to console if enabled
  if (config.chatSettings.logThinkingToConsole) {
    console.log('AI Thinking:', thinkingContent.join('\n'));
  }
  
  return {
    displayContent,
    thinkingContent: thinkingContent.join('\n')
  };
};

// Create a new conversation - Enhanced version with thinking processing
export const createConversation = async (req, res) => {
  try {
    const { userId, title, initialMessage } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if user exists
    const user = await User.findOne({ 
      $or: [
        { _id: userId },
        { id: userId }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create a new conversation
    const newConversation = new Conversation({
      userId,
      patientName: user.fullname || user.name || 'Patient',
      title: title || 'Medical Consultation',
      status: 'open',
      messages: initialMessage ? [{
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      }] : []
    });
    
    await newConversation.save();
    
    res.status(201).json({ 
      success: true, 
      conversation: newConversation 
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Failed to create conversation', error: error.message });
  }
};

// Add a message to a conversation
export const addMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, userId, isAI = false } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    let messageContent = content;
    let thinkingContent = null;
    
    // Process AI response if needed
    if (isAI) {
      const processed = processAIResponse(content);
      messageContent = processed.displayContent;
      thinkingContent = processed.thinkingContent;
    }
    
    // Create the new message
    const newMessage = {
      role: isAI ? 'assistant' : 'user',
      content: messageContent,
      timestamp: new Date()
    };
    
    // Add thinking content if available and configured to save
    const config = readChatConfig();
    if (thinkingContent && config.chatSettings.saveThinkingHistory) {
      newMessage.thinking = thinkingContent;
    }
    
    // Add message to conversation
    conversation.messages.push(newMessage);
    conversation.lastMessage = messageContent.substring(0, 100) + (messageContent.length > 100 ? '...' : '');
    conversation.messageCount = (conversation.messageCount || 0) + 1;
    conversation.updatedAt = new Date();
    
    // Update status if it's still open
    if (conversation.status === 'open' && isAI) {
      conversation.status = 'in-progress';
    }
    
    await conversation.save();
    
    res.status(200).json({ 
      success: true, 
      message: newMessage,
      conversationId
    });
  } catch (error) {
    console.error('Error adding message to conversation:', error);
    res.status(500).json({ message: 'Failed to add message', error: error.message });
  }
};

// Get all conversations for a user - Enhanced version
export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const conversations = await Conversation.find({ 
      $or: [
        { userId },
        { 'userId': userId }
      ]
    }).sort({ updatedAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      conversations
    });
  } catch (error) {
    console.error('Error getting user conversations:', error);
    res.status(500).json({ message: 'Failed to get conversations', error: error.message });
  }
};

// Get a specific conversation by ID
export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if we need to filter thinking content
    const config = readChatConfig();
    if (!config.showThinking && !config.chatSettings.saveThinkingHistory) {
      // Remove thinking field from messages
      conversation.messages = conversation.messages.map(msg => {
        const { thinking, ...rest } = msg.toObject ? msg.toObject() : msg;
        return rest;
      });
    }
    
    res.status(200).json({ 
      success: true, 
      conversation
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ message: 'Failed to get conversation', error: error.message });
  }
};

// Add doctor response to conversation
export const addDoctorResponse = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, doctorId } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Response content is required' });
    }
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Get doctor details
    const doctor = await User.findOne({
      $or: [
        { _id: doctorId },
        { id: doctorId }
      ]
    });
    
    if (!doctor || doctor.userType !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Create the new message
    const newMessage = {
      role: 'assistant',
      content,
      timestamp: new Date(),
      fromDoctor: true,
      doctorId,
      doctorName: doctor.fullname || doctor.name || 'Doctor'
    };
    
    // Add message to conversation
    conversation.messages.push(newMessage);
    conversation.lastMessage = content.substring(0, 100) + (content.length > 100 ? '...' : '');
    conversation.messageCount = (conversation.messageCount || 0) + 1;
    conversation.updatedAt = new Date();
    
    // Update status
    if (conversation.status === 'open') {
      conversation.status = 'in-progress';
    }
    
    await conversation.save();
    
    res.status(200).json({ 
      success: true, 
      message: newMessage,
      conversationId
    });
  } catch (error) {
    console.error('Error adding doctor response:', error);
    res.status(500).json({ message: 'Failed to add response', error: error.message });
  }
};

// Update conversation status
export const updateConversationStatus = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { status, doctorId } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if doctor exists
    const doctor = await User.findOne({
      $or: [
        { _id: doctorId },
        { id: doctorId }
      ]
    });
    
    if (!doctor || doctor.userType !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Update status
    conversation.status = status;
    conversation.updatedAt = new Date();
    
    if (status === 'closed') {
      conversation.closedAt = new Date();
      conversation.closedBy = doctorId;
    }
    
    await conversation.save();
    
    res.status(200).json({ 
      success: true, 
      conversation
    });
  } catch (error) {
    console.error('Error updating conversation status:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

// Get all conversations for a doctor
export const getDoctorConversations = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }
    
    // Check if doctor exists
    const doctor = await User.findOne({
      $or: [
        { _id: doctorId },
        { id: doctorId }
      ]
    });
    
    if (!doctor || doctor.userType !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Get all conversations (since doctors can see all patient conversations)
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      conversations
    });
  } catch (error) {
    console.error('Error getting doctor conversations:', error);
    res.status(500).json({ message: 'Failed to get conversations', error: error.message });
  }
}; 