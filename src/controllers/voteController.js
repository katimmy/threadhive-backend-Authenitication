import mongoose from "mongoose";
import {
  upvoteThreadService,
  downvoteThreadService,
  upvoteCommentService,
  downvoteCommentService,
} from "../services/voteService.js";
import { createAppError } from "../utils/createAppError.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const upvoteThread = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw createAppError("Invalid thread ID", 400);
  }
  const updated = await upvoteThreadService(req.params.id, req.user._id);
  res.status(200).json({
    success: true,
    message: "Thread upvoted successfully",
    data: updated,
  });
};

export const downvoteThread = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw createAppError("Invalid thread ID", 400);
  }
  const updated = await downvoteThreadService(req.params.id, req.user._id);
  res.status(200).json({
    success: true,
    message: "Thread downvoted successfully",
    data: updated,
  });
};

export const upvoteComment = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw createAppError("Invalid comment ID", 400);
  }
  const updated = await upvoteCommentService(req.params.id, req.user._id);
  res.status(200).json({
    success: true,
    message: "Comment upvoted successfully",
    data: updated,
  });
};

export const downvoteComment = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw createAppError("Invalid comment ID", 400);
  }
  const updated = await downvoteCommentService(req.params.id, req.user._id);
  res.status(200).json({
    success: true,
    message: "Comment downvoted successfully",
    data: updated,
  });
};
