import express from 'express';
import { 
  createAppointment, 
  getAppointments, 
  getAppointmentById, 
  updateAppointment, 
  deleteAppointment 
} from '../Controllers/AppointmentController.js';

const router = express.Router();

// Rutas de citas
router.post('/', createAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router; 