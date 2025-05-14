import express from 'express';
import { 
  sendMessage, 
  getMessagesByPatient, 
  getMessagesBetweenUsers, 
  markMessageAsRead,
  deleteMessage,
  getMessagesByPatientEmail,
  getMessagesForDoctor 
} from '../Controllers/MessageController.js';
import { isAuthenticated, validateObjectId } from '../Middleware/auth.js';

const router = express.Router();

// Send a new message - make it open for testing (remove authentication requirement)
router.post('/send', sendMessage);

// Get all messages for a patient by ID
router.get('/patient/:patientId', validateObjectId, getMessagesByPatient);

// Get all messages for a patient by Email
router.get('/patient/byEmail/:patientEmail', getMessagesByPatientEmail);

// Get messages for a doctor (where doctor is the receiver)
router.get('/doctor/:doctorId', getMessagesForDoctor);

// Get messages between two users
router.get('/between/:senderId/:receiverId', validateObjectId, getMessagesBetweenUsers);

// Mark a message as read
router.put('/:messageId/read', validateObjectId, markMessageAsRead);

// Delete a message
router.delete('/:messageId', validateObjectId, deleteMessage);

export default router; 