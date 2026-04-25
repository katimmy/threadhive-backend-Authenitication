import Thread from "../models/Thread.js";
import User from "../models/User.js";
import Subreddit from "../models/Subreddit.js";
import { createAppError } from "../utils/createAppError.js";

export const fetchAllThreads = async () => {
  const threads = await Thread.find()
    .populate({ path: "author", model: User })
    .populate({ path: "subreddit", model: Subreddit })
    .sort({ createdAt: -1 });

  if (!threads || threads.length === 0) {
    throw createAppError("No threads found", 404);
  }

  return threads;
};

export const fetchThreadById = async (id) => {
  const thread = await Thread.findById(id)
    .populate({ path: "author" })
    .populate({ path: "subreddit" });

  if (!thread) {
    throw createAppError("Thread not found", 404);
  }
  return thread;
};

export const createNewThread = async (title, content, author, subreddit) => {
  const newThread = new Thread({ title, content, author, subreddit });
  await newThread.save();

  const populatedThread = await Thread.findById(newThread._id)
    .populate({ path: "subreddit", select: "name description" })
    .populate({ path: "author", select: "name" });

  if (!populatedThread) {
    throw createAppError("Failed to create thread", 500);
  }

  return populatedThread;
};

export const updateThreadById = async (id, updateData, userId) => {
  const thread = await Thread.findById(id);
  if (!thread) {
    throw createAppError("Thread not found", 404);
  }
  if (!thread.author.equals(userId)) {
    throw createAppError("Not authorized to update this thread", 403);
  }

  const { title, content } = updateData;
  const updatedThread = await Thread.findByIdAndUpdate(
    id,
    { $set: { ...(title && { title }), ...(content && { content }) } },
    { new: true, runValidators: true },
  );

  return updatedThread;
};

export const deleteThreadById = async (id, userId) => {
  const thread = await Thread.findById(id);
  if (!thread) {
    throw createAppError("Thread not found", 404);
  }
  if (!thread.author.equals(userId)) {
    throw createAppError("Not authorized to delete this thread", 403);
  }

  const deletedThread = await Thread.findByIdAndDelete(id);
  return deletedThread;
};
