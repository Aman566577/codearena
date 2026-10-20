import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Question from "../src/models/Question.js";
import Assessment from "../src/models/Assessment.js";
import AssessmentAttempt from "../src/models/AssessmentAttempt.js";
import Draft from "../src/models/Draft.js";

let admin, cand1, cand2, question, openAssessment, futureAssessment, pastAssessment;
const agent1 = request.agent(app);
const agent2 = request.agent(app);

async function makeUser(name, email, role) {
  return User.create({
    name,
    email,
    role,
    passwordHash: await bcrypt.hash("password123", 4),
  });
}

async function wipe() {
  await Promise.all([
    User.deleteMany({}),
    Question.deleteMany({}),
    Assessment.deleteMany({}),
    AssessmentAttempt.deleteMany({}),
    Draft.deleteMany({}),
  ]);
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST);
  await wipe();

  admin = await makeUser("Admin", "admin@t.com", "admin");
  cand1 = await makeUser("C1", "c1@t.com", "candidate");
  cand2 = await makeUser("C2", "c2@t.com", "candidate");

  question = await Question.create({
    title: "Two Sum",
    description: "Find two numbers that add up to target.",
    marks: 20,
    sampleCases: [{ input: "1 2\n3", output: "0 1" }],
    hiddenTestCases: [{ input: "SECRET", output: "SECRET_OUT" }],
    createdBy: admin._id,
  });

  const day = 24 * 60 * 60 * 1000;
  const base = {
    questionIds: [question._id],
    duration: 60,
    assignedCandidates: [cand1._id],
    createdBy: admin._id,
  };
  openAssessment = await Assessment.create({
    ...base,
    title: "Open",
    startAt: new Date(Date.now() - day),
    endAt: new Date(Date.now() + day),
  });
  futureAssessment = await Assessment.create({
    ...base,
    title: "Future",
    startAt: new Date(Date.now() + day),
    endAt: new Date(Date.now() + 2 * day),
  });
  pastAssessment = await Assessment.create({
    ...base,
    title: "Past",
    startAt: new Date(Date.now() - 2 * day),
    endAt: new Date(Date.now() - day),
  });

  await agent1.post("/api/auth/login").send({ email: "c1@t.com", password: "password123" });
  await agent2.post("/api/auth/login").send({ email: "c2@t.com", password: "password123" });
});

afterAll(async () => {
  await wipe();
  await mongoose.disconnect();
});

describe("attempts", () => {
  let attemptId;

  it("rejects start before the window opens", async () => {
    const res = await agent1.post(`/api/candidate/assessments/${futureAssessment._id}/start`);
    expect(res.status).toBe(403);
  });

  it("rejects start after the window closes", async () => {
    const res = await agent1.post(`/api/candidate/assessments/${pastAssessment._id}/start`);
    expect(res.status).toBe(403);
  });

  it("rejects start for an unassigned candidate", async () => {
    const res = await agent2.post(`/api/candidate/assessments/${openAssessment._id}/start`);
    expect(res.status).toBe(404);
  });

  it("starts an attempt with a server-calculated deadline", async () => {
    const res = await agent1.post(`/api/candidate/assessments/${openAssessment._id}/start`);
    expect(res.status).toBe(201);
    attemptId = res.body.attempt._id;
    const ms = new Date(res.body.attempt.deadline) - new Date(res.body.attempt.startedAt);
    expect(ms).toBe(60 * 60 * 1000);
  });

  it("rejects a second attempt", async () => {
    const res = await agent1.post(`/api/candidate/assessments/${openAssessment._id}/start`);
    expect(res.status).toBe(409);
  });

  it("never leaks hidden test cases to the candidate", async () => {
    const res = await agent1.get(`/api/candidate/attempts/${attemptId}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain("SECRET");
    expect(res.body.questions[0].sampleCases.length).toBe(1);
  });

  it("hides an attempt from another candidate", async () => {
    const res = await agent2.get(`/api/candidate/attempts/${attemptId}`);
    expect(res.status).toBe(404);
  });

  it("autosaves while the attempt is open", async () => {
    const res = await agent1.put(`/api/candidate/attempts/${attemptId}/draft`).send({
      questionId: String(question._id),
      language: "python",
      sourceCode: "print(1)",
    });
    expect(res.status).toBe(200);
  });

  it("rejects autosave after the deadline", async () => {
    await AssessmentAttempt.updateOne(
      { _id: attemptId },
      { deadline: new Date(Date.now() - 1000) }
    );
    const res = await agent1.put(`/api/candidate/attempts/${attemptId}/draft`).send({
      questionId: String(question._id),
      language: "python",
      sourceCode: "print(2)",
    });
    expect(res.status).toBe(403);
  });
});