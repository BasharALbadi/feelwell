import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
    validate: {
      validator: function(v) {
        const validRoles = ['user', 'assistant', 'system'];
        if (!validRoles.includes(v)) {
          console.warn(`Invalid role encountered: ${v}, defaulting to 'assistant'`);
          return false;
        }
        return true;
      },
      message: props => `${props.value} is not a valid role. Must be 'user', 'assistant', or 'system'`
    },
    default: 'assistant'
  },
  content: {
    type: String,
    required: true
  },
  thinking: {
    type: String,
    default: null
  },
  fromDoctor: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  patientName: {
    type: String,
    default: 'Patient'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    default: 'Medical Consultation'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'closed', 'archived'],
    default: 'open'
  },
  isMedicalConsultation: {
    type: Boolean,
    default: true
  },
  messages: [messageSchema],
  lastMessage: {
    type: String,
    default: ''
  },
  messageCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Indexes for faster querying
conversationSchema.index({ userId: 1 });
conversationSchema.index({ doctorId: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ updatedAt: -1 });

export default mongoose.model('Conversation', conversationSchema); 