import Message from '../Models/MessageModel.js';
import User from '../Models/UserModel.js';
import mongoose from 'mongoose';

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, senderType, messageType, inReplyTo, urgency, appointmentId, senderName, receiverName } = req.body;
    
    console.log('Message data received:', { 
      senderId, 
      receiverId, 
      content: content?.substring(0, 30) + '...', 
      senderType,
      senderName,
      receiverName
    });
    
    // Validate required fields
    if (!senderId || !receiverId || !content || !senderType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Handle non-MongoDB ID formats by making this more flexible
    let sender = null;
    let receiver = null;
    
    try {
      // Try to find sender
      console.log('Looking for sender with ID/email:', senderId);
      sender = await User.findOne({ 
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(senderId) ? senderId : null }, 
          { id: senderId },
          { email: senderId }
        ] 
      }).select('name fullname email userType');
      
      if (!sender) {
        console.error('Sender not found with ID/email:', senderId);
        return res.status(404).json({ message: 'Sender not found', id: senderId });
      }
      
      console.log('Found sender:', { 
        id: sender._id, 
        name: sender.fullname || sender.name, 
        email: sender.email,
        type: sender.userType
      });
      
      // Try to find receiver
      console.log('Looking for receiver with ID/email:', receiverId);
      receiver = await User.findOne({ 
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(receiverId) ? receiverId : null }, 
          { id: receiverId },
          { email: receiverId }
        ] 
      }).select('name fullname email userType');
      
      if (!receiver) {
        console.error('Receiver not found with ID/email:', receiverId);
        return res.status(404).json({ message: 'Receiver not found', id: receiverId });
      }
      
      console.log('Found receiver:', { 
        id: receiver._id, 
        name: receiver.fullname || receiver.name, 
        email: receiver.email,
        type: receiver.userType
      });
      
      // Create new message
      const newMessage = new Message({
        senderId: sender._id,
        receiverId: receiver._id,
        content,
        senderType,
        messageType: messageType || 'direct',
        inReplyTo: inReplyTo || null,
        urgency: urgency || 'normal',
        appointmentId: appointmentId || null,
        senderName: senderName || sender.fullname || sender.name,
        receiverName: receiverName || receiver.fullname || receiver.name
      });
      
      await newMessage.save();
      
      console.log('Message saved successfully:', {
        id: newMessage._id,
        from: newMessage.senderName,
        to: newMessage.receiverName,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId
      });
      
      res.status(201).json({ 
        success: true, 
        message: 'Message sent successfully',
        data: newMessage
      });
    } catch (userError) {
      console.error('Error finding users:', userError);
      return res.status(500).json({ message: 'Error finding users', error: userError.message });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all messages for a specific patient
export const getMessagesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID format' });
    }
    
    // Find all messages where patient is either sender or receiver
    const messages = await Message.find({
      $or: [
        { senderId: patientId },
        { receiverId: patientId }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      messages 
    });
  } catch (error) {
    console.error('Error getting patient messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get messages between two users
export const getMessagesBetweenUsers = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Find messages between these two users in either direction
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ createdAt: 1 });
    
    res.status(200).json({ 
      success: true, 
      messages 
    });
  } catch (error) {
    console.error('Error getting messages between users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark a message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID format' });
    }
    
    // Update message to mark as read
    const message = await Message.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID format' });
    }
    
    // Find and delete the message
    const message = await Message.findByIdAndDelete(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all messages for a specific patient by email
export const getMessagesByPatientEmail = async (req, res) => {
  try {
    const { patientEmail } = req.params;
    
    if (!patientEmail) {
      return res.status(400).json({ message: 'Patient email is required' });
    }
    
    console.log('Finding user by email:', patientEmail);
    
    // Find the user by email
    const patient = await User.findOne({ email: patientEmail });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found with this email', email: patientEmail });
    }
    
    console.log('Found patient:', patient._id);
    
    // Find all messages where patient is either sender or receiver
    const messages = await Message.find({
      $or: [
        { senderId: patient._id },
        { receiverId: patient._id }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${messages.length} messages for patient ${patientEmail}`);
    
    res.status(200).json({ 
      success: true, 
      messages 
    });
  } catch (error) {
    console.error('Error getting patient messages by email:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all messages where doctor is the receiver
export const getMessagesForDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    console.log('Getting messages for doctor:', doctorId);
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }
    
    let doctor = null;
    
    // Try to find the doctor by ID or alternate fields
    try {
      doctor = await User.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : null },
          { id: doctorId },
          { email: doctorId }
        ],
        userType: 'doctor'
      });
      
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found', id: doctorId });
      }
      
      console.log('Found doctor:', doctor._id);
    } catch (userError) {
      console.error('Error finding doctor:', userError);
      return res.status(500).json({ message: 'Error finding doctor', error: userError.message });
    }
    
    // Find all messages where doctor is the receiver
    const messages = await Message.find({
      receiverId: doctor._id
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${messages.length} messages for doctor ${doctorId}`);
    
    // For debugging purposes, let's log the first few messages
    if (messages.length > 0) {
      console.log('Sample messages:');
      messages.slice(0, 3).forEach((msg, index) => {
        console.log(`Message ${index + 1}:`, {
          from: msg.senderName,
          to: msg.receiverName,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.content.substring(0, 30) + '...',
          date: msg.createdAt
        });
      });
    }
    
    res.status(200).json({ 
      success: true, 
      messages 
    });
  } catch (error) {
    console.error('Error getting messages for doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 