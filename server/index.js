import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import UserModel from "./Models/UserModel.js";
import bcrypt from "bcrypt";
import PostModel from "./Models/Posts.js";
import { callGroqDirectly } from "./directApi.js";
import userRoutes from "./Routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./Routes/messageRoutes.js";
import path from "path";
import fs from "fs";

import * as ENV from "./config.js";

// Importar nuevas rutas
import appointmentRoutes from "./Routes/appointmentRoutes.js";

// Importar los controladores de citas
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment
} from './Controllers/AppointmentController.js';

// Importar los controladores de usuarios
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getDoctors 
} from './Controllers/UserController.js';

// Configurar variables de entorno
dotenv.config();

// Inicializar express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // En producción, especifica los dominios permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conectar a MongoDB - usando la configuración original
const connectString = `mongodb+srv://${ENV.DB_USER}:${ENV.DB_PASSWORD}@${ENV.DB_CLUSTER}/${ENV.DB_NAME}?retryWrites=true&w=majority`;

// Connect to MongoDB
mongoose.connect(connectString)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);

// Rutas directas para autenticación (sin /api/ para compatibilidad)
app.post('/registerUser', registerUser);
app.post('/login', loginUser);
app.post('/logout', logoutUser);
app.get('/getDoctors', getDoctors);

// Rutas para citas - accesibles directamente sin /api/ para compatibilidad
app.post('/appointments', createAppointment);
app.get('/appointments', getAppointments);
app.get('/appointments/:id', getAppointmentById);
app.put('/appointments/:id', updateAppointment);
app.delete('/appointments/:id', deleteAppointment);

// También añadir las rutas con prefijo /api para consistencia
app.use('/api/appointments', appointmentRoutes);

// Ruta para comprobar que el servidor está funcionando
app.get("/", (req, res) => {
  res.send("API is running...");
});

// AI Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    console.log("Received chat request:", message);
    
    try {
      // Direct call to the chat completion function
      let rawResponse = await callGroqDirectly(message);
      
      // Eliminar cualquier prefijo "Here's the response to:"
      rawResponse = rawResponse.replace(/^Here's the response to:.*?\n?/i, '');
      rawResponse = rawResponse.trim();
      
      // Apply any other necessary filters or formatting
      // ...
      
      console.log("Response processed successfully");
      return res.json({ response: rawResponse });
    } catch (error) {
      console.error("Error in chat completion:", error);
      return res.json({ 
        response: "I apologize for the technical difficulties. Please try again in a moment."
      });
    }
  } catch (error) {
    console.error("Chat API error:", error.message || error);
    return res.json({ 
      response: "I'm here to help with your mental health questions. What would you like to talk about today?"
    });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

