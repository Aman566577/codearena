import { z } from "zod";
import Assessment from "../models/Assessment.js";
import Question from "../models/Question.js";
import User from "../models/User.js";

const assessmentInput = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().default(""),
    questionIds: z.array(z.string().length(24)).min(1),
    duration: z.number().int().min(1).max(600),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    candidateEmails: z.array(z.string().trim().toLowerCase().email()).default([]),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });

async function resolveInput(data) {
  const count = await Question.countDocuments({ _id: { $in: data.questionIds } });
  if (count !== data.questionIds.length) {
    return { error: "One or more questions do not exist" };
  }
  const users = await User.find({
    email: { $in: data.candidateEmails },
    role: "candidate",
  }).select("_id email");
  const found = new Set(users.map((u) => u.email));
  const missing = data.candidateEmails.filter((e) => !found.has(e));
  return { users, missing };
}

export async function createAssessment(req, res) {
  const parsed = assessmentInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
  }
  const d = parsed.data;
  const r = await resolveInput(d);
  if (r.error) return res.status(400).json({ message: r.error });

  const assessment = await Assessment.create({
    title: d.title,
    description: d.description,
    questionIds: d.questionIds,
    duration: d.duration,
    startAt: d.startAt,
    endAt: d.endAt,
    assignedCandidates: r.users.map((u) => u._id),
    createdBy: req.user._id,
  });
  res.status(201).json({ assessment, unknownEmails: r.missing });
}

export async function listAssessments(req, res) {
  const assessments = await Assessment.find().sort({ createdAt: -1 });
  res.json({ assessments });
}

export async function getAssessment(req, res) {
  const assessment = await Assessment.findById(req.params.id)
    .populate("questionIds", "title difficulty marks")
    .populate("assignedCandidates", "name email");
  if (!assessment) return res.status(404).json({ message: "Assessment not found" });
  res.json({ assessment });
}

export async function updateAssessment(req, res) {
  const parsed = assessmentInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
  }
  const d = parsed.data;
  const r = await resolveInput(d);
  if (r.error) return res.status(400).json({ message: r.error });

  const assessment = await Assessment.findByIdAndUpdate(
    req.params.id,
    {
      title: d.title,
      description: d.description,
      questionIds: d.questionIds,
      duration: d.duration,
      startAt: d.startAt,
      endAt: d.endAt,
      assignedCandidates: r.users.map((u) => u._id),
    },
    { new: true, runValidators: true }
  );
  if (!assessment) return res.status(404).json({ message: "Assessment not found" });
  res.json({ assessment, unknownEmails: r.missing });
}

export async function deleteAssessment(req, res) {
  const assessment = await Assessment.findByIdAndDelete(req.params.id);
  if (!assessment) return res.status(404).json({ message: "Assessment not found" });
  res.json({ message: "Assessment deleted" });
}