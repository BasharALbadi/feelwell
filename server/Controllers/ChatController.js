import ChatModel from '../Models/ChatModel.js';
import Message from '../Models/MessageModel.js';
import Conversation from '../Models/Conversation.js';
import User from '../Models/User.js';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

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
  
  // Default config if file can't be read - disable thinking processing
  return {
    showThinking: false,
    debugMode: false,
    chatSettings: {
      separateThinking: false,
      logThinkingToConsole: false,
      showThinkingToAdmin: false,
      saveThinkingHistory: false
    }
  };
};

// Helper to extract and separate thinking content - simplified to return content as-is
const processAIResponse = (content) => {
  // Always return the original content without processing
  return { 
    displayContent: content,
    thinkingContent: null
  };
};

// Create a new conversation - Enhanced version with thinking processing
export const createConversation = async (req, res) => {
  try {
    console.log("=== CREATE CONVERSATION REQUEST RECEIVED ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const { userId, title, initialMessage } = req.body;
    
    if (!userId) {
      console.log("ERROR: User ID is missing in the request");
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    console.log(`Attempting to create conversation for user: ${userId}`);
    console.log(`With title: ${title || 'Medical Consultation'}`);
    console.log(`Initial message: ${initialMessage || 'None'}`);
    
    // Check if user exists - Handle different ID formats
    let userIdToFind = userId;
    
    // If userId is a string with valid ObjectId format, convert it to ObjectId
    if (typeof userId === 'string' && userId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        userIdToFind = new mongoose.Types.ObjectId(userId);
        console.log("Converted string userId to ObjectId:", userIdToFind);
      } catch (err) {
        console.log("Error converting userId to ObjectId:", err);
        // Continue with string version if conversion fails
      }
    }
    
    // Look for user with multiple query options
    const user = await User.findOne({
      $or: [
        { _id: userIdToFind },
        { id: userId },
        { '_id': userIdToFind },
        { 'id': userId }
      ]
    });
    
    if (!user) {
      console.log(`ERROR: User not found with ID: ${userId}`);
      
      // Create the conversation anyway as a fallback
      console.log("Creating conversation without verifying user existence as fallback");
      
      // Create welcome message with explicit role
      const welcomeMessage = {
        role: 'assistant',
        content: initialMessage || "Hello! I'm your health assistant. How can I help you today?",
        timestamp: new Date()
      };
      
      const fallbackConversation = new Conversation({
        userId: userIdToFind,
        title: title || 'Medical Consultation',
        status: 'open',
        messages: [welcomeMessage]
      });
      
      await fallbackConversation.save();
      console.log(`FALLBACK: Conversation saved with ID: ${fallbackConversation._id}`);
      
      return res.status(201).json({
        success: true,
        conversation: fallbackConversation,
        warning: 'User not found but conversation created'
      });
    }
    
    console.log(`User found: ${user.name || user.fullname || 'Unknown'} (${user._id})`);
    
    // Create welcome message with explicit role
    const welcomeMessage = {
      role: 'assistant',
      content: initialMessage || "Hello! I'm your health assistant. How can I help you today?",
      timestamp: new Date()
    };
    
    // Create a new conversation
    const newConversation = new Conversation({
      userId: user._id, // Use the actual user ObjectId from database
      patientName: user.fullname || user.name || 'Patient',
      title: title || 'Medical Consultation',
      status: 'open',
      messages: [welcomeMessage]
    });
    
    console.log("Created conversation object:", JSON.stringify(newConversation, null, 2));
    
    try {
      await newConversation.save();
      console.log(`SUCCESS: Conversation saved with ID: ${newConversation._id}`);
    } catch (saveError) {
      console.error("ERROR saving conversation:", saveError);
      throw saveError;
    }
    
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
    
    // Validate role is set correctly
    if (!['user', 'assistant', 'system'].includes(newMessage.role)) {
      console.warn(`Invalid role detected: ${newMessage.role}, correcting to 'assistant'`);
      newMessage.role = 'assistant';
    }
    
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
      console.log("ERROR: User ID is missing in the request params");
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    console.log(`=== GET USER CONVERSATIONS: Searching for user ${userId} ===`);
    
    // Handle different ID formats
    let userIdToFind = userId;
    
    // If userId is a string with valid ObjectId format, convert it to ObjectId
    if (typeof userId === 'string' && userId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        userIdToFind = new mongoose.Types.ObjectId(userId);
        console.log("Converted string userId to ObjectId:", userIdToFind);
      } catch (err) {
        console.log("Error converting userId to ObjectId:", err);
        // Continue with string version if conversion fails
      }
    }
    
    // Find conversations with flexible userId matching
    console.log("Finding conversations for userId:", userIdToFind);
    console.log("userId type:", typeof userIdToFind);
    
    const conversations = await Conversation.find({ 
      $or: [
        { userId: userIdToFind },
        { 'userId': userIdToFind.toString() },
        { userId: userIdToFind.toString() }
      ]
    }).sort({ updatedAt: -1 });
    
    console.log(`Found ${conversations.length} conversations for user ${userId}`);
    
    if (conversations.length === 0) {
      console.log("No conversations found, checking if user exists");
      
      // Check if user exists
      const user = await User.findOne({
        $or: [
          { _id: userIdToFind },
          { id: userId },
          { '_id': userIdToFind },
          { 'id': userId }
        ]
      });
      
      if (!user) {
        console.log(`User not found with ID: ${userId}`);
      } else {
        console.log(`User exists with ID: ${userId}, but has no conversations`);
      }
    } else {
      // Log the IDs of the found conversations
      console.log("Conversation IDs found:", conversations.map(c => c._id));
      
      // Fix message roles if needed
      conversations.forEach(conversation => {
        if (conversation.messages && conversation.messages.length > 0) {
          let modified = false;
          
          conversation.messages.forEach(msg => {
            // Fix role if missing or invalid
            if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
              console.log(`Fixing invalid role "${msg.role}" in conversation ${conversation._id}`);
              
              // Determine if this is an assistant message based on content patterns
              if (msg.fromDoctor || 
                 (msg.content && (
                   msg.content.includes("Hello! I'm your health assistant") ||
                   msg.content.includes("I'm not a doctor") ||
                   msg.content.includes("Note that I provide") ||
                   msg.content.includes("health assistant") ||
                   msg.content.includes("provide general information")
                 ))) {
                msg.role = 'assistant';
              } else {
                msg.role = 'user';
              }
              modified = true;
            }
          });
          
          // Save if modifications were made
          if (modified) {
            console.log(`Saving conversation ${conversation._id} with fixed message roles`);
            conversation.save().catch(err => {
              console.error(`Error saving fixed conversation ${conversation._id}:`, err);
            });
          }
        }
      });
    }
    
    res.status(200).json({ 
      success: true, 
      conversations
    });
  } catch (error) {
    console.error('Error getting user conversations:', error);
    res.status(500).json({ message: 'Failed to get conversations', error: error.message });
  }
};

