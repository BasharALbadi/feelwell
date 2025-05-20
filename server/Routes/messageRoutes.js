import express from 'express';
import { 
  sendMessage, 
  getMessagesByPatient, 
  getMessagesBetweenUsers, 
  markMessageAsRead,
  deleteMessage,
  getMessagesByPatientEmail,
  getMessagesForDoctor,
  sendMessageByEmail 
} from '../Controllers/MessageController.js';
import { isAuthenticated, validateObjectId } from '../Middleware/auth.js';
import mongoose from 'mongoose';
import Message from '../Models/MessageModel.js';

const router = express.Router();

// Send a new message - make it open for testing (remove authentication requirement)
router.post('/send', sendMessage);

// Alternative route for sending messages using email identifiers
router.post('/send-by-email', sendMessageByEmail);

// Get all messages for a patient by ID
router.get('/patient/:patientId', validateObjectId, getMessagesByPatient);

// Get all messages for a patient by Email
router.get('/patient/byEmail/:patientEmail', getMessagesByPatientEmail);

// Get messages for a doctor (where doctor is the receiver)
router.get('/doctor/:doctorId', getMessagesForDoctor);

// Get messages for a doctor (where doctor is the receiver) - Alternative version
router.get('/doctor-received/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    console.log('Using alternative endpoint to get messages for doctor:', doctorId);
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }
    
    // Try various ways to find messages for this doctor
    let doctorQuery = {
      $or: []
    };
    
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      doctorQuery.$or.push({ receiverId: doctorId });
    }
    
    // Add other possible ways the doctor might be identified in messages
    doctorQuery.$or.push({ receiverId: doctorId });
    
    console.log('Using query:', JSON.stringify(doctorQuery));
    
    // Find all messages where doctor is receiver by any means
    const messages = await Message.find(doctorQuery).sort({ createdAt: -1 });
    
    console.log(`Found ${messages.length} messages with alternative method`);
    
    res.status(200).json({ 
      success: true, 
      messages 
    });
  } catch (error) {
    console.error('Error in alternative doctor messages endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages between two users
router.get('/between/:senderId/:receiverId', validateObjectId, getMessagesBetweenUsers);

// Mark a message as read
router.put('/:messageId/read', validateObjectId, markMessageAsRead);

// Delete a message
router.delete('/:messageId', validateObjectId, deleteMessage);

export default router; 