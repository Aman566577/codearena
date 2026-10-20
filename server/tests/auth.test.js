import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import User from "../src/models/User.js";

const email = "test-auth@example.com";

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST);
  await User.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.disconnect();
});

describe("auth", () => {
  it("registers a candidate", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email, password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("candidate");
  });

  it("rejects duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email, password: "password123" });
    expect(res.status).toBe(409);
  });

  it("rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  it("blocks /me without cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns user on /me with cookie", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email, password: "password123" });
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it("blocks candidate from admin routes", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email, password: "password123" });
    const res = await agent.get("/api/questions");
    expect(res.status).toBe(403);
  });
});