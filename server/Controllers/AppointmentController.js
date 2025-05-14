import AppointmentModel from '../Models/AppointmentModel.js';
import { v4 as uuidv4 } from 'uuid';

// Crear una nueva cita
export const createAppointment = async (req, res) => {
  try {
    const { 
      userId, 
      doctorId, 
      patient, 
      doctor, 
      date, 
      time, 
      type, 
      notes 
    } = req.body;
    
    // Generar un número de referencia único
    const referenceNumber = `APP-${Date.now().toString().slice(-6)}-${uuidv4().slice(0, 4)}`;
    
    const appointment = new AppointmentModel({
      userId,
      doctorId,
      patient,
      doctor,
      date,
      time,
      type,
      notes,
      referenceNumber
    });
    
    await appointment.save();
    res.status(201).json({ 
      appointment, 
      message: "Appointment created successfully" 
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ error: "Failed to create appointment" });
  }
};

// Obtener todas las citas (con filtros opcionales)
export const getAppointments = async (req, res) => {
  try {
    const { userId, doctorId, status, startDate, endDate } = req.query;
    
    // Construir filtro basado en parámetros de consulta
    const filter = {};
    
    if (userId) filter.userId = userId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;
    
    // Filtrar por rango de fechas si se proporcionan
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }
    
    const appointments = await AppointmentModel.find(filter)
      .sort({ date: 1, time: 1 });
      
    res.status(200).json({ 
      appointments, 
      count: appointments.length 
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
};

// Obtener una cita por ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await AppointmentModel.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    res.status(200).json({ appointment });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({ error: "Failed to fetch appointment" });
  }
};

// Actualizar una cita
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Si se está confirmando, añadir la fecha de confirmación
    if (updates.status === 'confirmed' && !updates.confirmedAt) {
      updates.confirmedAt = new Date();
    }
    
    const appointment = await AppointmentModel.findByIdAndUpdate(
      id, 
      updates, 
      { new: true }
    );
    
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    res.status(200).json({ 
      appointment, 
      message: "Appointment updated successfully" 
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ error: "Failed to update appointment" });
  }
};

// Eliminar una cita
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await AppointmentModel.findByIdAndDelete(id);
    
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    res.status(200).json({ 
      message: "Appointment deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ error: "Failed to delete appointment" });
  }
}; 