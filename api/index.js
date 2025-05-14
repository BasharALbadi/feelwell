// This file serves as the API entry point for Vercel serverless functions
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const fs = require('fs');
const path = require('path');

// Import routes - adjust paths as needed to correctly point to your existing routes
let userRoutes, messageRoutes, chatRoutes, appointmentRoutes;

try {
  userRoutes = require('../server/Routes/userRoutes');
} catch (error) {
  console.error('Could not load user routes:', error);
}

try {
  messageRoutes = require('../server/Routes/messageRoutes');
} catch (error) {
  console.error('Could not load message routes:', error);
}

try {
  chatRoutes = require('../server/Routes/chatRoutes');
} catch (error) {
  console.error('Could not load chat routes:', error);
}

try {
  appointmentRoutes = require('../server/Routes/appointmentRoutes');
} catch (error) {
  console.error('Could not load appointment routes:', error);
}

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register routes if they were successfully imported
if (userRoutes) app.use('/api/users', userRoutes);
if (messageRoutes) app.use('/api/messages', messageRoutes);
if (chatRoutes) app.use('/api/chats', chatRoutes);
if (appointmentRoutes) app.use('/api/appointments', appointmentRoutes);

// Default route
app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});

// For Vercel, we need to export the Express app as a module
module.exports = app; 