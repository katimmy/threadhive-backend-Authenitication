import Thread from "../models/Thread.js";
import Comment from "../models/Comment.js";
import { createAppError } from "../utils/createAppError.js";

const voteHandler = async (Model, id, userId, type) => {
  const voteField = type + "dBy";
  const otherField = type === "upvote" ? "downvotedBy" : "upvotedBy";

  // Atomic: remove from opposite array and add to target array in one operation
  const item = await Model.findOneAndUpdate(
    { _id: id, [voteField]: { $ne: userId } },
    {
      $addToSet: { [voteField]: userId },
      $pull: { [otherField]: userId },
    },
    { new: true },
  );

  if (!item) {
    // Either not found or already voted this way
    const exists = await Model.findById(id);
    if (!exists) throw createAppError("Item not found", 404);
    return exists; // already voted this way, return unchanged
  }

  // Update counters atomically based on array lengths
  const updated = await Model.findByIdAndUpdate(
    id,
    {
      $set: {
        upvotes: item.upvotedBy.length,
        downvotes: item.downvotedBy.length,
        voteCount: item.upvotedBy.length - item.downvotedBy.length,
      },
    },
    { new: true },
  );

  return updated;
};

export default voteHandler;

// Public service functions
export const upvoteThreadService = async (threadId, userId) => {
  const updated = await voteHandler(Thread, threadId, userId, "upvote");
  return {
    _id: updated._id,
    upvotes: updated.upvotes,
    downvotes: updated.downvotes,
    voteCount: updated.voteCount,
  };
};

export const downvoteThreadService = async (threadId, userId) => {
  const updated = await voteHandler(Thread, threadId, userId, "downvote");
  return {
    _id: updated._id,
    upvotes: updated.upvotes,
    downvotes: updated.downvotes,
    voteCount: updated.voteCount, 
  }
};

export const upvoteCommentService = async (commentId, userId) => {
  const updated = await voteHandler(Comment, commentId, userId, "upvote");
  return updated.populate("user", "name");
};

export const downvoteCommentService = async (commentId, userId) => {
  const updated = await voteHandler(Comment, commentId, userId, "downvote");
  return updated.populate("user", "name");
};