import express from 'express';
import { 
  createConversation, 
  getUserConversations, 
  getConversation, 
  addMessage,
  addDoctorResponse,
  updateConversationStatus,
  getDoctorConversations
} from '../Controllers/ChatController.js';
import { createChatCompletion } from '../services/aiService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ChatModel from '../Models/ChatModel.js';

const router = express.Router();

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration from data.txt
const loadConfig = () => {
  try {
    const configPath = path.join(__dirname, '../data.txt');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } else {
      console.warn('Configuration file data.txt not found, using defaults');
      return {
        model_settings: {
          remove_thinking: true,
          remove_patterns: ["<think>[\\s\\S]*?<\\/think>", "<think>", "<\\/think>"],
          format_output: true
        }
      };
    }
  } catch (error) {
    console.error('Error loading config:', error);
    return {
      model_settings: {
        remove_thinking: true,
        remove_patterns: ["<think>[\\s\\S]*?<\\/think>", "<think>", "<\\/think>"],
        format_output: true
      }
    };
  }
};

// Apply response filters based on config
const filterResponse = (response, config) => {
  if (!response) return '';
  
  let filtered = response;
  
  // Remove thinking patterns
  if (config.model_settings.remove_thinking) {
    const patterns = config.model_settings.remove_patterns || [];
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'g');
      filtered = filtered.replace(regex, '');
    }
  }
  
  // Clean response
  if (config.response_filters && config.response_filters.clean_special_chars) {
    filtered = filtered
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\n{3,}/g, '\n\n'); // Remove excessive newlines
  }
  
  return filtered.trim();
};

// Routes for chat conversations
router.post('/conversations', createConversation);
router.get('/conversations/user/:userId', getUserConversations);
router.get('/conversations/doctor/:doctorId', getDoctorConversations);
router.get('/conversations/:conversationId', getConversation);
router.post('/conversations/:conversationId/message', addMessage);
router.post('/conversations/:conversationId/doctor-response', addDoctorResponse);
router.put('/conversations/:conversationId/status', updateConversationStatus);

// Ruta para procesar mensajes con IA
router.post('/completion', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Procesar el mensaje con el servicio de IA
    let aiResponse = await createChatCompletion(message);
    
    // Eliminar cualquier prefijo "Here's the response to:"
    aiResponse = aiResponse.replace(/^Here's the response to:.*?\n?/i, '');
    aiResponse = aiResponse.trim();
    
    // Si hay un ID de conversación, guardar mensaje y respuesta
    if (conversationId) {
      // Guardar mensaje del usuario y respuesta en la conversación
      const conversation = await ChatModel.findById(conversationId);
      
      if (conversation) {
        // Agregar mensaje del usuario
        conversation.messages.push({
          role: 'user',
          content: message,
          timestamp: new Date()
        });
        
        // Agregar respuesta de la IA
        conversation.messages.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        });
        
        await conversation.save();
      }
    }
    
    res.status(200).json({ reply: aiResponse });
  } catch (error) {
    console.error('Error in chat processing:', error);
    res.status(500).json({ error: error.message || 'Failed to process message' });
  }
});

// Añadir ruta para obtener conversaciones de un doctor
router.get('/conversations/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const conversations = await ChatModel.find({ 
      doctorId,
      isMedicalConsultation: true 
    })
    .sort({ updatedAt: -1 })
    .populate('userId', 'fullname email')
    .select('title createdAt updatedAt status userId');
    
    // Transformar los resultados para añadir el nombre del paciente
    const formattedConversations = conversations.map(conv => {
      const doc = conv.toObject();
      return {
        ...doc,
        patientName: doc.userId ? doc.userId.fullname : 'Unknown'
      };
    });
    
    res.status(200).json({ 
      conversations: formattedConversations, 
      count: conversations.length 
    });
  } catch (error) {
    console.error("Error fetching doctor's conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Ruta para actualizar el estado de una conversación
router.put('/conversations/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, doctorId } = req.body;
    
    if (!status || !doctorId) {
      return res.status(400).json({ error: "Status and doctorId are required" });
    }
    
    if (!['open', 'in-progress', 'closed'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    
    const conversation = await ChatModel.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    // Verificar que el doctor está asociado a esta conversación
    if (conversation.doctorId && conversation.doctorId.toString() !== doctorId) {
      return res.status(403).json({ error: "You are not authorized to update this conversation" });
    }
    
    conversation.status = status;
    
    // Si cerramos la conversación, añadir un mensaje informativo
    if (status === 'closed') {
      conversation.messages.push({
        role: 'system',
        content: 'This consultation has been closed by the doctor.',
        timestamp: new Date()
      });
    }
    
    await conversation.save();
    
    res.status(200).json({ 
      success: true,
      message: "Conversation status updated successfully"
    });
  } catch (error) {
    console.error("Error updating conversation status:", error);
    res.status(500).json({ error: "Failed to update conversation status" });
  }
});

// Ruta para eliminar una conversación
router.delete('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la conversación existe
    const conversation = await ChatModel.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    // Eliminar la conversación
    await ChatModel.findByIdAndDelete(id);
    
    res.status(200).json({ 
      success: true,
      message: "Conversation deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router; 