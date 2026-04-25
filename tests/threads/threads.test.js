import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import User from "../../src/models/User.js";
import Subreddit from "../../src/models/Subreddit.js";
import Thread from "../../src/models/Thread.js";

let mongoServer;
let request;
let testUser;
let otherUser;
let testSubreddit;
let authToken;
let otherAuthToken;

const JWT_SECRET = "test-secret";

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = JWT_SECRET;
  request = supertest(app);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Thread.deleteMany({});
  await User.deleteMany({});
  await Subreddit.deleteMany({});

  testUser = await User.create({
    name: "TestUser",
    email: "test@example.com",
    password: "hashedpassword123",
  });

  otherUser = await User.create({
    name: "OtherUser",
    email: "other@example.com",
    password: "hashedpassword456",
  });

  testSubreddit = await Subreddit.create({
    name: "testsubreddit",
    description: "A test subreddit",
    author: testUser._id,
  });

  authToken = jwt.sign({ userId: testUser._id }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "1h",
  });

  otherAuthToken = jwt.sign({ userId: otherUser._id }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "1h",
  });
});

// --- Helper ---
const createTestThread = (overrides = {}) => ({
  title: "Test Thread",
  content: "This is test content for the thread.",
  subreddit: testSubreddit._id.toString(),
  ...overrides,
});

