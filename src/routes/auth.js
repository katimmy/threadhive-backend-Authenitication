// Setting up the authentication routes
import express from 'express';
const router = express.Router();
import authController from '../controllers/authController.js';

// Route for user registration
router.post('/register', authController.register);

// Route for user login and token generation
router.post('/login', authController.login);

export default router;
