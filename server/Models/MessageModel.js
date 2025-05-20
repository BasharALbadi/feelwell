import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  senderType: {
    type: String,
    enum: ['user', 'doctor', 'admin'],
    required: true
  },
  messageType: {
    type: String,
    enum: ['direct', 'test', 'automated', 'appointment', 'medical'],
    default: 'direct'
  },
  inReplyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  urgency: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  senderName: {
    type: String,
    required: true
  },
  receiverName: {
    type: String,
    required: true
  },
  // The role field is still needed for validation in some controllers
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    default: function() {
      // Set default role based on senderType
      return this.senderType === 'doctor' ? 'assistant' : 'user';
    }
  }
}, { timestamps: true });

// Add index for faster querying
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ senderType: 1 });
messageSchema.index({ messageType: 1 });

export default mongoose.model('Message', messageSchema); 