// ============================================================
// GET /api/threads
// ============================================================
describe("GET /api/threads", () => {
  it("should return all threads with 200", async () => {
    await Thread.create({
      title: "Thread 1",
      content: "Content 1",
      author: testUser._id,
      subreddit: testSubreddit._id,
    });
    await Thread.create({
      title: "Thread 2",
      content: "Content 2",
      author: testUser._id,
      subreddit: testSubreddit._id,
    });

    const res = await request
      .get("/api/threads")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Threads fetched successfully");
    expect(res.body.data).toHaveLength(2);
  });

  it("should return threads sorted by createdAt descending", async () => {
    await Thread.create({
      title: "Older Thread",
      content: "Old content",
      author: testUser._id,
      subreddit: testSubreddit._id,
    });
    // small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 50));
    await Thread.create({
      title: "Newer Thread",
      content: "New content",
      author: testUser._id,
      subreddit: testSubreddit._id,
    });

    const res = await request
      .get("/api/threads")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].title).toBe("Newer Thread");
    expect(res.body.data[1].title).toBe("Older Thread");
  });

  it("should populate author and subreddit fields", async () => {
    await Thread.create({
      title: "Populated Thread",
      content: "Content",
      author: testUser._id,
      subreddit: testSubreddit._id,
    });

    const res = await request
      .get("/api/threads")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].author).toHaveProperty("name", "TestUser");
    expect(res.body.data[0].subreddit).toHaveProperty("name", "testsubreddit");
  });

  it("should return 404 when no threads exist", async () => {
    const res = await request
      .get("/api/threads")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("No threads found");
  });

  it("should return 401 without auth token", async () => {
    const res = await request.get("/api/threads");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 with invalid token", async () => {
    const res = await request
      .get("/api/threads")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ============================================================
// GET /api/threads/:id
// ============================================================
describe("GET /api/threads/:id", () => {
  it("should return a single thread by ID with 200", async () => {
    const thread = await Thread.create({
      title: "Single Thread",
      content: "Single content",
      author: testUser._id,
      subreddit: testSubreddit._id,
    });

    const res = await request
      .get(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Thread fetched successfully");
    expect(res.body.data.title).toBe("Single Thread");
  });

  it("should populate author and subreddit on single thread", async () => {
    const thread = await Thread.create({
      title: "Populated Single",
      content: "Content",
      author: testUser._id,
      subreddit: testSubreddit._id,
    });

    const res = await request
      .get(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.author).toHaveProperty("name", "TestUser");
    expect(res.body.data.subreddit).toHaveProperty("name", "testsubreddit");
  });

  it("should return 404 for non-existent thread ID", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request
      .get(`/api/threads/${fakeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Thread not found");
  });

  it("should return 400 for invalid ObjectId", async () => {
    const res = await request
      .get("/api/threads/not-a-valid-id")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid thread ID");
  });

  it("should return 401 without auth token", async () => {
    const thread = await Thread.create({
      title: "Auth Test",
      content: "Content",
      author: testUser._id,
      subreddit: testSubreddit._id,
    });

    const res = await request.get(`/api/threads/${thread._id}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ============================================================
// POST /api/threads
// ============================================================
describe("POST /api/threads", () => {
  it("should create a thread and return 201", async () => {
    const res = await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send(createTestThread());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Thread created successfully");
    expect(res.body.data.title).toBe("Test Thread");
    expect(res.body.data.content).toBe(
      "This is test content for the thread.",
    );
  });

  it("should populate author and subreddit in response", async () => {
    const res = await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send(createTestThread());

    expect(res.status).toBe(201);
    expect(res.body.data.author).toHaveProperty("name", "TestUser");
    expect(res.body.data.subreddit).toHaveProperty("name", "testsubreddit");
  });

  it("should persist the thread in the database", async () => {
    await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send(createTestThread());

    const threads = await Thread.find({});
    expect(threads).toHaveLength(1);
    expect(threads[0].title).toBe("Test Thread");
  });

  it("should set the authenticated user as author", async () => {
    const res = await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send(createTestThread());

    expect(res.status).toBe(201);
    const thread = await Thread.findById(res.body.data._id);
    expect(thread.author.toString()).toBe(testUser._id.toString());
  });

  it("should return 400 when title is missing", async () => {
    const res = await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send(createTestThread({ title: undefined }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Title, content, and subreddit are required.",
    );
  });

  it("should return 400 when content is missing", async () => {
    const res = await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send(createTestThread({ content: undefined }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 when subreddit is missing", async () => {
    const res = await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send(createTestThread({ subreddit: undefined }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for invalid subreddit ID", async () => {
    const res = await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send(createTestThread({ subreddit: "bad-id" }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid subreddit ID");
  });

  it("should return 401 without auth token", async () => {
    const res = await request.post("/api/threads").send(createTestThread());

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ============================================================
// PUT /api/threads/:id
// ============================================================
describe("PUT /api/threads/:id", () => {
  let existingThread;

  beforeEach(async () => {
    existingThread = await Thread.create({
      title: "Original Title",
      content: "Original Content",
      author: testUser._id,
      subreddit: testSubreddit._id,
    });
  });

  it("should update a thread and return 200", async () => {
    const res = await request
      .put(`/api/threads/${existingThread._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Updated Title", content: "Updated Content" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Thread updated successfully");
    expect(res.body.data.title).toBe("Updated Title");
    expect(res.body.data.content).toBe("Updated Content");
  });

  it("should update only the title when content is not provided", async () => {
    const res = await request
      .put(`/api/threads/${existingThread._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Only Title Updated" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Only Title Updated");
    expect(res.body.data.content).toBe("Original Content");
  });

  it("should update only the content when title is not provided", async () => {
    const res = await request
      .put(`/api/threads/${existingThread._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ content: "Only Content Updated" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Original Title");
    expect(res.body.data.content).toBe("Only Content Updated");
  });

  it("should persist updates in the database", async () => {
    await request
      .put(`/api/threads/${existingThread._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Persisted Title" });

    const thread = await Thread.findById(existingThread._id);
    expect(thread.title).toBe("Persisted Title");
  });

  it("should return 403 when another user tries to update", async () => {
    const res = await request
      .put(`/api/threads/${existingThread._id}`)
      .set("Authorization", `Bearer ${otherAuthToken}`)
      .send({ title: "Unauthorized Update" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Not authorized to update this thread");
  });

  it("should return 404 for non-existent thread", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request
      .put(`/api/threads/${fakeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Does not exist" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Thread not found");
  });

  it("should return 400 for invalid ObjectId", async () => {
    const res = await request
      .put("/api/threads/invalid-id")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Bad ID" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid thread ID");
  });

  it("should return 401 without auth token", async () => {
    const res = await request
      .put(`/api/threads/${existingThread._id}`)
      .send({ title: "No Auth" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ============================================================
// DELETE /api/threads/:id
// ============================================================
describe("DELETE /api/threads/:id", () => {
  let existingThread;

  beforeEach(async () => {
    existingThread = await Thread.create({
      title: "Thread to Delete",
      content: "Content to Delete",
      author: testUser._id,
      subreddit: testSubreddit._id,
    });
  });

  it("should delete a thread and return 200", async () => {
    const res = await request
      .delete(`/api/threads/${existingThread._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Thread deleted successfully");
  });

  it("should remove the thread from the database", async () => {
    await request
      .delete(`/api/threads/${existingThread._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    const thread = await Thread.findById(existingThread._id);
    expect(thread).toBeNull();
  });

  it("should return the deleted thread data", async () => {
    const res = await request
      .delete(`/api/threads/${existingThread._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.data.title).toBe("Thread to Delete");
  });

  it("should return 403 when another user tries to delete", async () => {
    const res = await request
      .delete(`/api/threads/${existingThread._id}`)
      .set("Authorization", `Bearer ${otherAuthToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Not authorized to delete this thread");
  });

  it("should not remove thread from DB on 403", async () => {
    await request
      .delete(`/api/threads/${existingThread._id}`)
      .set("Authorization", `Bearer ${otherAuthToken}`);

    const thread = await Thread.findById(existingThread._id);
    expect(thread).not.toBeNull();
  });

  it("should return 404 for non-existent thread", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request
      .delete(`/api/threads/${fakeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Thread not found");
  });

  it("should return 400 for invalid ObjectId", async () => {
    const res = await request
      .delete("/api/threads/invalid-id")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid thread ID");
  });

  it("should return 401 without auth token", async () => {
    const res = await request.delete(
      `/api/threads/${existingThread._id}`,
    );

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
