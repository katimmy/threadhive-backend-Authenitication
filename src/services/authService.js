import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { createAppError } from "../utils/createAppError.js";

const authService = {
  register: async (input) => {
    const { name, username, email, password } = input;

    if (!name || !email || !password) {
      throw createAppError("Name, email, and password are required", 400);
    }
    if (typeof email !== "string" || typeof password !== "string") {
      throw createAppError("Invalid input", 400);
    }

    const existingUser = await User.findOne({ email: String(email) });
    if (existingUser) {
      throw createAppError("Registration failed", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: String(name),
      username: username ? String(username) : undefined,
      email: String(email),
      password: hashedPassword,
    });
    await newUser.save();

    return newUser;
  },

  login: async (input) => {
    const { email, password } = input;

    if (!email || !password) {
      throw createAppError("Email and password are required", 400);
    }
    if (typeof email !== "string" || typeof password !== "string") {
      throw createAppError("Invalid credentials", 400);
    }

    const user = await User.findOne({ email: String(email) });
    if (!user) {
      throw createAppError("Invalid email or password", 401);
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createAppError("Invalid email or password", 401);
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: "1h" },
    );

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    };
  },
};

export default authService;