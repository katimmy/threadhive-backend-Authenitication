import mongoose from "mongoose";

const SubredditSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
      match: [/^[a-zA-Z0-9_]+$/, "Subreddit name can only contain letters, numbers, and underscores"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Subreddit = mongoose.model("Subreddit", SubredditSchema);

export default Subreddit;
