import express from 'express';
import { 
  createConversation, 
  getUserConversations, 
  getConversationById, 
  addMessageToConversation, 
  updateConversation, 
  deleteConversation,
  addDoctorResponse,
  updateConversationStatus
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
  
  // Additional thinking pattern removal
  // Remove paragraphs that look like internal reasoning
  const thinkingPatterns = [
    /^(Okay|I see|Let me|Let's|First|Now|Based on|Looking at|Understanding|The user|In this case|I should|I need to|I want to).*?\n\n/is,
    /^(Okay|I see|Let me|Let's|First|Now|Based on|Looking at|Understanding|The user|In this case|I should|I need to|I want to).*?\. /is,
    /^.*(I should respond|I will respond|I'll respond|I can respond|I need to|I'll provide|I'll offer|I'll help|I want to|I can help).*?\n\n/is,
    /^.*(the user is asking|the user wants|the user needs|the user mentioned|the user greeted).*?\n\n/is,
    /^.*(this is a question about|this question is about|this is asking about).*?\n\n/is
  ];
  
  // Apply all thinking patterns
  for (const pattern of thinkingPatterns) {
    if (pattern.test(filtered)) {
      const paragraphs = filtered.split(/\n\n/);
      // If there are multiple paragraphs and the first matches a thinking pattern, remove it
      if (paragraphs.length > 1 && pattern.test(paragraphs[0])) {
        filtered = paragraphs.slice(1).join('\n\n');
      }
    }
  }
  
  // Handle case where the thinking and response are in the same paragraph
  const separatedByLine = /^.*?(I should|I need to|I'll|I will|I'm going to|I want to).*?\n/is;
  if (separatedByLine.test(filtered)) {
    filtered = filtered.replace(separatedByLine, '');
  }
  
  // If response still starts with a typical thinking phrase after all the above,
  // look for a clear response start indicator
  const responseStartIndicators = [
    'Hello!', 'Hi!', 'Hello,', 'Hi,', 'Hello there', 'Hi there', 
    'Yes,', 'No,', 'Absolutely!', 'Actually,', 'Indeed,'
  ];
  
  for (const indicator of responseStartIndicators) {
    const index = filtered.indexOf(indicator);
    if (index > 0) {
      filtered = filtered.substring(index);
      break;
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

// Rutas para gestión de conversaciones
router.post('/conversations', (req, res, next) => {
  console.log('=== CHAT ROUTES: Request to create new conversation ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  next();
}, createConversation);

router.get('/conversations/user/:userId', (req, res, next) => {
  console.log(`=== CHAT ROUTES: Request to get conversations for user: ${req.params.userId} ===`);
  next();
}, getUserConversations);

router.get('/conversations/:id', (req, res, next) => {
  console.log(`=== CHAT ROUTES: Request to get conversation: ${req.params.id} ===`);
  next();
}, getConversationById);

router.post('/conversations/:id/messages', (req, res, next) => {
  console.log(`=== CHAT ROUTES: Request to add message to conversation: ${req.params.id} ===`);
  console.log('Message:', JSON.stringify(req.body, null, 2));
  next();
}, addMessageToConversation);

router.put('/conversations/:id', (req, res, next) => {
  console.log(`=== CHAT ROUTES: Request to update conversation: ${req.params.id} ===`);
  next();
}, updateConversation);

router.delete('/conversations/:id', (req, res, next) => {
  console.log(`=== CHAT ROUTES: Request to delete conversation: ${req.params.id} ===`);
  next();
}, deleteConversation);

// Ruta para procesar mensajes con IA
router.post('/completion', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Procesar el mensaje con el servicio de IA
    let aiResponse = await createChatCompletion(message);
    
    // Cargar configuración para filtrado
    const config = loadConfig();
    
    // Aplicar filtro para eliminar patrones de pensamiento
    aiResponse = filterResponse(aiResponse, config);
    
    // Eliminar cualquier prefijo "Here's the response to:"
    aiResponse = aiResponse.replace(/^Here's the response to:.*?\n?/i, '');
    
    // Eliminar cualquier patrón de thinking adicional
    aiResponse = aiResponse
      .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<thinking>/g, '')
      .replace(/<\/thinking>/g, '')
      .replace(/<think>/g, '')
      .replace(/<\/think>/g, '')
      .replace(/\(thinking\)[\s\S]*?\(\/thinking\)/g, '')
      .replace(/\(thinking\)/g, '')
      .replace(/\(\/thinking\)/g, '')
      .replace(/\[thinking\][\s\S]*?\[\/thinking\]/g, '')
      .replace(/\[thinking\]/g, '')
      .replace(/\[\/thinking\]/g, '')
      .trim();
    
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

// Ruta para enviar respuesta médica
router.post('/conversations/:id/doctor-response', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, doctorId } = req.body;
    
    if (!content || !doctorId) {
      return res.status(400).json({ error: "Content and doctorId are required" });
    }
    
    const conversation = await ChatModel.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    // Verificar que el doctor está asociado a esta conversación
    if (conversation.doctorId && conversation.doctorId.toString() !== doctorId) {
      return res.status(403).json({ error: "You are not authorized to respond to this conversation" });
    }
    
    // Si no hay doctor asociado aún, asociarlo
    if (!conversation.doctorId) {
      conversation.doctorId = doctorId;
    }
    
    // Añadir mensaje del doctor
    conversation.messages.push({
      role: 'assistant',
      content,
      fromDoctor: true,
      timestamp: new Date()
    });
    
    // Actualizar estado si está abierto
    if (conversation.status === 'open') {
      conversation.status = 'in-progress';
    }
    
    await conversation.save();
    
    res.status(200).json({ 
      success: true,
      message: "Doctor response added successfully",
      conversationId: conversation._id
    });
  } catch (error) {
    console.error("Error adding doctor response:", error);
    res.status(500).json({ error: "Failed to add doctor response" });
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

// Add routes for doctor responses and updating conversation status
router.post('/conversations/:conversationId/doctor-response', (req, res, next) => {
  console.log(`=== CHAT ROUTES: Request to add doctor response to conversation: ${req.params.conversationId} ===`);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  next();
}, addDoctorResponse);

router.put('/conversations/:conversationId/status', (req, res, next) => {
  console.log(`=== CHAT ROUTES: Request to update conversation status: ${req.params.conversationId} to ${req.body.status} ===`);
  next();
}, updateConversationStatus);

export default router; 