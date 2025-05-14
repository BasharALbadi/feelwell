import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ['user', 'doctor'],
    default: 'user'
  },
  specialization: {
    type: String,
    required: function() {
      return this.userType === 'doctor';
    }
  },
  experience: {
    type: String,
    required: function() {
      return this.userType === 'doctor';
    }
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
});

const UserModel = mongoose.model("userinfos", UserSchema);
export default UserModel;
