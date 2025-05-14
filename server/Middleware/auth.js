import jwt from 'jsonwebtoken';
import User from '../Models/UserModel.js';
import mongoose from 'mongoose';

// Middleware to validate MongoDB ObjectIds
export const validateObjectId = (req, res, next) => {
  // For POST requests, check IDs in the body
  if (req.method === 'POST') {
    const { senderId, receiverId } = req.body;
    
    if (senderId && !mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: 'Invalid sender ID format' });
    }
    
    if (receiverId && !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: 'Invalid receiver ID format' });
    }
  }
  
  // For GET, PUT, DELETE requests, check IDs in params
  if (['GET', 'PUT', 'DELETE'].includes(req.method)) {
    const idParams = ['id', 'userId', 'patientId', 'doctorId', 'messageId', 'senderId', 'receiverId']
      .filter(param => req.params[param]);
    
    for (const param of idParams) {
      if (!mongoose.Types.ObjectId.isValid(req.params[param])) {
        return res.status(400).json({ message: `Invalid ${param} format` });
      }
    }
  }
  
  next();
};

// Authentication middleware
export const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Token is not valid' });
  }
}; 