// Get a specific conversation by ID with role validation
export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Ensure each message has a valid role
    if (conversation.messages && conversation.messages.length > 0) {
      conversation.messages = conversation.messages.map(msg => {
        const msgObj = msg.toObject ? msg.toObject() : { ...msg };
        
        // Validate and fix roles if needed
        if (!msgObj.role || !['user', 'assistant', 'system'].includes(msgObj.role)) {
          console.log(`Found message with invalid role "${msgObj.role}" in conversation ${conversationId}, fixing...`);
          
          // Determine the correct role based on content or context
          if (msgObj.fromDoctor || 
             (msgObj.content && msgObj.content.includes("health assistant") || 
              msgObj.content.includes("provide general information"))) {
            msgObj.role = 'assistant';
          } else {
            msgObj.role = 'user';
          }
        }
        
        // Check if we need to filter thinking content
        const config = readChatConfig();
        if (!config.showThinking && !config.chatSettings.saveThinkingHistory) {
          const { thinking, ...restMsg } = msgObj;
          return restMsg;
        }
        
        return msgObj;
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
    
    console.log(`Adding doctor response to conversation ${conversationId}`);
    console.log(`Content: ${content.substring(0, 50)}... Length: ${content.length}`);
    console.log(`Doctor ID: ${doctorId}`);
    
    if (!content) {
      return res.status(400).json({ message: 'Response content is required' });
    }
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      console.log(`Conversation not found with ID: ${conversationId}`);
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
      console.log(`Doctor not found with ID: ${doctorId}`);
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Create the new message with explicit role
    const newMessage = {
      role: 'assistant', // Always set to 'assistant' for doctor messages
      content,
      timestamp: new Date(),
      fromDoctor: true,
      doctorId,
      doctorName: doctor.fullname || doctor.name || 'Doctor'
    };
    
    console.log(`Created new message object:`, newMessage);
    
    // Add message to conversation
    conversation.messages.push(newMessage);
    conversation.lastMessage = content.substring(0, 100) + (content.length > 100 ? '...' : '');
    conversation.messageCount = (conversation.messageCount || 0) + 1;
    conversation.updatedAt = new Date();
    
    // Update status
    if (conversation.status === 'open') {
      conversation.status = 'in-progress';
    }
    
    try {
      await conversation.save();
      console.log(`Successfully saved doctor response to conversation ${conversationId}`);
    } catch (saveError) {
      console.error("Error saving message:", saveError);
      // Check for validation errors
      if (saveError.name === 'ValidationError') {
        console.error("Validation error details:", JSON.stringify(saveError.errors, null, 2));
      }
      throw saveError;
    }
    
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

// Add message to conversation
export const addMessageToConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, userId, isAI = false } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    const conversation = await Conversation.findById(id);
    
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
    
    // Validate role is set correctly
    if (!['user', 'assistant', 'system'].includes(newMessage.role)) {
      console.warn(`Invalid role detected: ${newMessage.role}, correcting to 'assistant'`);
      newMessage.role = 'assistant';
    }
    
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
      conversationId: id
    });
  } catch (error) {
    console.error('Error adding message to conversation:', error);
    res.status(500).json({ message: 'Failed to add message', error: error.message });
  }
};

