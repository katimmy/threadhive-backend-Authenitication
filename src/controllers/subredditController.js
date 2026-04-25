import mongoose from "mongoose";
import {
  fetchAllSubreddits,
  createNewSubreddit,
  fetchSubredditWithThreads,
} from "../services/subredditService.js";
import { createAppError } from "../utils/createAppError.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getAllSubreddits = async (req, res) => {
  const subreddits = await fetchAllSubreddits();
  res.status(200).json({
    success: true,
    message: "Subreddits fetched successfully",
    data: subreddits,
  });
};

export const createSubreddit = async (req, res) => {
  const { name, description } = req.body;
  const author = req.user._id;

  if (!name || !description) {
    throw createAppError("Name and description are required.", 400);
  }
  if (typeof name !== "string" || typeof description !== "string") {
    throw createAppError("Name and description must be strings", 400);
  }

  const newSubreddit = await createNewSubreddit(name.trim(), description.trim(), author);
  res.status(201).json({
    success: true,
    message: "Subreddit created successfully",
    data: newSubreddit,
  });
};

export const getSubredditWithThreads = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw createAppError("Invalid subreddit ID", 400);
  }
  const { subreddit, threads } = await fetchSubredditWithThreads(req.params.id);
  res.status(200).json({
    success: true,
    message: "Subreddit and its threads fetched successfully",
    data: {
      subreddit,
      threads,
    },
  });
};
