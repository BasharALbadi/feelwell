import express from 'express';
import { registerUser, loginUser, logoutUser, getDoctors } from '../Controllers/UserController.js';

const router = express.Router();

// User routes
router.post("/registerUser", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/getDoctors", getDoctors);

export default router; 