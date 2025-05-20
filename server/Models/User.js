import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  usertype: {
    type: String,
    enum: ['admin', 'doctor', 'patient'],
    default: 'patient'
  },
  speciality: {
    type: String
  },
  location: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {timestamps: true});

// Create indexes for faster querying
UserSchema.index({ email: 1 });
UserSchema.index({ usertype: 1 });

export default mongoose.model('User', UserSchema); 