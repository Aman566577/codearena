import { z } from "zod";
import Question from "../models/Question.js";

const caseSchema = z.object({
  input: z.string(),
  output: z.string(),
});

const questionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().min(10),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  constraints: z.string().default(""),
  sampleCases: z
    .array(caseSchema.extend({ explanation: z.string().default("") }))
    .min(1),
  hiddenTestCases: z.array(caseSchema).min(1),
  marks: z.number().int().min(1).max(1000),
});

export async function createQuestion(req, res) {
  const parsed = questionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
  }
  const question = await Question.create({ ...parsed.data, createdBy: req.user._id });
  res.status(201).json({ question });
}

// Admin: list all questions (hidden cases NOT included)
export async function listQuestions(req, res) {
  const questions = await Question.find().sort({ createdAt: -1 });
  res.json({ questions });
}

// Admin: single question including hidden cases (to edit them)
export async function getQuestionAdmin(req, res) {
  const question = await Question.findById(req.params.id).select("+hiddenTestCases");
  if (!question) return res.status(404).json({ message: "Question not found" });
  res.json({ question });
}

export async function updateQuestion(req, res) {
  const parsed = questionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
  }
  const question = await Question.findByIdAndUpdate(req.params.id, parsed.data, {
    new: true,
    runValidators: true,
  });
  if (!question) return res.status(404).json({ message: "Question not found" });
  res.json({ question });
}

export async function deleteQuestion(req, res) {
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) return res.status(404).json({ message: "Question not found" });
  res.json({ message: "Question deleted" });
}