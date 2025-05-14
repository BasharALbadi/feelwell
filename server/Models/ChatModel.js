import mongoose from "mongoose";

const MessageSchema = mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ConversationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userinfos',
    required: true
  },
  // Campo opcional para asociar la conversación con un médico específico
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userinfos',
    default: null
  },
  // Campo opcional para asociar la conversación con una cita específica
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'appointments',
    default: null
  },
  title: {
    type: String,
    default: "New Conversation"
  },
  messages: [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Indicar si esta conversación es una consulta médica
  isMedicalConsultation: {
    type: Boolean,
    default: false
  },
  // Estado de la conversación (para consultas médicas)
  status: {
    type: String,
    enum: ['open', 'in-progress', 'closed'],
    default: 'open'
  },
  active: {
    type: Boolean,
    default: true
  }
});

// Middleware para actualizar el campo updatedAt en cada modificación
ConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ChatModel = mongoose.model("conversations", ConversationSchema);
export default ChatModel; 