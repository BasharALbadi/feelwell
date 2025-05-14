import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
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
    enum: ['doctor', 'patient'],
    required: true
  },
  messageType: {
    type: String,
    enum: ['direct', 'appointment', 'followup', 'result', 'consultation', 'system'],
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
    enum: ['normal', 'high'],
    default: 'normal'
  },
  senderName: String,
  receiverName: String
}, { timestamps: true });

// Index for faster queries
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ receiverId: 1, read: 1 });

export default mongoose.model('Message', MessageSchema); 