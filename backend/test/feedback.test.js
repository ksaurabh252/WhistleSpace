const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const Feedback = require("../models/Feedback.model");

// Use a test database
beforeAll(async () => {
  await mongoose.connect("mongodb://localhost:27017/whistlespace_test");
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await Feedback.deleteMany({});
});

describe("Feedback API", () => {
  it("should reject empty feedback", async () => {
    const res = await request(app).post("/feedback").send({ text: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Text is required");
  });

  it("should accept valid feedback", async () => {
    const res = await request(app)
      .post("/feedback")
      .send({ text: "Great job!", tags: ["ui"] });
    expect(res.statusCode).toBe(201);
    expect(res.body.text).toBe("Great job!");
    expect(res.body.tags).toContain("ui");
  });

  it("should list feedbacks", async () => {
    await Feedback.create({ text: "Test feedback", tags: ["bug"] });
    const res = await request(app).get("/feedback");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Example for AI moderation (simulate flagged)
  it.skip("should block inappropriate feedback (simulate AI)", async () => {
    // Mock the moderateFeedback function
    jest.mock("../utils/moderateFeedback", () =>
      jest.fn(() => Promise.resolve({ flagged: true }))
    );
    const res = await request(app).post("/feedback").send({ text: "badword" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/flagged/i);
    jest.resetModules();
  });
});
