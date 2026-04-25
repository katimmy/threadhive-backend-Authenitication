import Comment from "../models/Comment.js";
import Thread from "../models/Thread.js";
import { createAppError } from "../utils/createAppError.js";

export const getCommentsByThread = async (threadId) => {
  const comments = await Comment.find({ thread: threadId }).populate("user", "name");
  return comments;
};

export const createComment = async (thread, userId, content) => {
  const threadExists = await Thread.findById(thread);
  if (!threadExists) {
    throw createAppError("Thread not found", 404);
  }

  const comment = await Comment.create({
    thread,
    user: userId,
    content,
  });
  const populatedComment = await Comment.findById(comment._id).populate("user", "name");
  if (!populatedComment) {
    throw createAppError("Comment creation failed", 500);
  }
  return populatedComment;
};