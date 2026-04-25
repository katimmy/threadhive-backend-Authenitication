import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { createAppError } from "../utils/createAppError.js";

const PUBLIC_ROUTES = new Set(["/api/auth/login", "/api/auth/register"]);

const authHandler = async (req, res, next) => {
  if (PUBLIC_ROUTES.has(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(createAppError("Unauthorized: No token provided", 401));
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return next(createAppError("Unauthorized: User not found", 401));
    }
    req.user = user;
    next();
  } catch (error) {
    return next(createAppError("Unauthorized: Invalid token", 401));
  }
};

export default authHandler;