// Get conversation by ID with role validation
export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Process messages to ensure valid roles
    if (conversation.messages && conversation.messages.length > 0) {
      conversation.messages = conversation.messages.map(msg => {
        const msgObj = msg.toObject ? msg.toObject() : { ...msg };
        
        // Validate and fix roles if needed
        if (!msgObj.role || !['user', 'assistant', 'system'].includes(msgObj.role)) {
          console.log(`Found message with invalid role "${msgObj.role}" in conversation ${id}, fixing...`);
          
          // Determine the correct role based on content or context
          if (msgObj.fromDoctor || 
             (msgObj.content && (
               msgObj.content.includes("health assistant") || 
               msgObj.content.includes("provide general information")))) {
            msgObj.role = 'assistant';
          } else {
            msgObj.role = 'user';
          }
        }
        
        // Check if we need to filter thinking content
        const config = readChatConfig();
        if (!config.showThinking && !config.chatSettings.saveThinkingHistory) {
          const { thinking, ...restMsg } = msgObj;
          return restMsg;
        }
        
        return msgObj;
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

// Also add the missing updateConversation function that seems to be imported in routes
export const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, status } = req.body;
    
    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Update fields if provided
    if (title) conversation.title = title;
    if (status) conversation.status = status;
    
    await conversation.save();
    
    res.status(200).json({ 
      success: true, 
      conversation
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ message: 'Failed to update conversation', error: error.message });
  }
};

// Also add the missing deleteConversation function that seems to be imported in routes
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Conversation.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Failed to delete conversation', error: error.message });
  }
}; 