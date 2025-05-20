import Message from '../Models/MessageModel.js';
import User from '../Models/UserModel.js';
import mongoose from 'mongoose';

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { 
      senderId, receiverId, content, senderType, messageType, 
      inReplyTo, urgency, appointmentId, senderName, receiverName,
      senderEmail, receiverEmail, role
    } = req.body;
    
    console.log('Message data received:', { 
      senderId, receiverId, 
      senderEmail, receiverEmail,
      content: content?.substring(0, 30) + '...', 
      senderType, senderName, receiverName
    });
    
    // Validate required fields
    if ((!senderId && !senderEmail) || (!receiverId && !receiverEmail) || !content || !senderType) {
      return res.status(400).json({ message: 'Missing required fields. Need sender and receiver identification, content, and senderType.' });
    }
    
    // Handle non-MongoDB ID formats by making this more flexible
    let sender = null;
    let receiver = null;
    
    try {
      // SENDER LOOKUP - Try all possible ways to find the sender
      console.log('Looking for sender with ID/email:', senderId || senderEmail);
      
      // First, determine if we can convert to MongoDB ObjectId
      const isSenderIdValidObjectId = senderId && mongoose.Types.ObjectId.isValid(senderId);
      
      // Build a flexible query for the sender
      const senderQuery = {
        $or: []
      };
      
      // Add all possible identifiers for sender
      if (isSenderIdValidObjectId) {
        senderQuery.$or.push({ _id: senderId });
      }
      
      if (senderId) {
        senderQuery.$or.push({ id: senderId });
      }
      
      if (senderEmail) {
        senderQuery.$or.push({ email: senderEmail });
      }
      
      // If we have a name, try to match it too as a last resort
      if (senderName) {
        senderQuery.$or.push({ fullname: senderName });
        senderQuery.$or.push({ name: senderName });
      }
      
      console.log('Searching for sender with query:', JSON.stringify(senderQuery, null, 2));
      
      // Use the imported User model
      sender = await User.findOne(senderQuery);
      
      if (!sender) {
        console.error('Sender not found with ID/email:', senderId || senderEmail);
        return res.status(404).json({ message: 'Sender not found', id: senderId, email: senderEmail });
      }
      
      console.log('Found sender:', { 
        id: sender._id, 
        name: sender.fullname || sender.name, 
        email: sender.email,
        type: sender.userType || sender.usertype
      });
      
      // RECEIVER LOOKUP - Try all possible ways to find the receiver
      console.log('Looking for receiver with ID/email:', receiverId || receiverEmail);
      
      // First, determine if we can convert to MongoDB ObjectId
      const isReceiverIdValidObjectId = receiverId && mongoose.Types.ObjectId.isValid(receiverId);
      
      // Build a flexible query for the receiver
      const receiverQuery = {
        $or: []
      };
      
      // Add all possible identifiers for receiver
      if (isReceiverIdValidObjectId) {
        receiverQuery.$or.push({ _id: receiverId });
      }
      
      if (receiverId) {
        receiverQuery.$or.push({ id: receiverId });
      }
      
      if (receiverEmail) {
        receiverQuery.$or.push({ email: receiverEmail });
      }
      
      // If we have a name, try to match it too as a last resort
      if (receiverName) {
        receiverQuery.$or.push({ fullname: receiverName });
        receiverQuery.$or.push({ name: receiverName });
      }
      
      console.log('Searching for receiver with query:', JSON.stringify(receiverQuery, null, 2));
      
      // Use the imported User model
      receiver = await User.findOne(receiverQuery);
      
      if (!receiver) {
        console.error('Receiver not found with ID/email:', receiverId || receiverEmail);
        return res.status(404).json({ message: 'Receiver not found', id: receiverId, email: receiverEmail });
      }
      
      console.log('Found receiver:', { 
        id: receiver._id, 
        name: receiver.fullname || receiver.name, 
        email: receiver.email,
        type: receiver.userType || receiver.usertype
      });
      
      // Create new message with proper role value
      const messageRole = role || (senderType === 'doctor' ? 'assistant' : 'user');
      
      const newMessage = new Message({
        senderId: sender._id,
        receiverId: receiver._id,
        content,
        // Ensure we use a valid role (required by the Message schema)
        role: messageRole,
        senderType,
        messageType: messageType || 'direct',
        inReplyTo: inReplyTo || null,
        urgency: urgency || 'normal',
        appointmentId: appointmentId || null,
        senderName: senderName || sender.fullname || sender.name,
        receiverName: receiverName || receiver.fullname || receiver.name
      });
      
      // Validate the message before saving
      const validationError = newMessage.validateSync();
      if (validationError) {
        console.error('Message validation error:', validationError);
        return res.status(400).json({ 
          message: 'Message validation failed',
          errors: validationError.errors
        });
      }
      
      await newMessage.save();
      
      console.log('Message saved successfully:', {
        id: newMessage._id,
        from: newMessage.senderName,
        to: newMessage.receiverName,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
        role: newMessage.role
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

// Send a message by email (alternative method)
export const sendMessageByEmail = async (req, res) => {
  try {
    const { 
      senderEmail, receiverEmail, content, senderType, messageType, 
      senderName, receiverName, role
    } = req.body;
    
    console.log('Message data received:', { 
      senderEmail, receiverEmail,
      content: content?.substring(0, 30) + '...', 
      senderType, senderName, receiverName
    });
    
    // Validate required fields
    if (!senderEmail || !receiverEmail || !content || !senderType) {
      return res.status(400).json({ message: 'Missing required fields. Need sender email, receiver email, content, and senderType.' });
    }
    
    let sender = null;
    let receiver = null;
    
    try {
      // Find sender by email
      sender = await User.findOne({ email: senderEmail });
      
      if (!sender) {
        console.error('Sender not found with email:', senderEmail);
        return res.status(404).json({ message: 'Sender not found', email: senderEmail });
      }
      
      console.log('Found sender:', { 
        id: sender._id, 
        name: sender.fullname || sender.name,
        email: sender.email
      });
      
      // Find receiver by email
      receiver = await User.findOne({ email: receiverEmail });
      
      if (!receiver) {
        console.error('Receiver not found with email:', receiverEmail);
        return res.status(404).json({ message: 'Receiver not found', email: receiverEmail });
      }
      
      console.log('Found receiver:', { 
        id: receiver._id, 
        name: receiver.fullname || receiver.name,
        email: receiver.email
      });
      
      // Create message with proper role
      const messageRole = role || (senderType === 'doctor' ? 'assistant' : 'user');
      
      const newMessage = new Message({
        senderId: sender._id,
        receiverId: receiver._id,
        content,
        role: messageRole,
        senderType,
        messageType: messageType || 'direct',
        senderName: senderName || sender.fullname || sender.name,
        receiverName: receiverName || receiver.fullname || receiver.name
      });
      
      // Validate the message
      const validationError = newMessage.validateSync();
      if (validationError) {
        console.error('Message validation error:', validationError);
        return res.status(400).json({ 
          message: 'Message validation failed',
          errors: validationError.errors
        });
      }
      
      await newMessage.save();
      
      console.log('Message saved successfully:', {
        id: newMessage._id,
        from: newMessage.senderName,
        to: newMessage.receiverName,
        role: newMessage.role
      });
      
      res.status(201).json({ 
        success: true, 
        message: 'Message sent successfully via email method',
        data: newMessage
      });
    } catch (error) {
      console.error('Error in email-based message sending:', error);
      return res.status(500).json({ message: 'Error in email-based message sending', error: error.message });
    }
  } catch (error) {
    console.error('Server error in email-based message:', error);
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

// Get messages for a doctor (where doctor is the receiver)
export const getMessagesForDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    console.log('Getting messages for doctor ID:', doctorId);
    
    if (!doctorId) {
      console.error('Doctor ID is missing in getMessagesForDoctor');
      return res.status(400).json({ message: 'Doctor ID is required' });
    }
    
    // Try to find the doctor first to confirm they exist
    const doctor = await User.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : null },
        { id: doctorId }
      ]
    });
    
    if (!doctor) {
      console.error(`Doctor not found with ID: ${doctorId}`);
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    console.log(`Found doctor: ${doctor.fullname || doctor.name} (${doctor._id})`);
    
    // Find all messages where the doctor is the receiver
    const messages = await Message.find({
      receiverId: doctor._id
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${messages.length} messages for doctor ${doctorId}`);
    
    // If we found messages, log a sample of the first one
    if (messages.length > 0) {
      console.log('Sample first message:', {
        id: messages[0]._id,
        from: messages[0].senderName,
        to: messages[0].receiverName,
        content: messages[0].content.substring(0, 30) + '...',
        date: messages[0].createdAt
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