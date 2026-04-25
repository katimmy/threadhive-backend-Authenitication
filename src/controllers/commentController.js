import mongoose from "mongoose";
import * as commentService from "../services/commentService.js";
import { createAppError } from "../utils/createAppError.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const fetchComments = async (req, res) => {
  if (!isValidObjectId(req.params.threadId)) {
    throw createAppError("Invalid thread ID", 400);
  }
  const comments = await commentService.getCommentsByThread(req.params.threadId);

  res.status(200).json({
    success: true,
    message: "Comments fetched successfully",
    data: comments,
  });
};

export const addComment = async (req, res) => {
  const { thread, content } = req.body;

  if (!thread || !content) {
    throw createAppError("Thread and content are required", 400);
  }
  if (!isValidObjectId(thread)) {
    throw createAppError("Invalid thread ID", 400);
  }
  if (typeof content !== "string" || content.trim().length === 0) {
    throw createAppError("Content must be a non-empty string", 400);
  }

  const populatedComment = await commentService.createComment(
    thread,
    req.user._id,
    content.trim(),
  );

  res.status(201).json({
    success: true,
    message: "Comment created successfully",
    data: populatedComment,
  });
};
