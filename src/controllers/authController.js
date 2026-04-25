import authService from "../services/authService.js";

const authController = {
  register: async (req, res, next) => {
    try {
      const newUser = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          id: newUser._id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
        },
      });
    } catch (error) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  login: async (req, res, next) => {
    try {
      const { token, user } = await authService.login(req.body);
      res.json({ success: true, message: "Login successful", data: { token, user } });
    } catch (error) {
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },
};

export default authController;    
